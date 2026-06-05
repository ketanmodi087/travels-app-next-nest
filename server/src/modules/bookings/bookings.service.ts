import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EmailService } from '../../integrations/email/email.service';
import { SupabaseService } from '../../integrations/supabase/supabase.service';
import { ToursService } from '../tours/tours.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  // Convert query inputs into safe pagination boundaries.
  private getPagination(pageRaw?: string, limitRaw?: string) {
    const page = Math.max(1, Number(pageRaw ?? 1) || 1);
    const limit = Math.min(50, Math.max(1, Number(limitRaw ?? 10) || 10));
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return { page, limit, from, to };
  }

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly toursService: ToursService,
    private readonly emailService: EmailService,
  ) {}

  // Create a pending booking from public flow and notify traveler.
  async createPublicBooking(slug: string, payload: CreateBookingDto) {
    const tour = await this.toursService.getTourBySlug(slug);
    if (payload.guestCount > tour.guest_limit) {
      throw new BadRequestException('Guest count exceeds tour guest limit');
    }

    const supabase = this.supabaseService.getClient();
    const totalPriceCents = payload.guestCount * tour.price_cents;

    // Persist booking record with computed total amount.
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        tour_id: tour.id,
        visitor_name: payload.visitorName,
        visitor_email: payload.visitorEmail,
        guest_count: payload.guestCount,
        special_requests: payload.specialRequests ?? null,
        total_price_cents: totalPriceCents,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    // Notify traveler without blocking booking response beyond email timeout.
    void this.emailService.sendBookingCreatedEmail({
      customerEmail: payload.visitorEmail,
      customerName: payload.visitorName,
      bookingId: data.id,
      tourTitle: tour.title,
      guestCount: payload.guestCount,
      totalPriceCents,
    });

    return data;
  }

  // List creator bookings with server-side pagination and filters.
  async listCreatorBookings(
    userId: string,
    pageRaw?: string,
    limitRaw?: string,
    search?: string,
    status?: string,
  ) {
    const supabase = this.supabaseService.getClient();
    const pagination = this.getPagination(pageRaw, limitRaw);
    let query = supabase
      .from('bookings')
      .select('*, tours!inner(title, creator_id, share_slug)', { count: 'exact' })
      .eq('tours.creator_id', userId)
      .range(pagination.from, pagination.to)
      .order('created_at', { ascending: false });

    if (status && ['pending', 'confirmed', 'cancelled'].includes(status)) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `visitor_name.ilike.%${search}%,visitor_email.ilike.%${search}%,tours.title.ilike.%${search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
    return {
      data: data ?? [],
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
      },
    };
  }

  // Update booking status only when booking belongs to creator.
  async updateBookingStatus(userId: string, bookingId: string, status: 'confirmed' | 'cancelled') {
    const supabase = this.supabaseService.getClient();
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, tour_id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new NotFoundException('Booking not found');
    }

    const { data: tour, error: tourError } = await supabase
      .from('tours')
      .select('id')
      .eq('id', booking.tour_id)
      .eq('creator_id', userId)
      .single();

    if (tourError || !tour) {
      throw new NotFoundException('Booking not found for this creator');
    }

    // Update status and fetch related tour details for notifications.
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select('*, tours!inner(title, creator_id, share_slug)')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    const customerName = (data.visitor_name as string) ?? 'Traveler';
    const emailPayload = {
      customerEmail: data.visitor_email as string,
      customerName,
      bookingId: data.id as string,
      tourTitle: (data.tours as { title?: string } | null)?.title ?? 'Tour Booking',
      guestCount: data.guest_count as number,
      totalPriceCents: data.total_price_cents as number,
    };

    // Trigger status emails in background; API returns immediately.
    if (status === 'confirmed') {
      void this.emailService.sendBookingConfirmedEmail(emailPayload);
    }
    if (status === 'cancelled') {
      void this.emailService.sendBookingCancelledEmail(emailPayload);
    }

    return data;
  }
}

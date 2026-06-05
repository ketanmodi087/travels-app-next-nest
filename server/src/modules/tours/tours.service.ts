import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { nanoid } from 'nanoid';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../integrations/supabase/supabase.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';

@Injectable()
export class ToursService {
  private getPagination(pageRaw?: string, limitRaw?: string) {
    const page = Math.max(1, Number(pageRaw ?? 1) || 1);
    const limit = Math.min(50, Math.max(1, Number(limitRaw ?? 10) || 10));
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return { page, limit, from, to };
  }

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  async createTour(userId: string, payload: CreateTourDto) {
    const supabase = this.supabaseService.getClient();
    const shareSlug = nanoid(10).toLowerCase();

    const { data, error } = await supabase
      .from('tours')
      .insert({
        creator_id: userId,
        title: payload.title,
        description: payload.description,
        location: payload.location,
        price_cents: payload.priceCents,
        currency: payload.currency ?? 'USD',
        itinerary: payload.itinerary,
        start_date: payload.startDate,
        end_date: payload.endDate,
        guest_limit: payload.guestLimit,
        images: payload.images ?? [],
        share_slug: shareSlug,
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  async updateTour(userId: string, tourId: string, payload: UpdateTourDto) {
    const supabase = this.supabaseService.getClient();

    const patch: Record<string, unknown> = {};
    if (payload.title !== undefined) patch.title = payload.title;
    if (payload.description !== undefined) patch.description = payload.description;
    if (payload.location !== undefined) patch.location = payload.location;
    if (payload.priceCents !== undefined) patch.price_cents = payload.priceCents;
    if (payload.currency !== undefined) patch.currency = payload.currency;
    if (payload.startDate !== undefined) patch.start_date = payload.startDate;
    if (payload.endDate !== undefined) patch.end_date = payload.endDate;
    if (payload.guestLimit !== undefined) patch.guest_limit = payload.guestLimit;
    if (payload.itinerary !== undefined) patch.itinerary = payload.itinerary;
    if (payload.images !== undefined) patch.images = payload.images;

    const { data, error } = await supabase
      .from('tours')
      .update(patch)
      .eq('id', tourId)
      .eq('creator_id', userId)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException('Tour not found');
    }

    return data;
  }

  async listTours(userId: string, search?: string, pageRaw?: string, limitRaw?: string) {
    const supabase = this.supabaseService.getClient();
    const pagination = this.getPagination(pageRaw, limitRaw);
    let query = supabase
      .from('tours')
      .select('*', { count: 'exact' })
      .eq('creator_id', userId)
      .range(pagination.from, pagination.to)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('title', `%${search}%`);
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

  async getTourById(userId: string, tourId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('id', tourId)
      .eq('creator_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Tour not found');
    }

    return data;
  }

  async getTourBySlug(slug: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('tours').select('*').eq('share_slug', slug).single();

    if (error || !data) {
      throw new NotFoundException('Tour not found');
    }

    return data;
  }

  async listPublicTours(search?: string, pageRaw?: string, limitRaw?: string) {
    const supabase = this.supabaseService.getClient();
    const pagination = this.getPagination(pageRaw, limitRaw);
    let query = supabase
      .from('tours')
      .select('*', { count: 'exact' })
      .range(pagination.from, pagination.to)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%`);
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

  async uploadTourImage(userId: string, tourId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const tour = await this.getTourById(userId, tourId);
    const supabase = this.supabaseService.getClient();
    const bucket = this.configService.get<string>('SUPABASE_STORAGE_BUCKET') ?? 'tour-images';
    const fileExt = file.originalname.split('.').pop() ?? 'jpg';
    const filePath = `${userId}/${tourId}/${Date.now()}-${nanoid(8)}.${fileExt}`;

    const bucketsResult = await supabase.storage.listBuckets();
    if (bucketsResult.error) {
      throw new InternalServerErrorException(bucketsResult.error.message);
    }

    const hasBucket = bucketsResult.data.some((item) => item.name === bucket);
    if (!hasBucket) {
      const createBucketResult = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
      });

      if (createBucketResult.error) {
        throw new InternalServerErrorException(createBucketResult.error.message);
      }
    }

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: false });

    if (uploadError) {
      throw new InternalServerErrorException(uploadError.message);
    }

    const publicUrl = `${this.configService.get<string>('SUPABASE_URL')}/storage/v1/object/public/${bucket}/${filePath}`;
    const nextImages = [...(tour.images ?? []), publicUrl];

    const { data, error } = await supabase
      .from('tours')
      .update({ images: nextImages })
      .eq('id', tourId)
      .eq('creator_id', userId)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }
}

import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../auth/admin.guard';
import { AuthGuard } from '../../auth/auth.guard';
import { UserId } from '../../auth/user-id.decorator';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingsService } from './bookings.service';

@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('public/tours/:slug/bookings')
  createPublicBooking(@Param('slug') slug: string, @Body() payload: CreateBookingDto) {
    return this.bookingsService.createPublicBooking(slug, payload);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Get('bookings')
  listCreatorBookings(
    @UserId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.bookingsService.listCreatorBookings(userId, page, limit, search, status);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Patch('bookings/:id/status')
  updateBookingStatus(
    @UserId() userId: string,
    @Param('id') bookingId: string,
    @Body() payload: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateBookingStatus(userId, bookingId, payload.status);
  }
}

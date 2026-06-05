import { Module } from '@nestjs/common';
import { ToursModule } from '../tours/tours.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [ToursModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}

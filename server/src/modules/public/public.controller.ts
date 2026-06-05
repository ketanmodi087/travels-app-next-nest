import { Controller, Get, Param, Query } from '@nestjs/common';
import { ToursService } from '../tours/tours.service';

@Controller('public/tours')
export class PublicController {
  constructor(private readonly toursService: ToursService) {}

  @Get()
  listPublicTours(@Query('search') search?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.toursService.listPublicTours(search, page, limit);
  }

  @Get(':slug')
  getPublicTour(@Param('slug') slug: string) {
    return this.toursService.getTourBySlug(slug);
  }
}

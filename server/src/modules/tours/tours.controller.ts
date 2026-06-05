import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from '../../auth/admin.guard';
import { AuthGuard } from '../../auth/auth.guard';
import { UserId } from '../../auth/user-id.decorator';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { ToursService } from './tours.service';

@Controller('tours')
@UseGuards(AuthGuard, AdminGuard)
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Post()
  createTour(@UserId() userId: string, @Body() payload: CreateTourDto) {
    return this.toursService.createTour(userId, payload);
  }

  @Patch(':id')
  updateTour(@UserId() userId: string, @Param('id') id: string, @Body() payload: UpdateTourDto) {
    return this.toursService.updateTour(userId, id, payload);
  }

  @Get()
  listTours(
    @UserId() userId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.toursService.listTours(userId, search, page, limit);
  }

  @Get(':id')
  getTourById(@UserId() userId: string, @Param('id') id: string) {
    return this.toursService.getTourById(userId, id);
  }

  @Post(':id/images')
  @UseInterceptors(FileInterceptor('image'))
  uploadTourImage(
    @UserId() userId: string,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.toursService.uploadTourImage(userId, id, file);
  }
}

import { Module } from '@nestjs/common';
import { ToursModule } from '../tours/tours.module';
import { PublicController } from './public.controller';

@Module({
  imports: [ToursModule],
  controllers: [PublicController],
})
export class PublicModule {}

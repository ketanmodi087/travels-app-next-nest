import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { SupabaseModule } from './integrations/supabase/supabase.module';
import { EmailModule } from './integrations/email/email.module';
import { ToursModule } from './modules/tours/tours.module';
import { PublicModule } from './modules/public/public.module';
import { BookingsModule } from './modules/bookings/bookings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    SupabaseModule,
    EmailModule,
    HealthModule,
    ToursModule,
    PublicModule,
    BookingsModule,
  ],
})
export class AppModule {}

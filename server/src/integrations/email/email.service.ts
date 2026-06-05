import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

type BookingEmailPayload = {
  customerEmail: string;
  customerName: string;
  bookingId: string;
  tourTitle: string;
  guestCount: number;
  totalPriceCents: number;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private static readonly SEND_TIMEOUT_MS = 3_000;

  constructor(private readonly configService: ConfigService) {}

  // Cap SMTP wait so API responses are never blocked on Render/network issues.
  private withSendTimeout<T>(promise: Promise<T>): Promise<T> {
    const timeoutMs = Number(
      this.configService.get<string>('SMTP_SEND_TIMEOUT_MS') ?? EmailService.SEND_TIMEOUT_MS,
    );

    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(`Email send timeout after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  }

  // Create and cache SMTP transporter from environment config.
  private getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT') ?? 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn('SMTP is not fully configured. Email notifications are disabled.');
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      connectionTimeout: EmailService.SEND_TIMEOUT_MS,
      greetingTimeout: EmailService.SEND_TIMEOUT_MS,
      socketTimeout: EmailService.SEND_TIMEOUT_MS,
      auth: {
        user,
        pass,
      },
    });

    return this.transporter;
  }

  // Send an HTML email and fail gracefully on SMTP errors.
  private async sendMail(to: string, subject: string, html: string) {
    const transporter = this.getTransporter();
    if (!transporter) {
      return;
    }

    const fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL') ?? this.configService.get<string>('SMTP_USER');
    const fromName = this.configService.get<string>('SMTP_FROM_NAME') ?? 'TourBooking Pro';
    const from = `${fromName} <${fromEmail}>`;

    try {
      await this.withSendTimeout(
        transporter.sendMail({
          from,
          to,
          subject,
          html,
        }),
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown SMTP error';
      this.logger.warn(`Email skipped for ${to}: ${errorMessage}`);
    }
  }

  // Notify traveler that booking request is successfully received.
  async sendBookingCreatedEmail(payload: BookingEmailPayload) {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1f36;">
        <h2>Booking Received - ${payload.tourTitle}</h2>
        <p>Hi ${payload.customerName},</p>
        <p>Thank you for your booking request. We have successfully received your reservation.</p>
        <ul>
          <li><strong>Booking ID:</strong> ${payload.bookingId}</li>
          <li><strong>Tour:</strong> ${payload.tourTitle}</li>
          <li><strong>Guests:</strong> ${payload.guestCount}</li>
          <li><strong>Amount:</strong> ${(payload.totalPriceCents / 100).toFixed(2)} USD</li>
          <li><strong>Status:</strong> PENDING</li>
        </ul>
        <p>The creator will review your booking and update the status shortly.</p>
        <p>Regards,<br/>TourBooking Pro Team</p>
      </div>
    `;

    await this.sendMail(
      payload.customerEmail,
      `Booking Received: ${payload.tourTitle} (${payload.bookingId})`,
      html,
    );
  }

  // Notify traveler that creator confirmed the booking.
  async sendBookingConfirmedEmail(payload: BookingEmailPayload) {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1f36;">
        <h2>Your Booking is Confirmed</h2>
        <p>Hi ${payload.customerName},</p>
        <p>Great news! Your booking has been confirmed.</p>
        <ul>
          <li><strong>Booking ID:</strong> ${payload.bookingId}</li>
          <li><strong>Tour:</strong> ${payload.tourTitle}</li>
          <li><strong>Guests:</strong> ${payload.guestCount}</li>
          <li><strong>Amount:</strong> ${(payload.totalPriceCents / 100).toFixed(2)} USD</li>
          <li><strong>Status:</strong> CONFIRMED</li>
        </ul>
        <p>We look forward to hosting you.</p>
        <p>Regards,<br/>TourBooking Pro Team</p>
      </div>
    `;

    await this.sendMail(
      payload.customerEmail,
      `Booking Confirmed: ${payload.tourTitle} (${payload.bookingId})`,
      html,
    );
  }

  // Notify traveler that booking is cancelled with refund note.
  async sendBookingCancelledEmail(payload: BookingEmailPayload) {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1f36;">
        <h2>Your Booking has been Cancelled</h2>
        <p>Hi ${payload.customerName},</p>
        <p>We regret to inform you that your booking has been cancelled by the creator.</p>
        <ul>
          <li><strong>Booking ID:</strong> ${payload.bookingId}</li>
          <li><strong>Tour:</strong> ${payload.tourTitle}</li>
          <li><strong>Guests:</strong> ${payload.guestCount}</li>
          <li><strong>Amount:</strong> ${(payload.totalPriceCents / 100).toFixed(2)} USD</li>
          <li><strong>Status:</strong> CANCELLED</li>
        </ul>
        <p>Your refund will be processed and credited within the next <strong>5 business days</strong>.</p>
        <p>Regards,<br/>TourBooking Pro Team</p>
      </div>
    `;

    await this.sendMail(
      payload.customerEmail,
      `Booking Cancelled: ${payload.tourTitle} (${payload.bookingId})`,
      html,
    );
  }
}

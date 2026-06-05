'use client';

import Link from 'next/link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';
import { useSearchParams } from 'next/navigation';
import { jsPDF } from 'jspdf';
import { Alert, Box, Button, Grid, Paper, Stack, Typography } from '@mui/material';
import { AppShell } from '@/components/layout/app-shell';

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId') ?? 'N/A';
  const email = searchParams.get('email') ?? 'your inbox';
  const customerName = searchParams.get('name') ?? 'Guest Traveler';
  const guestCount = searchParams.get('guests') ?? '1';
  const totalCents = Number(searchParams.get('total') ?? 0);
  const tourSlug = searchParams.get('tour') ?? 'tour';
  const bookingDate = new Date().toLocaleString();

  const handleDownloadReceipt = () => {
    const receiptId = `RCP-${bookingId.slice(0, 8).toUpperCase()}`;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('TourBooking Pro - Booking Receipt', 14, 18);
    doc.setFontSize(11);
    doc.text(`Receipt ID: ${receiptId}`, 14, 30);
    doc.text(`Booking Ref: ${bookingId}`, 14, 38);
    doc.text(`Tour: ${tourSlug}`, 14, 46);
    doc.text(`Customer: ${customerName}`, 14, 54);
    doc.text(`Email: ${email}`, 14, 62);
    doc.text(`Guests: ${guestCount}`, 14, 70);
    doc.text(`Total Paid: ${(totalCents / 100).toFixed(2)} USD`, 14, 78);
    doc.text(`Payment Date: ${bookingDate}`, 14, 86);
    doc.text('Payment Mode: Dummy Card Payment (Interview Simulation)', 14, 94);
    doc.text('Status: Payment Successful | Booking Submitted', 14, 102);
    doc.text('Thank you for booking with TourBooking Pro.', 14, 118);

    doc.save(`booking-receipt-${bookingId.slice(0, 8)}.pdf`);
  };

  return (
    <AppShell title="Booking Confirmed">
      <Paper sx={{ p: { xs: 3, md: 4 }, maxWidth: 920, mx: 'auto' }}>
        <Stack spacing={2.5}>
          <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main' }} />
          <Typography variant="h4">Your booking is successful</Typography>
          <Typography color="text.secondary">
            Confirmation has been sent to <strong>{email}</strong>. Creator will review and update booking status
            shortly.
          </Typography>
          </Stack>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: 2.5, bgcolor: '#fbfcff' }}>
                <Stack spacing={1}>
                  <Typography variant="h6">Booking details</Typography>
                  <Typography color="text.secondary">Booking reference: {bookingId}</Typography>
                  <Typography color="text.secondary">Traveler: {customerName}</Typography>
                  <Typography color="text.secondary">Tour: {tourSlug}</Typography>
                  <Typography color="text.secondary">Guests: {guestCount}</Typography>
                  <Typography color="text.secondary">Total paid: {(totalCents / 100).toFixed(2)} USD</Typography>
                  <Typography color="text.secondary">Payment time: {bookingDate}</Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Alert icon={<EmailIcon fontSize="inherit" />} severity="success" sx={{ mb: 1.5 }}>
                We have shared booking confirmation on email: <strong>{email}</strong>
              </Alert>
              <Paper sx={{ p: 2.5 }}>
                <Stack spacing={1.25}>
                  <Typography variant="h6">Receipt</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Download a dummy PDF receipt with booking and payment details.
                  </Typography>
                  <Button startIcon={<DownloadIcon />} variant="contained" onClick={handleDownloadReceipt}>
                    Download Receipt (PDF)
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ pt: 1, justifyContent: 'center' }}
          >
            <Button component={Link} href="/" variant="contained">
              Continue Browsing Tours
            </Button>
            <Button component={Link} href="/" variant="outlined">
              Back to Home
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </AppShell>
  );
}

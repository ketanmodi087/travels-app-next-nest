'use client';

import { useEffect, useState } from 'react';
import SecurityIcon from '@mui/icons-material/Security';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LockIcon from '@mui/icons-material/Lock';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';
import { bookingDraftStore } from '@/lib/booking-draft';
import { getFriendlyErrorMessage } from '@/lib/error-messages';

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [hasCompletedPayment, setHasCompletedPayment] = useState(false);

  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    cardHolderName?: string;
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
  }>({});

  const draft = bookingDraftStore.read();

  // Ensure payment page is accessed only with a valid booking draft.
  useEffect(() => {
    if (hasCompletedPayment) {
      return;
    }

    if (!draft || draft.slug !== params.slug) {
      router.replace(`/t/${params.slug}/book`);
      return;
    }
    setIsReady(true);
  }, [draft, params.slug, router, hasCompletedPayment]);

  // Validate card fields, create booking, and redirect to success page.
  const handleProcessPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || !params.slug) {
      setErrorMessage('Your booking details are missing. Please enter traveler details again.');
      return;
    }

    // Validate payment fields with real-world style constraints.
    const nextErrors: typeof fieldErrors = {};
    if (cardHolderName.trim().length < 3) {
      nextErrors.cardHolderName = 'Enter valid cardholder name.';
    }
    if (!/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(cardNumber)) {
      nextErrors.cardNumber = 'Card number must be 16 digits.';
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      nextErrors.expiry = 'Use MM/YY format.';
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      nextErrors.cvv = 'CVV must be 3 or 4 digits.';
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const booking = await apiClient.createPublicBooking(params.slug, {
        visitorName: draft.visitorName,
        visitorEmail: draft.visitorEmail,
        guestCount: draft.guestCount,
        specialRequests: draft.specialRequests,
      });

      // Prevent redirect guard from running while finishing checkout flow.
      setHasCompletedPayment(true);
      bookingDraftStore.clear();
      router.push(
        `/t/${params.slug}/booking-success?bookingId=${encodeURIComponent(booking.id)}&email=${encodeURIComponent(draft.visitorEmail)}&name=${encodeURIComponent(draft.visitorName)}&guests=${encodeURIComponent(String(draft.guestCount))}&total=${encodeURIComponent(String(booking.total_price_cents ?? 0))}&tour=${encodeURIComponent(params.slug)}`,
      );
    } catch (requestError) {
      setErrorMessage(getFriendlyErrorMessage(requestError, 'Payment could not be completed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isReady) {
    return (
      <AppShell title="Secure Payment">
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary">Preparing your payment page...</Typography>
        </Paper>
      </AppShell>
    );
  }

  return (
    <AppShell title="Secure Payment">
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2.2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6">Checkout & Payment</Typography>
                  <Typography color="text.secondary">
                    Complete payment to confirm your booking instantly.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <SecurityIcon sx={{ fontSize: 18, color: 'success.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    256-bit secure flow
                  </Typography>
                </Stack>
              </Stack>
              <Divider />
              <Stack component="form" spacing={2} onSubmit={handleProcessPayment}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Chip icon={<CreditCardIcon />} label="Card payment" />
                  <Chip icon={<VerifiedIcon />} label="Dummy checkout simulation" />
                </Stack>
                {errorMessage.length > 0 && <Alert severity="error">{errorMessage}</Alert>}
                <TextField
                  required
                  label="Cardholder name"
                  placeholder="Name on card"
                  value={cardHolderName}
                  onChange={(event) => setCardHolderName(event.target.value)}
                  error={Boolean(fieldErrors.cardHolderName)}
                  helperText={fieldErrors.cardHolderName}
                />
                <TextField
                  required
                  label="Card number"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(event) => {
                    // Keep card number masked in groups of four digits.
                    const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 16);
                    const grouped = digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
                    setCardNumber(grouped);
                  }}
                  error={Boolean(fieldErrors.cardNumber)}
                  helperText={fieldErrors.cardNumber ?? '16-digit card number'}
                />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      required
                      fullWidth
                      label="Expiry (MM/YY)"
                      placeholder="08/28"
                      value={expiry}
                      onChange={(event) => {
                        // Enforce MM/YY formatting while user types.
                        const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 4);
                        if (digitsOnly.length <= 2) {
                          setExpiry(digitsOnly);
                          return;
                        }
                        setExpiry(`${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`);
                      }}
                      error={Boolean(fieldErrors.expiry)}
                      helperText={fieldErrors.expiry}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      required
                      fullWidth
                      label="CVV"
                      placeholder="123"
                      value={cvv}
                      onChange={(event) => setCvv(event.target.value.replace(/\D/g, '').slice(0, 4))}
                      error={Boolean(fieldErrors.cvv)}
                      helperText={fieldErrors.cvv}
                    />
                  </Grid>
                </Grid>
                <Stack spacing={1}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
                  >
                    {isSubmitting ? 'Processing Payment...' : 'Pay & Confirm Booking'}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Your booking request will be saved with status <strong>PENDING</strong> after payment.
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2}>
            <Paper sx={{ p: 2.5 }}>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <LockIcon fontSize="small" color="success" />
                  <Typography variant="body2" color="text.secondary">
                    Secure transaction simulation
                  </Typography>
                </Stack>
                <Typography variant="h6">Order Summary</Typography>
                <Typography color="text.secondary">Tour slug: {params.slug}</Typography>
                <Typography color="text.secondary">Guest count: {draft?.guestCount ?? '-'}</Typography>
                <Typography color="text.secondary">Booking email: {draft?.visitorEmail ?? '-'}</Typography>
                <Divider />
                <Typography variant="h5" color="primary.main" sx={{ fontWeight: 800 }}>
                  To Be Charged
                </Typography>
                <Typography color="text.secondary">
                  {(draft?.guestCount ?? 0) > 0 ? `For ${draft?.guestCount} guest(s)` : 'Guest info pending'}
                </Typography>
              </Stack>
            </Paper>
            <Paper sx={{ p: 2.5 }}>
              <Box sx={{ p: 1.5, bgcolor: '#f6f9ff', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  After successful payment, your booking will appear in creator booking management with status
                  <strong> PENDING</strong>.
                </Typography>
              </Box>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </AppShell>
  );
}

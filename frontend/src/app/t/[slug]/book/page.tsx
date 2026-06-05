'use client';

import { useEffect, useState } from 'react';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LockIcon from '@mui/icons-material/Lock';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
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
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';
import { bookingDraftStore } from '@/lib/booking-draft';
import { getFriendlyErrorMessage } from '@/lib/error-messages';
import { Tour } from '@/lib/types';

export default function BookTourPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();

  const [tour, setTour] = useState<Tour | null>(null);
  const [isLoadingTour, setIsLoadingTour] = useState(true);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    visitorName?: string;
    visitorEmail?: string;
    guestCount?: string;
  }>({});

  useEffect(() => {
    const loadTour = async () => {
      if (!params.slug) {
        setIsLoadingTour(false);
        return;
      }

      setIsLoadingTour(true);
      setErrorMessage('');
      try {
        const result = await apiClient.getPublicTourBySlug(params.slug);
        setTour(result);
        setGuestCount((current) => Math.min(Math.max(current, 1), result.guest_limit));
      } catch (error) {
        setErrorMessage(getFriendlyErrorMessage(error, 'Unable to load tour details. Please try again.'));
      } finally {
        setIsLoadingTour(false);
      }
    };

    void loadTour();
  }, [params.slug]);

  const handleSubmitBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    if (!params.slug) {
      setErrorMessage('This tour link is not valid. Please go back and choose a tour again.');
      return;
    }

    if (!tour) {
      setErrorMessage('Tour details are still loading. Please wait a moment and try again.');
      return;
    }

    const nextErrors: typeof fieldErrors = {};
    if (visitorName.trim().length < 2) {
      nextErrors.visitorName = 'Please enter your full name (at least 2 characters).';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitorEmail.trim())) {
      nextErrors.visitorEmail = 'Please enter a valid email address.';
    }
    if (!Number.isFinite(guestCount) || guestCount < 1) {
      nextErrors.guestCount = 'Guest count must be at least 1.';
    } else if (guestCount > tour.guest_limit) {
      nextErrors.guestCount = `This tour allows up to ${tour.guest_limit} guest${tour.guest_limit === 1 ? '' : 's'}.`;
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    bookingDraftStore.save({
      slug: params.slug,
      visitorName,
      visitorEmail,
      guestCount,
      specialRequests,
    });

    router.push(`/t/${params.slug}/payment`);
  };

  if (isLoadingTour) {
    return (
      <AppShell title="Book Tour">
        <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={28} />
        </Paper>
      </AppShell>
    );
  }

  return (
    <AppShell title="Book Tour">
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2.25}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6">Traveler Details</Typography>
                  <Typography color="text.secondary">
                    Enter guest information to continue to secure payment.
                  </Typography>
                  {tour && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Maximum guests allowed for this tour: {tour.guest_limit}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <LockIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Encrypted form
                  </Typography>
                </Stack>
              </Stack>
              <Divider />
              <Stack component="form" spacing={2} onSubmit={handleSubmitBooking}>
              {errorMessage.length > 0 && <Alert severity="error">{errorMessage}</Alert>}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Chip icon={<PersonOutlineOutlinedIcon />} label="Lead traveler information" />
                <Chip icon={<CalendarMonthIcon />} label="You can review before payment" />
              </Stack>
              <TextField
                required
                label="Full name"
                placeholder="e.g. John Doe"
                value={visitorName}
                onChange={(event) => setVisitorName(event.target.value)}
                error={Boolean(fieldErrors.visitorName)}
                helperText={fieldErrors.visitorName}
              />
              <TextField
                required
                type="email"
                label="Email address"
                placeholder="you@example.com"
                value={visitorEmail}
                onChange={(event) => setVisitorEmail(event.target.value)}
                error={Boolean(fieldErrors.visitorEmail)}
                helperText={fieldErrors.visitorEmail}
              />
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Guest count"
                    value={guestCount}
                    slotProps={{
                      htmlInput: {
                        min: 1,
                        max: tour?.guest_limit ?? undefined,
                      },
                    }}
                    onChange={(event) => {
                      const parsed = Number(event.target.value);
                      setGuestCount(Number.isFinite(parsed) ? parsed : 1);
                    }}
                    error={Boolean(fieldErrors.guestCount)}
                    helperText={
                      fieldErrors.guestCount ??
                      (tour ? `Allowed range: 1 to ${tour.guest_limit} guests` : 'Enter number of guests')
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Promo code (optional)" placeholder="SUMMER2026" />
                </Grid>
              </Grid>
              <TextField
                multiline
                minRows={3}
                label="Special requests"
                placeholder="Airport pickup timing, meal preferences, room requests..."
                value={specialRequests}
                onChange={(event) => setSpecialRequests(event.target.value)}
              />
              <Stack spacing={1}>
                <Button type="submit" variant="contained" size="large" disabled={!tour}>
                  Continue to Payment
                </Button>
                <Typography variant="caption" color="text.secondary">
                  By continuing, you agree to booking terms and cancellation policy.
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
                <Typography variant="h6">Booking Confidence</Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <VerifiedUserIcon color="success" fontSize="small" />
                  <Typography color="text.secondary">Verified creators and curated experiences</Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <VerifiedUserIcon color="success" fontSize="small" />
                  <Typography color="text.secondary">Secure payment step with booking confirmation</Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <VerifiedUserIcon color="success" fontSize="small" />
                  <Typography color="text.secondary">Status updates from creator dashboard</Typography>
                </Stack>
              </Stack>
            </Paper>
            <Paper sx={{ p: 2.5 }}>
              <Stack spacing={1.2}>
                <Typography variant="h6">Need Assistance?</Typography>
                <Typography color="text.secondary">
                  Contact our travel support team for any booking or itinerary question.
                </Typography>
                <Box sx={{ mt: 0.5, p: 1.5, bgcolor: '#f6f9ff', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    support@tourbookingpro.com
                  </Typography>
                </Box>
              </Stack>
            </Paper>
            <Paper sx={{ p: 2.5, bgcolor: '#f8fbff' }}>
              <Typography variant="body2" color="text.secondary">
                Next step: dummy payment page, then success confirmation + downloadable receipt PDF.
              </Typography>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </AppShell>
  );
}

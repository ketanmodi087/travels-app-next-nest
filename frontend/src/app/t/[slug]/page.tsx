'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import Groups2Icon from '@mui/icons-material/Groups2';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';
import { Tour } from '@/lib/types';

export default function PublicTourPage() {
  const params = useParams<{ slug: string }>();
  const [tour, setTour] = useState<Tour | null>(null);

  useEffect(() => {
    const loadTour = async () => {
      const result = await apiClient.getPublicTourBySlug(params.slug);
      setTour(result);
    };

    if (params.slug) {
      void loadTour();
    }
  }, [params.slug]);

  if (!tour) {
    return (
      <AppShell title="Public Tour">
        <Typography color="text.secondary">Loading public tour...</Typography>
      </AppShell>
    );
  }

  return (
    <AppShell title={tour.title}>
      <Stack spacing={2.5}>
        <Paper sx={{ p: 0, overflow: 'hidden' }}>
          <Box
            sx={{
              position: 'relative',
              minHeight: { xs: 260, md: 340 },
              background: tour.images?.[0]
                ? `linear-gradient(120deg, rgba(0,0,0,0.22), rgba(0,0,0,0.55)), url(${tour.images[0]}) center/cover`
                : 'linear-gradient(120deg, #003580 0%, #006ce4 60%, #2f8fff 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'end',
            }}
          >
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                  <StarIcon sx={{ fontSize: 18, color: '#febb02' }} />
                  <Typography sx={{ fontWeight: 700 }}>4.8 Exceptional</Typography>
                </Stack>
                <Typography variant="h3" sx={{ fontSize: { xs: '1.45rem', md: '2rem' }, fontWeight: 800 }}>
                  {tour.title}
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', opacity: 0.95 }}>
                  <LocationOnIcon sx={{ fontSize: 18 }} />
                  <Typography>{tour.location}</Typography>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Paper>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: { xs: 2, md: 2.5 } }}>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Chip icon={<CalendarTodayIcon />} label={`${tour.start_date} to ${tour.end_date}`} />
                  <Chip icon={<Groups2Icon />} label={`Up to ${tour.guest_limit} guests`} />
                  <Chip icon={<FlightTakeoffIcon />} label="Airport assistance included" />
                </Stack>
                <Typography color="text.secondary">{tour.description}</Typography>
                <Divider />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Day-wise Itinerary
                  </Typography>
                  <Stack spacing={1.5}>
                    {tour.itinerary.map((item) => (
                      <Paper
                        key={`${item.day}-${item.title}`}
                        sx={{ p: 1.75, bgcolor: '#fbfcff', border: '1px solid #e8eef8' }}
                      >
                        <Stack spacing={0.75}>
                          <Typography sx={{ fontWeight: 700 }}>
                            Day {item.day}: {item.title}
                          </Typography>
                          {item.description && (
                            <Typography variant="body2" color="text.secondary">
                              {item.description}
                            </Typography>
                          )}
                          {item.items && item.items.length > 0 && (
                            <Stack spacing={0.5}>
                              {item.items.map((activity, index) => (
                                <Typography
                                  key={`${item.day}-activity-${index}`}
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  - {activity}
                                </Typography>
                              ))}
                            </Stack>
                          )}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 2.25, position: { md: 'sticky' }, top: { md: 16 } }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" color="text.secondary">
                  Starting price
                </Typography>
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 800 }}>
                  {(tour.price_cents / 100).toFixed(2)} {tour.currency}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Includes guided activities as per itinerary and on-ground support.
                </Typography>
                <Button component={Link} href={`/t/${tour.share_slug}/book`} variant="contained" size="large">
                  Reserve Now
                </Button>
                <Button component={Link} href="/" variant="outlined">
                  Explore Similar Tours
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </AppShell>
  );
}

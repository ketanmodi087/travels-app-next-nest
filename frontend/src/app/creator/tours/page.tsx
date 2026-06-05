'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditNoteIcon from '@mui/icons-material/EditNote';
import Groups2Icon from '@mui/icons-material/Groups2';
import LanguageIcon from '@mui/icons-material/Language';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import PublicIcon from '@mui/icons-material/Public';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';
import { getFriendlyErrorMessage } from '@/lib/error-messages';
import { Tour } from '@/lib/types';

export default function ToursDashboardPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [copiedTourId, setCopiedTourId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const loadTours = async () => {
      setErrorMessage('');
      try {
        const result = await apiClient.listCreatorTours(undefined, currentPage, 10);
        setTours(result.data);
        setCurrentPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
      } catch (error) {
        setErrorMessage(getFriendlyErrorMessage(error, 'Unable to load tours right now. Please try again.'));
      }
    };

    void loadTours();
  }, [currentPage]);

  return (
    <AppShell title="Tour Management">
      <Stack spacing={3}>
        {errorMessage.length > 0 && <Alert severity="error">{errorMessage}</Alert>}

        <Paper
          sx={{
            p: { xs: 2, md: 2.5 },
            background: 'linear-gradient(115deg, #003580 0%, #006ce4 55%, #2f8fff 100%)',
            color: 'white',
          }}
        >
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  Manage Your Tours Professionally
                </Typography>
                <Typography sx={{ opacity: 0.95 }}>
                  Create tour packages, update itinerary, and share links with travelers.
                </Typography>
              </Box>
              <Button
                component={Link}
                href="/creator/tours/new"
                variant="contained"
                color="secondary"
                startIcon={<AddCircleIcon />}
                sx={{ color: '#17223b' }}
              >
                Create New Tour
              </Button>
            </Stack>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.22)' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <RouteOutlinedIcon />
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Total Tours
                      </Typography>
                      <Typography variant="h6">{tours.length}</Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.22)' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <PublicIcon />
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Public Listings
                      </Typography>
                      <Typography variant="h6">{tours.filter((tour) => tour.share_slug).length}</Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.22)' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Groups2Icon />
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Avg Guest Capacity
                      </Typography>
                      <Typography variant="h6">
                        {tours.length > 0
                          ? Math.round(tours.reduce((sum, item) => sum + item.guest_limit, 0) / tours.length)
                          : 0}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        <Grid container spacing={2}>
          {tours.map((tour) => (
            <Grid size={{ xs: 12, md: 6 }} key={tour.id}>
              <Card sx={{ overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: 140,
                    background: tour.images?.[0]
                      ? `url(${tour.images[0]}) center/cover`
                      : 'linear-gradient(135deg, #dfefff 0%, #b9d6ff 100%)',
                  }}
                />
                <CardContent>
                  <Stack spacing={1.25}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6">{tour.title}</Typography>
                      <Typography variant="h6" color="primary.main">
                        {(tour.price_cents / 100).toFixed(2)} {tour.currency}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <PlaceOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography color="text.secondary">{tour.location}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Chip icon={<LanguageIcon />} label={`${tour.share_slug}`} size="small" />
                      <Chip icon={<Groups2Icon />} label={`${tour.guest_limit} guests`} size="small" />
                    </Stack>
                    <Divider />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <Button
                        component={Link}
                        href={`/creator/tours/${tour.id}/edit`}
                        variant="contained"
                        startIcon={<EditNoteIcon />}
                      >
                        Edit Tour
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ContentCopyIcon />}
                        onClick={async () => {
                          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
                          await navigator.clipboard.writeText(`${appUrl}/t/${tour.share_slug}`);
                          setCopiedTourId(tour.id);
                        }}
                      >
                        {copiedTourId === tour.id ? 'Link Copied' : 'Copy Share Link'}
                      </Button>
                      <Button component={Link} href={`/t/${tour.share_slug}`} variant="text" startIcon={<PublicIcon />}>
                        Public Page
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', pt: 1 }}>
          <Button disabled={currentPage <= 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}>
            Previous
          </Button>
          <Chip label={`Page ${currentPage} of ${totalPages}`} />
          <Button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((prev) => prev + 1)}>
            Next
          </Button>
        </Stack>
      </Stack>
    </AppShell>
  );
}

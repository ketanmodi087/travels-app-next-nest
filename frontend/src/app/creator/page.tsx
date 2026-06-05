'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import PaymentsIcon from '@mui/icons-material/Payments';
import { ApexOptions } from 'apexcharts';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';
import { getFriendlyErrorMessage } from '@/lib/error-messages';
import { Booking, Tour } from '@/lib/types';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const formatAmount = (valueInCents: number) => `${(valueInCents / 100).toFixed(2)} USD`;

export default function CreatorDashboardPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setErrorMessage('');
      try {
        const [tourResult, bookingResult] = await Promise.all([
          apiClient.listCreatorTours(undefined, 1, 50),
          apiClient.listCreatorBookings(1, 50),
        ]);
        setTours(tourResult.data);
        setBookings(bookingResult.data);
      } catch (error) {
        setErrorMessage(getFriendlyErrorMessage(error, 'Unable to load dashboard data right now. Please try again.'));
      }
    };

    void loadDashboard();
  }, []);

  const analytics = useMemo(() => {
    const totalRevenueCents = bookings
      .filter((item) => item.status === 'confirmed')
      .reduce((sum, item) => sum + item.total_price_cents, 0);
    const pendingCount = bookings.filter((item) => item.status === 'pending').length;
    const confirmedCount = bookings.filter((item) => item.status === 'confirmed').length;
    const cancelledCount = bookings.filter((item) => item.status === 'cancelled').length;
    const confirmationRate = bookings.length === 0 ? 0 : Math.round((confirmedCount / bookings.length) * 100);

    const monthBuckets = new Map<string, number>();
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthBuckets.set(key, 0);
    }
    bookings.forEach((booking) => {
      const key = new Date(booking.created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });
      if (monthBuckets.has(key)) {
        monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + 1);
      }
    });

    return {
      totalRevenueCents,
      pendingCount,
      confirmedCount,
      cancelledCount,
      confirmationRate,
      monthlyLabels: Array.from(monthBuckets.keys()),
      monthlySeries: Array.from(monthBuckets.values()),
      latestBookings: [...bookings].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8),
    };
  }, [bookings]);

  const statusChartOptions: ApexOptions = {
    chart: { type: 'donut', toolbar: { show: false } },
    labels: ['Pending', 'Confirmed', 'Cancelled'],
    legend: { position: 'bottom' },
    colors: ['#f59e0b', '#10b981', '#ef4444'],
    dataLabels: { enabled: true },
  };

  const monthlyChartOptions: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    xaxis: { categories: analytics.monthlyLabels },
    yaxis: { title: { text: 'Bookings' } },
    colors: ['#006ce4'],
    plotOptions: {
      bar: { borderRadius: 6, columnWidth: '50%' },
    },
    dataLabels: { enabled: false },
  };

  return (
    <AppShell title="Creator Dashboard & Analytics">
      <Stack spacing={2.5}>
        {errorMessage.length > 0 && <Alert severity="error">{errorMessage}</Alert>}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #eef5ff 100%)' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <TravelExploreIcon color="primary" />
                    <Typography color="text.secondary" variant="body2">
                      Total Tours
                    </Typography>
                  </Stack>
                  <Typography variant="h5">{tours.length}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f1fbff 100%)' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <EventAvailableIcon color="primary" />
                    <Typography color="text.secondary" variant="body2">
                      Total Bookings
                    </Typography>
                  </Stack>
                  <Typography variant="h5">{bookings.length}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f7f2ff 100%)' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <PaymentsIcon color="primary" />
                    <Typography color="text.secondary" variant="body2">
                      Confirmed Revenue
                    </Typography>
                  </Stack>
                  <Typography variant="h5">{formatAmount(analytics.totalRevenueCents)}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #fff9eb 100%)' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <TrendingUpIcon color="primary" />
                    <Typography color="text.secondary" variant="body2">
                      Confirmation Rate
                    </Typography>
                  </Stack>
                  <Typography variant="h5">{analytics.confirmationRate}%</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2.5, background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Booking Status Breakdown
              </Typography>
              <ReactApexChart
                type="donut"
                options={statusChartOptions}
                series={[analytics.pendingCount, analytics.confirmedCount, analytics.cancelledCount]}
                height={320}
              />
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2.5, background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Monthly Booking Trend (Last 6 Months)
              </Typography>
              <ReactApexChart
                type="bar"
                options={monthlyChartOptions}
                series={[{ name: 'Bookings', data: analytics.monthlySeries }]}
                height={320}
              />
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2.5, background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)' }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="h6">Latest Booking Activity</Typography>
            <Chip label={`${analytics.latestBookings.length} recent rows`} size="small" />
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Visitor</TableCell>
                <TableCell>Tour</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analytics.latestBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.visitor_name}</TableCell>
                  <TableCell>{booking.tours?.title ?? 'Unknown Tour'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={booking.status.toUpperCase()}
                      color={
                        booking.status === 'confirmed'
                          ? 'success'
                          : booking.status === 'cancelled'
                            ? 'error'
                            : 'warning'
                      }
                    />
                  </TableCell>
                  <TableCell>{formatAmount(booking.total_price_cents)}</TableCell>
                  <TableCell>{new Date(booking.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {analytics.latestBookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary">No booking data available yet.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    </AppShell>
  );
}

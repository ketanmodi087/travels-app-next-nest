'use client';

import { useState } from 'react';
import { Alert, Paper, Stack } from '@mui/material';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { TourForm, TourFormPayload } from '@/components/tours/tour-form';
import { apiClient } from '@/lib/api-client';
import { getFriendlyErrorMessage } from '@/lib/error-messages';

export default function NewTourPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateTour = async (payload: TourFormPayload) => {
    setIsSubmitting(true);
    setError('');
    try {
      await apiClient.createTour(payload);
      router.push('/creator/tours');
      router.refresh();
    } catch (requestError) {
      setError(getFriendlyErrorMessage(requestError, 'Unable to create tour. Please review details and try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="Create Tour">
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          {error.length > 0 && <Alert severity="error">{error}</Alert>}
          <TourForm onSubmit={handleCreateTour} isSubmitting={isSubmitting} />
        </Stack>
      </Paper>
    </AppShell>
  );
}

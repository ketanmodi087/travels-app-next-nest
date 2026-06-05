'use client';

import { useEffect, useState } from 'react';
import { Alert, Button, Paper, Stack, Typography } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { TourForm, TourFormPayload } from '@/components/tours/tour-form';
import { apiClient } from '@/lib/api-client';
import { getFriendlyErrorMessage } from '@/lib/error-messages';
import { Tour } from '@/lib/types';

export default function EditTourPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    const loadTour = async () => {
      try {
        const result = await apiClient.getTourById(params.id);
        setTour(result);
      } catch (requestError) {
        setError(getFriendlyErrorMessage(requestError, 'Unable to load tour details. Please try again.'));
      }
    };

    if (params.id) {
      void loadTour();
    }
  }, [params.id]);

  const handleUpdateTour = async (payload: TourFormPayload) => {
    setIsSubmitting(true);
    setError('');
    try {
      await apiClient.updateTour(params.id, payload);
      router.push('/creator/tours');
      router.refresh();
    } catch (requestError) {
      setError(getFriendlyErrorMessage(requestError, 'Unable to update tour. Please review details and try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="Edit Tour">
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          {error.length > 0 && <Alert severity="error">{error}</Alert>}
          {tour ? (
            <>
              <TourForm initialTour={tour} onSubmit={handleUpdateTour} isSubmitting={isSubmitting} />
              <Button variant="outlined" component="label" disabled={isUploadingImage}>
                {isUploadingImage ? 'Uploading...' : 'Upload Tour Image'}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }

                    setError('');
                    setIsUploadingImage(true);
                    try {
                      const updatedTour = await apiClient.uploadTourImage(tour.id, file);
                      setTour(updatedTour);
                    } catch (requestError) {
                      setError(getFriendlyErrorMessage(requestError, 'Unable to upload image. Please try another file.'));
                    } finally {
                      setIsUploadingImage(false);
                    }
                  }}
                />
              </Button>
              {tour.images?.map((imageUrl) => (
                <Typography key={imageUrl} variant="body2" color="text.secondary">
                  {imageUrl}
                </Typography>
              ))}
            </>
          ) : (
            <Typography color="text.secondary">Loading tour...</Typography>
          )}
        </Stack>
      </Paper>
    </AppShell>
  );
}

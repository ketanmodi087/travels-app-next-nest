'use client';

import { useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Box, Button, Divider, Grid, IconButton, Paper, Stack, TextField, Typography } from '@mui/material';
import { ItineraryDay, Tour } from '@/lib/types';

export type TourFormPayload = {
  title: string;
  description: string;
  location: string;
  priceCents: number;
  currency: string;
  startDate: string;
  endDate: string;
  guestLimit: number;
  itinerary: ItineraryDay[];
  images: string[];
};

type TourFormProps = {
  initialTour?: Tour;
  isSubmitting?: boolean;
  onSubmit: (payload: TourFormPayload) => Promise<void> | void;
};

// Normalize saved itinerary to editable day/activity structure.
const normalizeItinerary = (input: Tour['itinerary'] | undefined): ItineraryDay[] => {
  if (!input || input.length === 0) {
    return [
      {
        day: 1,
        title: 'Arrival and welcome',
        description: '',
        items: ['Airport pickup'],
      },
    ];
  }

  return input.map((item, index) => ({
    day: item.day ?? index + 1,
    title: item.title ?? '',
    description: item.description ?? '',
    items: item.items && item.items.length > 0 ? item.items : [''],
  }));
};

export const TourForm = ({ initialTour, isSubmitting, onSubmit }: TourFormProps) => {
  const [title, setTitle] = useState(initialTour?.title ?? '');
  const [description, setDescription] = useState(initialTour?.description ?? '');
  const [location, setLocation] = useState(initialTour?.location ?? '');
  const [priceCents, setPriceCents] = useState(initialTour?.price_cents ?? 10000);
  const [currency, setCurrency] = useState(initialTour?.currency ?? 'USD');
  const [startDate, setStartDate] = useState(initialTour?.start_date ?? '');
  const [endDate, setEndDate] = useState(initialTour?.end_date ?? '');
  const [guestLimit, setGuestLimit] = useState(initialTour?.guest_limit ?? 1);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>(normalizeItinerary(initialTour?.itinerary));
  const [formError, setFormError] = useState('');

  // Append a new itinerary day with default empty fields.
  const handleAddDay = () => {
    setItinerary((prev) => [
      ...prev,
      {
        day: prev.length + 1,
        title: '',
        description: '',
        items: [''],
      },
    ]);
  };

  // Remove selected day and resequence day numbers.
  const handleRemoveDay = (dayIndex: number) => {
    setItinerary((prev) =>
      prev
        .filter((_, index) => index !== dayIndex)
        .map((item, index) => ({
          ...item,
          day: index + 1,
        })),
    );
  };

  // Update day title/description in immutable state.
  const handleUpdateDay = (dayIndex: number, field: 'title' | 'description', value: string) => {
    setItinerary((prev) =>
      prev.map((item, index) => (index === dayIndex ? { ...item, [field]: value } : item)),
    );
  };

  // Add one more activity row for the selected day.
  const handleAddItem = (dayIndex: number) => {
    setItinerary((prev) =>
      prev.map((item, index) =>
        index === dayIndex ? { ...item, items: [...(item.items ?? []), ''] } : item,
      ),
    );
  };

  // Remove activity row and keep at least one input visible.
  const handleRemoveItem = (dayIndex: number, itemIndex: number) => {
    setItinerary((prev) =>
      prev.map((item, index) => {
        if (index !== dayIndex) {
          return item;
        }

        const nextItems = (item.items ?? []).filter((_, idx) => idx !== itemIndex);
        return { ...item, items: nextItems.length > 0 ? nextItems : [''] };
      }),
    );
  };

  // Update a specific activity entry for selected day.
  const handleUpdateItem = (dayIndex: number, itemIndex: number, value: string) => {
    setItinerary((prev) =>
      prev.map((item, index) => {
        if (index !== dayIndex) {
          return item;
        }

        const nextItems = [...(item.items ?? [])];
        nextItems[itemIndex] = value;
        return { ...item, items: nextItems };
      }),
    );
  };

  // Validate itinerary/date logic, then submit sanitized payload.
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setFormError('Start date cannot be after end date.');
      return;
    }

    if (itinerary.some((day) => (day.items ?? []).map((entry) => entry.trim()).filter(Boolean).length === 0)) {
      setFormError('Each day should have at least one activity item.');
      return;
    }

    // Trim empty activity values before sending to API.
    const cleanedItinerary = itinerary.map((item, index) => ({
      day: index + 1,
      title: item.title.trim(),
      description: item.description?.trim() ?? '',
      items: (item.items ?? []).map((entry) => entry.trim()).filter(Boolean),
    }));

    await onSubmit({
      title,
      description,
      location,
      priceCents,
      currency,
      startDate,
      endDate,
      guestLimit,
      itinerary: cleanedItinerary,
      images: initialTour?.images ?? [],
    });
  };

  // Enable submit only when core fields and day titles are present.
  const isFormValid = useMemo(() => {
    return (
      title.trim().length > 0 &&
      description.trim().length > 0 &&
      location.trim().length > 0 &&
      startDate.length > 0 &&
      endDate.length > 0 &&
      guestLimit > 0 &&
      priceCents > 0 &&
      itinerary.length > 0 &&
      itinerary.every((day) => day.title.trim().length > 0)
    );
  }, [title, description, location, startDate, endDate, guestLimit, priceCents, itinerary]);

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2.5}>
        <TextField
          required
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <TextField
          required
          multiline
          minRows={3}
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <TextField
          required
          label="Location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
        />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              required
              fullWidth
              type="number"
              label="Price (cents)"
              value={priceCents}
              onChange={(event) => setPriceCents(Number(event.target.value))}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              required
              fullWidth
              label="Currency"
              value={currency}
              onChange={(event) => setCurrency(event.target.value.toUpperCase())}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              required
              fullWidth
              type="number"
              label="Guest limit"
              value={guestLimit}
              onChange={(event) => setGuestLimit(Number(event.target.value))}
            />
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              required
              fullWidth
              type="date"
              label="Start date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              required
              fullWidth
              type="date"
              label="End date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </Grid>
        </Grid>
        {formError.length > 0 && (
          <Typography color="error" variant="body2">
            {formError}
          </Typography>
        )}
        <Divider />
        <Stack spacing={1}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Day-wise Itinerary Builder</Typography>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddDay}>
              Add Day
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Add day title, day description, and 4-5 activity items (airport pickup, sightseeing, etc.).
          </Typography>
        </Stack>

        <Stack spacing={2}>
          {itinerary.map((day, dayIndex) => (
            <Paper key={`day-${dayIndex}`} sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1">Day {dayIndex + 1}</Typography>
                  <IconButton
                    aria-label={`remove day ${dayIndex + 1}`}
                    onClick={() => handleRemoveDay(dayIndex)}
                    disabled={itinerary.length === 1}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
                <TextField
                  required
                  fullWidth
                  label={`Day ${dayIndex + 1} title`}
                  placeholder="Arrival and city orientation"
                  value={day.title}
                  onChange={(event) => handleUpdateDay(dayIndex, 'title', event.target.value)}
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label={`Day ${dayIndex + 1} description`}
                  placeholder="Short overview of the day plan"
                  value={day.description ?? ''}
                  onChange={(event) => handleUpdateDay(dayIndex, 'description', event.target.value)}
                />

                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    Day {dayIndex + 1} activities
                  </Typography>
                  {(day.items ?? ['']).map((activity, itemIndex) => (
                    <Stack key={`day-${dayIndex}-item-${itemIndex}`} direction="row" spacing={1}>
                      <TextField
                        fullWidth
                        label={`Activity ${itemIndex + 1}`}
                        placeholder="Airport pickup / Sightseeing / Local market visit"
                        value={activity}
                        onChange={(event) => handleUpdateItem(dayIndex, itemIndex, event.target.value)}
                      />
                      <IconButton
                        aria-label={`remove activity ${itemIndex + 1}`}
                        onClick={() => handleRemoveItem(dayIndex, itemIndex)}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Stack>
                  ))}
                  <Button variant="text" startIcon={<AddIcon />} onClick={() => handleAddItem(dayIndex)}>
                    Add Activity
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
        <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" disabled={!isFormValid || Boolean(isSubmitting)}>
            Save Tour
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

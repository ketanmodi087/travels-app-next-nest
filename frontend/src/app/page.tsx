"use client";

import Link from "next/link";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StarIcon from "@mui/icons-material/Star";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/lib/api-client";
import { getFriendlyErrorMessage } from "@/lib/error-messages";
import { Tour } from "@/lib/types";
import { useAppContext } from "@/contexts/app-context";
import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const { tourSearch, handleSetTourSearch } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [tours, setTours] = useState<Tour[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [tourSearch]);

  useEffect(() => {
    const loadTours = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const result = await apiClient.listTours(tourSearch, currentPage, 9);
        setTours(result.data);
        setCurrentPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
      } catch (error) {
        setErrorMessage(getFriendlyErrorMessage(error, 'Unable to load tours right now. Please try again.'));
      } finally {
        setIsLoading(false);
      }
    };
    void loadTours();
  }, [tourSearch, currentPage]);

  const filteredTours = useMemo(() => {
    if (!tourSearch.trim()) {
      return tours;
    }
    return tours.filter((tour) =>
      `${tour.title} ${tour.location}`.toLowerCase().includes(tourSearch.toLowerCase()),
    );
  }, [tours, tourSearch]);

  return (
    <AppShell title="Discover Bookable Travel Tours">
      <Stack spacing={4}>
        {errorMessage.length > 0 && <Alert severity="error">{errorMessage}</Alert>}
        <Paper
          sx={{
            p: { xs: 2, md: 3 },
            background: "linear-gradient(120deg, #003580 0%, #006ce4 55%, #2f8fff 100%)",
            color: "white",
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h4">Find your next great tour experience</Typography>
            <Typography sx={{ opacity: 0.95 }}>
              Compare destinations, view detailed itineraries, and book with confidence.
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, md: 9 }}>
                <TextField
                  fullWidth
                  label=""
                  placeholder="Search by title or location"
                  value={tourSearch}
                  onChange={(event) => handleSetTourSearch(event.target.value)}
                  sx={{ bgcolor: "white", borderRadius: 2 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Button fullWidth variant="contained" color="secondary" sx={{ height: "100%", color: "#1a1f36" }}>
                  Search Tours
                </Button>
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        {isLoading && <LinearProgress />}

        {!isLoading && filteredTours.length === 0 && (
          <Typography color="text.secondary">No tours found. Create your first one from dashboard.</Typography>
        )}

        <Grid container spacing={2}>
          {filteredTours.map((tour) => (
            <Grid size={{ xs: 12, md: 4 }} key={tour.id}>
              <Card sx={{ overflow: "hidden" }}>
                <Box component={Link} href={`/t/${tour.share_slug}`} sx={{ display: "block" }}>
                  <Box
                    sx={{
                      height: 180,
                      background: tour.images?.[0]
                        ? `url(${tour.images[0]}) center/cover`
                        : "linear-gradient(135deg, #dfefff 0%, #b9d6ff 100%)",
                    }}
                  />
                </Box>
                <CardContent>
                  <Stack spacing={1.25}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Typography component={Link} href={`/t/${tour.share_slug}`} variant="h6" sx={{ "&:hover": { textDecoration: "underline" } }}>
                        {tour.title}
                      </Typography>
                      <Stack direction="row" spacing={0.25} sx={{ alignItems: "center" }}>
                        <StarIcon sx={{ fontSize: 16, color: "#febb02" }} />
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          4.8
                        </Typography>
                      </Stack>
                    </Stack>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                      <LocationOnIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography color="text.secondary" variant="body2">
                        {tour.location}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Up to {tour.guest_limit} guests | Curated multi-day itinerary
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip label="Free cancellation" size="small" />
                      <Chip label="Instant confirmation" size="small" color="secondary" />
                    </Stack>
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", pt: 0.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Starting from
                        </Typography>
                        <Typography variant="h6" color="primary.main">
                          {(tour.price_cents / 100).toFixed(2)} {tour.currency}
                        </Typography>
                      </Box>
                      <Button component={Link} href={`/t/${tour.share_slug}/book`} variant="contained">
                        Reserve
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", pt: 1 }}>
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

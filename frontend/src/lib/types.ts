export type ItineraryDay = {
  day: number;
  title: string;
  description?: string;
  items?: string[];
};

export type Tour = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  location: string;
  price_cents: number;
  currency: string;
  itinerary: ItineraryDay[];
  start_date: string;
  end_date: string;
  guest_limit: number;
  images: string[];
  share_slug: string;
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  tour_id: string;
  visitor_name: string;
  visitor_email: string;
  guest_count: number;
  special_requests: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  total_price_cents: number;
  created_at: string;
  updated_at: string;
  tours?: {
    title: string;
    creator_id: string;
    share_slug: string;
  };
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: PaginationMeta;
};

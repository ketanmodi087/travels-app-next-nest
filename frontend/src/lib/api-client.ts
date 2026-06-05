import { Booking, PaginatedResponse, Tour } from '@/lib/types';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { toFriendlyApiMessage } from '@/lib/error-messages';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new ApiRequestError(toFriendlyApiMessage(raw, response.status), response.status);
  }

  return response.json() as Promise<T>;
};

const requestPrivate = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const sessionResult = await supabaseBrowser.auth.getSession();
  const token = sessionResult.data.session?.access_token;
  if (!token) {
    throw new ApiRequestError('Please sign in to continue.', 401);
  }

  return request<T>(path, {
    ...options,
    headers: {
      ...(options?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
};

export const apiClient = {
  listTours: async (search?: string, page = 1, limit = 9) => {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    query.set('page', String(page));
    query.set('limit', String(limit));
    return request<PaginatedResponse<Tour>>(`/public/tours?${query.toString()}`);
  },
  listCreatorTours: async (search?: string, page = 1, limit = 10) => {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    query.set('page', String(page));
    query.set('limit', String(limit));
    return requestPrivate<PaginatedResponse<Tour>>(`/tours?${query.toString()}`);
  },
  getTourById: async (id: string) => requestPrivate<Tour>(`/tours/${id}`),
  createTour: async (payload: unknown) =>
    requestPrivate<Tour>('/tours', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateTour: async (id: string, payload: unknown) =>
    requestPrivate<Tour>(`/tours/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  uploadTourImage: async (id: string, file: File) => {
    const sessionResult = await supabaseBrowser.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    if (!token) {
      throw new ApiRequestError('Please sign in to continue.', 401);
    }

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/tours/${id}/images`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      cache: 'no-store',
    });

    if (!response.ok) {
      const raw = await response.text();
      throw new ApiRequestError(toFriendlyApiMessage(raw, response.status), response.status);
    }

    return response.json() as Promise<Tour>;
  },
  getPublicTourBySlug: async (slug: string) => request<Tour>(`/public/tours/${slug}`),
  createPublicBooking: async (slug: string, payload: unknown) =>
    request<Booking>(`/public/tours/${slug}/bookings`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listCreatorBookings: async (page = 1, limit = 10, search?: string, status?: string) => {
    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', String(limit));
    if (search && search.trim().length > 0) {
      query.set('search', search.trim());
    }
    if (status && status !== 'all') {
      query.set('status', status);
    }
    return requestPrivate<PaginatedResponse<Booking>>(`/bookings?${query.toString()}`);
  },
  updateBookingStatus: async (id: string, status: 'confirmed' | 'cancelled') =>
    requestPrivate<Booking>(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

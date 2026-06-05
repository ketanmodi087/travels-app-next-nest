export type BookingDraft = {
  slug: string;
  visitorName: string;
  visitorEmail: string;
  guestCount: number;
  specialRequests: string;
};

const BOOKING_DRAFT_KEY = 'tour_booking_draft';

export const bookingDraftStore = {
  save(draft: BookingDraft) {
    if (typeof window === 'undefined') {
      return;
    }
    window.sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
  },
  read(): BookingDraft | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const raw = window.sessionStorage.getItem(BOOKING_DRAFT_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as BookingDraft;
    } catch {
      return null;
    }
  },
  clear() {
    if (typeof window === 'undefined') {
      return;
    }
    window.sessionStorage.removeItem(BOOKING_DRAFT_KEY);
  },
};

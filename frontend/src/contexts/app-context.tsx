'use client';

import { createContext, useContext, useMemo, useState } from 'react';

type ToastState = {
  message: string;
  severity: 'success' | 'error' | 'info';
} | null;

type AppContextValue = {
  tourSearch: string;
  bookingStatusFilter: 'all' | 'pending' | 'confirmed' | 'cancelled';
  toast: ToastState;
  handleSetTourSearch: (value: string) => void;
  handleSetBookingStatusFilter: (value: 'all' | 'pending' | 'confirmed' | 'cancelled') => void;
  handleSetToast: (value: ToastState) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [tourSearch, setTourSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<
    'all' | 'pending' | 'confirmed' | 'cancelled'
  >('all');
  const [toast, setToast] = useState<ToastState>(null);

  const value = useMemo<AppContextValue>(
    () => ({
      tourSearch,
      bookingStatusFilter,
      toast,
      handleSetTourSearch: setTourSearch,
      handleSetBookingStatusFilter: setBookingStatusFilter,
      handleSetToast: setToast,
    }),
    [tourSearch, bookingStatusFilter, toast],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
};

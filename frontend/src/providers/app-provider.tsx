'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppContextProvider } from '@/contexts/app-context';
import { appTheme } from '@/theme/theme';

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <AppContextProvider>{children}</AppContextProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
};

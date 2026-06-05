'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const sessionResult = await supabaseBrowser.auth.getSession();
      const user = sessionResult.data.session?.user;

      if (!user) {
        router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      const role = (user.user_metadata?.role as string | undefined) ?? 'customer';
      if (role !== 'creator' && role !== 'admin') {
        router.replace('/');
        return;
      }

      setIsLoading(false);
    };

    void checkAuth();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import {
  Avatar,
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { User } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase-browser';

type AppShellProps = {
  title: string;
  children: React.ReactNode;
};

export const AppShell = ({ title, children }: AppShellProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const initSession = async () => {
      const sessionResult = await supabaseBrowser.auth.getSession();
      setCurrentUser(sessionResult.data.session?.user ?? null);
    };
    void initSession();

    const { data } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const userDisplayName = useMemo(() => {
    if (!currentUser) {
      return '';
    }

    const metadataName = (currentUser.user_metadata?.full_name as string | undefined)?.trim();
    if (metadataName) {
      return metadataName;
    }

    const email = currentUser.email ?? '';
    if (!email) {
      return 'Account';
    }

    return email.split('@')[0];
  }, [currentUser]);

  const handleLogout = async () => {
    await supabaseBrowser.auth.signOut();
    setMenuAnchorEl(null);
    window.location.href = '/';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="transparent" elevation={0}>
        <Box
          sx={{
            background: 'linear-gradient(90deg, #003580 0%, #006ce4 50%, #1e7bf0 100%)',
            color: 'white',
          }}
        >
          <Container maxWidth="xl">
            <Toolbar sx={{ minHeight: 72, justifyContent: 'space-between', px: { xs: 0 } }}>
              <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
                <FlightTakeoffIcon />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  TourBooking Pro
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Button component={Link} href="/" variant="text" sx={{ color: 'white' }}>
                  Public Tours
                </Button>
                {(currentUser?.user_metadata?.role === 'creator' ||
                  currentUser?.user_metadata?.role === 'admin') && (
                  <>
                    <Button component={Link} href="/creator" variant="text" sx={{ color: 'white' }}>
                      Dashboard
                    </Button>
                    <Button component={Link} href="/creator/tours" variant="text" sx={{ color: 'white' }}>
                      Creator Tours
                    </Button>
                    <Button component={Link} href="/creator/bookings" variant="text" sx={{ color: 'white' }}>
                      Creator Bookings
                    </Button>
                  </>
                )}
                {!currentUser ? (
                  <Button
                    component={Link}
                    href="/auth/login"
                    variant="outlined"
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}
                  >
                    Login
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      onClick={(event) => setMenuAnchorEl(event.currentTarget)}
                      sx={{
                        color: 'white',
                        borderColor: 'rgba(255,255,255,0.4)',
                        px: 1,
                        py: 0.5,
                      }}
                    >
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Avatar sx={{ width: 26, height: 26, fontSize: 13, bgcolor: 'rgba(255,255,255,0.25)' }}>
                          {userDisplayName.slice(0, 1).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                          {userDisplayName}
                        </Typography>
                      </Stack>
                    </Button>
                    <Menu
                      anchorEl={menuAnchorEl}
                      open={Boolean(menuAnchorEl)}
                      onClose={() => setMenuAnchorEl(null)}
                    >
                      <MenuItem disabled>{currentUser.email}</MenuItem>
                      <MenuItem onClick={handleLogout}>Logout</MenuItem>
                    </Menu>
                  </>
                )}
              </Stack>
            </Toolbar>
          </Container>
        </Box>
        <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e6ebf5' }}>
          <Container maxWidth="xl" sx={{ py: 1.25 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip label="Best price guarantee" color="secondary" size="small" />
              <Chip label="Free cancellation on selected tours" size="small" />
              <Chip label="24/7 support for travelers" size="small" />
            </Stack>
          </Container>
        </Box>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={1.5} sx={{ mb: 3, p: { xs: 2, md: 2.5 }, bgcolor: '#ffffffb3', borderRadius: 3, border: '1px solid #e8eef8' }}>
          <Typography variant="h4">{title}</Typography>
          <Typography color="text.secondary">Discover, publish, and manage professional tour experiences.</Typography>
        </Stack>
        {children}
      </Container>
    </Box>
  );
};

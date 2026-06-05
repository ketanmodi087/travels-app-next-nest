'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Box, Button, Grid, Paper, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { AppShell } from '@/components/layout/app-shell';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { getAuthFriendlyMessage } from '@/lib/error-messages';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get('next') ?? '/creator/tours', [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    fullName?: string;
    phone?: string;
    confirmPassword?: string;
  }>({});

  // Handle creator login with field-level validation and redirect.
  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    // Block submit when required login fields are invalid.
    const nextErrors: typeof fieldErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter valid email address.';
    }
    if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setIsSubmitting(true);

    const result = await supabaseBrowser.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);
    if (result.error) {
      setErrorMessage(getAuthFriendlyMessage(result.error.message));
      return;
    }

    router.replace(nextPath);
    router.refresh();
  };

  // Handle creator signup and store basic profile metadata.
  const handleSignup = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    // Validate signup inputs before calling Supabase auth.
    const nextErrors: typeof fieldErrors = {};
    if (fullName.trim().length < 2) {
      nextErrors.fullName = 'Please enter a valid full name.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter valid email address.';
    }
    if (phone.trim().length > 0 && !/^[0-9+\-\s]{8,15}$/.test(phone.trim())) {
      nextErrors.phone = 'Enter valid phone number.';
    }
    if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }
    if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Password and confirm password must match.';
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    // Persist creator role in user metadata for route protection.
    const result = await supabaseBrowser.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          company_name: companyName.trim(),
          role: 'creator',
        },
      },
    });

    setIsSubmitting(false);
    if (result.error) {
      setErrorMessage(getAuthFriendlyMessage(result.error.message));
      return;
    }

    setSuccessMessage('Signup successful. You can now login as creator.');
    setAuthMode('login');
    setConfirmPassword('');
  };

  return (
    <AppShell title="Login">
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2} component="form" onSubmit={handleLogin}>
              <Tabs
                value={authMode}
                onChange={(_event, nextMode: 'login' | 'signup') => setAuthMode(nextMode)}
                variant="fullWidth"
                sx={{
                  bgcolor: '#f7f9fd',
                  borderRadius: 2,
                  p: 0.5,
                  '& .MuiTabs-indicator': { display: 'none' },
                }}
              >
                <Tab
                  value="login"
                  label="Login"
                  sx={{
                    borderRadius: 1.5,
                    minHeight: 40,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                    },
                  }}
                />
                <Tab
                  value="signup"
                  label="Creator Sign Up"
                  sx={{
                    borderRadius: 1.5,
                    minHeight: 40,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                    },
                  }}
                />
              </Tabs>
              <Typography color="text.secondary">
                {authMode === 'login'
                  ? 'Access your creator dashboard.'
                  : 'Create creator account with basic details.'}
              </Typography>
              {errorMessage.length > 0 && <Alert severity="error">{errorMessage}</Alert>}
              {successMessage.length > 0 && <Alert severity="success">{successMessage}</Alert>}
              {authMode === 'signup' && (
                <>
                  <TextField
                    required
                    label="Full name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    error={Boolean(fieldErrors.fullName)}
                    helperText={fieldErrors.fullName}
                  />
                  <TextField
                    label="Phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    error={Boolean(fieldErrors.phone)}
                    helperText={fieldErrors.phone}
                  />
                  <TextField
                    label="Company / Brand (optional)"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                  />
                </>
              )}
              <TextField
                required
                type="email"
                label="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={Boolean(fieldErrors.email)}
                helperText={fieldErrors.email}
              />
              <TextField
                required
                type="password"
                label="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={Boolean(fieldErrors.password)}
                helperText={fieldErrors.password}
              />
              {authMode === 'signup' && (
                <TextField
                  required
                  type="password"
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  error={Boolean(fieldErrors.confirmPassword)}
                  helperText={fieldErrors.confirmPassword}
                />
              )}
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {authMode === 'login' ? (
                  <Button type="submit" variant="contained" disabled={isSubmitting}>
                    Login
                  </Button>
                ) : (
                  <Button type="button" variant="contained" disabled={isSubmitting} onClick={handleSignup}>
                    Create Creator Account
                  </Button>
                )}
                <Button component={Link} href="/" variant="text">
                  Back to Public
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            sx={{
              p: { xs: 3, md: 5 },
              minHeight: '100%',
              background: 'linear-gradient(130deg, #003580 0%, #006ce4 100%)',
              color: 'white',
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="h4">Manage tours like a pro</Typography>
              <Typography sx={{ opacity: 0.95 }}>
                Publish beautiful tour pages, track bookings in real time, and share links with your audience.
              </Typography>
              <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.14)' }}>
                <Typography>Private dashboard includes:</Typography>
                <Typography sx={{ opacity: 0.95 }}>- Tour creation and editing</Typography>
                <Typography sx={{ opacity: 0.95 }}>- Share link generation</Typography>
                <Typography sx={{ opacity: 0.95 }}>- Booking status controls</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </AppShell>
  );
}

export default function LoginPage() {
  // Wrap search-param usage with suspense for app-router compatibility.
  return (
    <Suspense
      fallback={
        <AppShell title="Login">
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary">Loading authentication page...</Typography>
          </Paper>
        </AppShell>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

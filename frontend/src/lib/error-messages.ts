const KNOWN_API_MESSAGES: Array<{ match: RegExp; message: string }> = [
  {
    match: /guest count exceeds/i,
    message: 'This tour allows fewer guests. Please lower the guest count and try again.',
  },
  {
    match: /not authenticated|unauthorized|invalid or expired token/i,
    message: 'Please sign in to continue.',
  },
  {
    match: /not found/i,
    message: 'We could not find what you were looking for. Please try again.',
  },
];

// Map HTTP status codes to user-friendly fallback messages.
const STATUS_MESSAGES: Record<number, string> = {
  400: 'Some details look incorrect. Please check your information and try again.',
  401: 'Please sign in to continue.',
  403: 'You do not have permission to perform this action.',
  404: 'We could not find what you were looking for. Please try again.',
  409: 'This action could not be completed because of a conflict. Please refresh and try again.',
  422: 'Some details look incorrect. Please review the form and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong on our side. Please try again in a moment.',
  502: 'Our service is temporarily unavailable. Please try again shortly.',
  503: 'Our service is temporarily unavailable. Please try again shortly.',
};

// Extract a backend message string from plain text or NestJS JSON payloads.
const extractBackendMessage = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const parsed = JSON.parse(trimmed) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) {
      return parsed.message.join(' ');
    }
    if (typeof parsed.message === 'string') {
      return parsed.message;
    }
  } catch {
    return trimmed;
  }

  return trimmed;
};

// Convert API response body + status into a safe user-facing message.
export const toFriendlyApiMessage = (raw: string, status: number): string => {
  const backendMessage = extractBackendMessage(raw);

  for (const entry of KNOWN_API_MESSAGES) {
    if (entry.match.test(backendMessage)) {
      return entry.message;
    }
  }

  if (STATUS_MESSAGES[status]) {
    return STATUS_MESSAGES[status];
  }

  if (status >= 500) {
    return STATUS_MESSAGES[500];
  }

  return 'Something went wrong. Please try again.';
};

// Convert unknown errors (including API errors) into readable UI text.
export const getFriendlyErrorMessage = (error: unknown, fallback: string): string => {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();
  if (!message) {
    return fallback;
  }

  // Already friendly messages from api-client should pass through.
  if (!message.startsWith('{') && !message.includes('statusCode') && message.length < 120) {
    for (const entry of KNOWN_API_MESSAGES) {
      if (entry.match.test(message)) {
        return entry.message;
      }
    }

    if (
      message.includes('Please ') ||
      message.includes('Something went wrong') ||
      message.includes('We could not find') ||
      message.includes('Some details look')
    ) {
      return message;
    }
  }

  try {
    const parsedStatus = Number((error as Error & { status?: number }).status);
    if (Number.isFinite(parsedStatus)) {
      return toFriendlyApiMessage(message, parsedStatus);
    }
  } catch {
    // Fall through to generic fallback.
  }

  return fallback;
};

// Convert Supabase auth errors into simple language for login/signup forms.
export const getAuthFriendlyMessage = (rawMessage: string): string => {
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Email or password is incorrect. Please try again.';
  }
  if (normalized.includes('user already registered')) {
    return 'An account with this email already exists. Please log in instead.';
  }
  if (normalized.includes('password should be at least')) {
    return 'Password must be at least 8 characters long.';
  }
  if (normalized.includes('unable to validate email')) {
    return 'Please enter a valid email address.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Please confirm your email before logging in.';
  }

  return 'We could not complete authentication. Please check your details and try again.';
};

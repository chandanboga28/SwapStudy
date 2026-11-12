export interface MeetingUrlValidationResult {
  valid: boolean;
  normalizedUrl?: string;
  error?: string;
}

const GOOGLE_MEET_HOST = 'meet.google.com';
const GOOGLE_MEET_PATH_REGEX = /^\/[A-Za-z0-9_-]{3,}(?:\/[A-Za-z0-9_-]+)*$/;
const MAX_MEETING_URL_LENGTH = 500;

/**
 * Validates and normalizes a Google Meet room URL (e.g. https://meet.google.com/abc-defg-hij).
 */
export function validateGoogleMeetUrl(input: string): MeetingUrlValidationResult {
  const trimmed = (input || '').trim();

  if (!trimmed) {
    return {
      valid: false,
      error: 'Please enter a Google Meet URL (e.g., https://meet.google.com/abc-defg-hij).',
    };
  }

  if (/\s/.test(trimmed)) {
    return {
      valid: false,
      error: 'Google Meet URL cannot contain spaces.',
    };
  }

  if (trimmed.length > MAX_MEETING_URL_LENGTH) {
    return {
      valid: false,
      error: 'Google Meet URL is too long.',
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      error: 'Please enter a valid URL starting with https://meet.google.com/...',
    };
  }

  if (parsed.protocol !== 'https:') {
    return {
      valid: false,
      error: 'Google Meet link must use https:// (https://meet.google.com/...).',
    };
  }

  if (parsed.hostname.toLowerCase() !== GOOGLE_MEET_HOST) {
    return {
      valid: false,
      error: 'URL must be hosted on https://meet.google.com/.',
    };
  }

  if (parsed.username || parsed.password || parsed.port) {
    return {
      valid: false,
      error: 'Please enter a clean Google Meet link without credentials or port numbers.',
    };
  }

  const cleanPath = parsed.pathname.replace(/\/+$/, '');
  if (!GOOGLE_MEET_PATH_REGEX.test(cleanPath)) {
    return {
      valid: false,
      error: 'Please include a valid Google Meet code (e.g., https://meet.google.com/abc-defg-hij).',
    };
  }

  if (cleanPath.toLowerCase() === '/new') {
    return {
      valid: false,
      error:
        'Please paste your generated Google Meet room URL (e.g., https://meet.google.com/abc-defg-hij), not /new.',
    };
  }

  const normalizedUrl = `https://${GOOGLE_MEET_HOST}${cleanPath}${parsed.search}${parsed.hash}`;
  if (normalizedUrl.length > MAX_MEETING_URL_LENGTH) {
    return {
      valid: false,
      error: 'Google Meet URL is too long.',
    };
  }

  return {
    valid: true,
    normalizedUrl,
  };
}

/**
 * Type guard verifying a saved URL is a safe https://meet.google.com/... URL before rendering as a link.
 */
export function isSafeGoogleMeetUrl(url?: string | null): url is string {
  if (!url) return false;
  return validateGoogleMeetUrl(url).valid;
}


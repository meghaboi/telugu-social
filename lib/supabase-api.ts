const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // keep runtime warning deferred to call sites
}

function getEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are missing.');
  }

  return { url: SUPABASE_URL, anon: SUPABASE_ANON_KEY };
}

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  user: { id: string; phone?: string };
};

export async function sendOtp(phone: string) {
  const { url, anon } = getEnv();
  const response = await fetch(`${url}/auth/v1/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anon },
    body: JSON.stringify({ phone, create_user: true })
  });

  if (!response.ok) {
    throw new Error('Unable to send OTP.');
  }
}

export async function verifyOtp(phone: string, token: string): Promise<AuthSession> {
  const { url, anon } = getEnv();
  const response = await fetch(`${url}/auth/v1/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anon },
    body: JSON.stringify({ phone, token, type: 'sms' })
  });

  if (!response.ok) {
    throw new Error('Invalid OTP code.');
  }

  return response.json();
}

export async function fetchUser(accessToken: string) {
  const { url, anon } = getEnv();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${accessToken}` },
    cache: 'no-store'
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function refreshSession(refreshToken: string): Promise<AuthSession | null> {
  const { url, anon } = getEnv();
  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anon },
    body: JSON.stringify({ refresh_token: refreshToken })
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

type RestMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export async function restRequest<T>(
  path: string,
  method: RestMethod,
  accessToken: string,
  body?: Record<string, unknown> | Record<string, unknown>[]
): Promise<T> {
  const { url, anon } = getEnv();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: anon,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store'
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Database request failed.');
  }

  if (response.status === 204) {
    return [] as T;
  }

  return response.json();
}

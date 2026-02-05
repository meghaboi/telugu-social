import { cookies } from 'next/headers';
import { fetchUser } from '@/lib/supabase-api';

const ACCESS_COOKIE = 'ts_access_token';
const REFRESH_COOKIE = 'ts_refresh_token';

export function setSessionCookies(accessToken: string, refreshToken: string) {
  const jar = cookies();
  jar.set(ACCESS_COOKIE, accessToken, { httpOnly: true, sameSite: 'lax', path: '/', secure: true, maxAge: 60 * 60 * 24 * 7 });
  jar.set(REFRESH_COOKIE, refreshToken, { httpOnly: true, sameSite: 'lax', path: '/', secure: true, maxAge: 60 * 60 * 24 * 30 });
}

export function clearSessionCookies() {
  const jar = cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

export function getTokensFromCookies() {
  const jar = cookies();
  return {
    accessToken: jar.get(ACCESS_COOKIE)?.value,
    refreshToken: jar.get(REFRESH_COOKIE)?.value
  };
}

export async function requireUser() {
  const { accessToken } = getTokensFromCookies();
  if (!accessToken) return null;
  return fetchUser(accessToken);
}

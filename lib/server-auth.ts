import { cookies } from 'next/headers';
import { fetchUser } from '@/lib/supabase-api';

export async function getServerAuth() {
  const accessToken = cookies().get('ts_access_token')?.value;
  if (!accessToken) return null;
  const user = await fetchUser(accessToken);
  if (!user) return null;
  return { accessToken, user };
}

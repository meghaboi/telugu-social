import { NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/supabase-api';

export async function POST(request: Request) {
  const { phone, token } = await request.json();

  if (!phone || !token) {
    return NextResponse.json({ error: 'Phone and OTP are required.' }, { status: 400 });
  }

  try {
    const session = await verifyOtp(phone, token);
    const response = NextResponse.json({ ok: true, user: session.user });
    response.cookies.set('ts_access_token', session.access_token, { httpOnly: true, path: '/', sameSite: 'lax', secure: true });
    response.cookies.set('ts_refresh_token', session.refresh_token, { httpOnly: true, path: '/', sameSite: 'lax', secure: true });
    return response;
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

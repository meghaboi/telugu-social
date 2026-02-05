import { NextResponse } from 'next/server';
import { sendOtp } from '@/lib/supabase-api';

export async function POST(request: Request) {
  const { phone } = await request.json();
  if (!phone || !/^\+91\d{10}$/.test(phone)) {
    return NextResponse.json({ error: 'Use +91XXXXXXXXXX format.' }, { status: 400 });
  }

  try {
    await sendOtp(phone);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

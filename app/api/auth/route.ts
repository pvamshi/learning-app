import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { password } = body;

  const correctPassword = process.env.APP_PASSWORD;

  if (!correctPassword) {
    return NextResponse.json(
      { error: 'APP_PASSWORD not configured' },
      { status: 500 }
    );
  }

  if (password !== correctPassword) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  // Set auth cookie (expires in 30 days)
  const response = NextResponse.json({ success: true });
  response.cookies.set('auth', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}

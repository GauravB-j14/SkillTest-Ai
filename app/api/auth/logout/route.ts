import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth/store';

export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  await deleteSession(req.cookies.get('skilltype_session')?.value);
  const response = NextResponse.json({ ok: true });
  response.cookies.set('skilltype_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

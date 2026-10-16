import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/store';

export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req.cookies.get('skilltype_session')?.value);
  return NextResponse.json({ user });
}

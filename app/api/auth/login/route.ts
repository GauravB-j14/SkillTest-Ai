import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateUser, createSession } from '@/lib/auth/store';

export const runtime = 'nodejs';
const schema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(254),
  password: z.string().min(1, 'Enter your password.').max(128),
});

export async function POST(req: NextRequest) {
  try {
    if (Number(req.headers.get('content-length') || 0) > 8192) return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Check your details and try again.' }, { status: 400 });
    const user = await authenticateUser(parsed.data.email, parsed.data.password);
    if (!user) return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
    const session = await createSession(user.id);
    const response = NextResponse.json({ user });
    response.cookies.set('skilltype_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: session.maxAge,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Could not log in. Please try again.' }, { status: 500 });
  }
}

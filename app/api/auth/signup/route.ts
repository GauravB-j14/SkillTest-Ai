import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSession, registerUser } from '@/lib/auth/store';

export const runtime = 'nodejs';
const schema = z.object({
  name: z.string().trim().min(2, 'Enter a name with at least 2 characters.').max(80),
  email: z.string().trim().email('Enter a valid email address.').max(254),
  password: z.string().min(8, 'Use a password with at least 8 characters.').max(128),
});

export async function POST(req: NextRequest) {
  try {
    if (Number(req.headers.get('content-length') || 0) > 8192) return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Check your details and try again.' }, { status: 400 });
    const user = await registerUser(parsed.data.name, parsed.data.email, parsed.data.password);
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
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    if ((error instanceof Error && error.message.includes('UNIQUE constraint failed')) || code === '23505') {
      return NextResponse.json({ error: 'An account with this email already exists. Log in instead.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Could not create account. Please try again.' }, { status: 500 });
  }
}

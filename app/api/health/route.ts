import { NextResponse } from 'next/server';
import { geminiConfigured, getModel } from '@/lib/gemini/client';
export const runtime = 'nodejs';
export async function GET() { return NextResponse.json({ mode: geminiConfigured() ? 'ai' : 'demo', geminiConfigured: geminiConfigured(), model: geminiConfigured() ? getModel() : null }); }

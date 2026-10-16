import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import mammoth from 'mammoth';
import type { Part } from '@google/genai';
import { getGemini, getModel, geminiConfigured } from '@/lib/gemini/client';

export const runtime = 'nodejs';
export const maxDuration = 60;

const sourceFileSchema = z.object({
  name: z.string().min(1).max(180),
  mimeType: z.enum([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp',
  ]),
  data: z.string().min(1).max(5_600_000),
});

const schema = z.object({
  action: z.enum(['lesson', 'explain', 'quiz', 'hint', 'example']),
  topic: z.string().trim().min(1).max(180),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Beginner'),
  goal: z.string().max(100).optional(),
  source: z.string().max(24000).optional(),
  files: z.array(sourceFileSchema).max(5).optional(),
  context: z.string().max(4000).optional(),
  hintLevel: z.enum(['small', 'guided', 'full']).optional(),
});

const demo = (a: z.infer<typeof schema>) => ({
  title: a.topic,
  content: `Demo mode: ${a.topic} is a useful topic to study. Start with its core definition, learn one concrete example, and then explain the idea in your own words. Add a Gemini API key to generate a personalized ${a.action}.`,
  keyTerms: [a.topic, 'definition', 'example'],
  quiz: [{ question: `Which is the best first step when learning ${a.topic}?`, options: ['Understand the core idea', 'Memorize everything at once', 'Skip examples'], answer: 0, explanation: 'Start with the core idea, then use examples.' }],
});

export async function POST(req: NextRequest) {
  try {
    const length = Number(req.headers.get('content-length') || 0);
    if (length > 15 * 1024 * 1024) return NextResponse.json({ error: 'Source materials exceed the 10 MB total limit.' }, { status: 413 });

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request. Check topic, action, and source file formats.' }, { status: 400 });
    const data = parsed.data;
    const userApiKey = req.headers.get('x-gemini-api-key')?.trim();
    const files = data.files || [];
    const decodedTotal = files.reduce((total, file) => total + Math.floor(file.data.length * 0.75), 0);
    if (decodedTotal > 10 * 1024 * 1024 || files.some(file => file.data.length * 0.75 > 4 * 1024 * 1024)) {
      return NextResponse.json({ error: 'Keep each source file under 4 MB and all source materials under 10 MB.' }, { status: 413 });
    }
    if (!geminiConfigured(userApiKey)) return NextResponse.json({ ...demo(data), mode: 'demo' });

    const extractedText: string[] = [];
    const mediaParts: Part[] = [];
    for (const file of files) {
      if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer: Buffer.from(file.data, 'base64') });
        const text = result.value.trim();
        if (text) extractedText.push(`--- ${file.name} ---\n${text}`);
      } else {
        mediaParts.push({ text: `Use this attached source material: ${file.name}` });
        mediaParts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
      }
    }

    const attachedText = [data.source?.trim(), ...extractedText].filter(Boolean).join('\n\n').slice(0, 24000);
    const prompts: Record<string, string> = {
      lesson: `Create a concise, accurate educational typing lesson about "${data.topic}" for ${data.difficulty} level. Goal: ${data.goal || 'understand a concept'}. ${attachedText ? `Use these source materials as grounding. Prioritize their content and do not invent quotes: ${attachedText}` : ''} Return plain text with a short title, learning objectives, a 250-450 word passage, key terms, and 3 quiz questions.`,
      explain: `Explain "${data.topic}" at ${data.difficulty} level using a simple analogy and one practical example. Ground your explanation in the supplied source materials when present: ${attachedText || data.context || 'No extra context.'}`,
      quiz: `Create 5 multiple-choice questions about "${data.topic}" at ${data.difficulty} level, grounded in the supplied source materials when present. ${attachedText}`,
      hint: `You are a patient DSA tutor. Topic/challenge: ${data.topic}. Context: ${data.context || 'No game state supplied.'}. Source material: ${attachedText || 'None supplied.'}. Hint level: ${data.hintLevel || 'small'}. Small hint must not reveal the answer; guided hint gives next step; full explanation may reveal and explain solution.`,
      example: `Give a small, concrete example demonstrating "${data.topic}" at ${data.difficulty} level. Use the supplied source materials when relevant. ${attachedText}`,
    };
    const parts: Part[] = [{ text: prompts[data.action] }, ...mediaParts];
    const result = await Promise.race([
      getGemini(userApiKey).models.generateContent({ model: getModel(), contents: [{ role: 'user', parts }] }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('AI request timed out. Please retry.')), 50000)),
    ]);
    const content = result.text?.trim();
    if (!content || content.length > 20000) return NextResponse.json({ error: 'The AI returned an empty or oversized response. Please retry.' }, { status: 502 });
    return NextResponse.json({ title: data.topic, content, mode: 'ai' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected AI error.';
    const lower = message.toLowerCase();
    const status = lower.includes('api key') || lower.includes('unauthorized') || lower.includes('permission') ? 401 : lower.includes('quota') || lower.includes('resource_exhausted') ? 429 : lower.includes('timed out') ? 504 : 502;
    return NextResponse.json({ error: status === 401 ? 'Gemini authentication failed. Check GEMINI_API_KEY in .env.local.' : status === 429 ? 'Gemini quota or rate limit reached. Wait a moment and try again.' : message }, { status });
  }
}

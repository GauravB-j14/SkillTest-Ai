import { GoogleGenAI } from '@google/genai';

export function geminiConfigured(userKey?: string) { return Boolean(userKey?.trim() || process.env.GEMINI_API_KEY?.trim()); }
export function getGemini(userKey?: string) {
  const key = userKey?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error('Gemini is not configured. Add GEMINI_API_KEY to .env.local.');
  return new GoogleGenAI({ apiKey: key });
}
export function getModel() { return process.env.GEMINI_MODEL?.trim() || 'gemini-3.6-flash'; }

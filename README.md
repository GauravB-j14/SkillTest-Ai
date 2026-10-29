# SkillType AI

A Next.js MVP combining educational typing practice, a server-side Gemini learning endpoint, and a playable Binary Search Quest. Demo content and deterministic game logic work without an API key.

## Requirements
- Node.js 22.13+ (the local account store uses `node:sqlite`)
- npm
- Optional: a Google Gemini API key from https://aistudio.google.com/app/apikey

## Run locally

```bash
npm install
cp .env.example .env.local
```

Open `.env.local` and replace the placeholder on this line:

```dotenv
GEMINI_API_KEY=your_gemini_api_key
```

Optional model override:

```dotenv
GEMINI_MODEL=gemini-3.6-flash
```

Use a model supported by your Google AI Studio account. Restart `npm run dev` after editing environment variables.

```bash
npm run dev
```

Open http://localhost:3000. Check `/api/health` to see whether the server is in `ai` or `demo` mode. The endpoint never returns the secret.

## Commands
- `npm run dev` — development server
- `npm run build` — production build
- `npm start` — serve production build
- `npm test` — deterministic unit tests

## Render deployment

For the Render Free web service, create a Render Postgres database and set `DATABASE_URL` on the web service to that database's internal connection URL. Keep the database and web service in the same region. The app creates its account and session tables automatically and uses Postgres whenever `DATABASE_URL` is set.

Render's Free Postgres plan currently expires after 30 days. For accounts that must remain available longer, use a database plan that does not expire or another hosted Postgres provider. A paid Render web service can alternatively use a persistent disk mounted at `/var/data` with `AUTH_DATABASE_PATH=/var/data/skilltype.sqlite`; SQLite disks are limited to one service instance.

Use `pnpm install --frozen-lockfile && pnpm build` as the build command and `pnpm start` as the start command. Configure `GEMINI_API_KEY` separately in the Render service environment if AI generation is needed.

## Included in this MVP
- Responsive home, learning, typing, game arena, dashboard, and settings views.
- Character-level typing feedback, WPM/accuracy/CPM/error/progress calculations, pause/resume/reset/finish.
- Server-only Gemini integration via `@google/genai`, Zod request validation, request-size guard, timeout, and graceful demo mode.
- Playable binary-search game with deterministic move validation, search interval visualization, hints/explanations through the AI endpoint.
- Local XP/session state while the page remains open.
- Email/password sign-up and login with scrypt password hashes, HttpOnly session cookies, and a local SQLite account store.
- Users can provide a personal Gemini key in Settings; it overrides the server key and stays in that browser tab's session storage.
- Multi-file source loading for PDF, DOCX, TXT, Markdown, JPG, PNG, and WEBP; PDF and images can ground Gemini requests.

## Known limitations
- This is an MVP foundation, not the full feature list. Only Binary Search Quest is fully playable; other games are catalog entries and need their own game mechanics.
- Account records use local SQLite during development, or hosted Postgres when `DATABASE_URL` is configured. Learning progress remains in React state and does not sync between devices yet.
- The AI endpoint has basic request-size checks and timeout, but production deployment should add distributed per-IP/user rate limiting, request concurrency controls, and monitoring.
- XP and session progress remain in React state and are not durable across reloads.

- The AI endpoint returns validated text, not a trusted executable payload. Do not execute generated code.

## Security notes
- `GEMINI_API_KEY` is read only in server-side code. Never rename it to `NEXT_PUBLIC_GEMINI_API_KEY`.
- `.env.local` is ignored by Git; `.env.example` contains placeholders only.
- Uploaded source files are only sent to Gemini when a user submits a request that includes them. DOCX files are extracted locally on the server before their text is sent; selected PDFs and images are sent as visual inputs.

- https://skilltest-ai.onrender.com
- 

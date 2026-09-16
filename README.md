# Prompt.OS v4 Cloud

This package upgrades the local Prompt.OS workspace with:

- OpenAI Responses API streaming through a server-side Next.js route
- Supabase-authenticated AI execution by default to protect API spend
- Live run rendering with latency/token metadata
- Local simulation fallback
- Manual-result runs that never call an AI provider
- Supabase magic-link authentication
- Explicit Push Cloud / Pull Cloud backup
- Row Level Security so each signed-in user can access only their own Prompt.OS document

## 1. Requirements

- Node.js 22+
- npm
- Optional: OpenAI API key for real runs
- Optional: Supabase project for login/cloud sync

## 2. Install

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## 3. OpenAI setup

Put the key only in `.env.local`:

```bash
OPENAI_API_KEY=your_server_side_key
```

Do not use `NEXT_PUBLIC_OPENAI_API_KEY`. The browser calls `/api/ai/run`; only the server route talks to OpenAI.

By default the AI route also requires a valid Supabase access token, so a random visitor cannot spend your OpenAI balance. Sign in through the CLOUD menu before using `OpenAI Backend`. For isolated local development only, you can set `PROMPT_OS_ALLOW_UNAUTHENTICATED_AI=true`; do not enable that flag on a public deployment.

Default model in the UI is `gpt-5.6`. You can type another model ID in the workspace before execution.

## 4. Supabase setup

Run `supabase/schema.sql` in the Supabase SQL Editor, then set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

In Supabase Auth URL settings, add your local and production URLs to the allowed redirect URLs so magic links can return to the app.

The SQL explicitly grants the authenticated role access to `prompt_os_state` and then constrains rows with RLS. This is important for newer Supabase Data API behavior where new tables may not be automatically accessible.

## 5. Cloud sync behavior

- `PUSH_CLOUD`: uploads the full local Prompt.OS database document for the signed-in user.
- `PULL_CLOUD`: asks for confirmation, then replaces local Prompt.OS data with the cloud copy.
- LocalStorage remains the primary offline store, so the app still works when Supabase is absent.

This iteration deliberately uses explicit push/pull instead of silent last-write-wins autosync to avoid accidental cross-device overwrites.

## 6. Tests

```bash
npm test
```

The tests cover AI request validation, NDJSON stream parsing, and sync decision helpers.

## 7. Production deployment

Set the same environment variables in your deployment platform. Keep `OPENAI_API_KEY` server-only. The Supabase URL and publishable key are intended for browser use; RLS is the authorization boundary.

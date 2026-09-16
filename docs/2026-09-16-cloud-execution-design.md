# Prompt.OS Cloud Execution Design

## Goal
Extend the existing Prompt.OS v3 artifact with real server-side OpenAI streaming and optional authenticated Supabase cloud backup without putting secrets in browser storage.

## Architecture
- `components/PromptOS.jsx` remains the main UI and local-first database.
- `app/api/ai/run/route.js` is the only OpenAI boundary. It reads `OPENAI_API_KEY` server-side and streams normalized NDJSON events to the browser.
- `lib/ai/run-stream.mjs` consumes streamed events and exposes deltas/metadata to the Result Workspace.
- `components/CloudSyncPanel.jsx` provides explicit push/pull cloud backup using Supabase Auth magic links.
- `public.prompt_os_state` stores one JSONB state document per authenticated user. RLS limits every operation to `auth.uid() = user_id`.

## Security constraints
- Never expose `OPENAI_API_KEY` or a Supabase service-role/secret key to the browser.
- Browser code uses only a Supabase publishable key.
- RLS is enabled and ownership is checked in `USING` / `WITH CHECK` policies.
- Cloud pull is explicit and asks before replacing local data.
- Local mode remains fully usable without Supabase or OpenAI configuration.

## Execution behavior
- Local provider: deterministic simulation fallback.
- OpenAI provider: streamed Responses API output via the backend route.
- Manual pasted result: stored locally and never sent to an AI provider.
- Failed provider requests are saved as failed runs so history stays auditable.

import OpenAI from 'openai';
import { validateRunRequest } from '../../../../lib/ai/validate-run-request.mjs';
import { extractBearerToken, unauthenticatedAiAllowed } from '../../../../lib/ai/auth.mjs';
import { verifySupabaseAccessToken } from '../../../../lib/cloud/verify-access-token.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function encodeLine(encoder, payload) {
  return encoder.encode(`${JSON.stringify(payload)}\n`);
}

export async function POST(request) {
  try {
    const input = validateRunRequest(await request.json());

    if (!unauthenticatedAiAllowed(process.env.PROMPT_OS_ALLOW_UNAUTHENTICATED_AI)) {
      const accessToken = extractBearerToken(request.headers.get('authorization'));
      if (!accessToken) {
        return Response.json({ error: 'Authentication required. Sign in with Supabase before running AI.' }, { status: 401 });
      }
      try {
        await verifySupabaseAccessToken(accessToken);
      } catch (error) {
        return Response.json({ error: error?.message || 'Authentication failed' }, { status: 401 });
      }
    }

    if (input.provider !== 'openai') {
      return Response.json({ error: `Provider ${input.provider} is not implemented` }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: 'OPENAI_API_KEY is not configured on the server' }, { status: 503 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const startedAt = Date.now();
    const upstream = await client.responses.create({
      model: input.model,
      input: input.prompt,
      stream: true,
    });
    const encoder = new TextEncoder();

    const body = new ReadableStream({
      async start(controller) {
        let completed = false;
        try {
          for await (const event of upstream) {
            if (event.type === 'response.output_text.delta') {
              controller.enqueue(encodeLine(encoder, { type: 'delta', delta: event.delta || '' }));
            } else if (event.type === 'response.completed') {
              completed = true;
              const usage = event.response?.usage || {};
              controller.enqueue(encodeLine(encoder, {
                type: 'meta',
                provider: 'OpenAI',
                model: input.model,
                latencyMs: Date.now() - startedAt,
                inputTokens: usage.input_tokens || 0,
                outputTokens: usage.output_tokens || 0,
                responseId: event.response?.id || null,
              }));
            } else if (event.type === 'error') {
              controller.enqueue(encodeLine(encoder, { type: 'error', error: event.message || 'OpenAI stream error' }));
            }
          }
          if (!completed) {
            controller.enqueue(encodeLine(encoder, {
              type: 'meta', provider: 'OpenAI', model: input.model, latencyMs: Date.now() - startedAt,
            }));
          }
          controller.enqueue(encodeLine(encoder, { type: 'done' }));
        } catch (error) {
          controller.enqueue(encodeLine(encoder, { type: 'error', error: error?.message || 'Streaming failed' }));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(body, {
      headers: {
        'content-type': 'application/x-ndjson; charset=utf-8',
        'cache-control': 'no-store, no-transform',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'Invalid request' }, { status: 400 });
  }
}

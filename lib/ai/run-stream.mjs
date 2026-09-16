import { createNdjsonAccumulator } from './ndjson.mjs';
import { getSupabaseBrowserClient } from '../cloud/supabase-browser.js';

export async function streamAiRun({ provider = 'openai', model, prompt, signal, onDelta, onMeta }) {
  const supabase = getSupabaseBrowserClient();
  let accessToken = null;
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    accessToken = data?.session?.access_token || null;
  }

  const headers = { 'content-type': 'application/json' };
  if (accessToken) headers.authorization = `Bearer ${accessToken}`;

  const response = await fetch('/api/ai/run', {
    method: 'POST',
    headers,
    body: JSON.stringify({ provider, model, prompt }),
    signal,
  });

  if (!response.ok) {
    let message = `AI request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {
      const text = await response.text().catch(() => '');
      if (text) message = text;
    }
    throw new Error(message);
  }
  if (!response.body) throw new Error('Streaming body is unavailable');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = createNdjsonAccumulator();
  let metadata = {};

  const handle = (event) => {
    if (event.type === 'delta') onDelta?.(event.delta || '');
    if (event.type === 'meta') {
      metadata = { ...metadata, ...event };
      onMeta?.(metadata);
    }
    if (event.type === 'error') throw new Error(event.error || 'Provider stream failed');
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const event of parser.push(decoder.decode(value, { stream: true }))) handle(event);
  }
  for (const event of parser.push(decoder.decode())) handle(event);
  for (const event of parser.flush()) handle(event);

  return metadata;
}

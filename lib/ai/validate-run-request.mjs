const DEFAULT_MODELS = {
  openai: 'gpt-5.6',
};

const SUPPORTED_PROVIDERS = new Set(Object.keys(DEFAULT_MODELS));
const MAX_PROMPT_CHARS = 200_000;

export function validateRunRequest(input = {}) {
  const provider = String(input.provider || 'openai').trim().toLowerCase();
  const prompt = String(input.prompt || '').trim();
  const model = String(input.model || DEFAULT_MODELS[provider] || '').trim();

  if (!SUPPORTED_PROVIDERS.has(provider)) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  if (!prompt) {
    throw new Error('Prompt is required');
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    throw new Error(`Prompt exceeds ${MAX_PROMPT_CHARS} characters`);
  }
  if (!model) {
    throw new Error('Model is required');
  }

  return {
    provider,
    prompt,
    model,
  };
}

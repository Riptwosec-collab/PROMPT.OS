export function extractBearerToken(value) {
  const match = /^Bearer\s+(.+)$/i.exec(String(value || '').trim());
  return match?.[1]?.trim() || null;
}

export function unauthenticatedAiAllowed(value) {
  return String(value || '').trim().toLowerCase() === 'true';
}

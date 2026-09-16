export function createNdjsonAccumulator() {
  let buffer = '';

  const parseLines = (allowRemainder = false) => {
    const events = [];
    const lines = buffer.split('\n');
    buffer = allowRemainder ? '' : (lines.pop() ?? '');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      events.push(JSON.parse(trimmed));
    }

    if (allowRemainder) {
      const trimmed = buffer.trim();
      if (trimmed) events.push(JSON.parse(trimmed));
      buffer = '';
    }

    return events;
  };

  return {
    push(chunk) {
      buffer += String(chunk || '');
      return parseLines(false);
    },
    flush() {
      const last = buffer.trim();
      buffer = '';
      return last ? [JSON.parse(last)] : [];
    },
  };
}

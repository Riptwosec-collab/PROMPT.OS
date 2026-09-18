function compact(values = []) {
  return values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

function promptTitle(prompt = {}) {
  return prompt.displayTitle || prompt.displayTitleTh || prompt.title || prompt.name || `Prompt ${prompt.id}`;
}

export function buildCommandItems({ navItems = [], prompts = [], actions = [] } = {}) {
  const navigationItems = navItems.map((item) => ({
    id: `nav:${item.id}`,
    kind: 'navigation',
    title: item.label || item.title || item.id,
    keywords: compact([item.id, item.label, item.keywords]),
    action: { type: 'navigate', page: item.id },
  }));

  const promptItems = prompts.map((prompt) => ({
    id: `prompt:${prompt.id}`,
    kind: 'prompt',
    title: promptTitle(prompt),
    keywords: compact([
      prompt.name,
      prompt.displayTitle,
      prompt.displayTitleTh,
      prompt.category,
      prompt.tags,
      prompt.sourceType,
    ]),
    action: { type: 'prompt', promptId: prompt.id },
  }));

  const commandItems = actions.map((item) => ({
    id: `command:${item.id}`,
    kind: 'command',
    title: item.title || item.label || item.id,
    keywords: compact([item.keywords, item.id]),
    action: item.action || { type: 'action', name: item.id },
  }));

  return [...navigationItems, ...promptItems, ...commandItems];
}

import { scorePromptHealth } from '../prompts/health-score.mjs';
import { buildSmartCollections } from '../prompts/smart-collections.mjs';

function activePrompts(prompts = []) {
  return (Array.isArray(prompts) ? prompts : []).filter((prompt) => !prompt?.deletedAt);
}

function promptTitle(prompt = {}) {
  return prompt.displayTitleTh || prompt.displayTitle || prompt.title || prompt.name || 'Prompt';
}

export function buildMissionControlModel(prompts = [], { now = new Date(), packs = [] } = {}) {
  const active = activePrompts(prompts);
  const smartCollections = buildSmartCollections(active, now);
  const continueWorking = smartCollections.recentlyUsed.slice(0, 2);

  const usage = active.reduce((totals, prompt) => ({
    runs: totals.runs + Number(prompt?.runs || 0),
    copies: totals.copies + Number(prompt?.copyCount || 0),
  }), { runs: 0, copies: 0 });

  const healthScores = active.map((prompt) => scorePromptHealth(prompt).total);
  const healthSummary = {
    average: healthScores.length
      ? Math.round(healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length)
      : 0,
    analyzedCount: healthScores.length,
  };

  const activity = active
    .filter((prompt) => Boolean(prompt?.lastUsedAt) && Number.isFinite(Date.parse(prompt.lastUsedAt)))
    .slice()
    .sort((a, b) => {
      const diff = Date.parse(b.lastUsedAt) - Date.parse(a.lastUsedAt);
      return diff || String(a.id ?? '').localeCompare(String(b.id ?? ''));
    })
    .map((prompt) => ({
      id: `prompt-used:${String(prompt.id)}:${prompt.lastUsedAt}`,
      type: 'prompt-used',
      promptId: prompt.id,
      title: promptTitle(prompt),
      occurredAt: prompt.lastUsedAt,
    }));

  return {
    continueWorking,
    featuredPacks: Array.isArray(packs) ? packs : [],
    smartCollections,
    usage,
    healthSummary,
    activity,
  };
}

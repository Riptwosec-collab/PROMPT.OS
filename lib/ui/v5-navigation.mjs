export const V5_NAV_ITEMS = [
  ['home', 'HOME'],
  ['library', 'LIBRARY'],
  ['workspaces', 'WORKSPACES'],
  ['evaluation', 'EVALUATION LAB'],
  ['improve', 'AI IMPROVE'],
  ['analytics', 'ANALYTICS'],
  ['cloud', 'CLOUD & BACKUPS'],
  ['trash', 'TRASH'],
  ['settings', 'SETTINGS'],
].map(([id, label]) => Object.freeze({ id, label }));

const DAILY_USE_ITEMS = Object.freeze([
  Object.freeze({ id: 'history', label: 'RUN HISTORY' }),
  Object.freeze({ id: 'results', label: 'SAVED RESULTS' }),
]);

const ALL_PAGE_IDS = new Set([...V5_NAV_ITEMS, ...DAILY_USE_ITEMS].map((item) => item.id));

export function buildDailyUseNavItems(enabled = false) {
  if (!enabled) return V5_NAV_ITEMS;
  const libraryIndex = V5_NAV_ITEMS.findIndex((item) => item.id === 'library');
  return Object.freeze([
    ...V5_NAV_ITEMS.slice(0, libraryIndex + 1),
    ...DAILY_USE_ITEMS,
    ...V5_NAV_ITEMS.slice(libraryIndex + 1),
  ]);
}

export function normalizeV5Page(page) {
  return ALL_PAGE_IDS.has(page) ? page : 'home';
}

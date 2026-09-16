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

const V5_PAGE_IDS = new Set(V5_NAV_ITEMS.map((item) => item.id));

export function normalizeV5Page(page) {
  return V5_PAGE_IDS.has(page) ? page : 'home';
}

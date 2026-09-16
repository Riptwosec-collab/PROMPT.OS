export const DEFAULT_WORKSPACE = Object.freeze({
  id: 'personal',
  name: 'PERSONAL',
  order: 0,
  archivedAt: null,
});

function normalizeWorkspace(workspace, index) {
  return {
    id: String(workspace?.id || `workspace-${index + 1}`),
    name: String(workspace?.name || `WORKSPACE ${index + 1}`),
    order: Number.isFinite(Number(workspace?.order)) ? Number(workspace.order) : index,
    archivedAt: workspace?.archivedAt || null,
  };
}

function normalizeFolder(folder, index) {
  return {
    id: String(folder?.id || `folder-${index + 1}`),
    workspaceId: String(folder?.workspaceId || 'personal'),
    name: String(folder?.name || `FOLDER ${index + 1}`),
    order: Number.isFinite(Number(folder?.order)) ? Number(folder.order) : index,
    archivedAt: folder?.archivedAt || null,
  };
}

export function normalizeWorkspaceState(raw = {}) {
  const incomingWorkspaces = Array.isArray(raw.workspaces) ? raw.workspaces : [];
  const workspaces = incomingWorkspaces.length
    ? incomingWorkspaces.map(normalizeWorkspace)
    : [{ ...DEFAULT_WORKSPACE }];

  if (!workspaces.some((workspace) => workspace.id === 'personal')) {
    workspaces.unshift({ ...DEFAULT_WORKSPACE });
  }

  const workspaceIds = new Set(workspaces.map((workspace) => workspace.id));
  const folders = (Array.isArray(raw.folders) ? raw.folders : [])
    .map(normalizeFolder)
    .filter((folder) => workspaceIds.has(folder.workspaceId));

  return {
    workspaces: reorderByIds(workspaces, workspaces.slice().sort((a, b) => a.order - b.order).map((item) => item.id)),
    folders: reorderByIds(folders, folders.slice().sort((a, b) => a.order - b.order).map((item) => item.id)),
  };
}

export function movePrompt(prompts = [], promptId, workspaceId = 'personal', folderId = null) {
  return prompts.map((prompt) => (
    String(prompt.id) === String(promptId)
      ? { ...prompt, workspaceId: workspaceId || 'personal', folderId: folderId || null }
      : prompt
  ));
}

export function reorderByIds(items = [], orderedIds = []) {
  const byId = new Map(items.map((item) => [String(item.id), item]));
  const used = new Set();
  const ordered = [];

  orderedIds.forEach((id) => {
    const key = String(id);
    const item = byId.get(key);
    if (!item || used.has(key)) return;
    ordered.push(item);
    used.add(key);
  });

  items.forEach((item) => {
    const key = String(item.id);
    if (!used.has(key)) ordered.push(item);
  });

  return ordered.map((item, index) => ({ ...item, order: index }));
}

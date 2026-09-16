const FALLBACK_TIME = '1970-01-01T00:00:00.000Z';

function fnv1a(input, seed = 0x811c9dc5) {
  let hash = seed >>> 0;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function hex32(value) {
  return (value >>> 0).toString(16).padStart(8, '0');
}

function stableUuid(seed) {
  const text = String(seed);
  const hex = [
    hex32(fnv1a(text, 0x811c9dc5)),
    hex32(fnv1a(text, 0x9e3779b9)),
    hex32(fnv1a(text, 0x85ebca6b)),
    hex32(fnv1a(text, 0xc2b2ae35)),
  ].join('').split('');

  hex[12] = '5';
  const variant = parseInt(hex[16], 16);
  hex[16] = ((variant & 0x3) | 0x8).toString(16);
  const value = hex.join('');
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function validIso(value, fallback = FALLBACK_TIME) {
  const date = new Date(value || fallback);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function sourceWorkspaces(payload) {
  const rows = Array.isArray(payload?.workspaces) && payload.workspaces.length
    ? payload.workspaces
    : [{ id: 'personal', name: 'PERSONAL', order: 0, archivedAt: null }];

  if (!rows.some((workspace) => String(workspace.id) === 'personal')) {
    return [{ id: 'personal', name: 'PERSONAL', order: -1, archivedAt: null }, ...rows];
  }
  return rows;
}

export function mapV4PayloadToV5(payload = {}, userId) {
  if (!userId) throw new Error('userId is required for V5 migration');
  const source = payload && typeof payload === 'object' ? payload : {};
  const migrationTime = validIso(source.exportedAt || source.updatedAt || FALLBACK_TIME);

  const workspaceIdMap = new Map();
  const workspaceRows = sourceWorkspaces(source).map((workspace, index) => {
    const sourceId = String(workspace.id || `workspace-${index + 1}`);
    const id = stableUuid(`${userId}:workspace:${sourceId}`);
    workspaceIdMap.set(sourceId, id);
    return {
      id,
      user_id: userId,
      name: String(workspace.name || `WORKSPACE ${index + 1}`),
      sort_order: Number.isFinite(Number(workspace.order)) ? Number(workspace.order) : index,
      archived_at: workspace.archivedAt || null,
      created_at: validIso(workspace.createdAt || migrationTime),
      updated_at: validIso(workspace.updatedAt || migrationTime),
    };
  });

  const personalWorkspaceId = workspaceIdMap.get('personal') || workspaceRows[0]?.id;
  const folderIdMap = new Map();
  const folderRows = (Array.isArray(source.folders) ? source.folders : []).map((folder, index) => {
    const sourceId = String(folder.id || `folder-${index + 1}`);
    const workspaceSourceId = String(folder.workspaceId || 'personal');
    const id = stableUuid(`${userId}:folder:${sourceId}`);
    folderIdMap.set(sourceId, id);
    return {
      id,
      user_id: userId,
      workspace_id: workspaceIdMap.get(workspaceSourceId) || personalWorkspaceId,
      name: String(folder.name || `FOLDER ${index + 1}`),
      sort_order: Number.isFinite(Number(folder.order)) ? Number(folder.order) : index,
      archived_at: folder.archivedAt || null,
      created_at: validIso(folder.createdAt || migrationTime),
      updated_at: validIso(folder.updatedAt || migrationTime),
    };
  });

  const versionRows = [];
  const promptRows = (Array.isArray(source.prompts) ? source.prompts : []).map((prompt, promptIndex) => {
    const sourcePromptId = String(prompt.id ?? `prompt-${promptIndex + 1}`);
    const promptId = stableUuid(`${userId}:prompt:${sourcePromptId}`);
    const versions = Array.isArray(prompt.versions) && prompt.versions.length
      ? prompt.versions
      : [{ version: prompt.version || '1.0', prompt: prompt.prompt || '', updatedAt: prompt.updatedAt || migrationTime }];

    const promptVersionRows = versions.map((version, versionIndex) => {
      const sourceVersionId = String(version.id || version.version || `version-${versionIndex + 1}`);
      return {
        id: stableUuid(`${userId}:prompt:${sourcePromptId}:version:${sourceVersionId}:${versionIndex}`),
        user_id: userId,
        prompt_id: promptId,
        version: String(version.version || prompt.version || '1.0'),
        body: String(version.prompt ?? prompt.prompt ?? ''),
        variable_schema: cloneJson(prompt.variableSchema || prompt.variableConfig || {}),
        change_note: version.note || null,
        created_at: validIso(version.updatedAt || prompt.updatedAt || migrationTime),
      };
    });
    versionRows.push(...promptVersionRows);

    const currentVersion = promptVersionRows.find((row) => row.version === String(prompt.version || '')) || promptVersionRows[0];
    const workspaceSourceId = String(prompt.workspaceId || 'personal');
    const folderSourceId = prompt.folderId == null ? null : String(prompt.folderId);

    return {
      id: promptId,
      user_id: userId,
      workspace_id: workspaceIdMap.get(workspaceSourceId) || personalWorkspaceId,
      folder_id: folderSourceId ? (folderIdMap.get(folderSourceId) || null) : null,
      title: String(prompt.title || prompt.displayTitle || prompt.name || 'UNTITLED_PROMPT'),
      description: String(prompt.description || ''),
      favorite: Boolean(prompt.favorite),
      pinned: Boolean(prompt.pinned),
      archived_at: prompt.archivedAt || null,
      deleted_at: prompt.deletedAt || null,
      current_version_id: currentVersion?.id || null,
      created_at: validIso(prompt.createdAt || prompt.updatedAt || migrationTime),
      updated_at: validIso(prompt.updatedAt || migrationTime),
      legacy_id: sourcePromptId,
    };
  });

  return {
    workspaceRows,
    folderRows,
    promptRows,
    versionRows,
    snapshot: {
      id: stableUuid(`${userId}:snapshot:v4:${migrationTime}`),
      user_id: userId,
      reason: 'v4_migration',
      schema_version: Number(source.schemaVersion || 4),
      revision: 0,
      payload: cloneJson(source),
      created_at: migrationTime,
    },
  };
}

export function verifyV5Migration(sourcePayload = {}, mapped = {}) {
  const errors = [];
  const sourcePrompts = Array.isArray(sourcePayload?.prompts) ? sourcePayload.prompts : [];
  const promptRows = Array.isArray(mapped?.promptRows) ? mapped.promptRows : [];
  const versionRows = Array.isArray(mapped?.versionRows) ? mapped.versionRows : [];

  if (promptRows.length !== sourcePrompts.length) {
    errors.push(`prompt count mismatch: expected ${sourcePrompts.length}, got ${promptRows.length}`);
  }

  const expectedVersions = sourcePrompts.reduce((total, prompt) => (
    total + (Array.isArray(prompt.versions) && prompt.versions.length ? prompt.versions.length : 1)
  ), 0);
  if (versionRows.length !== expectedVersions) {
    errors.push(`version count mismatch: expected ${expectedVersions}, got ${versionRows.length}`);
  }

  const versionsById = new Map(versionRows.map((row) => [row.id, row]));
  promptRows.forEach((prompt) => {
    const current = versionsById.get(prompt.current_version_id);
    if (!current || current.prompt_id !== prompt.id) {
      errors.push(`current version relationship invalid for prompt ${prompt.id}`);
    }
  });

  return { valid: errors.length === 0, errors };
}

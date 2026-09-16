function revision(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function decideSync({ localBaseRevision = 0, cloudRevision = 0, hasPendingLocal = false } = {}) {
  const local = revision(localBaseRevision);
  const cloud = revision(cloudRevision);

  if (hasPendingLocal) {
    if (local === cloud) return 'push';
    return 'recover_then_pull';
  }

  if (local === cloud) return 'noop';
  return 'pull';
}

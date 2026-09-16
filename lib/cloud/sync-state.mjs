export function decideSyncAction({ localUpdatedAt, cloudUpdatedAt }) {
  if (!cloudUpdatedAt) return 'push';
  if (!localUpdatedAt) return 'pull';

  const local = Date.parse(localUpdatedAt);
  const cloud = Date.parse(cloudUpdatedAt);

  if (!Number.isFinite(local) || !Number.isFinite(cloud)) {
    throw new Error('Invalid sync timestamp');
  }
  if (local > cloud) return 'push';
  if (cloud > local) return 'pull';
  return 'equal';
}

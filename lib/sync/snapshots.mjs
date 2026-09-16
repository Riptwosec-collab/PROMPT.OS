function timestamp(snapshot) {
  const value = new Date(snapshot?.createdAt || 0).getTime();
  return Number.isFinite(value) ? value : 0;
}

export function trimSnapshots(snapshots = [], max = 20) {
  const limit = Math.max(0, Number.isFinite(Number(max)) ? Math.floor(Number(max)) : 20);
  return snapshots
    .map((snapshot) => ({ ...snapshot }))
    .sort((a, b) => timestamp(b) - timestamp(a))
    .slice(0, limit);
}

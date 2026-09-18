export function enqueueToast(queue = [], toast, limit = 3) {
  const source = Array.isArray(queue) ? queue : [];
  if (!toast || toast.id == null) return [...source];

  const numericLimit = Number(limit);
  const safeLimit = Number.isFinite(numericLimit) && numericLimit > 0
    ? Math.max(1, Math.floor(numericLimit))
    : 3;

  const next = [
    ...source.filter((item) => item?.id !== toast.id),
    { ...toast },
  ];

  return next.slice(-safeLimit);
}

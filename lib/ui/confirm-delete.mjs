export function confirmDestructiveAction(confirmFn, firstMessage, secondMessage) {
  if (typeof confirmFn !== 'function') return false;
  if (!confirmFn(firstMessage)) return false;
  return Boolean(confirmFn(secondMessage));
}

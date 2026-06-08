const ORDER_LIFECYCLE = [
  "pending",
  "paid",
  "training",
  "generating",
  "completed",
] as const;

const TERMINAL = new Set(["completed", "failed", "refunded"]);

export function isValidTransition(current: string, target: string): boolean {
  if (current === target) return true;
  if (TERMINAL.has(current)) return false;
  if (target === "failed" || target === "refunded") return true;
  const currentIdx = ORDER_LIFECYCLE.indexOf(
    current as (typeof ORDER_LIFECYCLE)[number],
  );
  const targetIdx = ORDER_LIFECYCLE.indexOf(
    target as (typeof ORDER_LIFECYCLE)[number],
  );
  if (currentIdx === -1 || targetIdx === -1) return false;
  return targetIdx > currentIdx;
}

export const RISK_THRESHOLD_HOURS = 2;

export function computeSlaStatus(slaDueAt) {
  if (!slaDueAt) return null;

  const due = new Date(slaDueAt).getTime();
  if (Number.isNaN(due)) return null;

  const now = Date.now();
  if (due < now) return "BREACHED";
  if (due < now + RISK_THRESHOLD_HOURS * 60 * 60 * 1000) return "AT_RISK";
  return "ON_TRACK";
}
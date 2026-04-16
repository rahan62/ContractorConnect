/** Minimum time between edits to your bid (3 hours). */
export const BID_EDIT_COOLDOWN_MS = 3 * 60 * 60 * 1000;

export function getBidEditEligibility(lastEditedAt: Date | null) {
  if (lastEditedAt == null) {
    return { canEdit: true, nextEditAvailableAt: null as string | null };
  }
  const next = new Date(lastEditedAt.getTime() + BID_EDIT_COOLDOWN_MS);
  const canEdit = Date.now() >= next.getTime();
  return {
    canEdit,
    nextEditAvailableAt: canEdit ? null : next.toISOString()
  };
}

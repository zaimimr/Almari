import type { ClosetFilter } from "../domain/closetFilters";

export type PendingFilter = Partial<ClosetFilter> & {
  panelOpen?: boolean;
  select?: boolean;
};

let pending: PendingFilter | null = null;

export function setPendingFilter(filter: PendingFilter): void {
  pending = filter;
}

export function takePendingFilter(): PendingFilter | null {
  const taken = pending;
  pending = null;
  return taken;
}

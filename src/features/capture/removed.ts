import { useSyncExternalStore } from "react";
import type { Closet, ImportJob } from "../../domain/closet";
import { orphanedFiles, removeImport } from "../../domain/importing";
import { discardPhoto } from "../../storage/local";

export type RemovedSlot = { job: ImportJob; index: number };

type Update = (transform: (closet: Closet) => Closet) => Promise<void>;

let slots: RemovedSlot[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRemovedSlots(): RemovedSlot[] {
  return useSyncExternalStore(
    subscribe,
    () => slots,
    () => slots,
  );
}

export async function removeWithUndo(update: Update, id: string) {
  let slot: RemovedSlot | null = null;
  await update((closet) => {
    const index = closet.imports.findIndex((job) => job.id === id);
    if (index < 0) return closet;
    slot = { job: closet.imports[index]!, index };
    return removeImport(closet, id);
  });
  if (slot) {
    slots = [...slots, slot];
    emit();
  }
}

export async function undoRemove(update: Update, id: string) {
  const slot = slots.find((item) => item.job.id === id);
  if (!slot) return;
  await update((closet) => {
    if (closet.imports.some((job) => job.id === id)) return closet;
    const imports = [...closet.imports];
    imports.splice(Math.min(slot.index, imports.length), 0, slot.job);
    return { ...closet, imports };
  });
  slots = slots.filter((item) => item.job.id !== id);
  emit();
}

export function settleRemoved(closet: Closet) {
  if (!slots.length) return;
  const gone = slots.map((slot) => slot.job);
  slots = [];
  emit();
  for (const file of orphanedFiles({ ...closet, imports: gone }, closet))
    void discardPhoto(file).catch(() => undefined);
}

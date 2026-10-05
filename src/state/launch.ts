import type { RefObject } from "react";
import { AccessibilityInfo, type View } from "react-native";

export type LaunchIntent = { day: "today" | "tomorrow" } | null;

let intent: LaunchIntent = null;
let header: RefObject<View | null> | null = null;
let handedOff = false;
let lastAdded: string[] = [];
const listeners = new Set<() => void>();
const intentListeners = new Set<() => void>();
const seen = new Set<string>();

export function setLaunchIntent(next: LaunchIntent): void {
  intent = next;
  intentListeners.forEach((listener) => listener());
}

export function onLaunchIntent(listener: () => void): () => void {
  intentListeners.add(listener);
  return () => intentListeners.delete(listener);
}

export function firstSeen(id: string): boolean {
  if (seen.has(id)) return false;
  seen.add(id);
  return true;
}

export function takeLaunchIntent(): LaunchIntent {
  const taken = intent;
  intent = null;
  return taken;
}

export function registerHandoffHeader(ref: RefObject<View | null>): void {
  if (!handedOff) header = ref;
}

export function onHandoff(listener: () => void): () => void {
  if (handedOff) {
    listener();
    return () => undefined;
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function handOff(): void {
  if (handedOff) return;
  handedOff = true;
  listeners.forEach((listener) => listener());
  listeners.clear();
  const target = header;
  header = null;
  requestAnimationFrame(() => {
    if (target?.current)
      AccessibilityInfo.sendAccessibilityEvent(target.current, "focus");
  });
}

export function setLastAdded(ids: string[]): void {
  lastAdded = ids;
}

export function takeLastAdded(): string[] {
  const taken = lastAdded;
  lastAdded = [];
  return taken;
}

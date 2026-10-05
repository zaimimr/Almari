import { type Closet, decodeCloset, emptyCloset } from "./closet";
import { t } from "../i18n";
import { sampleTraits } from "./samples";

export interface ClosetStorage {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
  clear?(): Promise<void>;
  keepBackup?(value: string): Promise<void>;
  readBackup?(): Promise<string | null>;
  setAside?(stamp: string): Promise<void>;
}

export const closetKeys = ["closet.v3", "closet.v2", "closet.v1"] as const;

export const backupKey = "closet.v3.backup";

export function keyedStorage(
  get: (key: string) => Promise<string | null>,
  set: (key: string, value: string) => Promise<void>,
  remove: (key: string) => Promise<void>,
): ClosetStorage {
  return {
    async read() {
      for (const key of closetKeys) {
        const value = await get(key);
        if (value !== null) return value;
      }
      return null;
    },
    write: (value) => set(closetKeys[0], value),
    async clear() {
      for (const key of closetKeys) await remove(key);
    },
    keepBackup: (value) => set(backupKey, value),
    readBackup: () => get(backupKey),
    async setAside(stamp) {
      for (const key of closetKeys) {
        const value = await get(key);
        if (value === null) continue;
        await set(`${closetKeys[0]}.corrupt-${stamp}`, value);
        break;
      }
      for (const key of closetKeys) await remove(key);
    },
  };
}

export class ClosetRepository {
  private snapshot: Closet = emptyCloset;
  private initialized = false;
  private queue: Promise<unknown> = Promise.resolve();
  private listeners = new Set<() => void>();

  constructor(private storage: ClosetStorage) {}

  getSnapshot = () => this.snapshot;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  async load() {
    const raw = await this.storage.read();
    this.snapshot = decodeCloset(raw, sampleTraits);
    this.initialized = true;
    this.listeners.forEach((listener) => listener());
    if (raw !== null)
      await this.storage.keepBackup?.(raw).catch(() => undefined);
  }

  async hasBackup(): Promise<boolean> {
    try {
      const raw = (await this.storage.readBackup?.()) ?? null;
      if (raw === null) return false;
      decodeCloset(raw, sampleTraits);
      return true;
    } catch {
      return false;
    }
  }

  async restoreBackup(stamp: string) {
    const raw = (await this.storage.readBackup?.()) ?? null;
    if (raw === null) throw new Error(t("error.closetOpening"));
    decodeCloset(raw, sampleTraits);
    await this.storage.setAside?.(stamp);
    await this.storage.write(raw);
  }

  async startOver(stamp: string) {
    await this.storage.setAside?.(stamp);
  }

  update(transform: (closet: Closet) => Closet): Promise<void> {
    return this.enqueue(transform, false);
  }

  reset(transform: (closet: Closet) => Closet): Promise<void> {
    return this.enqueue(transform, true);
  }

  private enqueue(
    transform: (closet: Closet) => Closet,
    clear: boolean,
  ): Promise<void> {
    const operation = this.queue.then(async () => {
      if (!this.initialized) throw new Error(t("error.closetOpening"));
      const next = transform(this.snapshot);
      if (next === this.snapshot && !clear) return;
      if (clear) await this.storage.clear?.();
      await this.storage.write(JSON.stringify(next));
      this.snapshot = next;
      this.listeners.forEach((listener) => listener());
    });
    this.queue = operation.catch(() => undefined);
    return operation;
  }
}

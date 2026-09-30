import { type Closet, decodeCloset, emptyCloset } from "./closet";

export interface ClosetStorage {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
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
    this.snapshot = decodeCloset(await this.storage.read());
    this.initialized = true;
    this.listeners.forEach((listener) => listener());
  }

  update(transform: (closet: Closet) => Closet): Promise<void> {
    const operation = this.queue.then(async () => {
      if (!this.initialized)
        throw new Error("Your closet is still opening. Try again in a moment.");
      const next = transform(this.snapshot);
      await this.storage.write(JSON.stringify(next));
      this.snapshot = next;
      this.listeners.forEach((listener) => listener());
    });
    this.queue = operation.catch(() => undefined);
    return operation;
  }
}

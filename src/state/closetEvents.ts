import { useEffect } from "react";
import { closetEvents } from "../domain/events";
import type { ClosetRepository } from "../domain/repository";
import { track } from "./telemetry";

export function useClosetEvents(repository: ClosetRepository, ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    let previous = repository.getSnapshot();
    return repository.subscribe(() => {
      const next = repository.getSnapshot();
      for (const { event, props } of closetEvents(previous, next))
        track(event, props);
      previous = next;
    });
  }, [repository, ready]);
}

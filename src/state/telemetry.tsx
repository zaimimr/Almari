import type { PropsWithChildren } from "react";
import type { EventProps } from "../domain/events";

export function track(_event: string, _props?: EventProps) {}

export function trackError(
  _error: unknown,
  _source: string,
  _extra?: EventProps,
) {}

export function TelemetryProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}

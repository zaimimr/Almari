import { useEffect, type PropsWithChildren } from "react";
import { isRunningInExpoGo } from "expo";
import { useSegments } from "expo-router";
import PostHog, { PostHogProvider } from "posthog-react-native";
import type { EventProps } from "../domain/events";

const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? "";

const analyticsActive = posthogKey.length > 0;

const posthog = new PostHog(analyticsActive ? posthogKey : "phc_disabled", {
  host: "https://eu.i.posthog.com",
  disabled: !analyticsActive,
  captureAppLifecycleEvents: true,
  enableSessionReplay: false,
  errorTracking: {
    autocapture: {
      uncaughtExceptions: true,
      unhandledRejections: true,
      nativeCrashes: !isRunningInExpoGo(),
    },
  },
});

if (analyticsActive) void posthog.register({ app_name: "almari" });

export function track(event: string, props?: EventProps) {
  posthog.capture(event, props);
}

export function trackError(error: unknown, source: string, extra?: EventProps) {
  posthog.captureException(error, { source, ...extra });
}

function ScreenTracking() {
  const segments = useSegments() as string[];
  const screen =
    segments.filter((segment) => !segment.startsWith("(")).join("/") || "index";

  useEffect(() => {
    void posthog.screen(screen);
  }, [screen]);

  return null;
}

export function TelemetryProvider({ children }: PropsWithChildren) {
  return (
    <PostHogProvider client={posthog} autocapture={false}>
      <ScreenTracking />
      {children}
    </PostHogProvider>
  );
}

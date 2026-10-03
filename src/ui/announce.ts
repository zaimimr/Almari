import { AccessibilityInfo } from "react-native";

export function announce(text: string, options?: { queue?: boolean }): void {
  AccessibilityInfo.announceForAccessibilityWithOptions(text, {
    queue: options?.queue ?? true,
  });
}

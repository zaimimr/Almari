import { requireOptionalNativeModule } from "expo";

const AccessibilityLanguage = requireOptionalNativeModule<{
  set(tag: string): void;
}>("AccessibilityLanguage");

export function setAccessibilityLanguage(tag: "en" | "nb-NO") {
  AccessibilityLanguage?.set(tag);
}

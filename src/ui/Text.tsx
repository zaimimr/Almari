import { useEffect, useRef } from "react";
import { Text as NativeText } from "react-native";
import type { TextProps, TextStyle } from "react-native";
import { hyphenate } from "../domain/hyphenate";
import { locale } from "../i18n";
import { announce as speak } from "./announce";
import { theme, type Colors } from "./theme";
import { useColors } from "./useColors";
import { useLargeText } from "./useLargeText";

export type TextRole =
  "title" | "headline" | "body" | "subhead" | "footnote" | "mark";
export type TextTone =
  "ink" | "muted" | "disabled" | "plum" | "error" | "onPlum" | "onMedia";

export const toneColor: Record<TextTone, keyof Colors> = {
  ink: "ink",
  muted: "inkMuted",
  disabled: "inkDisabled",
  plum: "plum",
  error: "error",
  onPlum: "onPlum",
  onMedia: "onMedia",
};

export function Text({
  role = "body",
  tone = "ink",
  announce = false,
  user = false,
  style,
  children,
  ...props
}: Omit<TextProps, "role"> & {
  role?: TextRole;
  tone?: TextTone;
  announce?: boolean;
  user?: boolean;
}) {
  const colors = useColors();
  const { bold } = useLargeText();
  const {
    maxFontSizeMultiplier,
    ...type
  }: TextStyle & { maxFontSizeMultiplier?: number } = theme.type[role];
  const text = typeof children === "string" ? children : undefined;
  const spoken = useRef(text);

  useEffect(() => {
    if (announce && text && text !== spoken.current) speak(text);
    spoken.current = text;
  }, [announce, text]);

  return (
    <NativeText
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...props}
      style={[
        type,
        { color: colors[toneColor[tone]] },
        role === "title" && bold && { fontFamily: "Georgia-Bold" },
        style,
      ]}
    >
      {text !== undefined && !user ? hyphenate(text, locale) : children}
    </NativeText>
  );
}

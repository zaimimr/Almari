import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { t } from "../i18n";
import { announce } from "./announce";
import { useAfterWait } from "./motion";
import { Silk } from "./Silk";
import { Symbol } from "./symbol";
import { Text } from "./Text";
import { theme } from "./theme";
import { useColors } from "./useColors";
import { useLargeText } from "./useLargeText";

export type FieldProps = TextInputProps & {
  label: string;
  kind?: "text" | "search" | "rename";
  error?: string | null;
  hideLabel?: boolean;
  trailing?: "check" | "clear";
  busy?: boolean;
  busyValue?: string;
  testID?: string;
};

const hidden = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

export function Field({
  label,
  kind = "text",
  error,
  hideLabel = false,
  trailing,
  busy = false,
  busyValue,
  testID,
  editable = true,
  placeholder,
  accessibilityLabel,
  onFocus,
  onBlur,
  style,
  ...props
}: FieldProps) {
  const colors = useColors();
  const { bold } = useLargeText();
  const [focused, setFocused] = useState(false);
  const waiting = useAfterWait(busy);
  const rename = kind === "rename";
  const showLabel = kind === "text" && !hideLabel;
  const end = trailing ?? (kind === "search" ? "clear" : undefined);
  const edgeWidth = error || focused ? 1.5 : 1;

  const shownError = useRef(error);
  useEffect(() => {
    if (error && error !== shownError.current) announce(error);
    shownError.current = error;
  }, [error]);

  const input = (
    <TextInput
      {...props}
      editable={editable}
      placeholder={placeholder ?? (showLabel ? undefined : label)}
      placeholderTextColor={colors.placeholder}
      selectionColor={colors.plum}
      accessibilityLabel={[accessibilityLabel ?? label, error]
        .filter(Boolean)
        .join(", ")}
      accessibilityValue={busy && busyValue ? { text: busyValue } : undefined}
      accessibilityState={{ disabled: !editable, busy }}
      maxFontSizeMultiplier={
        rename ? theme.type.title.maxFontSizeMultiplier : undefined
      }
      testID={testID}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={[
        rename
          ? [
              styles.rename,
              {
                fontFamily: bold ? theme.fontFamily.serifBold : theme.fontFamily.serif,
                borderBottomColor: colors.lineField,
              },
            ]
          : styles.input,
        { color: editable ? colors.ink : colors.inkDisabled },
        style,
      ]}
    />
  );

  const errorText = error ? (
    <View {...hidden}>
      <Text role="footnote" tone="error">
        {error}
      </Text>
    </View>
  ) : null;

  if (rename) {
    return (
      <View style={styles.field}>
        {input}
        {errorText}
      </View>
    );
  }

  return (
    <View style={styles.field}>
      {showLabel ? <Text role="headline">{label}</Text> : null}
      <View
        style={[
          styles.box,
          {
            backgroundColor: editable ? colors.surface : colors.sunken,
            borderColor: error
              ? colors.error
              : focused
                ? colors.plum
                : colors.lineField,
            borderWidth: edgeWidth,
            paddingHorizontal: theme.space.md + 1 - edgeWidth,
          },
        ]}
      >
        {kind === "search" ? (
          <Symbol
            name="magnifyingglass"
            size={theme.size.iconInline}
            tone="muted"
          />
        ) : null}
        {input}
        {end === "check" ? (
          <View style={styles.slot} {...hidden}>
            <Symbol
              name="checkmark"
              size={theme.size.iconInline}
              tone="plum"
              weight="semibold"
            />
          </View>
        ) : end === "clear" && props.value && editable ? (
          <Pressable
            onPress={() => props.onChangeText?.("")}
            accessibilityRole="button"
            accessibilityLabel={t("common.clear")}
            style={styles.slot}
          >
            <Symbol
              name="xmark.circle.fill"
              size={theme.size.iconInline}
              tone="muted"
            />
          </Pressable>
        ) : null}
        {waiting ? (
          <View
            pointerEvents="none"
            style={[styles.busy, { backgroundColor: colors.surface }]}
          >
            <Silk kind="placeholder" shape="text" label={busyValue ?? label} />
          </View>
        ) : null}
      </View>
      {errorText}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: theme.space.sm },
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.sm,
    minHeight: theme.size.controlRegular,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  input: {
    flex: 1,
    fontSize: theme.type.body.fontSize,
    paddingVertical: theme.space.md,
  },
  rename: {
    fontSize: theme.type.title.fontSize,
    letterSpacing: theme.type.title.letterSpacing,
    minHeight: theme.type.title.lineHeight,
    padding: 0,
    borderBottomWidth: 1,
  },
  slot: {
    width: theme.size.touch,
    height: theme.size.touch,
    marginRight: -theme.space.md,
    alignItems: "center",
    justifyContent: "center",
  },
  busy: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
    paddingHorizontal: theme.space.md,
  },
});

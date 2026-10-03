import { createContext, useContext } from "react";
import { Pressable, StyleSheet } from "react-native";
import type { SFSymbol } from "expo-symbols";
import { t } from "../i18n";
import { Symbol } from "./symbol";
import { Text } from "./Text";
import { theme } from "./theme";
import { useLargeText } from "./useLargeText";

export const HeaderMedia = createContext(false);

export type HeaderItemProps = {
  label: string;
  onPress: () => void;
  icon?: SFSymbol;
  disabled?: boolean;
  expanded?: boolean;
  testID?: string;
};

function largeIcon(label: string): SFSymbol | undefined {
  const icons: Record<string, SFSymbol> = {
    [t("piece.edit")]: "pencil",
    [t("sets.select")]: "checklist",
    [t("common.done")]: "checkmark",
    [t("common.cancel")]: "xmark",
  };
  return icons[label];
}

export function HeaderItem({
  label,
  onPress,
  icon,
  disabled = false,
  expanded,
  testID,
}: HeaderItemProps) {
  const media = useContext(HeaderMedia);
  const { large } = useLargeText();
  const symbol = icon ?? (large ? largeIcon(label) : undefined);
  const tone = disabled ? "disabled" : media ? "onMedia" : "plum";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, expanded }}
      accessibilityShowsLargeContentViewer
      accessibilityLargeContentTitle={label}
      style={[styles.item, !symbol && styles.text]}
    >
      {symbol ? (
        <Symbol name={symbol} size={theme.size.iconBar} tone={tone} />
      ) : (
        <Text tone={tone} maxFontSizeMultiplier={1.3}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    minWidth: theme.size.touch,
    minHeight: theme.size.touch,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { paddingHorizontal: theme.space.sm },
});

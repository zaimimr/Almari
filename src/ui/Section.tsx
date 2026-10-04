import { Children, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { t } from "../i18n";
import { Button } from "./Button";
import { Text } from "./Text";
import { theme } from "./theme";
import { useLargeText } from "./useLargeText";

export function Section({
  title,
  count,
  action,
  children,
  testID,
}: {
  title?: string;
  count?: number;
  action?: { label: string; onPress: () => void };
  children: ReactNode;
  testID?: string;
}) {
  const { large } = useLargeText();
  if (Children.toArray(children).length === 0) return null;

  const spoken =
    title && count !== undefined
      ? t("closet.sectionLabel", {
          category: title,
          pieces:
            count === 1
              ? t("common.pieceCountOne")
              : t("common.pieceCountMany", { count }),
        })
      : title;

  return (
    <View style={styles.section} testID={testID}>
      {title || action ? (
        <View style={[styles.head, large && styles.headLarge]}>
          {title ? (
            <View
              accessible
              accessibilityRole="header"
              accessibilityLabel={spoken}
              style={styles.title}
            >
              <Text role="eyebrow" style={styles.name}>
                {title}
              </Text>
              {count !== undefined ? (
                <Text role="eyebrow">{String(count)}</Text>
              ) : null}
            </View>
          ) : null}
          {action ? (
            <Button
              variant="quiet"
              label={action.label}
              onPress={action.onPress}
            />
          ) : null}
        </View>
      ) : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: theme.space.md },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: theme.size.touch,
    gap: theme.space.sm,
  },
  headLarge: { flexDirection: "column", alignItems: "flex-start" },
  title: {
    flexDirection: "row",
    flexWrap: "wrap",
    flexShrink: 1,
    columnGap: theme.space.sm,
  },
  name: { flexShrink: 1 },
  body: { gap: theme.space.lg },
});

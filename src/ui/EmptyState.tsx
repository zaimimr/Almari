import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Button, type ButtonProps } from "./Button";
import { Text } from "./Text";
import { theme } from "./theme";

export type EmptyStateProps = {
  title?: string;
  line?: string;
  action?: ButtonProps;
  secondary?: ButtonProps;
  mark?: boolean;
  media?: boolean;
  testID?: string;
};

const tile = require("../../assets/brand/tile.png");
const brandMark = require("../../assets/brand/mark.png");

export function EmptyState({
  title,
  line,
  action,
  secondary,
  mark = false,
  media = false,
  testID,
}: EmptyStateProps) {
  return (
    <View testID={testID} style={styles.empty}>
      {mark ? (
        <View
          style={styles.mark}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Image source={tile} style={StyleSheet.absoluteFill} />
          <Image source={brandMark} style={StyleSheet.absoluteFill} />
        </View>
      ) : null}
      {title ? (
        <Text
          role="title"
          tone={media ? "onMedia" : "ink"}
          accessibilityRole="header"
          style={[styles.center, mark && styles.spaced]}
        >
          {title}
        </Text>
      ) : null}
      {line ? (
        <Text
          role="body"
          tone={media ? "onMedia" : "muted"}
          style={[styles.center, styles.line]}
        >
          {line}
        </Text>
      ) : null}
      {action || secondary ? (
        <View style={[styles.actions, (mark || title) && styles.spaced]}>
          {action ? (
            <Button
              variant="primary"
              size="regular"
              media={media}
              {...action}
            />
          ) : null}
          {secondary ? (
            <Button variant="quiet" media={media} {...secondary} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", paddingTop: theme.space.xxl },
  mark: { width: theme.size.brandMark, height: theme.size.brandMark },
  center: { textAlign: "center" },
  spaced: { marginTop: theme.space.xl },
  line: { marginTop: theme.space.sm },
  actions: { alignItems: "center", gap: theme.space.xs },
});

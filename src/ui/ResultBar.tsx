import { useEffect, useRef } from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import { announce as speak } from "./announce";
import { Button, type ButtonProps } from "./Button";
import { Symbol } from "./symbol";
import { Text } from "./Text";
import { theme } from "./theme";
import { useLargeText } from "./useLargeText";

export type ResultBarProps = {
  text?: string;
  action?: ButtonProps;
  second?: ButtonProps;
  focus?: boolean;
  announce?: boolean;
  testID?: string;
};

export function ResultBar({
  text,
  action,
  second,
  focus = false,
  announce = false,
  testID,
}: ResultBarProps) {
  const { large } = useLargeText();
  const line = useRef<View>(null);

  useEffect(() => {
    if (!text) return;
    if (focus && line.current) {
      AccessibilityInfo.sendAccessibilityEvent(line.current, "focus");
    } else if (announce) {
      speak(text);
    }
  }, [text, focus, announce]);

  return (
    <View
      testID={testID}
      style={[styles.bar, large && text ? styles.stack : styles.row]}
    >
      {text ? (
        <View
          ref={line}
          accessible
          accessibilityLabel={text}
          style={styles.line}
        >
          <Symbol name="checkmark" size={theme.size.iconInline} tone="plum" />
          <Text role="body" style={styles.text}>
            {text}
          </Text>
        </View>
      ) : null}
      {action || second ? (
        <View style={[styles.actions, text && !large && styles.trailing]}>
          {action ? <Button variant="quiet" {...action} /> : null}
          {second ? <Button variant="quiet" {...second} /> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { minHeight: theme.size.controlSmall, gap: theme.space.sm },
  row: { flexDirection: "row", alignItems: "center" },
  stack: { alignItems: "flex-start" },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.sm,
    flexShrink: 1,
  },
  text: { flexShrink: 1 },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: theme.space.sm,
  },
  trailing: { marginLeft: "auto" },
});

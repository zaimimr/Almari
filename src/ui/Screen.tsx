import {
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
  type Ref,
} from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
} from "react-native";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { t } from "../i18n";
import { largeTitleOptions } from "../navigation/options";
import { Button } from "./Button";
import { HeaderItem, HeaderMedia } from "./HeaderItem";
import { SheenClockProvider } from "./SheenClock";
import { Silk } from "./Silk";
import { Text } from "./Text";
import { gutterFor, theme } from "./theme";
import { useColors } from "./useColors";
import { useLargeText } from "./useLargeText";

export type ScreenProps = PropsWithChildren<{
  title?: string;
  large?: boolean;
  leading?: "back" | "cancel";
  onCancel?: () => void;
  actions?: ReactNode;
  footer?: ReactNode;
  progress?: { step: number; total: number; label: string };
  scroll?: boolean;
  gone?: { title: string };
  media?: boolean;
  search?: { placeholder: string; onChangeText: (text: string) => void };
  headerTitleVisible?: boolean;
  contentRef?: Ref<ScrollView>;
  testID?: string;
  maintainVisibleContentPosition?: boolean;
  keyboardFooter?: "ride" | "stay";
}>;

function useKeyboardSpace(ride: boolean, resting: number) {
  const keyboard = useAnimatedKeyboard();
  const lift = theme.space.md - resting;
  return useAnimatedStyle(() => ({
    height: ride ? Math.max(0, keyboard.height.get() + lift) : 0,
  }));
}

export function Screen({
  title,
  large = false,
  leading = "back",
  onCancel,
  actions,
  footer,
  progress,
  scroll = true,
  gone,
  media = false,
  search,
  headerTitleVisible = true,
  contentRef,
  testID,
  maintainVisibleContentPosition = false,
  keyboardFooter = "ride",
  children,
}: ScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { fontScale, bold } = useLargeText();
  const gutter = gutterFor(width);
  const showFooter = Boolean(footer) && !gone;
  const keyboardSpace = useKeyboardSpace(
    showFooter && keyboardFooter === "ride",
    Math.max(insets.bottom, theme.space.md),
  );
  const [under, setUnder] = useState(false);
  const frame = useRef({ offset: 0, viewport: 0, content: 0 });

  const measureUnder = (next: Partial<typeof frame.current>) => {
    frame.current = { ...frame.current, ...next };
    const { offset, viewport, content } = frame.current;
    setUnder(offset + viewport < content - 1);
  };

  const options = {
    ...(large
      ? largeTitleOptions(fontScale, bold)
      : { headerLargeTitleEnabled: false }),
    ...(title === undefined ? null : { title }),
    headerBackTitle: t("common.back"),
    ...(headerTitleVisible ? null : { headerTitle: "" }),
    ...(leading === "cancel" && onCancel
      ? {
          headerLeft: () => (
            <HeaderMedia value={media}>
              <HeaderItem label={t("common.cancel")} onPress={onCancel} />
            </HeaderMedia>
          ),
        }
      : null),
    ...(actions && !gone
      ? {
          headerRight: () => <HeaderMedia value={media}>{actions}</HeaderMedia>,
        }
      : null),
    ...(search
      ? {
          headerSearchBarOptions: {
            placeholder: search.placeholder,
            onChangeText: (event: { nativeEvent: { text: string } }) =>
              search.onChangeText(event.nativeEvent.text),
          },
        }
      : null),
    ...(media
      ? {
          headerStyle: { backgroundColor: colors.ink },
          headerTintColor: colors.onMedia,
          headerTitleStyle: { color: colors.onMedia },
          contentStyle: { backgroundColor: colors.ink },
        }
      : null),
  };

  const content = gone ? (
    <View style={styles.gone}>
      <Text
        role="title"
        tone={media ? "onMedia" : "ink"}
        accessibilityRole="header"
        style={styles.center}
      >
        {gone.title}
      </Text>
      <Button
        label={t("common.goBack")}
        size="regular"
        media={media}
        onPress={() => router.back()}
      />
    </View>
  ) : (
    children
  );

  return (
    <SheenClockProvider>
      <Stack.Screen options={options} />
      {media ? <StatusBar style="light" /> : null}
      <View
        testID={testID}
        style={[
          styles.screen,
          { backgroundColor: media ? colors.ink : colors.canvas },
        ]}
      >
        {progress ? (
          <Silk
            kind="progress"
            value={progress.step / progress.total}
            label={progress.label}
            hidden
            style={{ marginHorizontal: gutter }}
          />
        ) : null}
        {scroll ? (
          <ScrollView
            ref={contentRef}
            style={styles.screen}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={
              !showFooter || keyboardFooter === "stay"
            }
            maintainVisibleContentPosition={
              maintainVisibleContentPosition
                ? { minIndexForVisible: 0 }
                : undefined
            }
            scrollEventThrottle={16}
            onScroll={({ nativeEvent }: { nativeEvent: NativeScrollEvent }) =>
              measureUnder({
                offset: nativeEvent.contentOffset.y,
                viewport: nativeEvent.layoutMeasurement.height,
                content: nativeEvent.contentSize.height,
              })
            }
            onLayout={(event) =>
              measureUnder({ viewport: event.nativeEvent.layout.height })
            }
            onContentSizeChange={(_, height) =>
              measureUnder({ content: height })
            }
            contentContainerStyle={{
              paddingHorizontal: gutter,
              paddingTop: theme.space.sm,
              paddingBottom: theme.space.footerInset,
            }}
          >
            {content}
          </ScrollView>
        ) : (
          <View style={[styles.screen, { paddingHorizontal: gutter }]}>
            {content}
          </View>
        )}
        {showFooter ? (
          <>
            <View
              style={[
                styles.edge,
                { backgroundColor: under ? colors.line : "transparent" },
              ]}
            />
            {footer}
            <Animated.View style={keyboardSpace} />
          </>
        ) : null}
      </View>
    </SheenClockProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  gone: {
    paddingTop: theme.space.xxl,
    gap: theme.space.xl,
    alignItems: "stretch",
  },
  center: { textAlign: "center" },
  edge: { height: StyleSheet.hairlineWidth },
});

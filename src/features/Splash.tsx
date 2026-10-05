import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import * as SplashScreen from "expo-splash-screen";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { t } from "../i18n";
import { useClosetStatus } from "../state/closet";
import { handOff } from "../state/launch";
import { announce } from "../ui/announce";
import { confirmAction } from "../ui/confirm";
import { Button } from "../ui/Button";
import { motion, timing, useAfterWait, useReduceMotion } from "../ui/motion";
import { Text } from "../ui/Text";
import { theme } from "../ui/theme";
import { useLargeText } from "../ui/useLargeText";

const tile = require("../../assets/brand/tile.png");
const mark = require("../../assets/brand/mark.png");
const size = 160;

let played = false;

export function Splash() {
  const [first] = useState(() => {
    const unplayed = !played;
    played = true;
    return unplayed;
  });
  return first ? <Overlay /> : null;
}

function Overlay() {
  const { status, retry, restore, startOver } = useClosetStatus();
  const reduce = useReduceMotion();
  const { ax } = useLargeText();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [draped, setDraped] = useState(false);
  const [failed, setFailed] = useState(false);
  const [gone, setGone] = useState(false);
  const laidOut = useRef(false);
  const loaded = useRef(false);
  const started = useRef(false);
  const settled = useRef(false);
  const failedOnce = useRef(false);
  const announced = useRef(false);
  const title = useRef<View>(null);
  const slot = useRef<View>(null);
  const markIn = useSharedValue(0);
  const drop = useSharedValue(-10);
  const lift = useSharedValue(0);
  const swap = useSharedValue(0);
  const shown = useSharedValue(0);
  const fade = useSharedValue(1);
  const leaving = draped && status === "ready";
  if (draped && status === "error" && !failed) setFailed(true);
  const holding = useAfterWait(draped && status === "loading" && !failed);

  const begin = () => {
    if (started.current || !laidOut.current || !loaded.current) return;
    started.current = true;
    SplashScreen.hide();
    const done = (finished?: boolean) => {
      "worklet";
      if (finished) scheduleOnRN(setDraped, true);
    };
    if (reduce) {
      drop.set(0);
      markIn.set(timing(1, "base", "silk", done));
    } else {
      markIn.set(timing(1, "base", "silk"));
      drop.set(timing(0, "drape", "fall", done));
    }
  };

  useEffect(() => {
    if (holding && !announced.current) {
      announced.current = true;
      announce(t("common.loading"));
    }
  }, [holding]);

  useEffect(() => {
    if (!draped || status !== "error") return;
    if (failedOnce.current) announce(t("start.error.title"));
    failedOnce.current = true;
  }, [draped, status]);

  useEffect(() => {
    if (!leaving) return;
    handOff();
    fade.set(
      timing(0, reduce ? "base" : "settle", "silk", (finished) => {
        "worklet";
        if (finished) scheduleOnRN(setGone, true);
      }),
    );
  }, [leaving, reduce, fade]);

  const focusTitle = () => {
    if (title.current)
      AccessibilityInfo.sendAccessibilityEvent(title.current, "focus");
  };

  const settle = (top: number) => {
    if (settled.current) return;
    settled.current = true;
    if (reduce) {
      swap.set(timing(1, "base", "silk"));
      shown.set(timing(1, "base", "silk"));
      focusTitle();
      return;
    }
    lift.set(
      timing(top - (height - size) / 2, "settle", "silk", (finished) => {
        "worklet";
        if (!finished) return;
        swap.set(1);
        shown.set(withDelay(motion.timer.step, timing(1, "base", "silk")));
        scheduleOnRN(focusTitle);
      }),
    );
  };

  const overlayStyle = useAnimatedStyle(() => ({ opacity: fade.get() }));
  const markStyle = useAnimatedStyle(() => ({
    opacity: markIn.get(),
    transform: [{ translateY: drop.get() }],
  }));
  const tileStyle = useAnimatedStyle(() => ({
    opacity: 1 - swap.get(),
    transform: [{ translateY: lift.get() }],
  }));
  const placedStyle = useAnimatedStyle(() => ({ opacity: swap.get() }));
  const shownStyle = useAnimatedStyle(() => ({ opacity: shown.get() }));

  if (gone) return null;

  return (
    <Animated.View
      pointerEvents={leaving ? "none" : "auto"}
      accessibilityViewIsModal={failed && !leaving}
      accessibilityElementsHidden={leaving}
      importantForAccessibility={leaving ? "no-hide-descendants" : "auto"}
      onLayout={() => {
        laidOut.current = true;
        begin();
      }}
      style={[styles.overlay, overlayStyle]}
    >
      {failed ? (
        <ScrollView
          contentContainerStyle={[
            ax ? styles.top : styles.centred,
            {
              paddingTop: insets.top + (ax ? theme.space.xxl : theme.space.xl),
              paddingBottom: insets.bottom + theme.space.xl,
            },
          ]}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            ref={slot}
            onLayout={() =>
              slot.current?.measureInWindow((_, top) => settle(top))
            }
            style={styles.tile}
          >
            <Animated.View style={[StyleSheet.absoluteFill, placedStyle]}>
              <Image source={tile} style={StyleSheet.absoluteFill} />
              <Image source={mark} style={StyleSheet.absoluteFill} />
            </Animated.View>
          </View>
          <Animated.View style={[styles.block, shownStyle]}>
            <View
              ref={title}
              accessible
              accessibilityRole="header"
              accessibilityLabel={t("start.error.title")}
            >
              <Text role="title" style={styles.title}>
                {t("start.error.title")}
              </Text>
            </View>
            <View style={styles.action}>
              {restore ? (
                <Button
                  label={t("start.error.restore")}
                  variant="primary"
                  size="regular"
                  busy={status === "loading"}
                  onPress={restore}
                  testID="splash-restore"
                />
              ) : (
                <Button
                  label={t("common.tryAgain")}
                  variant="primary"
                  size="regular"
                  busy={status === "loading"}
                  onPress={retry}
                  testID="splash-try-again"
                />
              )}
              <Button
                label={t("start.error.startOver")}
                variant="destructive"
                disabled={status === "loading"}
                onPress={() =>
                  void confirmAction(
                    t("start.error.startOverTitle"),
                    t("start.error.startOverBody"),
                    t("start.error.startOver"),
                  ).then((confirmed) => {
                    if (confirmed) startOver();
                  })
                }
                testID="splash-start-over"
              />
            </View>
          </Animated.View>
        </ScrollView>
      ) : null}
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.centre}
      >
        <Animated.View style={[styles.tile, tileStyle]}>
          <Image source={tile} style={StyleSheet.absoluteFill} />
          <Animated.View style={[StyleSheet.absoluteFill, markStyle]}>
            <Image
              source={mark}
              style={StyleSheet.absoluteFill}
              onLoad={() => {
                loaded.current = true;
                begin();
              }}
            />
          </Animated.View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.canvas,
  },
  centre: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  centred: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  top: { alignItems: "center" },
  tile: { width: size, height: size },
  block: { alignItems: "center", paddingHorizontal: theme.space.lg },
  title: { textAlign: "center", marginTop: theme.space.xl },
  action: {
    marginTop: theme.space.xl,
    alignItems: "center",
    gap: theme.space.sm,
  },
});

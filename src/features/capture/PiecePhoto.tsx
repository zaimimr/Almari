import { useEffect, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  ReduceMotion,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
} from "react-native-reanimated";
import { Image } from "expo-image";
import type { Piece } from "../../domain/closet";
import { t } from "../../i18n";
import { Button, Expander, Field, Segmented, Silk, Text } from "../../ui";
import { motion, timing, useReduceMotion } from "../../ui/motion";
import { photoSource } from "../../ui/photos";
import { theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";
import { useLargeText } from "../../ui/useLargeText";

export type PhotoView = "original" | "cutout" | "studio";

export type PhotoChoice = {
  id: PhotoView;
  image: Piece;
  raw: boolean;
  uri?: string;
};

const order: PhotoView[] = ["original", "cutout", "studio"];

export const photoLabel = (view: PhotoView) =>
  view === "original"
    ? t("photo.original")
    : view === "cutout"
      ? t("photo.plain")
      : t("photo.clean");

const fade = (duration: "settle" | "drape", reduce: boolean) =>
  FadeIn.duration(motion.duration[reduce ? "base" : duration])
    .easing(motion.easing[duration === "drape" ? "fall" : "silk"])
    .reduceMotion(ReduceMotion.Never);

const leave = FadeOut.duration(motion.duration.settle)
  .easing(motion.easing.release)
  .reduceMotion(ReduceMotion.Never);

function Picture({ choice }: { choice: PhotoChoice }) {
  const source = choice.uri
    ? { uri: choice.uri }
    : photoSource(choice.image.photo);
  return choice.raw ? (
    <Image
      source={source}
      contentFit="contain"
      recyclingKey={choice.image.id}
      style={[StyleSheet.absoluteFill, styles.raw]}
    />
  ) : (
    <View style={styles.cut}>
      <Image
        source={source}
        contentFit="contain"
        recyclingKey={choice.image.id}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function Generating({ choice, label }: { choice: PhotoChoice; label: string }) {
  const reduce = useReduceMotion();
  const breath = useSharedValue(0);
  useEffect(() => {
    if (reduce) {
      breath.set(0);
      return;
    }
    breath.set(withRepeat(timing(1, "sheen", "silk"), -1, true));
    return () => cancelAnimation(breath);
  }, [reduce, breath]);
  const soft = useAnimatedStyle(() => ({
    opacity: reduce ? 0.6 : 1 - breath.get() * 0.35,
    transform: [{ scale: 1 - breath.get() * 0.015 }],
  }));
  return (
    <Silk kind="sheen" peak={0.8} label={label} style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, soft]}>
        <Picture choice={choice} />
      </Animated.View>
    </Silk>
  );
}

export function PiecePhoto({
  choices,
  value,
  onChange,
  making = false,
  made = false,
  stale = false,
  onMake,
  adjust,
  message,
  note = false,
  disabled = false,
  accessibilityLabel,
  heroID,
  testID,
}: {
  choices: PhotoChoice[];
  value: PhotoView;
  onChange: (next: PhotoView) => void;
  making?: boolean;
  made?: boolean;
  stale?: boolean;
  onMake?: (note?: string) => void;
  adjust?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    testID?: string;
  } | null;
  message?: string | null;
  note?: boolean;
  disabled?: boolean;
  accessibilityLabel: string;
  heroID: string;
  testID?: string;
}) {
  const colors = useColors();
  const reduce = useReduceMotion();
  const { height } = useWindowDimensions();
  const { ax } = useLargeText();
  const [compare, setCompare] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const sorted = order
    .map((id) => choices.find((choice) => choice.id === id))
    .filter((choice): choice is PhotoChoice => Boolean(choice));
  const shownView = making ? "studio" : value;
  const shown =
    sorted.find((choice) => choice.id === (making ? "cutout" : shownView)) ??
    sorted[0] ??
    null;
  const locked = disabled || making;
  const offersStudio = sorted.some((choice) => choice.id === "studio");
  const original = sorted.find((choice) => choice.id === "original");
  const candidate = sorted.find((choice) => choice.id === "studio");
  const comparing = compare && made && !making && original && candidate;
  const busyLabel = t("photo.cleanMaking");
  const [fix, setFix] = useState("");
  const remake = () => {
    if (!locked) onMake?.(fix.trim() || undefined);
  };

  return (
    <View style={styles.block} testID={testID}>
      <View style={styles.hero}>
        {comparing ? (
          <View
            style={[styles.comparison, ax && styles.stacked]}
            testID="photo-comparison"
          >
            {[original, candidate].map((choice) => (
              <View key={choice.id} style={styles.comparisonPhoto}>
                <Text role="subhead">{photoLabel(choice.id)}</Text>
                <View
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel={`${photoLabel(choice.id)}, ${accessibilityLabel}`}
                  accessibilityIgnoresInvertColors
                  style={[
                    styles.frame,
                    {
                      height: Math.min(
                        height * (ax ? 0.42 : 0.34),
                        ax ? 400 : 320,
                      ),
                      backgroundColor: colors.sunken,
                    },
                  ]}
                >
                  <Picture choice={choice} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={making ? busyLabel : accessibilityLabel}
            accessibilityState={{ busy: making }}
            accessibilityIgnoresInvertColors
            style={[
              styles.frame,
              {
                height: Math.min(height * 0.46, 440),
                backgroundColor: colors.sunken,
              },
            ]}
            testID={making ? "moment-generating" : heroID}
          >
            {shown ? (
              <Animated.View
                key={`${making ? "making" : shown.id}-${shown.uri ?? shown.image.photo}`}
                entering={fade(
                  shown.id === "studio" && !making ? "drape" : "settle",
                  reduce,
                )}
                exiting={leave}
                style={StyleSheet.absoluteFill}
              >
                {making ? (
                  <Generating choice={shown} label={busyLabel} />
                ) : (
                  <Picture choice={shown} />
                )}
              </Animated.View>
            ) : null}
          </View>
        )}
        {adjust && !comparing ? (
          <View style={styles.adjust}>
            <Button
              variant="icon"
              icon="scissors"
              label={adjust.label}
              disabled={locked || adjust.disabled}
              onPress={adjust.onPress}
              testID={adjust.testID}
            />
          </View>
        ) : null}
      </View>
      {sorted.length > 1 ? (
        <Segmented
          options={sorted.map((choice) => ({
            id: choice.id,
            label: photoLabel(choice.id),
          }))}
          value={shownView}
          onChange={(next) => {
            setCompare(false);
            onChange(next);
          }}
          disabled={locked}
        />
      ) : null}
      {made && original && !making ? (
        <View style={styles.lead}>
          <Button
            variant="quiet"
            icon="rectangle.split.2x1"
            label={t(compare ? "photo.closeCompare" : "photo.compare")}
            selected={compare}
            onPress={() => setCompare((current) => !current)}
            disabled={disabled}
            testID="photo-compare"
          />
          {value === "studio" || compare ? (
            <Text role="footnote" tone={stale ? "error" : "muted"}>
              {t(stale ? "photo.stale" : "photo.checkDetails")}
            </Text>
          ) : null}
        </View>
      ) : null}
      {offersStudio && onMake && !making ? (
        <View style={styles.fix}>
          <Button
            variant={made ? "secondary" : "primary"}
            icon={made ? "arrow.clockwise" : "wand.and.stars"}
            label={t(made ? "photo.aiAgain" : "photo.create")}
            disabled={disabled}
            onPress={remake}
            testID="photo-ai-again"
          />
          <Expander
            id="photo-details"
            title={t("photo.correctDetails")}
            open={detailsOpen}
            onToggle={() => setDetailsOpen((current) => !current)}
            testID="photo-details"
          >
            <Field
              label={t(made ? "photo.aiFix" : "photo.aiDescribe")}
              placeholder={t("photo.aiFixHint")}
              value={fix}
              onChangeText={setFix}
              maxLength={200}
              editable={!disabled}
              returnKeyType="done"
              testID="photo-ai-fix"
            />
          </Expander>
        </View>
      ) : null}
      {message ? (
        <View style={styles.lead}>
          <Text role="footnote" tone="error">
            {message}
          </Text>
          {onMake && message !== t("photo.cleanLimit") ? (
            <View style={styles.bleed}>
              <Button
                label={t("common.tryAgain")}
                variant="quiet"
                disabled={locked}
                onPress={remake}
              />
            </View>
          ) : null}
        </View>
      ) : null}
      {offersStudio && (note || making) ? (
        <Text role="footnote" tone="muted">
          {t("photo.cleanNote")}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: theme.space.md },
  hero: { width: "100%", maxWidth: 440, alignSelf: "center" },
  frame: {
    width: "100%",
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  comparison: { flexDirection: "row", gap: theme.space.sm },
  stacked: { flexDirection: "column" },
  comparisonPhoto: { flex: 1, gap: theme.space.sm },
  raw: { borderRadius: theme.radius.md, borderCurve: "continuous" },
  cut: {
    position: "absolute",
    top: "3%",
    left: "3%",
    right: "3%",
    bottom: "3%",
  },
  adjust: { position: "absolute", top: theme.space.sm, right: theme.space.sm },
  lead: { alignItems: "flex-start", gap: theme.space.sm },
  fix: { gap: theme.space.sm },
  bleed: { marginLeft: -theme.space.sm },
});

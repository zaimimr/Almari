import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import type { Prepared, Variant } from "../domain/closet";
import { t } from "../i18n";
import { photoUri } from "../storage/local";
import { Chip } from "../ui";
import { theme } from "../ui/theme";

export function PhotoChoice({
  prepared,
  keepOriginal,
  variant,
  onChange,
  studioOffered,
  making,
  onStudio,
}: {
  prepared: Prepared;
  keepOriginal: boolean;
  variant: Variant;
  onChange: (choice: { keepOriginal: boolean; variant: Variant }) => void;
  studioOffered: boolean;
  making: boolean;
  onStudio: () => void;
}) {
  const enhanced = prepared.enhanced ?? null;
  const studio = enhanced ? (prepared.studio ?? null) : null;
  const shown =
    studio && variant === "studio"
      ? studio
      : enhanced && variant !== "plain"
        ? enhanced
        : prepared.cutout;
  return (
    <View style={styles.compare}>
      {shown ? (
        <View style={styles.half}>
          <View style={[styles.photo, !keepOriginal && styles.selected]}>
            <Image
              source={{ uri: photoUri(shown) }}
              style={styles.image}
              contentFit="contain"
              accessibilityLabel={
                shown === studio
                  ? t("photo.studioImage")
                  : shown === enhanced
                    ? t("photo.enhancedImage")
                    : t("photo.plainImage")
              }
            />
          </View>
          {enhanced ? (
            <View style={styles.chips}>
              <Chip
                label={t("photo.enhanced")}
                selected={!keepOriginal && variant === "enhanced"}
                onPress={() =>
                  onChange({ keepOriginal: false, variant: "enhanced" })
                }
              />
              <Chip
                label={t("photo.plain")}
                selected={!keepOriginal && variant === "plain"}
                onPress={() =>
                  onChange({ keepOriginal: false, variant: "plain" })
                }
              />
              {studio || studioOffered ? (
                <Chip
                  label={making ? t("photo.studioMaking") : t("photo.studio")}
                  selected={!keepOriginal && variant === "studio" && !!studio}
                  disabled={making}
                  onPress={() =>
                    studio
                      ? onChange({ keepOriginal: false, variant: "studio" })
                      : onStudio()
                  }
                />
              ) : null}
            </View>
          ) : (
            <Chip
              label={t("capture.usePrepared")}
              selected={!keepOriginal}
              onPress={() => onChange({ keepOriginal: false, variant })}
            />
          )}
        </View>
      ) : null}
      <View style={styles.half}>
        <View style={[styles.photo, keepOriginal && styles.selected]}>
          <Image
            source={{ uri: photoUri(prepared.original) }}
            style={styles.image}
            contentFit="contain"
            accessibilityLabel={t("capture.originalPhoto")}
          />
        </View>
        <Chip
          label={t("capture.keepOriginal")}
          selected={keepOriginal}
          onPress={() => onChange({ keepOriginal: true, variant })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compare: { flexDirection: "row", gap: 12 },
  half: { flex: 1, gap: 8, alignItems: "center" },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  photo: {
    width: "100%",
    aspectRatio: 0.8,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: theme.colors.line,
    overflow: "hidden",
    padding: 6,
    backgroundColor: theme.colors.canvas,
  },
  selected: { borderColor: theme.colors.plum, borderWidth: 2, padding: 5 },
  image: { width: "100%", height: "100%" },
});

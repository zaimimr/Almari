import { Pressable, StyleSheet, View } from "react-native";
import type { Piece } from "../../domain/closet";
import { t } from "../../i18n";
import { Button, Segmented, Text, Tile } from "../../ui";
import { theme } from "../../ui/theme";
import { useColors } from "../../ui/useColors";

export type PhotoView = "cutout" | "original" | "studio";

export type PhotoPreview = { image: Piece; raw: boolean };

export function PhotoToolbar({
  options,
  value,
  onChange,
  adjust,
  previews,
  note,
  making = false,
  disabled = false,
  testID,
}: {
  options: PhotoView[];
  value: PhotoView;
  onChange: (next: PhotoView) => void;
  adjust?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    testID?: string;
  } | null;
  previews?: Partial<Record<PhotoView, PhotoPreview>>;
  note?: boolean;
  making?: boolean;
  disabled?: boolean;
  testID?: string;
}) {
  const colors = useColors();
  const label = (option: PhotoView) =>
    option === "cutout"
      ? t("photo.plain")
      : option === "original"
        ? t("photo.original")
        : making
          ? t("photo.cleanMaking")
          : t("photo.clean");
  const locked = disabled || making;
  const adjustButton = adjust ? (
    <Button
      variant="quiet"
      icon="scissors"
      label={adjust.label}
      disabled={locked || adjust.disabled}
      onPress={adjust.onPress}
      testID={adjust.testID}
    />
  ) : null;
  const choices =
    options.length < 2 ? null : previews ? (
      <View style={styles.thumbs}>
        {options.map((option) => {
          const preview = previews[option];
          const selected = option === value;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={label(option)}
              accessibilityState={{ selected, disabled: locked }}
              disabled={locked}
              onPress={() => onChange(option)}
              style={({ pressed }) => [
                styles.thumb,
                pressed && styles.pressed,
                locked && !selected && styles.faded,
              ]}
            >
              <View
                style={[
                  styles.frame,
                  {
                    borderColor: selected ? colors.ink : "transparent",
                  },
                ]}
              >
                {preview ? (
                  <Tile
                    image={preview.image}
                    raw={preview.raw}
                    size="cell"
                    state={
                      option === "studio" && making ? "preparing" : undefined
                    }
                    accessibilityLabel={label(option)}
                  />
                ) : null}
              </View>
              <Text
                role="footnote"
                tone={selected ? "ink" : "muted"}
                numberOfLines={2}
                style={styles.caption}
              >
                {label(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    ) : (
      <View style={styles.choices}>
        <Segmented
          options={options.map((option) => ({
            id: option,
            label: label(option),
          }))}
          value={value}
          onChange={onChange}
          disabled={locked}
        />
      </View>
    );
  return (
    <View style={styles.block} testID={testID}>
      {previews ? (
        choices
      ) : (
        <View style={styles.row}>
          {choices}
          {adjustButton}
        </View>
      )}
      {(note ?? making) ? (
        <Text role="footnote" tone="muted">
          {t("photo.cleanNote")}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: theme.space.sm },
  row: { flexDirection: "row", alignItems: "center", gap: theme.space.sm },
  choices: { flex: 1 },
  thumbs: { flexDirection: "row", gap: theme.space.md },
  thumb: { flex: 1, minWidth: 0, gap: theme.space.xs, alignItems: "center" },
  frame: {
    alignSelf: "stretch",
    borderWidth: 2,
    borderRadius: theme.radius.md,
    padding: 2,
  },
  caption: { textAlign: "center" },
  pressed: { opacity: 0.7 },
  faded: { opacity: 0.5 },
});

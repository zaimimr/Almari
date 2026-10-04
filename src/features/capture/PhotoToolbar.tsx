import { StyleSheet, View } from "react-native";
import { t } from "../../i18n";
import { Button, Segmented, Text } from "../../ui";
import { theme } from "../../ui/theme";

export type PhotoView = "cutout" | "original" | "studio";

export function PhotoToolbar({
  options,
  value,
  onChange,
  adjust,
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
  making?: boolean;
  disabled?: boolean;
  testID?: string;
}) {
  const label = (option: PhotoView) =>
    option === "cutout"
      ? t("photo.plain")
      : option === "original"
        ? t("photo.original")
        : making
          ? t("photo.cleanMaking")
          : t("photo.clean");
  return (
    <View style={styles.block} testID={testID}>
      <View style={styles.row}>
        {options.length > 1 ? (
          <View style={styles.choices}>
            <Segmented
              options={options.map((option) => ({
                id: option,
                label: label(option),
              }))}
              value={value}
              onChange={onChange}
              disabled={disabled || making}
            />
          </View>
        ) : null}
        {adjust ? (
          <Button
            variant="quiet"
            icon="scissors"
            label={adjust.label}
            disabled={disabled || making || adjust.disabled}
            onPress={adjust.onPress}
            testID={adjust.testID}
          />
        ) : null}
      </View>
      {making ? (
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
});

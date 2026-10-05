import { StyleSheet, View } from "react-native";
import type { ColourProfile } from "../../domain/closet";
import { shiftSeason, shifts, type Shift } from "../../domain/seasons";
import { t } from "../../i18n";
import { Button, Chip, Expander, Row } from "../../ui";
import { theme } from "../../ui/theme";

export function NotMe({
  open,
  onToggle,
  profile,
  hairCovered,
  onHairCovered,
  onShift,
  onRetake,
}: {
  open: boolean;
  onToggle: () => void;
  profile: ColourProfile;
  hairCovered: boolean;
  onHairCovered: (next: boolean) => void;
  onShift: (shift: Shift) => void;
  onRetake: () => void;
}) {
  return (
    <View style={styles.notMe}>
      <View style={styles.start}>
        <Button
          label={t("colours.notMe")}
          variant="quiet"
          icon={open ? "chevron.up" : "chevron.down"}
          iconAfter
          expanded={open}
          onPress={onToggle}
          testID="colours-not-me"
        />
      </View>
      <Expander id="colours-not-me" headless open={open} onToggle={onToggle}>
        <View style={styles.body}>
          <View style={styles.shifts}>
            {shifts.map((shift) => (
              <Chip
                key={shift}
                label={t(`colours.shift.${shift}`)}
                kind="action"
                disabled={!shiftSeason(profile.season, shift)}
                onPress={() => onShift(shift)}
                testID={`colours-shift-${shift}`}
              />
            ))}
          </View>
          <Row
            title={t("colours.hairCovered")}
            trailing={{ toggle: hairCovered, onToggle: onHairCovered }}
            testID="colours-hair"
          />
          <View style={styles.start}>
            <Button
              label={t("colours.retakeButton")}
              variant="secondary"
              icon="camera"
              onPress={onRetake}
              testID="colours-retake"
            />
          </View>
        </View>
      </Expander>
    </View>
  );
}

const styles = StyleSheet.create({
  notMe: { gap: theme.space.sm },
  start: { alignItems: "flex-start" },
  body: { gap: theme.space.lg },
  shifts: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
});

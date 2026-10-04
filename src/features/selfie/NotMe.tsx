import { StyleSheet, View } from "react-native";
import type { ColourProfile } from "../../domain/closet";
import { t } from "../../i18n";
import { Button, Expander, Row, Segmented } from "../../ui";
import { theme } from "../../ui/theme";

const undertones = ["cool", "neutral", "warm"] as const;
const depths = ["light", "medium", "deep"] as const;
const contrasts = ["low", "medium", "high"] as const;

type Change = Partial<Pick<ColourProfile, "undertone" | "depth" | "contrast">>;

export function NotMe({
  open,
  onToggle,
  profile,
  hairCovered,
  onHairCovered,
  onAdjust,
  onRetake,
}: {
  open: boolean;
  onToggle: () => void;
  profile: ColourProfile;
  hairCovered: boolean;
  onHairCovered: (next: boolean) => void;
  onAdjust: (change: Change) => void;
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
          <View style={styles.start}>
            <Button
              label={t("colours.retakeButton")}
              variant="secondary"
              icon="camera"
              onPress={onRetake}
              testID="colours-retake"
            />
          </View>
          <Row
            title={t("colours.hairCovered")}
            trailing={{ toggle: hairCovered, onToggle: onHairCovered }}
            testID="colours-hair"
          />
          <Segmented
            label={t("colours.undertone")}
            options={undertones.map((id) => ({
              id,
              label: t(`undertone.${id}`),
            }))}
            value={profile.undertone}
            onChange={(undertone) => onAdjust({ undertone })}
          />
          <Segmented
            label={t("colours.depth")}
            options={depths.map((id) => ({ id, label: t(`depth.${id}`) }))}
            value={profile.depth}
            onChange={(depth) => onAdjust({ depth })}
          />
          <Segmented
            label={t("colours.contrast")}
            options={contrasts.map((id) => ({
              id,
              label: t(`contrast.${id}`),
            }))}
            value={profile.contrast}
            onChange={(contrast) => onAdjust({ contrast })}
          />
        </View>
      </Expander>
    </View>
  );
}

const styles = StyleSheet.create({
  notMe: { gap: theme.space.sm },
  start: { alignItems: "flex-start" },
  body: { gap: theme.space.lg },
});

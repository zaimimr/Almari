import { Linking, View } from "react-native";
import { router } from "expo-router";
import { t } from "../../i18n";
import { Banner, Expander, Row, Rows, Text } from "../../ui";
import { theme } from "../../ui/theme";
import type { Problem } from "./useCaptureGrid";

const tips = [
  "capture.tip1Title",
  "capture.tip2Title",
  "capture.tip3Title",
] as const;

const problemText = {
  "camera-off": "common.cameraOff",
  unavailable: "common.photoOpenFailed",
  "low-space": "problem.low-space",
  failed: "problem.failed",
} as const;

export function CaptureTips({
  open,
  onToggle,
  onGotIt,
}: {
  open: boolean;
  onToggle: () => void;
  onGotIt: () => void;
}) {
  return (
    <Expander
      id="capture-tips"
      headless
      open={open}
      onToggle={onToggle}
      actions={[
        { label: t("capture.gotIt"), variant: "secondary", onPress: onGotIt },
      ]}
      testID="capture-tips"
    >
      <View
        accessibilityLabel={t("capture.tips")}
        style={{ gap: theme.space.xs }}
      >
        {tips.map((key) => (
          <Text key={key} role="headline">
            {t(key)}
          </Text>
        ))}
      </View>
    </Expander>
  );
}

export function CaptureSources({
  onTakePhotos,
  onChoosePhotos,
  problem,
  onRetryProblem,
}: {
  onTakePhotos: () => void;
  onChoosePhotos: () => void;
  problem: Problem | null;
  onRetryProblem: () => void;
}) {
  return (
    <View style={{ gap: theme.space.md }}>
      <Rows>
        <Row
          title={t("capture.takePhotos")}
          leading={{ icon: "camera" }}
          onPress={onTakePhotos}
          testID="source-camera"
        />
        <Row
          title={t("capture.choosePhotos")}
          leading={{ icon: "photo.on.rectangle" }}
          onPress={onChoosePhotos}
          testID="source-library"
        />
        <Row
          title={t("capture.scan")}
          leading={{ icon: "viewfinder" }}
          trailing="chevron"
          onPress={() => router.push("/capture/scan")}
          testID="source-scan"
        />
        <Row
          title={t("capture.byHand")}
          leading={{ icon: "pencil" }}
          trailing="chevron"
          onPress={() => router.push("/piece/new")}
          last
          testID="source-by-hand"
        />
      </Rows>
      {problem ? (
        <Banner
          tone="notice"
          text={t(problemText[problem.kind])}
          actions={
            problem.kind === "camera-off"
              ? [
                  {
                    label: t("capture.choosePhotos"),
                    variant: "secondary",
                    onPress: onChoosePhotos,
                  },
                  {
                    label: t("common.openSettings"),
                    variant: "quiet",
                    onPress: () => void Linking.openSettings(),
                  },
                ]
              : [
                  {
                    label: t("common.tryAgain"),
                    variant: "secondary",
                    onPress: onRetryProblem,
                  },
                ]
          }
          testID="capture-problem"
        />
      ) : null}
    </View>
  );
}

import { useState } from "react";
import { NotMe } from "../../src/features/selfie/NotMe";
import {
  PaletteResult,
  SeasonChoice,
} from "../../src/features/selfie/PaletteResult";
import { SelfieCameraPhase } from "../../src/features/selfie/SelfieCameraPhase";
import { SelfieTips } from "../../src/features/selfie/SelfieTips";
import { useSelfie } from "../../src/features/selfie/useSelfie";
import { t } from "../../src/i18n";
import { Footer, Screen } from "../../src/ui";

export default function Colours() {
  const selfie = useSelfie();
  const [notMe, setNotMe] = useState(false);
  const { phase, profile, palette, choice } = selfie;
  const choosing = phase === "result" && choice !== null && !!selfie.photo;

  const footer =
    phase === "tips" ? (
      <Footer
        primary={{
          label: t("colours.openCamera"),
          onPress: selfie.openCamera,
          testID: "colours-open-camera",
        }}
      />
    ) : phase === "result" && !choosing ? (
      <Footer
        primary={{
          label: t("colours.save"),
          onPress: () => void selfie.save(),
          busy: selfie.saving,
          testID: "colours-save",
        }}
        error={selfie.error}
      />
    ) : null;

  return (
    <Screen title={t("onboarding.colours.title")} footer={footer}>
      {phase === "tips" ? <SelfieTips /> : null}
      {phase === "camera" || phase === "measuring" ? (
        <SelfieCameraPhase
          camera={selfie.camera}
          guide={selfie.guide}
          checks={selfie.checks}
          retake={selfie.retake}
          hold={selfie.hold}
          cameraRef={selfie.cameraRef}
          measuring={phase === "measuring"}
          photo={selfie.photo}
          paper={selfie.paper}
          onPaper={selfie.togglePaper}
          onReading={selfie.onReading}
          onUnavailable={selfie.onUnavailable}
          onCapture={selfie.capture}
          onLibrary={() => void selfie.chooseFromLibrary()}
          onTryAgain={selfie.openCamera}
        />
      ) : null}
      {choosing && choice && selfie.photo ? (
        <SeasonChoice
          seasons={choice}
          photo={selfie.photo}
          face={selfie.face}
          size={selfie.size}
          onChoose={selfie.choose}
        />
      ) : null}
      {phase === "result" && !choosing && profile && palette ? (
        <PaletteResult
          profile={profile}
          palette={palette}
          photo={selfie.photo}
          face={selfie.face}
          size={selfie.size}
          plain={selfie.plain}
        >
          <NotMe
            open={notMe}
            onToggle={() => setNotMe((open) => !open)}
            profile={profile}
            hairCovered={selfie.hairCovered}
            onHairCovered={selfie.setHairCovered}
            onShift={selfie.shift}
            onRetake={() => {
              setNotMe(false);
              selfie.retakePhoto();
            }}
          />
        </PaletteResult>
      ) : null}
    </Screen>
  );
}

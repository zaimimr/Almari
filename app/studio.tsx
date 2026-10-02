import { useState } from "react";
import { locale, t } from "../src/i18n";
import { useCloset } from "../src/state/closet";
import {
  cancelStudioDownload,
  deleteStudioModel,
  downloadStudioModel,
  useStudioModel,
} from "../src/state/studio";
import {
  AppText,
  Button,
  ChoiceGroup,
  ErrorMessage,
  FormScreen,
} from "../src/ui";

const gigabytes = (bytes: number) =>
  (bytes / 1e9).toLocaleString(locale, { maximumFractionDigits: 1 });

export default function Studio() {
  const { closet, update } = useCloset();
  const model = useStudioModel();
  const [busy, setBusy] = useState(false);
  const on = closet.styling.studio;

  async function choose(value: "on" | "off") {
    setBusy(true);
    try {
      await update((current) => ({
        ...current,
        styling: { ...current.styling, studio: value === "on" },
      }));
    } finally {
      setBusy(false);
    }
    if (value === "on" && model.supported && !model.ready)
      void downloadStudioModel();
    if (value === "off") void cancelStudioDownload();
  }

  async function remove() {
    setBusy(true);
    try {
      await deleteStudioModel();
    } finally {
      setBusy(false);
    }
  }

  if (!model.supported)
    return (
      <FormScreen>
        <AppText muted>{t("studio.unsupported")}</AppText>
      </FormScreen>
    );

  return (
    <FormScreen>
      <ChoiceGroup
        label={t("studio.title")}
        options={[
          { id: "off", label: t("studio.off") },
          { id: "on", label: t("studio.on") },
        ]}
        value={on ? "on" : "off"}
        disabled={busy}
        onChange={(value) => {
          void choose(value);
        }}
      />
      {model.downloading ? (
        <>
          <AppText testID="studio-progress">
            {t("studio.progress", {
              percent: Math.floor((model.bytes / (model.size || 1)) * 100),
            })}
          </AppText>
          <Button
            label={t("common.cancel")}
            secondary
            onPress={() => {
              void cancelStudioDownload();
            }}
          />
        </>
      ) : model.ready ? (
        <>
          <AppText muted>
            {t("studio.ready", { size: gigabytes(model.size) })}
          </AppText>
          <Button
            label={t("studio.delete")}
            danger
            disabled={busy}
            onPress={() => {
              void remove();
            }}
          />
        </>
      ) : on ? (
        <Button
          label={t("studio.download", { size: gigabytes(model.size) })}
          disabled={busy}
          onPress={() => {
            void downloadStudioModel();
          }}
        />
      ) : null}
      <ErrorMessage
        message={model.failed && !model.downloading ? t("studio.failed") : null}
      />
    </FormScreen>
  );
}

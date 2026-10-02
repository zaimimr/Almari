import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useCloset } from "../../src/state/closet";
import { piecesForLook } from "../../src/domain/closet";
import {
  AppText,
  Button,
  ErrorMessage,
  FormScreen,
  Message,
  OutfitCollage,
  Screen,
} from "../../src/ui";
import { confirmAction } from "../../src/ui/confirm";
import { occasionName, t } from "../../src/i18n";

export default function LookDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { closet, update } = useCloset();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const look = closet.looks.find((item) => item.id === id);

  if (!look)
    return (
      <Screen centered>
        <Message
          title={t("look.goneTitle")}
          description={t("look.goneBody")}
          action={
            <Button
              label={t("look.goToLooks")}
              onPress={() => router.replace("/looks")}
            />
          }
        />
      </Screen>
    );
  const pieces = piecesForLook(closet, look);
  const missing = look.pieceIds.length - pieces.length;

  async function remove() {
    if (
      busy ||
      !(await confirmAction(
        t("look.removeTitle"),
        t("look.removeBody"),
        t("common.remove"),
      ))
    )
      return;
    setBusy(true);
    try {
      await update((current) => ({
        ...current,
        looks: current.looks.filter((item) => item.id !== id),
      }));
      router.back();
    } catch {
      setError(t("error.lookRemove"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormScreen>
      <AppText variant="title">{look.name}</AppText>
      {look.occasion ? (
        <AppText muted>{occasionName(look.occasion)}</AppText>
      ) : null}
      <AppText muted>
        {pieces.length === 1
          ? t("looksTab.countOne")
          : t("looksTab.countMany", { count: pieces.length })}
      </AppText>
      <OutfitCollage pieces={pieces} />
      {missing ? (
        <AppText>
          {missing === 1
            ? t("look.missingOne")
            : t("look.missingMany", { count: missing })}
        </AppText>
      ) : null}
      <Button
        label={t("look.changePieces")}
        disabled={busy}
        onPress={() => router.push({ pathname: "/look/build", params: { id } })}
      />
      {pieces.map((piece) => (
        <AppText key={piece.id}>{piece.name}</AppText>
      ))}
      <ErrorMessage message={error} />
      <Button
        label={t("look.remove")}
        danger
        busy={busy}
        onPress={() => {
          void remove();
        }}
      />
    </FormScreen>
  );
}

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
          title="This look is no longer here"
          description="Your other saved looks are still in Looks."
          action={
            <Button
              label="Go to looks"
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
        "Remove this look?",
        "The pieces will stay in your closet.",
        "Remove",
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
      setError("This look could not be removed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormScreen>
      <AppText variant="title">{look.name}</AppText>
      <AppText muted>
        {pieces.length} {pieces.length === 1 ? "piece" : "pieces"} from your
        closet
      </AppText>
      <OutfitCollage pieces={pieces} />
      {missing ? (
        <AppText>
          {missing} {missing === 1 ? "piece is" : "pieces are"} no longer in
          your closet. Edit this look to choose a replacement.
        </AppText>
      ) : null}
      <Button
        label="Change pieces"
        disabled={busy}
        onPress={() => router.push({ pathname: "/look/build", params: { id } })}
      />
      {pieces.map((piece) => (
        <AppText key={piece.id}>{piece.name}</AppText>
      ))}
      <ErrorMessage message={error} />
      <Button
        label="Remove look"
        danger
        busy={busy}
        onPress={() => {
          void remove();
        }}
      />
    </FormScreen>
  );
}

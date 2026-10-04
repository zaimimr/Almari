import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { isAvailable } from "../../src/domain/closet";
import {
  activeSession,
  applyRequest,
  startOccasion,
} from "../../src/domain/today";
import { t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { addPiecesRoute } from "../../src/state/imports";
import { PiecePicker } from "../../src/features/PiecePicker";
import { pickPieces } from "../../src/features/adjust/useAdjust";
import { Footer, Screen } from "../../src/ui";

export default function StartWithPiece() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromAdjust = from === "adjust";
  const { closet, update } = useCloset();
  const today = closet.styling.today;
  const session = today ? activeSession(today) : null;
  const request = session?.request ?? null;
  const [initial] = useState(() =>
    fromAdjust ? [] : (request?.keptIds ?? []),
  );
  const [selected, setSelected] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pool = closet.pieces.filter(
    (piece) =>
      isAvailable(piece) && (!request || piece.source === request.wardrobe),
  );
  const chosen = selected.filter((id) => pool.some((piece) => piece.id === id));
  const releasing = !chosen.length && initial.length > 0;

  async function submit() {
    if (busy) return;
    if (fromAdjust) {
      pickPieces(chosen);
      router.back();
      return;
    }
    if (!request) return;
    setBusy(true);
    setError(null);
    try {
      await update((current) =>
        (releasing && session
          ? (next: typeof current, changed: typeof request) =>
              applyRequest(next, changed, session.revision)
          : startOccasion)(current, {
          ...request,
          garmentType: null,
          keptIds: chosen,
          excludedIds: request.excludedIds.filter((id) => !chosen.includes(id)),
        }),
      );
      router.back();
    } catch {
      setError(t("common.error.save"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      title={t("today.startWithPiece")}
      testID="pieces"
      footer={
        pool.length ? (
          <Footer
            waiting={!chosen.length && !releasing}
            primary={{
              label: releasing
                ? t("adjust.stopKeeping")
                : t("pieces.startWithThese"),
              onPress: () => void submit(),
              busy,
              testID: "pieces-start",
            }}
            error={error}
          />
        ) : undefined
      }
    >
      <PiecePicker
        pieces={pool}
        selectedIds={chosen}
        onToggle={(id) =>
          setSelected((current) =>
            current.includes(id)
              ? current.filter((item) => item !== id)
              : [...current, id],
          )
        }
        onClear={() => setSelected([])}
        preview
        columns={3}
        onAddPieces={() => router.push(addPiecesRoute)}
        testID="pieces-picker"
        countTestID="pieces-count"
      />
    </Screen>
  );
}

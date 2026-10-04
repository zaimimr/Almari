import { router } from "expo-router";
import { addPiecesRoute } from "../../src/state/imports";
import { isAvailable } from "../../src/domain/closet";
import { setWearMore } from "../../src/domain/preferences";
import { PiecePicker } from "../../src/features/PiecePicker";
import { t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { Screen } from "../../src/ui";

export default function WearMore() {
  const { closet, update } = useCloset();
  const selected = closet.styling.profile.wearMore ?? [];
  const save = (ids: string[]) =>
    void update((current) => setWearMore(current, ids));

  return (
    <Screen title={t("wearMore.title")} leading="back" testID="wear-more">
      <PiecePicker
        pieces={closet.pieces.filter(isAvailable)}
        selectedIds={selected}
        onToggle={(id) =>
          save(
            selected.includes(id)
              ? selected.filter((item) => item !== id)
              : [...selected, id],
          )
        }
        onClear={() => save([])}
        columns={2}
        onAddPieces={() => router.push(addPiecesRoute)}
        testID="wear-more-picker"
        countTestID="wear-more-count"
      />
    </Screen>
  );
}

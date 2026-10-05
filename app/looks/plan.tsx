import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { lookEntries, setPlannedFor } from "../../src/domain/looks";
import type { LookEntry } from "../../src/domain/looks";
import {
  confirmMove,
  confirmReplace,
  showOn,
} from "../../src/features/looks/actions";
import { entryMeta, todayDate } from "../../src/features/looks/format";
import { locale, t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { Row, Rows, Screen } from "../../src/ui";
import { shortDate } from "../../src/ui/dates";

export default function PlanDay() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { closet, update } = useCloset();
  const today = todayDate();
  const saved = lookEntries(closet, locale, today).filter(
    (entry) => entry.lookId,
  );

  const pick = async (entry: LookEntry) => {
    const lookId = entry.lookId;
    if (!lookId || !(await confirmMove(closet, date, lookId))) return;
    if (!(await confirmReplace(closet, date, lookId))) return;
    const now = date === today;
    try {
      await update((current) => {
        const planned = setPlannedFor(current, lookId, date);
        return now ? showOn(entry)(planned) : planned;
      });
    } catch {
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (now) router.dismissTo("/(tabs)/today");
    else router.back();
  };

  return (
    <Screen
      title={t("looks.planFor", { date: shortDate(date, locale) })}
      testID="plan-day"
    >
      <Rows>
        {saved.map((entry, index) => {
          const pieces = entry.pieceIds.flatMap((id) => {
            const piece = closet.pieces.find((item) => item.id === id);
            return piece ? [piece] : [];
          });
          return (
            <Row
              key={entry.id}
              title={entry.name}
              meta={entryMeta(closet, entry)}
              leading={{ lay: pieces }}
              checked={entry.plannedFor === date}
              trailing={entry.plannedFor === date ? "selected" : undefined}
              onPress={() => void pick(entry)}
              last={index === saved.length - 1}
              testID={`plan-${entry.id}`}
            />
          );
        })}
      </Rows>
    </Screen>
  );
}

import { router, useLocalSearchParams } from "expo-router";
import {
  occasionOptions,
  styleOptions,
  type Occasion,
  type Style,
} from "../../src/domain/closet";
import { t } from "../../src/i18n";
import { useAdjust } from "../../src/features/adjust/useAdjust";
import { WhenRow } from "../../src/features/adjust/WhenRow";
import {
  ChipRow,
  EmptyState,
  Footer,
  Row,
  Screen,
  Section,
  Segmented,
} from "../../src/ui";

export default function Adjust() {
  const { keep } = useLocalSearchParams<{ keep?: string; focus?: string }>();
  const adjust = useAdjust(keep);
  const { closet, request, set } = adjust;

  if (!adjust.today || !request)
    return (
      <Screen title={t("title.adjust")}>
        <EmptyState
          title={t("common.setEverydayFirst")}
          action={{ label: t("common.goBack"), onPress: () => router.back() }}
        />
      </Screen>
    );

  const kept = request.keptIds.flatMap((id) => {
    const piece = closet.pieces.find((item) => item.id === id);
    return piece ? [piece] : [];
  });
  const keeping =
    kept.length === 1
      ? t("adjust.keepingOne")
      : t("adjust.keepingMany", { count: kept.length });

  return (
    <Screen
      title={t("title.adjust")}
      leading="cancel"
      onCancel={() => router.back()}
      testID="adjust"
      footer={
        <Footer
          primary={{
            label: t("adjust.find"),
            onPress: () => void adjust.submit(),
            busy: adjust.busy,
            testID: "adjust-find",
          }}
          error={adjust.error}
        />
      }
    >
      <Section title={t("adjust.occasion")}>
        <ChipRow
          label={t("adjust.occasion")}
          options={occasionOptions()}
          value={request.occasion}
          onChange={(next) => next && set({ occasion: next as Occasion })}
          testID="adjust-occasion"
        />
      </Section>
      <Section title={t("adjust.day")}>
        <WhenRow
          date={adjust.date}
          today={adjust.localDate}
          tomorrow={adjust.tomorrow}
          onChange={adjust.chooseDate}
        />
      </Section>
      <Section title={t("adjust.style")}>
        <Segmented<Style>
          label={t("adjust.style")}
          options={styleOptions.map((option) => ({
            id: option.id,
            label: option.label,
          }))}
          value={request.style}
          onChange={(style) => set({ style })}
        />
      </Section>
      <Section title={t("adjust.pieces")}>
        {kept.length ? (
          <Row
            title={`${keeping}, ${kept.map((piece) => piece.name).join(", ")}`}
            leading={
              kept[0] && kept.length === 1 ? { thumb: kept[0] } : { lay: kept }
            }
            trailing={{
              action: {
                label: t("adjust.stopKeeping"),
                onPress: () => set({ keptIds: [] }),
                variant: "quiet",
                size: "small",
              },
            }}
            testID="adjust-kept"
          />
        ) : (
          <Row
            title={t("today.startWithPiece")}
            trailing="chevron"
            onPress={() =>
              router.push({
                pathname: "/today/pieces",
                params: { from: "adjust" },
              })
            }
            testID="adjust-start-with"
          />
        )}
      </Section>
    </Screen>
  );
}

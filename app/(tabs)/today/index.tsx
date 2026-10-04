import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { plannedPieces } from "../../../src/domain/looks";
import { replacementsFor, roleOf } from "../../../src/domain/styling";
import {
  backToEveryday,
  clockFor,
  toggleKeep,
} from "../../../src/domain/today";
import { hijabAlternatives } from "../../../src/domain/wardrobe";
import { ChangeStrip } from "../../../src/features/ChangeStrip";
import { ActionArea } from "../../../src/features/today/ActionArea";
import { FirstRun } from "../../../src/features/today/FirstRun";
import { IntentRow } from "../../../src/features/today/IntentRow";
import { OutfitCard } from "../../../src/features/today/OutfitCard";
import { ProblemBanner } from "../../../src/features/today/ProblemBanner";
import {
  useToday,
  type TodayModel,
} from "../../../src/features/today/useToday";
import { locale, t } from "../../../src/i18n";
import { now } from "../../../src/state/clock";
import {
  Banner,
  Button,
  FlatLay,
  Footer,
  HeaderItem,
  ResultBar,
  Screen,
  Silk,
  Text,
} from "../../../src/ui";
import { fullDate, shortWeekday, spokenDate } from "../../../src/ui/dates";
import { theme } from "../../../src/ui/theme";
import { useGreeting } from "../../../src/features/today/useGreeting";

const heroSize = 360;

function Strip({ model }: { model: TodayModel }) {
  const { closet, request, session, openId, setOpenId, pieces } = model;
  const target = openId
    ? (pieces.find((piece) => piece.id === openId) ?? null)
    : null;
  const role = target ? roleOf(target) : null;

  const strip = useMemo(() => {
    if (!target || !request || !session) return null;
    if (role === "hijab") {
      const comparison = hijabAlternatives(
        closet,
        request,
        session.pieceIds,
        model.score,
        { all: false },
      );
      const marks = plannedPieces(closet, clockFor(now()));
      const options = comparison
        ? [comparison.current, ...comparison.options]
        : [{ piece: target, reason: null }];
      const partner = pieces.find((piece) => roleOf(piece) === "main");
      return {
        alternatives: options.map(({ piece, reason }) => ({
          piece,
          reason,
          planned: marks[piece.id]
            ? shortWeekday(marks[piece.id]!, locale)
            : undefined,
        })),
        value: partner
          ? t("change.reason.with", { piece: partner.name })
          : undefined,
      };
    }
    const replacements = replacementsFor(
      closet.pieces,
      request,
      session.pieceIds,
      target.id,
      model.scorer,
      model.context,
    );
    return {
      alternatives: [
        { piece: target, reason: null },
        ...replacements
          .filter((item) => item.piece.id !== target.id)
          .map((item) => ({ piece: item.piece, reason: null })),
      ],
      value: undefined,
    };
  }, [target, role, request, session, closet, pieces, model]);

  if (!target || !role || !request || !strip) return null;

  return (
    <ChangeStrip
      role={role}
      pieceId={target.id}
      alternatives={strip.alternatives}
      currentId={target.id}
      open
      onClose={() => setOpenId(null)}
      onPick={(piece) => {
        model.pick(target, piece);
        setOpenId(piece.id);
      }}
      keep={{
        kept: request.keptIds.includes(target.id),
        onToggle: () =>
          void model.run((current) => toggleKeep(current, target.id)),
      }}
      value={strip.value}
      loading={model.styling}
      testID="change-strip"
    />
  );
}

function TitleRow({ model }: { model: TodayModel }) {
  const date = model.session?.date;
  const tomorrow = model.mode === "tomorrow";
  return (
    <View style={styles.titleRow}>
      <Text role="title" accessibilityRole="header" style={styles.titleText}>
        {tomorrow
          ? t("today.tomorrow")
          : date
            ? fullDate(date, locale)
            : t("nav.today")}
      </Text>
      <Button
        label={t("today.backToToday")}
        variant="quiet"
        size="small"
        disabled={model.busy}
        onPress={() =>
          tomorrow ? model.leaveTomorrow() : void model.restyle(backToEveryday)
        }
        testID="today-back"
      />
    </View>
  );
}

function Banners({ model }: { model: TodayModel }) {
  const { result, showOutfit } = model;
  return (
    <>
      {model.stylingFailed ? (
        <Banner
          tone="notice"
          text={t("today.stylingFailed")}
          actions={[
            { label: t("common.tryAgain"), onPress: model.stylingFailed },
          ]}
          testID="today-styling-failed"
        />
      ) : null}
      {result && !showOutfit && model.lostPieces === 0
        ? result.problems
            .slice(0, 1)
            .map((problem) => (
              <ProblemBanner
                key={problem.code}
                model={model}
                problem={problem}
              />
            ))
        : null}
    </>
  );
}

function TodayFooter({ model }: { model: TodayModel }) {
  const planning = model.mode === "planning" || model.mode === "tomorrow";
  if (!model.showOutfit) return null;
  if (planning) {
    const saved = model.savedLook;
    return (
      <Footer
        primary={{
          label: saved
            ? t("today.openLook")
            : t("today.saveFor", {
                day: spokenDate(
                  model.session?.date ?? model.today?.localDate ?? "",
                  locale,
                ),
              }),
          disabled: model.busy,
          onPress: () => {
            if (saved)
              router.push({ pathname: "/look/[id]", params: { id: saved.id } });
            else void model.saveLook();
          },
          testID: "today-save-look",
        }}
        error={model.error}
      />
    );
  }
  return model.worn ? (
    <Footer error={model.error}>
      <ResultBar
        text={t("outfit.worn")}
        action={{
          label: t("common.undo"),
          onPress: model.unwear,
          disabled: model.busy,
          testID: "today-worn-undo",
        }}
        testID="today-worn"
      />
    </Footer>
  ) : (
    <Footer
      primary={{
        label: t("outfit.wear"),
        disabled: model.busy,
        onPress: () => void model.wear(),
        testID: "today-wear",
      }}
      error={model.error}
    />
  );
}

export default function TodayScreen() {
  const model = useToday();
  const { closet, today, mode, request, openId, setOpenId } = model;
  const [title, measure] = useGreeting(closet.styling.name, model.hour);
  const inline = mode === "planning" || mode === "tomorrow";
  const first = !closet.styling.everyday;

  const header = (
    <HeaderItem
      label={t("nav.profile")}
      icon="person.crop.circle"
      onPress={() => router.push("/profile")}
      testID="header-profile"
    />
  );

  if (first)
    return (
      <Screen large title={title} actions={header} testID="today">
        {measure}
        <FirstRun model={model} />
      </Screen>
    );

  return (
    <Screen
      large={!inline}
      title={inline ? t("nav.today") : title}
      headerTitleVisible={!inline}
      actions={header}
      footer={<TodayFooter model={model} />}
      testID="today"
    >
      {measure}
      <View style={styles.content}>
        {inline ? <TitleRow model={model} /> : <IntentRow model={model} />}
        <Banners model={model} />
        {!today ? (
          <Silk
            kind="placeholder"
            shape="lay"
            label={t("common.loading")}
            style={styles.placeholder}
          />
        ) : model.showOutfit ? (
          <View style={styles.outfit}>
            <View style={styles.hero}>
              <FlatLay
                pieces={model.pieces}
                size="hero"
                maxSize={heroSize}
                swapMark
                keptIds={request?.keptIds}
                openId={openId}
                revision={model.revision}
                state={model.styling ? "arranging" : undefined}
                onPiecePress={(piece) =>
                  setOpenId(openId === piece.id ? null : piece.id)
                }
                testID="today-outfit"
              />
            </View>
            <Strip key={openId ?? "closed"} model={model} />
            <OutfitCard model={model} />
            <ActionArea model={model} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.space.xl },
  outfit: { gap: theme.space.md },
  hero: { width: "100%", maxWidth: heroSize, alignSelf: "center" },
  placeholder: {
    alignSelf: "center",
    width: "100%",
    maxWidth: heroSize,
    aspectRatio: 1,
  },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.space.sm,
  },
  titleText: { flexShrink: 1 },
});

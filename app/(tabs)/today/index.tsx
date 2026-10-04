import { useMemo, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { colourNames, mainColourName } from "../../../src/domain/color";
import { setColour } from "../../../src/domain/facts";
import { plannedPieces } from "../../../src/domain/looks";
import { replacementsFor, roleOf } from "../../../src/domain/styling";
import {
  backToEveryday,
  clockFor,
  discardPlan,
  dropFromToday,
  resumePlan,
  toggleKeep,
} from "../../../src/domain/today";
import { hijabAlternatives } from "../../../src/domain/wardrobe";
import { ChangeStrip } from "../../../src/features/ChangeStrip";
import { ColourChips } from "../../../src/features/ColourChips";
import { ActionArea } from "../../../src/features/today/ActionArea";
import { ContextRow } from "../../../src/features/today/ContextRow";
import { FirstRun } from "../../../src/features/today/FirstRun";
import { OutfitCard } from "../../../src/features/today/OutfitCard";
import {
  ProblemBanner,
  StaleBanner,
} from "../../../src/features/today/ProblemBanner";
import { Rediscover } from "../../../src/features/today/Rediscover";
import { StartWith } from "../../../src/features/today/StartWith";
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

function Strip({ model }: { model: TodayModel }) {
  const { closet, request, session, open, setOpen, pieces } = model;
  const [all, setAll] = useState(false);
  const [editing, setEditing] = useState(false);
  const [colourId, setColourId] = useState<string | null>(null);
  const colourFor = closet.pieces.find((piece) => piece.id === colourId);
  const target =
    open?.kind === "strip"
      ? (pieces.find((piece) => piece.id === open.pieceId) ?? null)
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
        { all },
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
  }, [target, role, request, session, closet, pieces, all, model]);

  if (!target || !role || !request || !strip) return null;

  const close = () => {
    setAll(false);
    setEditing(false);
    setColourId(null);
    setOpen(null);
  };

  return (
    <ChangeStrip
      role={role}
      pieceId={target.id}
      alternatives={strip.alternatives}
      currentId={target.id}
      open
      onClose={close}
      onPick={(piece) => {
        setEditing(false);
        setColourId(null);
        model.pick(target, piece);
        setOpen({ kind: "strip", pieceId: piece.id });
      }}
      keep={{
        kept: request.keptIds.includes(target.id),
        onToggle: () =>
          void model.run((current) => toggleKeep(current, target.id)),
      }}
      value={strip.value}
      onShowAll={role === "hijab" && !all ? () => setAll(true) : undefined}
      onAnotherWithout={
        role === "hijab"
          ? undefined
          : () => {
              close();
              void model.restyle(
                (current) => dropFromToday(current, target.id),
                null,
              );
            }
      }
      onEditColour={() => {
        setEditing(true);
        setColourId(null);
      }}
      loading={model.styling}
      testID="change-strip"
    >
      {editing && !colourFor ? (
        <Button
          label={t("common.editColour")}
          variant="quiet"
          size="small"
          onPress={() => setColourId(target.id)}
          testID="change-edit-colour"
        />
      ) : null}
      {colourFor ? (
        <ColourChips
          value={
            colourNames.find(
              (name) => name.toLowerCase() === mainColourName(colourFor.colors),
            ) ?? null
          }
          onPick={(name) =>
            void model.run((current) => setColour(current, colourFor.id, name))
          }
          inSurface
        />
      ) : null}
    </ChangeStrip>
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
          tomorrow
            ? model.leaveTomorrow()
            : void model.restyle(backToEveryday, null)
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
      {model.tomorrowWaiting ? (
        <Banner
          tone="notice"
          text={t("today.tomorrow")}
          actions={[
            {
              label: t("today.showTomorrow"),
              accessibilityLabel: t("today.showTomorrowLabel"),
              onPress: model.showTomorrow,
            },
          ]}
          testID="today-tomorrow-waiting"
        />
      ) : null}
      {model.planned ? (
        <Banner
          tone="notice"
          text={t("today.planned", { name: model.planned.name })}
          actions={[
            {
              label: t("looks.showOnToday"),
              onPress: () => void model.showLook(model.planned!.pieceIds),
            },
          ]}
          testID="today-planned"
        />
      ) : null}
      {model.unsaved?.date ? (
        <Banner
          tone="notice"
          text={t("today.unsavedPlan", {
            day: spokenDate(model.unsaved.date, locale),
          })}
          actions={[
            {
              label: t("today.openPlan"),
              onPress: () => void model.restyle(resumePlan, null),
            },
            {
              label: t("common.discard"),
              onPress: () => void model.run(discardPlan),
            },
          ]}
          testID="today-unsaved"
        />
      ) : null}
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
      {model.lostPieces > 0 || model.broken.length > 0 ? (
        <StaleBanner model={model} />
      ) : null}
    </>
  );
}

function WeatherMark({ model }: { model: TodayModel }) {
  const forecast = model.closet.styling.forecast;
  const date = model.session?.date ?? model.today?.localDate;
  if (
    !forecast ||
    forecast.date !== date ||
    model.request?.weather.source !== "forecast"
  )
    return null;
  return (
    <Button
      label={t("forecast.mark")}
      accessibilityLabel={t("forecast.markLabel")}
      variant="quiet"
      size="small"
      onPress={() => void Linking.openURL(forecast.attribution.url)}
      testID="forecast-mark"
    />
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
          label: t(saved ? "today.openLook" : "common.saveLook"),
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
  const { closet, today, mode, request, open, setOpen } = model;
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

  const openId = open?.kind === "strip" ? open.pieceId : null;

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
        {inline ? <TitleRow model={model} /> : null}
        <ContextRow model={model} />
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
                maxSize={236}
                swapMark
                keptIds={request?.keptIds}
                openId={openId}
                revision={model.revision}
                state={model.styling ? "arranging" : undefined}
                onPiecePress={(piece) =>
                  setOpen(
                    openId === piece.id
                      ? null
                      : { kind: "strip", pieceId: piece.id },
                  )
                }
                testID="today-outfit"
              />
            </View>
            <Strip key={openId ?? "closed"} model={model} />
            <OutfitCard model={model} />
            <ActionArea model={model} />
          </View>
        ) : null}
        {today ? <StartWith model={model} /> : null}
        {today ? <Rediscover model={model} /> : null}
        <WeatherMark model={model} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.space.xl },
  outfit: { gap: theme.space.md },
  hero: { width: "100%", maxWidth: 236, alignSelf: "center" },
  placeholder: { alignSelf: "center", width: 236, height: 236 },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.space.sm,
  },
  titleText: { flexShrink: 1 },
});

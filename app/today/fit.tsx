import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import type { Slot } from "../../src/domain/closet";
import { fitsOn, removeFit, unwearFit } from "../../src/domain/day";
import { undoFeedback } from "../../src/domain/feedback";
import { outfitName } from "../../src/domain/outfitName";
import { DressyMeter } from "../../src/features/today/DressyMeter";
import { PieceStrip } from "../../src/features/today/PieceStrip";
import { ProblemBanner } from "../../src/features/today/ProblemBanner";
import { degrees, whenLabel } from "../../src/features/today/sky";
import { useToday } from "../../src/features/today/useToday";
import { WeatherTip } from "../../src/features/today/WeatherTip";
import { locale, t } from "../../src/i18n";
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
} from "../../src/ui";
import { enter, reflow, useReduceMotion } from "../../src/ui/motion";
import { theme } from "../../src/ui/theme";

const heroSize = 340;
const slots: Slot[] = ["morning", "afternoon", "evening"];

type Params = {
  slot?: string;
  celsius?: string;
  fit?: string;
  date?: string;
  view?: string;
  from?: string;
};

const home = () => router.dismissTo("/(tabs)/today");

export default function FitScreen() {
  const params = useLocalSearchParams<Params>();
  const slot = slots.find((item) => item === params.slot) ?? "morning";
  const celsius =
    params.celsius !== undefined && Number.isFinite(Number(params.celsius))
      ? Number(params.celsius)
      : null;
  if (params.view && params.fit && params.date)
    return <FitView id={params.fit} date={params.date} />;
  return (
    <FitEditor
      slot={slot}
      celsius={celsius}
      fitId={params.fit}
      fromCreate={params.from === "create"}
    />
  );
}

function FitEditor({
  slot,
  celsius,
  fitId,
  fromCreate,
}: {
  slot: Slot;
  celsius: number | null;
  fitId?: string;
  fromCreate: boolean;
}) {
  const model = useToday();
  const reduce = useReduceMotion();
  const { request, openId, setOpenId } = model;
  const units = model.closet.styling.units;
  const fit = fitId
    ? fitsOn(model.closet, model.date).find((item) => item.id === fitId)
    : undefined;
  const temp = celsius ?? fit?.celsius ?? null;
  const weather = request?.weather;
  const sky =
    weather && weather.source !== "unknown" ? weather.precipitation : null;
  const weatherLine =
    sky && temp !== null
      ? t(`fit.weather.${sky}`, {
          when: whenLabel(slot),
          temp: degrees(temp, units),
        })
      : null;

  const wear = async () => {
    const saved = await model.keep(slot, temp, fitId);
    if (!saved) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    home();
  };

  const editAnswers = () =>
    fromCreate
      ? router.back()
      : router.push({
          pathname: "/today/create",
          params: { day: model.planning ? "tomorrow" : "today" },
        });

  const saveAction = model.showOutfit ? (
    <HeaderItem
      label={model.savedLook ? t("result.saved") : t("fit.save")}
      icon={model.savedLook ? "bookmark.fill" : "bookmark"}
      disabled={!!model.savedLook || model.busy}
      onPress={() => void model.saveLook()}
      testID="fit-save"
    />
  ) : null;

  return (
    <Screen
      title={t("fit.title")}
      headerTitleVisible={false}
      actions={saveAction}
      testID="fit"
      footer={
        model.showOutfit ? (
          <Footer
            primary={{
              label: model.planning ? t("fit.plan") : t("outfit.wear"),
              onPress: () => void wear(),
              busy: model.busy && !model.styling,
              disabled: model.styling,
              testID: "fit-wear",
            }}
            error={model.error}
          />
        ) : undefined
      }
    >
      <View style={styles.content}>
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
        {model.result && !model.showOutfit && model.lostPieces === 0
          ? model.result.problems
              .slice(0, 1)
              .map((problem) => (
                <ProblemBanner
                  key={problem.code}
                  model={model}
                  problem={problem}
                />
              ))
          : null}
        {!model.session || (model.lostPieces > 0 && model.styling) ? (
          <Silk
            kind="placeholder"
            shape="lay"
            label={t("common.loading")}
            style={styles.placeholder}
          />
        ) : model.showOutfit ? (
          <>
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
            <PieceStrip key={openId ?? "closed"} model={model} />
            <Animated.View
              key={model.revision}
              entering={enter(reduce)}
              layout={reflow(reduce)}
              style={styles.copy}
            >
              <Text
                role="display"
                style={styles.name}
                accessibilityRole="header"
                testID="fit-name"
              >
                {model.name}
              </Text>
              {weatherLine ? (
                <Text role="subhead" tone="plum" testID="fit-weather">
                  {weatherLine}
                </Text>
              ) : null}
              {model.reasonLine ? (
                <Text role="body" tone="muted" testID="fit-why">
                  {model.reasonLine}
                </Text>
              ) : null}
            </Animated.View>
            <DressyMeter model={model} />
            <WeatherTip model={model} />
            <Animated.View layout={reflow(reduce)} style={styles.actions}>
              <View style={styles.action}>
                <Button
                  label={t("today.another")}
                  variant="secondary"
                  icon="arrow.triangle.2.circlepath"
                  disabled={model.only || model.busy}
                  busy={model.styling}
                  onPress={() => void model.another()}
                  testID="fit-another"
                />
              </View>
              <View style={styles.action}>
                <Button
                  label={t("fit.editAnswers")}
                  variant="quiet"
                  disabled={model.busy}
                  onPress={editAnswers}
                  testID="fit-edit"
                />
              </View>
            </Animated.View>
            {model.only || model.last ? (
              <Text role="footnote" tone="muted" style={styles.center}>
                {model.only
                  ? t("today.onlyCombination")
                  : t("today.lastCombination")}
              </Text>
            ) : null}
          </>
        ) : null}
      </View>
    </Screen>
  );
}

function FitView({ id, date }: { id: string; date: string }) {
  const model = useToday();
  const { closet } = model;
  const fit = fitsOn(closet, date).find((item) => item.id === id);
  if (!fit)
    return (
      <Screen title={t("fit.title")} testID="fit">
        <View />
      </Screen>
    );
  const pieces = fit.pieceIds.flatMap((pieceId) =>
    closet.pieces.filter((piece) => piece.id === pieceId),
  );
  const name = outfitName(pieces, fit.occasion, locale);
  const meta = [
    t(`occasion.${fit.occasion}`),
    whenLabel(fit.slot),
    degrees(fit.celsius, closet.styling.units),
  ]
    .filter(Boolean)
    .join(" · ");

  const undo = () =>
    void model
      .run((current) =>
        unwearFit(
          fit.wearId ? undoFeedback(current, fit.wearId) : current,
          date,
          fit.id,
        ),
      )
      .then((saved) => saved && home());
  const remove = () =>
    void model
      .run((current) =>
        removeFit(
          fit.wearId ? undoFeedback(current, fit.wearId) : current,
          date,
          fit.id,
        ),
      )
      .then((saved) => saved && home());

  return (
    <Screen
      title={t("fit.title")}
      headerTitleVisible={false}
      testID="fit-view"
      footer={
        <Footer error={model.error}>
          {fit.wornAt ? (
            <ResultBar
              text={t("outfit.worn")}
              action={{
                label: t("common.undo"),
                onPress: undo,
                disabled: model.busy,
                testID: "fit-undo",
              }}
            />
          ) : (
            <Button
              label={t("common.remove")}
              variant="destructive"
              disabled={model.busy}
              onPress={remove}
              testID="fit-remove"
            />
          )}
        </Footer>
      }
    >
      <View style={styles.content}>
        <View style={styles.hero}>
          <FlatLay pieces={pieces} size="hero" maxSize={heroSize} />
        </View>
        <View style={styles.copy}>
          <Text role="display" style={styles.name} accessibilityRole="header">
            {name}
          </Text>
          <Text role="subhead" tone="muted">
            {fit.wornAt ? meta : `${t("fit.planned")} · ${meta}`}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.space.lg },
  hero: { width: "100%", maxWidth: heroSize, alignSelf: "center" },
  placeholder: {
    alignSelf: "center",
    width: "100%",
    maxWidth: heroSize,
    aspectRatio: 1,
  },
  copy: { gap: theme.space.sm },
  name: { fontFamily: theme.fontFamily.serif, fontWeight: "400" },
  actions: { flexDirection: "row", gap: theme.space.sm },
  action: { flex: 1 },
  center: { textAlign: "center" },
});

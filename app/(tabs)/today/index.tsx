import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { router } from "expo-router";
import type { DayFit, Look, Units } from "../../../src/domain/closet";
import { greeting } from "../../../src/domain/greeting";
import { outfitName } from "../../../src/domain/outfitName";
import { ProfileButton } from "../../../src/features/profile/ProfileButton";
import { FirstRun } from "../../../src/features/today/FirstRun";
import {
  degrees,
  lineText,
  skyIcon,
  whenLabel,
} from "../../../src/features/today/sky";
import {
  useHome,
  type Day,
  type HomeModel,
} from "../../../src/features/today/useHome";
import { locale, t } from "../../../src/i18n";
import {
  Banner,
  Button,
  FlatLay,
  Row,
  Rows,
  Screen,
  Section,
  Segmented,
  Symbol,
  Text,
} from "../../../src/ui";
import { fullDate, shortDate } from "../../../src/ui/dates";
import { enter, reflow, useReduceMotion } from "../../../src/ui/motion";
import { theme } from "../../../src/ui/theme";
import { useColors } from "../../../src/ui/useColors";

function piecesOf(model: HomeModel, ids: string[]) {
  return ids.flatMap((id) =>
    model.closet.pieces.filter((piece) => piece.id === id),
  );
}

function Greeting({ model }: { model: HomeModel }) {
  const units = model.closet.styling.units;
  const hello = greeting(model.closet.styling.name, model.hour, locale);
  const sky = model.line ? lineText(model.line, model.day, units) : null;
  const [before, after] = sky ? splitOnce(sky.text, sky.temp) : ["", ""];
  return (
    <View style={styles.greeting}>
      <Text role="eyebrow" tone="muted" testID="home-date">
        {fullDate(model.date, locale)}
      </Text>
      <Text role="title" style={styles.sentence} accessibilityRole="header">
        {`${hello}.`}
        {sky ? (
          <>
            {` ${before}`}
            {after !== null ? (
              <Text role="title" tone="plum" style={styles.sentence}>
                {sky.temp}
              </Text>
            ) : null}
            {after ?? ""}
          </>
        ) : null}
      </Text>
    </View>
  );
}

function splitOnce(text: string, part: string): [string, string | null] {
  const index = text.indexOf(part);
  return index < 0
    ? [text, null]
    : [text.slice(0, index), text.slice(index + part.length)];
}

function Tiles({ model, units }: { model: HomeModel; units: Units }) {
  const colors = useColors();
  if (model.tiles.every((tile) => tile.celsius === null)) return null;
  return (
    <View style={styles.tiles} testID="home-tiles">
      {model.tiles.map((tile) => (
        <View
          key={tile.slot}
          accessible
          accessibilityLabel={`${whenLabel(tile.slot)}, ${degrees(tile.celsius, units)}`}
          style={[
            styles.tile,
            { backgroundColor: colors.surface, borderColor: colors.line },
            tile.past && styles.past,
          ]}
        >
          <Text role="footnote" tone="muted">
            {whenLabel(tile.slot)}
          </Text>
          <View style={styles.tileValue}>
            <Symbol name={skyIcon(tile.sky, tile.slot)} size={15} tone="ink" />
            <Text role="headline" style={styles.tileTemp}>
              {degrees(tile.celsius, units)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function Brief({ day }: { day: Day }) {
  const colors = useColors();
  const [text, setText] = useState("");
  const submit = () => {
    const brief = text.trim();
    if (!brief) return;
    setText("");
    router.push({ pathname: "/today/create", params: { day, text: brief } });
  };
  return (
    <TextInput
      value={text}
      onChangeText={setText}
      onSubmitEditing={submit}
      placeholder={t("home.brief")}
      placeholderTextColor={colors.placeholder}
      accessibilityLabel={t("home.briefLabel")}
      returnKeyType="go"
      style={[styles.brief, { borderColor: colors.line, color: colors.ink }]}
      testID="home-brief"
    />
  );
}

function FitCard({
  model,
  fit,
  units,
  index,
}: {
  model: HomeModel;
  fit: DayFit;
  units: Units;
  index: number;
}) {
  const colors = useColors();
  const reduce = useReduceMotion();
  const pieces = piecesOf(model, fit.pieceIds);
  const name = outfitName(pieces, fit.occasion, locale);
  const meta = t("home.cardMeta", {
    when: whenLabel(fit.slot),
    temp: degrees(fit.celsius, units),
  }).replace(/ · $/, "");
  const press = () =>
    fit.wornAt || model.day === "tomorrow"
      ? model.view(fit)
      : void model.open(fit, fit);
  return (
    <Animated.View entering={enter(reduce)} layout={reflow(reduce)}>
      <Pressable
        onPress={press}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${meta}${fit.wornAt ? `, ${t("home.worn")}` : ""}`}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: pressed ? colors.sunken : colors.surface,
            borderColor: colors.line,
          },
        ]}
        testID={`home-fit-${index}`}
      >
        <View style={styles.cardLay}>
          <FlatLay pieces={pieces} size="hero" maxSize={128} preview />
        </View>
        <View style={styles.cardText}>
          <Text role="subhead" numberOfLines={1} style={styles.cardName}>
            {t(`occasion.${fit.occasion}`)}
          </Text>
          <Text role="footnote" tone="muted" numberOfLines={1}>
            {meta}
          </Text>
        </View>
        {fit.wornAt ? (
          <View style={[styles.badge, { backgroundColor: colors.plumSoft }]}>
            <Text role="mark" tone="plum">
              {t("home.worn")}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function LookCard({ model, look }: { model: HomeModel; look: Look }) {
  const colors = useColors();
  const pieces = piecesOf(model, look.pieceIds);
  return (
    <Pressable
      onPress={() =>
        model.day === "tomorrow"
          ? router.push({ pathname: "/look/[id]", params: { id: look.id } })
          : void model.open(look)
      }
      accessibilityRole="button"
      accessibilityLabel={look.name}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? colors.sunken : colors.surface,
          borderColor: colors.line,
        },
      ]}
    >
      <View style={styles.cardLay}>
        <FlatLay pieces={pieces} size="hero" maxSize={128} preview />
      </View>
      <View style={styles.cardText}>
        <Text role="subhead" numberOfLines={1} style={styles.cardName}>
          {look.name}
        </Text>
        {look.occasion ? (
          <Text role="footnote" tone="muted" numberOfLines={1}>
            {t(`occasion.${look.occasion}`)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function AnotherCard({ day }: { day: Day }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/today/create", params: { day } })
      }
      accessibilityRole="button"
      accessibilityLabel={t("home.anotherFit")}
      style={({ pressed }) => [
        styles.card,
        styles.another,
        {
          borderColor: colors.plumSoftDeep,
          backgroundColor: pressed ? colors.plumSoft : colors.canvas,
        },
      ]}
      testID="home-another"
    >
      <View style={[styles.plus, { backgroundColor: colors.plumSoft }]}>
        <Symbol name="plus" size={18} tone="plum" />
      </View>
      <Text role="subhead" tone="plum" style={styles.cardName}>
        {t("home.anotherFit")}
      </Text>
    </Pressable>
  );
}

function DayLane({ model, units }: { model: HomeModel; units: Units }) {
  if (!model.fits.length && !model.looks.length) return null;
  return (
    <Section
      title={model.day === "tomorrow" ? t("day.tomorrow") : t("home.yourDay")}
      testID="home-day"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.lane}
        style={styles.laneBleed}
      >
        {model.fits.map((fit, index) => (
          <FitCard
            key={fit.id}
            model={model}
            fit={fit}
            units={units}
            index={index}
          />
        ))}
        {model.looks.map((look) => (
          <LookCard key={look.id} model={model} look={look} />
        ))}
        <AnotherCard day={model.day} />
      </ScrollView>
    </Section>
  );
}

function Earlier({ model }: { model: HomeModel }) {
  if (model.fits.length || model.looks.length || !model.earlier.length)
    return null;
  if (model.day === "tomorrow") return null;
  return (
    <Section title={t("home.earlier")} testID="home-earlier">
      <Rows>
        {model.earlier.map((item, index) => {
          const pieces = piecesOf(model, item.pieceIds);
          return (
            <Row
              key={item.key}
              title={outfitName(pieces, item.occasion, locale)}
              meta={t("home.earlierMeta", {
                day: shortDate(item.date, locale),
                occasion: t(`occasion.${item.occasion}`),
              })}
              leading={{ lay: pieces }}
              trailing="chevron"
              onPress={() => void model.open(item)}
              last={index === model.earlier.length - 1}
              testID={`home-earlier-${index}`}
            />
          );
        })}
      </Rows>
    </Section>
  );
}

export default function TodayScreen() {
  const model = useHome();
  const { closet } = model;
  const units = closet.styling.units;
  const header = <ProfileButton testID="header-profile" />;

  if (!closet.styling.everyday)
    return (
      <Screen
        large
        title={greeting(closet.styling.name, model.hour, locale)}
        actions={header}
        testID="today"
      >
        <FirstRun model={model} />
      </Screen>
    );

  const tomorrow = model.day === "tomorrow";

  return (
    <Screen
      title={t("nav.today")}
      headerTitleVisible={false}
      actions={header}
      testID="today"
    >
      <View style={styles.content}>
        <Greeting model={model} />
        {model.evening ? (
          <Segmented<Day>
            options={[
              { id: "today", label: t("nav.today") },
              { id: "tomorrow", label: t("day.tomorrow") },
            ]}
            value={model.day}
            onChange={model.setDay}
          />
        ) : null}
        <Tiles model={model} units={units} />
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
        <View style={styles.actions}>
          <View style={styles.create}>
            <Button
              label={tomorrow ? t("home.plan") : t("home.create")}
              icon="arrow.right"
              iconAfter
              busy={model.styling}
              onPress={() =>
                router.push({
                  pathname: "/today/create",
                  params: { day: model.day },
                })
              }
              testID="home-create"
            />
          </View>
          <Button
            label={t("home.pickLook")}
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: "/looks/plan",
                params: { date: model.date },
              })
            }
            testID="home-pick-look"
          />
        </View>
        <Brief day={model.day} />
        <DayLane model={model} units={units} />
        <Earlier model={model} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.space.lg, paddingTop: theme.space.sm },
  greeting: { gap: theme.space.sm },
  sentence: { fontSize: 30, lineHeight: 37 },
  tiles: { flexDirection: "row", gap: theme.space.sm },
  tile: {
    flex: 1,
    gap: theme.space.xs,
    padding: theme.space.md,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  past: { opacity: 0.5 },
  tileValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.xs,
  },
  tileTemp: {
    fontFamily: theme.fontFamily.serif,
    fontWeight: "400",
    fontSize: 20,
  },
  actions: { gap: theme.space.sm },
  create: { alignSelf: "stretch" },
  brief: {
    minHeight: theme.size.touch + 4,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    paddingHorizontal: theme.space.lg,
    fontSize: 17,
  },
  lane: { gap: theme.space.md, paddingHorizontal: theme.space.lg },
  laneBleed: { marginHorizontal: -theme.space.lg },
  card: {
    width: 152,
    padding: theme.space.md,
    gap: theme.space.sm,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardLay: { width: 128, height: 128, alignSelf: "center" },
  cardText: { gap: 2 },
  cardName: { fontWeight: "600" },
  badge: {
    position: "absolute",
    top: theme.space.sm,
    right: theme.space.sm,
    paddingHorizontal: theme.space.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  another: {
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
    borderWidth: 1.5,
    minHeight: 200,
  },
  plus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

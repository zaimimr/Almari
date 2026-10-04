import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { locale, t } from "../../src/i18n";
import {
  Banner,
  Button,
  Chip,
  Expander,
  Field,
  FlatLay,
  Footer,
  HeaderItem,
  MonthGrid,
  ResultBar,
  Row,
  Screen,
  Section,
  Text,
} from "../../src/ui";
import { spokenDate, monthTitle } from "../../src/ui/dates";
import { theme } from "../../src/ui/theme";
import { useLook } from "../../src/features/looks/useLook";
import {
  lastWornText,
  occasionText,
  plannedText,
  todayDate,
  tomorrowDate,
} from "../../src/features/looks/format";

function shiftMonth(month: string, delta: number): string {
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + delta);
  return date.toISOString().slice(0, 7);
}

export default function LookDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    closet,
    look,
    entry,
    pieces,
    body,
    setBody,
    worn,
    setWorn,
    error,
    rename,
    markWorn,
    undoWorn,
    plan,
    save,
    showOnToday,
    remove,
  } = useLook(id);
  const [draft, setDraft] = useState<string | null>(null);
  const plannedFor = look?.plannedFor ?? null;
  const [month, setMonth] = useState((plannedFor ?? todayDate()).slice(0, 7));

  if (!entry) return <Screen gone={{ title: t("look.goneTitle") }} />;

  const today = todayDate();
  const planned =
    plannedFor && plannedFor >= today ? plannedText(plannedFor) : null;
  const meta = [
    occasionText(entry.occasion),
    planned ?? (entry.lastWorn ? lastWornText(closet, entry.lastWorn) : null),
  ]
    .filter(Boolean)
    .join(" · ");
  const missing = entry.missing;

  const commit = () => {
    if (draft === null) return;
    rename(draft);
    setDraft(null);
  };

  const startRename = () => {
    if (draft !== null) return commit();
    setBody(null);
    setWorn(null);
    setDraft(entry.name);
  };

  const before = (action: () => void) => () => {
    commit();
    if (worn) setWorn(null);
    action();
  };

  const toggle = (next: "worn" | "plan") => {
    commit();
    setWorn(null);
    if (next === "plan") setMonth((plannedFor ?? today).slice(0, 7));
    setBody(body === next ? null : next);
  };

  return (
    <Screen
      title={entry.name}
      headerTitleVisible={false}
      keyboardFooter="stay"
      actions={
        <HeaderItem
          label={t("look.rename")}
          onPress={startRename}
          testID="look-rename"
        />
      }
      footer={
        <Footer
          error={error}
          primary={
            look
              ? {
                  label: t("looks.showOnToday"),
                  onPress: before(() => void showOnToday()),
                  testID: "look-show",
                }
              : {
                  label: t("common.saveLook"),
                  onPress: before(() => void save()),
                  testID: "look-save",
                }
          }
        />
      }
    >
      <FlatLay
        pieces={pieces}
        size="hero"
        onPiecePress={(piece) => router.push(`/piece/${piece.id}`)}
      />
      <View style={styles.head}>
        {draft !== null ? (
          <Field
            label={t("look.name")}
            hideLabel
            kind="rename"
            value={draft}
            onChangeText={setDraft}
            autoFocus
            multiline
            submitBehavior="blurAndSubmit"
            returnKeyType="done"
            onSubmitEditing={commit}
            onBlur={commit}
            testID="look-name"
          />
        ) : (
          <Text role="title" accessibilityRole="header">
            {entry.name}
          </Text>
        )}
        {meta ? (
          <Text
            role="subhead"
            tone="muted"
            accessibilityLabel={[
              occasionText(entry.occasion),
              planned && plannedFor
                ? t("looks.planned", { date: spokenDate(plannedFor, locale) })
                : (planned ??
                  (entry.lastWorn
                    ? lastWornText(closet, entry.lastWorn)
                    : null)),
            ]
              .filter(Boolean)
              .join(", ")}
          >
            {meta}
          </Text>
        ) : null}
      </View>
      {missing ? (
        <Banner
          tone="notice"
          text={
            missing === 1
              ? t("look.missingOne")
              : t("look.missingMany", { count: missing })
          }
        />
      ) : null}
      <Section
        title={
          pieces.length === 1
            ? t("common.pieceCountOne")
            : t("common.pieceCountMany", { count: pieces.length })
        }
        action={
          look
            ? {
                label: t("look.change"),
                onPress: before(() => router.push(`/look/build?id=${look.id}`)),
              }
            : undefined
        }
      >
        {pieces.map((piece, index) => (
          <Row
            key={piece.id}
            title={piece.name}
            leading={{ thumb: piece }}
            trailing="chevron"
            onPress={before(() => router.push(`/piece/${piece.id}`))}
            last={index === pieces.length - 1}
            testID={`look-piece-${piece.id}`}
          />
        ))}
      </Section>
      {look ? (
        <View style={styles.acts}>
          {worn ? (
            <ResultBar
              text={t(worn.yesterday ? "looks.wornYesterday" : "outfit.worn")}
              action={{
                label: t("common.undo"),
                onPress: () => void undoWorn(),
              }}
            />
          ) : (
            <View>
              <View style={styles.start}>
                <Button
                  label={t("look.markWorn")}
                  variant="quiet"
                  icon="checkmark"
                  expanded={body === "worn"}
                  onPress={() => toggle("worn")}
                  testID="look-worn"
                />
              </View>
              <Expander
                id="look-worn"
                headless
                open={body === "worn"}
                onToggle={() => toggle("worn")}
              >
                <View style={styles.chips}>
                  <Chip
                    kind="action"
                    label={t("adjust.today")}
                    accessibilityLabel={t("outfit.worn")}
                    onPress={() => void markWorn(false)}
                    testID="worn-today"
                  />
                  <Chip
                    kind="action"
                    label={t("looks.yesterday")}
                    accessibilityLabel={t("looks.wornYesterday")}
                    onPress={() => void markWorn(true)}
                    testID="worn-yesterday"
                  />
                </View>
              </Expander>
            </View>
          )}
          <View style={styles.start}>
            <Button
              label={t("looks.plan")}
              variant="quiet"
              icon="calendar"
              expanded={body === "plan"}
              onPress={() => toggle("plan")}
              testID="look-plan"
            />
          </View>
          <Expander
            id="look-plan"
            headless
            open={body === "plan"}
            onToggle={() => toggle("plan")}
          >
            <MonthGrid
              mode="pick"
              month={month}
              today={today}
              from={tomorrowDate()}
              selected={plannedFor}
              onSelect={(date) => void plan(date)}
              onMonth={(delta) => setMonth(shiftMonth(month, delta))}
              monthLabel={monthTitle(month, locale)}
              dayLabel={(date) => spokenDate(date, locale)}
            />
            {plannedFor ? (
              <View style={styles.start}>
                <Button
                  label={t("looks.clearPlan")}
                  variant="quiet"
                  onPress={() => void plan(null)}
                  testID="look-clear-plan"
                />
              </View>
            ) : null}
          </Expander>
          <View style={styles.start}>
            <Button
              label={t("look.remove")}
              variant="destructive"
              onPress={before(() => void remove())}
              testID="look-remove"
            />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: theme.space.xs },
  acts: { gap: theme.space.xs, marginLeft: -theme.space.sm },
  start: { alignItems: "flex-start" },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.space.sm,
    paddingLeft: theme.space.sm,
  },
});

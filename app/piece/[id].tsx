import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import {
  awayReasons,
  setAway,
  usedIn,
  type AwayReason,
  type Closet,
} from "../../src/domain/closet";
import {
  confirmFact,
  factChoice,
  pieceFacts,
  type Fact,
  type FactKey,
} from "../../src/domain/facts";
import { setMembers, unlinkPiece } from "../../src/domain/sets";
import { dropFromToday } from "../../src/domain/today";
import { MissingPiece } from "../../src/features/MissingPiece";
import { t } from "../../src/i18n";
import { labelLines } from "../../src/state/careLabel";
import { useCloset } from "../../src/state/closet";
import { canPrepareOnDevice } from "../../src/state/imports";
import {
  AppText,
  Button,
  Chip,
  ErrorMessage,
  FormScreen,
  HeaderAction,
  PiecePhoto,
} from "../../src/ui";
import { theme } from "../../src/ui/theme";

export default function PieceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { closet, update } = useCloset();
  const [open, setOpen] = useState<FactKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const piece = closet.pieces.find((item) => item.id === id);
  if (!piece) return <MissingPiece />;
  const pieceId = piece.id;
  const facts = pieceFacts(piece);
  const choice = open ? factChoice(piece, open) : null;
  const suggested = choice
    ? choice.options.find((option) => option.id === choice.current)
    : undefined;
  const uses = usedIn(closet, pieceId);
  const members = setMembers(closet, piece);

  const change = async (transform: (current: Closet) => Closet) => {
    setBusy(true);
    setError(null);
    try {
      await update(transform);
      return true;
    } catch {
      setError(t("piece.error.save"));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const confirm = (key: FactKey, option: string) => {
    void change((current) => confirmFact(current, pieceId, key, option)).then(
      (saved) => {
        if (saved) setOpen(null);
      },
    );
  };

  const leaveSet = async () => {
    setBusy(true);
    setError(null);
    try {
      await update((latest) => unlinkPiece(latest, pieceId));
    } catch {
      setError(t("sets.removeFailed"));
    } finally {
      setBusy(false);
    }
  };

  const markAway = (reason: AwayReason | null) => {
    void change((current) =>
      reason
        ? dropFromToday(setAway(current, pieceId, reason), pieceId)
        : setAway(current, pieceId, null),
    );
  };

  return (
    <FormScreen>
      <Stack.Screen
        options={{
          title: t("piece.title"),
          headerRight: () => (
            <HeaderAction
              label={t("piece.edit")}
              onPress={() =>
                router.push({
                  pathname: "/piece/edit/[id]",
                  params: { id: pieceId },
                })
              }
            />
          ),
        }}
      />
      <PiecePhoto piece={piece} style={styles.photo} />
      <View style={styles.intro}>
        <AppText variant="heading">{piece.name}</AppText>
        <AppText muted testID="piece-used-in">
          {uses === 0
            ? t("piece.usedIn.none")
            : uses === 1
              ? t("piece.usedIn.one")
              : t("piece.usedIn.other", { count: uses })}
        </AppText>
      </View>
      <View style={styles.section}>
        <AppText style={styles.label}>{t("piece.facts.title")}</AppText>
        {facts.length ? (
          <View style={styles.chips}>
            {facts.map((fact) => (
              <FactChip
                key={fact.key}
                fact={fact}
                editable={factChoice(piece, fact.key) !== null}
                selected={open === fact.key}
                disabled={busy}
                onPress={() => setOpen(open === fact.key ? null : fact.key)}
              />
            ))}
          </View>
        ) : (
          <AppText variant="caption" muted>
            {t("piece.facts.none")}
          </AppText>
        )}
        {facts.some((fact) => fact.source === "proposed") ? (
          <AppText variant="caption" muted>
            {t("piece.facts.hint")}
          </AppText>
        ) : null}
        {open && choice ? (
          <View style={styles.question} testID="fact-question">
            <AppText style={styles.label}>{t(choice.label)}</AppText>
            {suggested ? (
              <AppText variant="caption" muted>
                {t("fact.suggested", { value: t(suggested.label) })}
              </AppText>
            ) : null}
            <View style={styles.chips}>
              {choice.options.map((option) => (
                <Chip
                  key={option.id}
                  label={t(option.label)}
                  accessibilityLabel={`${t(choice.label)}: ${t(option.label)}`}
                  selected={option.id === choice.current}
                  disabled={busy}
                  onPress={() => confirm(open, option.id)}
                />
              ))}
            </View>
            <View style={styles.actions}>
              {choice.current ? (
                <View style={styles.action}>
                  <Button
                    label={t("fact.looksRight")}
                    accessibilityLabel={`${t(choice.label)}: ${t("fact.looksRight")}`}
                    compact
                    busy={busy}
                    onPress={() => confirm(open, choice.current!)}
                  />
                </View>
              ) : null}
              <View style={styles.action}>
                <Button
                  label={t("piece.fact.notNow")}
                  secondary
                  compact
                  disabled={busy}
                  onPress={() => setOpen(null)}
                />
              </View>
            </View>
          </View>
        ) : null}
      </View>
      {piece.source === "owned" && canPrepareOnDevice ? (
        <View style={styles.section} testID="piece-care-label">
          <AppText style={styles.label}>{t("careLabel.title")}</AppText>
          {piece.label && labelLines(piece.label).length ? (
            labelLines(piece.label).map((line) => (
              <AppText key={line}>{line}</AppText>
            ))
          ) : (
            <AppText variant="caption" muted>
              {piece.label
                ? t("careLabel.pieceEmpty")
                : t("careLabel.pieceHint")}
            </AppText>
          )}
          <Button
            label={piece.label ? t("careLabel.viewOrEdit") : t("careLabel.add")}
            secondary
            compact
            disabled={busy}
            onPress={() =>
              router.push({
                pathname: "/label/[id]",
                params: { id: pieceId, target: "piece" },
              })
            }
          />
        </View>
      ) : null}
      {members.length ? (
        <View style={styles.section} testID="piece-set">
          <AppText style={styles.label}>{t("sets.partOf")}</AppText>
          <AppText>{members.map((item) => item.name).join(", ")}</AppText>
          <Button
            label={t("sets.remove")}
            secondary
            compact
            disabled={busy}
            onPress={() => {
              void leaveSet();
            }}
          />
        </View>
      ) : null}
      <View style={styles.section} testID="piece-availability">
        <AppText style={styles.label}>{t("piece.away.title")}</AppText>
        <AppText variant="caption" muted>
          {piece.away
            ? t("piece.away.status", {
                reason: t(`piece.away.${piece.away}`),
              })
            : t("piece.away.hint")}
        </AppText>
        <View style={styles.chips}>
          {awayReasons.map((reason) => (
            <Chip
              key={reason}
              label={t(`piece.away.${reason}`)}
              selected={piece.away === reason}
              disabled={busy}
              onPress={() => markAway(piece.away === reason ? null : reason)}
            />
          ))}
        </View>
        {piece.away ? (
          <Button
            label={t("piece.away.back")}
            secondary
            busy={busy}
            onPress={() => markAway(null)}
          />
        ) : null}
      </View>
      <ErrorMessage message={error} />
    </FormScreen>
  );
}

function FactChip({
  fact,
  editable,
  selected,
  disabled,
  onPress,
}: {
  fact: Fact;
  editable: boolean;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const guess = fact.source === "proposed";
  const label = t(fact.label);
  const value = t(fact.value);
  const content = (
    <AppText variant="caption">
      <AppText variant="caption" muted>
        {`${label} `}
      </AppText>
      {guess ? `${value} ?` : value}
    </AppText>
  );
  const vars = { label, value };
  if (!guess || !editable)
    return (
      <View
        testID={`fact-${fact.key}`}
        accessible
        accessibilityLabel={t(
          guess ? "piece.fact.guessFixed" : "piece.fact.known",
          vars,
        )}
        style={[styles.fact, guess && styles.guess]}
      >
        {content}
      </View>
    );
  return (
    <Pressable
      testID={`fact-${fact.key}`}
      accessibilityRole="button"
      accessibilityLabel={t("piece.fact.guess", vars)}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fact,
        styles.guess,
        selected && styles.guessOpen,
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  photo: {
    height: 280,
    borderRadius: theme.radius,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: theme.colors.surface,
  },
  intro: { gap: theme.space.xs },
  section: { gap: theme.space.md },
  label: { fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
  fact: {
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.sm,
  },
  guess: {
    borderStyle: "dashed",
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.background,
  },
  guessOpen: { backgroundColor: theme.colors.accentSoft },
  pressed: { opacity: 0.7 },
  question: {
    gap: theme.space.md,
    padding: theme.space.lg,
    borderRadius: theme.radius,
    borderCurve: "continuous",
    backgroundColor: theme.colors.accentSoft,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.md },
  action: { flexGrow: 1, minWidth: 130 },
});

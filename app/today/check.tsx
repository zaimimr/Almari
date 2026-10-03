import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import {
  coverageQuestion,
  lengthChoices,
  questionText,
  seeThroughChoices,
  seeThroughConfirmation,
  sleeveChoices,
} from "../../src/domain/coverage";
import { activeSession, applyRequest } from "../../src/domain/today";
import { confirmPiece, type Confirmation } from "../../src/domain/wardrobe";
import { t } from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import {
  AppText,
  Button,
  ChoiceGroup,
  ErrorMessage,
  FormScreen,
  HeaderAction,
  Message,
  PiecePhoto,
  Screen,
} from "../../src/ui/legacy";
import { theme } from "../../src/ui/theme";

export default function CheckPiece() {
  const { id, ask } = useLocalSearchParams<{ id: string; ask: string }>();
  const { closet, update } = useCloset();
  const piece = closet.pieces.find((item) => item.id === id);
  const today = closet.styling.today;
  const session = today ? activeSession(today) : null;
  const [question] = useState(() =>
    piece && (ask === "sleeve" || ask === "length")
      ? coverageQuestion(piece, ask)
      : null,
  );
  const [choice, setChoice] = useState<string | null>(() =>
    question && question.kind !== "see-through" ? question.proposed : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!piece || !question)
    return (
      <Screen centered>
        <Message
          title={t("check.nothingTitle")}
          description={t("check.nothingBody")}
          action={
            <Button label={t("common.goBack")} onPress={() => router.back()} />
          }
        />
      </Screen>
    );

  const choices: readonly { id: string; label: string }[] =
    question.kind === "see-through"
      ? seeThroughChoices(question)
      : question.kind === "sleeve"
        ? sleeveChoices
        : lengthChoices;

  function confirmation(): Confirmation | null {
    if (!choice || !question) return null;
    if (question.kind === "see-through") {
      const found = seeThroughChoices(question).find(
        (option) => option.id === choice,
      );
      return found ? seeThroughConfirmation(found.answer) : null;
    }
    if (question.kind === "sleeve") {
      const sleeve = sleeveChoices.find((option) => option.id === choice)?.id;
      return sleeve ? { attributes: { sleeve } } : null;
    }
    const length = lengthChoices.find((option) => option.id === choice)?.id;
    return length ? { attributes: { length } } : null;
  }

  async function commit(
    transform: Parameters<typeof update>[0],
    failure: string,
  ) {
    setBusy(true);
    setError(null);
    try {
      await update(transform);
      router.back();
    } catch {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }

  const change = confirmation();
  const suggested = question.kind !== "see-through" && question.proposed;

  return (
    <FormScreen>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <HeaderAction
              label={t("check.notNow")}
              onPress={() => router.back()}
            />
          ),
        }}
      />
      <View style={styles.photo}>
        <PiecePhoto piece={piece} />
      </View>
      <AppText variant="title" testID="check-question">
        {questionText(piece, question)}
      </AppText>
      <AppText muted>
        {question.kind === "see-through"
          ? t("check.whySeeThrough")
          : suggested
            ? t("check.suggested")
            : t("check.kept")}
      </AppText>
      <ChoiceGroup
        label={t("check.answer")}
        options={choices}
        value={choice}
        disabled={busy}
        onChange={setChoice}
      />
      <ErrorMessage message={error} />
      <Button
        label={t("check.save")}
        busy={busy}
        disabled={!change}
        onPress={() => {
          if (change)
            void commit(
              (current) => confirmPiece(current, piece.id, change),
              t("check.saveError"),
            );
        }}
      />
      {session?.pieceIds.includes(piece.id) ? (
        <Button
          label={t("check.useAnother")}
          secondary
          disabled={busy}
          onPress={() => {
            void commit(
              (current) =>
                applyRequest(
                  current,
                  {
                    ...session.request,
                    keptIds: session.request.keptIds.filter(
                      (keptId) => keptId !== piece.id,
                    ),
                    excludedIds: [...session.request.excludedIds, piece.id],
                  },
                  session.revision,
                ),
              t("common.restyleError"),
            );
          }}
        />
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  photo: {
    height: 240,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    overflow: "hidden",
  },
});

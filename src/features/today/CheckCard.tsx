import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import {
  coverageQuestion,
  lengthChoices,
  questionText,
  seeThroughChoices,
  seeThroughConfirmation,
  sleeveChoices,
} from "../../domain/coverage";
import type { Closet, Piece } from "../../domain/closet";
import { confirmPiece, type Confirmation } from "../../domain/wardrobe";
import { t } from "../../i18n";
import { ChipRow, Expander, Row, Rows, Text } from "../../ui";
import { theme } from "../../ui/theme";

export function CheckCard({
  piece,
  ask,
  busy,
  onSave,
  onUseAnother,
}: {
  piece: Piece;
  ask: "sleeve" | "length";
  busy: boolean;
  onSave: (transform: (closet: Closet) => Closet) => void;
  onUseAnother: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [question] = useState(() => coverageQuestion(piece, ask));
  const [choice, setChoice] = useState<string | null>(() =>
    question && question.kind !== "see-through" ? question.proposed : null,
  );
  if (!question) return null;

  const choices: readonly { id: string; label: string }[] =
    question.kind === "see-through"
      ? seeThroughChoices(question)
      : question.kind === "sleeve"
        ? sleeveChoices
        : lengthChoices;

  const confirmation = (): Confirmation | null => {
    if (!choice) return null;
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
  };
  const change = confirmation();

  return (
    <Expander
      id={`check-${piece.id}`}
      title={t("today.check.title", { name: piece.name })}
      open={open}
      onToggle={() => setOpen((value) => !value)}
      tone="attention"
      actions={[
        {
          label: t("check.save"),
          variant: "secondary",
          busy,
          disabled: !change,
          onPress: () => {
            if (change)
              onSave((closet) => confirmPiece(closet, piece.id, change));
          },
        },
        {
          label: t("check.useAnother"),
          variant: "quiet",
          disabled: busy,
          onPress: onUseAnother,
        },
      ]}
      testID="today-check"
    >
      <View style={styles.body}>
        <Text role="body">{questionText(piece, question)}</Text>
        <ChipRow
          options={choices.map(({ id, label }) => ({ id, label }))}
          value={choice}
          onChange={(next) => {
            if (typeof next === "string") setChoice(next);
          }}
          inSurface
        />
        <Rows>
          <Row
            title={piece.name}
            leading={{ thumb: piece }}
            trailing="chevron"
            accessibilityLabel={t("today.openPiece", { name: piece.name })}
            onPress={() =>
              router.push({ pathname: "/piece/[id]", params: { id: piece.id } })
            }
            last
          />
        </Rows>
      </View>
    </Expander>
  );
}

const styles = StyleSheet.create({
  body: { gap: theme.space.md },
});

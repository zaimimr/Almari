import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import {
  categoryOf,
  fixedStyles,
  type Category,
  type GarmentKind,
  type QuickCheck,
  type Style,
  type Variant,
} from "../../src/domain/closet";
import {
  optionsFor,
  type AttributeKey,
  type AttributeValue,
} from "../../src/domain/attributes";
import {
  correctImport,
  dismissAdvice,
  keepDuplicate,
  nameFor,
  removeImport,
} from "../../src/domain/importing";
import { attributeLabelKey, attributeValueKey } from "../../src/domain/facts";
import { adviceFor } from "../../src/domain/quality";
import { rankCategories, rankKinds } from "../../src/domain/recognition";
import {
  categoryName,
  kindName,
  styleName,
  stylesName,
  t,
  type Key,
} from "../../src/i18n";
import { labelLines } from "../../src/state/careLabel";
import { useCloset } from "../../src/state/closet";
import { changeImports } from "../../src/state/imports";
import { PhotoChoice } from "../../src/features/PhotoChoice";
import {
  problemMessages,
  useRetake,
  type CaptureProblem,
} from "../../src/features/Retake";
import {
  AppText,
  Button,
  Chip,
  ChoiceGroup,
  ErrorMessage,
  Field,
  FormScreen,
  HeaderAction,
  Message,
  Notice,
  Screen,
} from "../../src/ui";

const attributeQuestions: Partial<Record<AttributeKey, Key>> = {
  length: "question.length",
  sleeve: "question.sleeve",
};

type StyleChoice = Style | "both";

const styleChoices = (): { id: StyleChoice; label: string }[] => [
  { id: "desi", label: styleName("desi") },
  { id: "western", label: styleName("western") },
  { id: "both", label: t("piece.styleBoth") },
];

function choiceOf(styles: Style[] | undefined): StyleChoice | null {
  if (!styles?.length) return null;
  return styles.length > 1 ? "both" : styles[0]!;
}

function stylesOf(choice: StyleChoice): Style[] {
  return choice === "both" ? ["western", "desi"] : [choice];
}

function questionText(
  question: QuickCheck,
  categories: Category[],
  kinds: GarmentKind[],
) {
  if (question === "category")
    return t("capture.askCategory", {
      first: categoryName(categories[0]!),
      second: categoryName(categories[1]!),
    });
  if (question === "subcategory" && kinds.length > 1)
    return t("capture.askKind", {
      first: kindName(kinds[0]!).toLowerCase(),
      second: kindName(kinds[1]!).toLowerCase(),
    });
  if (question === "style") return t("capture.askStyle");
  return null;
}

export default function CheckPiece() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { closet, update } = useCloset();
  const job = closet.imports.find((item) => item.id === id);
  const [name, setName] = useState(job?.name ?? "");
  const [kind, setKind] = useState<GarmentKind | undefined>(job?.kind);
  const [chosenStyles, setChosenStyles] = useState<Style[] | undefined>(
    job?.styles ?? (job?.kind ? fixedStyles(job.kind) : undefined),
  );
  const [keepOriginal, setKeepOriginal] = useState(
    Boolean(job?.keepOriginal || !job?.prepared?.cutout),
  );
  const [showAll, setShowAll] = useState(false);
  const [variant, setVariant] = useState<Variant>(job?.variant ?? "enhanced");
  const [problem, setProblem] = useState<CaptureProblem | null>(null);
  const retake = useRetake();
  const [step, setStep] = useState<"piece" | "label">("piece");
  const [answer, setAnswer] = useState<AttributeValue | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!job?.prepared || !job.kind || !kind)
    return (
      <Screen centered>
        <Message
          title={t("capture.gone.title")}
          description={t("capture.gone.description")}
          action={
            <Button label={t("common.goBack")} onPress={() => router.back()} />
          }
        />
      </Screen>
    );

  if (step === "label")
    return (
      <FormScreen>
        <Stack.Screen
          options={{
            headerLeft: () => (
              <HeaderAction
                label={t("careLabel.done")}
                onPress={() => router.back()}
              />
            ),
          }}
        />
        <AppText variant="heading">{t("careLabel.offerTitle")}</AppText>
        <AppText>{t("careLabel.offerBody")}</AppText>
        {job.label
          ? labelLines(job.label).map((line) => (
              <AppText key={line} muted>
                {line}
              </AppText>
            ))
          : null}
        <Button
          label={job.label ? t("careLabel.change") : t("careLabel.add")}
          onPress={() =>
            router.push({
              pathname: "/label/[id]",
              params: { id: job.id, target: "import" },
            })
          }
        />
        <Button
          label={job.label ? t("careLabel.done") : t("careLabel.skip")}
          secondary
          onPress={() => router.back()}
        />
      </FormScreen>
    );

  const prepared = job.prepared;
  const checks = job.checks ?? [];
  const attributeAsked = job.attributeCheck;
  const attributeSuggested = attributeAsked
    ? job.attributes?.[attributeAsked]
    : undefined;
  const attributeQuestion = attributeAsked
    ? attributeQuestions[attributeAsked]
    : undefined;
  const question = checks.includes("uncertain")
    ? (job.question ?? "subcategory")
    : null;
  const category = categoryOf(kind);
  const rankedCategories = rankCategories(prepared.labels);
  const shownCategories = showAll
    ? rankedCategories
    : [...new Set([category, ...rankedCategories.slice(0, 3)])];
  const kindChoices = rankKinds(prepared.labels, category);
  const fixed = fixedStyles(kind);
  const asked = question
    ? questionText(
        question,
        rankedCategories,
        rankKinds(prepared.labels, categoryOf(job.kind)),
      )
    : null;

  function chooseKind(next: GarmentKind) {
    if (name === nameFor(kind!, prepared.palette))
      setName(nameFor(next, prepared.palette));
    setKind(next);
    const nextFixed = fixedStyles(next);
    if (nextFixed) setChosenStyles(nextFixed);
    else if (fixed) setChosenStyles(undefined);
  }

  function chooseCategory(next: Category) {
    if (next !== category) chooseKind(rankKinds(prepared.labels, next)[0]!);
  }

  async function save() {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await update((current) =>
        correctImport(current, job!.id, {
          kind,
          styles: fixed ? undefined : chosenStyles,
          name: name.trim(),
          keepOriginal,
          variant,
          ...(attributeAsked && answer !== undefined
            ? { attribute: { key: attributeAsked, value: answer } }
            : {}),
        }),
      );
      setStep("label");
    } catch {
      setError(t("capture.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await changeImports(update, (current) => removeImport(current, job!.id));
      router.back();
    } catch {
      setError(t("capture.removeFailed"));
      setBusy(false);
    }
  }

  async function retakeFrom(from: "camera" | "library") {
    if (busy) return;
    setBusy(true);
    setProblem(null);
    setError(null);
    const result = await retake(job!, from);
    setBusy(false);
    if (result === "done") router.back();
    else if (result !== "cancelled") setProblem(result);
  }

  async function keepAsIs() {
    if (busy) return;
    setBusy(true);
    try {
      await update((current) => dismissAdvice(current, job!.id));
    } catch {
      setError(t("capture.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function differentPiece() {
    if (busy) return;
    setBusy(true);
    try {
      await update((current) => keepDuplicate(current, job!.id));
    } catch {
      setError(t("capture.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  const duplicateName = job.duplicateOf
    ? (closet.pieces.find((item) => item.id === job.duplicateOf)?.name ??
      closet.imports.find((item) => item.id === job.duplicateOf)?.name ??
      null)
    : null;
  const advice = job.advice ? adviceFor(job.advice) : null;

  return (
    <FormScreen>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <HeaderAction
              label={t("common.back")}
              onPress={() => router.back()}
            />
          ),
        }}
      />
      <PhotoChoice
        prepared={prepared}
        keepOriginal={keepOriginal}
        variant={variant}
        onChange={(choice) => {
          setKeepOriginal(choice.keepOriginal);
          setVariant(choice.variant);
        }}
      />
      {job.duplicateOf ? (
        <Notice
          title={t("duplicate.title")}
          message={
            duplicateName
              ? t("duplicate.named", { name: duplicateName })
              : t("duplicate.unnamed")
          }
          actions={[
            { label: t("duplicate.same"), onPress: () => void remove() },
            {
              label: t("duplicate.different"),
              onPress: () => void differentPiece(),
            },
          ]}
        />
      ) : null}
      {advice ? (
        <Notice
          title={t(advice.title)}
          message={t(advice.body)}
          actions={[
            {
              label: t("capture.retake"),
              onPress: () => void retakeFrom("camera"),
            },
            { label: t("advice.useAnyway"), onPress: () => void keepAsIs() },
          ]}
        />
      ) : null}
      {checks.includes("no-cutout") ? (
        <AppText>{t("capture.noCutout")}</AppText>
      ) : null}
      {checks.includes("several") ? (
        <AppText>{t("capture.several")}</AppText>
      ) : null}
      {checks.includes("partial") ? (
        <View style={styles.section}>
          <AppText style={styles.label}>{t("capture.partial")}</AppText>
          <AppText>{t("capture.partialCheck")}</AppText>
        </View>
      ) : null}
      <View style={styles.section}>
        <AppText style={styles.label}>
          {question === "category" && asked ? asked : t("piece.category")}
        </AppText>
        <View style={styles.chips}>
          {shownCategories.map((option) => (
            <Chip
              key={option}
              label={categoryName(option)}
              selected={category === option}
              onPress={() => chooseCategory(option)}
            />
          ))}
          {!showAll ? (
            <Chip
              label={t("capture.somethingElse")}
              onPress={() => setShowAll(true)}
            />
          ) : null}
        </View>
      </View>
      <View style={styles.section}>
        <AppText style={styles.label}>
          {question === "subcategory" && asked ? asked : t("piece.kind")}
        </AppText>
        <View style={styles.chips}>
          {kindChoices.map((option) => (
            <Chip
              key={option}
              label={kindName(option)}
              selected={kind === option}
              onPress={() => chooseKind(option)}
            />
          ))}
        </View>
      </View>
      {fixed ? (
        <View style={styles.section}>
          <AppText style={styles.label}>{t("piece.style")}</AppText>
          <AppText muted>
            {t("piece.styleFixed", { styles: stylesName(fixed) })}
          </AppText>
        </View>
      ) : (
        <ChoiceGroup
          label={question === "style" && asked ? asked : t("piece.style")}
          options={styleChoices()}
          value={choiceOf(chosenStyles)}
          onChange={(choice) => setChosenStyles(stylesOf(choice))}
        />
      )}
      {attributeAsked ? (
        <View style={styles.section}>
          <AppText style={styles.label}>
            {t(attributeQuestion ?? attributeLabelKey(attributeAsked))}
          </AppText>
          <View style={styles.chips}>
            {optionsFor(attributeAsked).map((option) => (
              <Chip
                key={String(option.id)}
                label={t(attributeValueKey(attributeAsked, option.id))}
                selected={answer === option.id}
                onPress={() => setAnswer(option.id)}
              />
            ))}
          </View>
          {attributeSuggested !== undefined ? (
            <AppText variant="caption" muted>
              {t("fact.suggested", {
                value: t(attributeValueKey(attributeAsked, attributeSuggested)),
              })}
            </AppText>
          ) : null}
        </View>
      ) : null}
      <Field
        label={t("piece.name")}
        testID="check-name"
        value={name}
        onChangeText={setName}
        maxLength={80}
        returnKeyType="done"
      />
      <ErrorMessage message={error} />
      <Button
        label={t("capture.looksRight")}
        busy={busy}
        disabled={!name.trim()}
        onPress={() => {
          void save();
        }}
      />
      {problem ? (
        <Notice
          message={t(problemMessages[problem])}
          actions={
            problem === "camera-off"
              ? [
                  {
                    label: t("problem.chooseInstead"),
                    onPress: () => void retakeFrom("library"),
                  },
                  {
                    label: t("problem.openSettings"),
                    onPress: () => void Linking.openSettings(),
                  },
                ]
              : [
                  {
                    label: t("problem.tryAgain"),
                    onPress: () => void retakeFrom("library"),
                  },
                ]
          }
        />
      ) : null}
      <Button
        label={t("capture.retake")}
        secondary
        disabled={busy}
        onPress={() => {
          void retakeFrom("camera");
        }}
      />
      <Button
        label={t("capture.remove")}
        danger
        disabled={busy}
        onPress={() => {
          void remove();
        }}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  label: { fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});

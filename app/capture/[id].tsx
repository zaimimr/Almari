import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import {
  categoryOf,
  fixedStyles,
  type Category,
  type GarmentKind,
  type QuickCheck,
  type Style,
} from "../../src/domain/closet";
import {
  correctImport,
  nameFor,
  removeImport,
} from "../../src/domain/importing";
import { rankCategories, rankKinds } from "../../src/domain/recognition";
import {
  categoryName,
  kindName,
  styleName,
  stylesName,
  t,
} from "../../src/i18n";
import { useCloset } from "../../src/state/closet";
import { discardImportFiles } from "../../src/state/imports";
import { photoUri } from "../../src/storage/local";
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
  Screen,
} from "../../src/ui";
import { theme } from "../../src/ui/theme";

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

  const prepared = job.prepared;
  const checks = job.checks ?? [];
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
        }),
      );
      router.back();
    } catch {
      setError(t("capture.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await update((current) => removeImport(current, job!.id));
      discardImportFiles(job!);
      router.back();
    } catch {
      setError(t("capture.removeFailed"));
      setBusy(false);
    }
  }

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
      <View style={styles.compare}>
        {prepared.cutout ? (
          <View style={styles.half}>
            <View style={[styles.photo, !keepOriginal && styles.photoSelected]}>
              <Image
                source={{ uri: photoUri(prepared.cutout) }}
                style={styles.image}
                contentFit="contain"
                accessibilityLabel={t("capture.preparedImage")}
              />
            </View>
            <Chip
              label={t("capture.usePrepared")}
              selected={!keepOriginal}
              onPress={() => setKeepOriginal(false)}
            />
          </View>
        ) : null}
        <View style={styles.half}>
          <View style={[styles.photo, keepOriginal && styles.photoSelected]}>
            <Image
              source={{ uri: photoUri(prepared.original) }}
              style={styles.image}
              contentFit="contain"
              accessibilityLabel={t("capture.originalPhoto")}
            />
          </View>
          <Chip
            label={t("capture.keepOriginal")}
            selected={keepOriginal}
            onPress={() => setKeepOriginal(true)}
          />
        </View>
      </View>
      {checks.includes("no-cutout") ? (
        <AppText>{t("capture.noCutout")}</AppText>
      ) : null}
      {checks.includes("several") ? (
        <AppText>{t("capture.several")}</AppText>
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
      <Field
        label={t("piece.name")}
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
  compare: { flexDirection: "row", gap: 12 },
  half: { flex: 1, gap: 8, alignItems: "center" },
  photo: {
    width: "100%",
    aspectRatio: 0.8,
    borderRadius: theme.radius,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: theme.colors.line,
    overflow: "hidden",
    padding: 6,
    backgroundColor: theme.colors.background,
  },
  photoSelected: {
    borderColor: theme.colors.accent,
    borderWidth: 2,
    padding: 5,
  },
  image: { width: "100%", height: "100%" },
  section: { gap: 12 },
  label: { fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});

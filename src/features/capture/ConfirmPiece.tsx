import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import {
  categoryOf,
  fixedStyles,
  type Category,
  type GarmentKind,
  type ImportJob,
  type QuickCheck,
  type Style,
  type Variant,
} from "../../domain/closet";
import {
  optionsFor,
  type AttributeKey,
  type AttributeValue,
} from "../../domain/attributes";
import {
  correctImport,
  importStudioSource,
  keepDuplicate,
  nameFor,
  setImportStudio,
} from "../../domain/importing";
import { importCutout } from "../../domain/cutout";
import { attributeLabelKey, attributeValueKey } from "../../domain/facts";
import { rankCategories, rankKinds } from "../../domain/recognition";
import { categoryName, kindName, styleName, t, type Key } from "../../i18n";
import { useDiscardChanges } from "../../navigation/useDiscardChanges";
import { useCloset } from "../../state/closet";
import { canPrepareOnDevice } from "../../state/imports";
import { studioOffered, useStudioMaker } from "../../state/studio";
import { discardPhoto } from "../../storage/local";
import {
  Banner,
  Button,
  ChipRow,
  Field,
  Footer,
  HeaderItem,
  Screen,
  Segmented,
  Text,
  Tile,
} from "../../ui";
import { theme } from "../../ui/theme";
import { ColourChips } from "../ColourChips";
import { useRetake, type CaptureProblem } from "../Retake";
import { jobColour, jobPhoto, jobPiece } from "./jobs";
import { PhotoToolbar, type PhotoView } from "./PhotoToolbar";
import { removeWithUndo } from "./removed";

type StyleChoice = Style | "both";

const attributeQuestions: Partial<Record<AttributeKey, Key>> = {
  length: "question.length",
  sleeve: "question.sleeve",
};

const problemKeys: Record<CaptureProblem, Key> = {
  "camera-off": "common.cameraOff",
  unavailable: "common.photoOpenFailed",
  "low-space": "problem.low-space",
  failed: "problem.failed",
};

const somethingElse = "something-else";
const switchCategory = "switch-category";

export const styleChoices = (): { id: StyleChoice; label: string }[] => [
  { id: "desi", label: styleName("desi") },
  { id: "western", label: styleName("western") },
  { id: "both", label: t("piece.styleBoth") },
];

export function choiceOf(styles: Style[] | undefined): StyleChoice | null {
  if (!styles?.length) return null;
  return styles.length > 1 ? "both" : styles[0]!;
}

export function stylesOf(choice: StyleChoice): Style[] {
  return choice === "both" ? ["western", "desi"] : [choice];
}

function questionText(
  question: QuickCheck,
  categories: Category[],
  kinds: GarmentKind[],
) {
  if (question === "category" && categories.length > 1)
    return t("capture.askCategory", {
      first: categoryName(categories[0]!),
      second: categoryName(categories[1]!),
    });
  if (question === "subcategory" && kinds.length > 1)
    return t("capture.askKind", {
      first: kindName(kinds[0]!),
      second: kindName(kinds[1]!),
    });
  if (question === "style") return t("capture.askStyle");
  return null;
}

function photoChoiceOf(job: ImportJob): PhotoView {
  if (!job.prepared?.cutout || job.keepOriginal) return "original";
  if (job.variant === "studio" && job.prepared.studio) return "studio";
  return "cutout";
}

function photoChange(choice: PhotoView): {
  keepOriginal: boolean;
  variant: Variant;
} {
  if (choice === "original") return { keepOriginal: true, variant: "enhanced" };
  if (choice === "studio") return { keepOriginal: false, variant: "studio" };
  return { keepOriginal: false, variant: "enhanced" };
}

export function ConfirmPiece({
  id,
  run,
  walk = false,
}: {
  id: string;
  run: string[];
  walk?: boolean;
}) {
  const { closet, update } = useCloset();
  const job = closet.imports.find((item) => item.id === id);
  const usable =
    job &&
    (job.state === "failed" ||
      ((job.state === "review" || job.state === "ready") &&
        job.prepared &&
        job.kind));
  if (!job || !usable)
    return (
      <Screen
        title={t("confirm.title")}
        headerTitleVisible
        gone={{ title: t("capture.gone.title") }}
      />
    );
  return <ConfirmForm job={job} run={run} walk={walk} update={update} />;
}

function ConfirmForm({
  job,
  run,
  walk,
  update,
}: {
  job: ImportJob;
  run: string[];
  walk: boolean;
  update: ReturnType<typeof useCloset>["update"];
}) {
  const { closet } = useCloset();
  const prepared = job.prepared;
  const failed = job.state === "failed";
  const [initial] = useState(() => ({
    name: job.name ?? "",
    kind: job.kind,
    styles: job.styles ?? (job.kind ? fixedStyles(job.kind) : undefined),
    photo: photoChoiceOf(job),
    colour: jobColour(job),
    answer: job.attributeCheck
      ? job.attributes?.[job.attributeCheck]
      : undefined,
  }));
  const [name, setName] = useState(initial.name);
  const [kind, setKind] = useState(initial.kind);
  const [chosenStyles, setStyles] = useState(initial.styles);
  const [photo, setPhoto] = useState<PhotoView>(initial.photo);
  const [colour, setColour] = useState(initial.colour);
  const [answer, setAnswer] = useState<AttributeValue | undefined>(
    initial.answer,
  );
  const [showAll, setShowAll] = useState(false);
  const [pickCategory, setPickCategory] = useState(false);
  const [problem, setProblem] = useState<CaptureProblem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const studio = useStudioMaker();
  const retake = useRetake();

  const dirty =
    !failed &&
    (name !== initial.name ||
      kind !== initial.kind ||
      choiceOf(chosenStyles) !== choiceOf(initial.styles) ||
      photo !== initial.photo ||
      colour !== initial.colour ||
      answer !== initial.answer);
  const allowClose = useDiscardChanges(dirty, busy || studio.making);

  function leave() {
    allowClose();
    router.back();
  }

  async function act(change: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await change();
    } catch {
      setError(t("capture.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    await act(async () => {
      await removeWithUndo(update, job.id);
      leave();
    });
  }

  async function retakeFrom(from: "camera" | "library") {
    if (busy) return;
    setBusy(true);
    setProblem(null);
    setError(null);
    const result = await retake(job, from);
    setBusy(false);
    if (result === "done") leave();
    else if (result !== "cancelled") setProblem(result);
  }

  const step = run.indexOf(job.id);
  const title =
    run.length > 1 && step >= 0
      ? walk
        ? t("confirm.step", { n: step + 1, total: run.length })
        : t("confirm.titleStep", { n: step + 1, total: run.length })
      : t("confirm.title");
  const previous = walk && step > 0 ? run[step - 1] : undefined;
  const following = walk && step >= 0 ? run[step + 1] : undefined;
  const shown = jobPhoto({ ...job, ...photoChange(photo) });
  const cutout = failed ? undefined : importCutout(job);
  const adjust =
    failed || (canPrepareOnDevice && cutout?.cutout === null)
      ? {
          label: t("cutout.byHand"),
          disabled: failed || busy,
          onPress: () => openCutout(job.id),
          testID: "confirm-cutout",
        }
      : canPrepareOnDevice && cutout?.cutout
        ? {
            label: t("photo.adjust"),
            disabled: busy || photo === "original",
            onPress: () => openCutout(job.id),
            testID: "confirm-cutout",
          }
        : null;

  const duplicate = job.duplicateOf
    ? (closet.pieces.find((item) => item.id === job.duplicateOf) ??
      (() => {
        const other = closet.imports.find(
          (item) => item.id === job.duplicateOf,
        );
        return other ? jobPiece(other) : null;
      })())
    : null;
  const checks = job.checks ?? [];

  const banner = problem ? (
    <Banner
      tone="notice"
      text={t(problemKeys[problem])}
      actions={
        problem === "camera-off"
          ? [
              {
                label: t("common.choosePhoto"),
                variant: "secondary",
                onPress: () => void retakeFrom("library"),
              },
              {
                label: t("common.openSettings"),
                variant: "quiet",
                onPress: () => void Linking.openSettings(),
              },
            ]
          : [
              {
                label: t("common.tryAgain"),
                variant: "secondary",
                onPress: () => void retakeFrom("library"),
              },
            ]
      }
      testID="confirm-problem"
    />
  ) : job.duplicateOf ? (
    <Banner
      tone="notice"
      text={t("duplicate.title")}
      leading={duplicate ? { thumb: duplicate } : undefined}
      accessibilityLabel={
        duplicate?.name
          ? `${t("duplicate.title")} ${t("duplicate.named", { name: duplicate.name })}`
          : undefined
      }
      actions={[
        {
          label: t("duplicate.same"),
          variant: "secondary",
          onPress: () => void remove(),
        },
        {
          label: t("duplicate.different"),
          variant: "quiet",
          onPress: () =>
            void act(() =>
              update((current) => keepDuplicate(current, job.id)).then(
                () => undefined,
              ),
            ),
        },
      ]}
      testID="confirm-duplicate"
    />
  ) : null;

  const retakeRow = (
    <View style={styles.bleed}>
      <Button
        label={t("capture.retake")}
        variant="quiet"
        disabled={busy}
        onPress={() => void retakeFrom("camera")}
        testID="confirm-retake"
      />
    </View>
  );

  const trash = (
    <HeaderItem
      label={t("capture.remove")}
      icon="trash"
      disabled={busy}
      onPress={() => void remove()}
      testID="confirm-remove"
    />
  );

  if (failed || !prepared || !kind)
    return (
      <Screen
        title={title}
        headerTitleVisible
        leading="cancel"
        onCancel={() => router.back()}
        actions={trash}
        testID="confirm-screen"
      >
        <View style={styles.content}>
          {banner}
          <View style={styles.hero}>
            <Tile
              image={jobPiece(job)}
              raw
              size="hero"
              accessibilityLabel={t("capture.photo")}
            />
          </View>
          {adjust ? (
            <PhotoToolbar
              options={["original"]}
              value="original"
              onChange={() => undefined}
              adjust={adjust}
            />
          ) : null}
          {retakeRow}
        </View>
      </Screen>
    );

  const question = checks.includes("uncertain")
    ? (job.question ?? "subcategory")
    : null;
  const category = categoryOf(kind);
  const rankedCategories = rankCategories(prepared.labels);
  const asked = question
    ? questionText(
        question,
        rankedCategories,
        rankKinds(prepared.labels, categoryOf(job.kind!)),
      )
    : null;
  const shownCategories = showAll
    ? rankedCategories
    : question === "category"
      ? [...new Set(rankedCategories.slice(0, 2))]
      : [...new Set([category, ...rankedCategories.slice(0, 3)])];
  const kindChoices = rankKinds(prepared.labels, category);
  const fixed = fixedStyles(kind);
  const attributeAsked = job.attributeCheck;
  const studioSource = importStudioSource(job);
  const offerStudio = studioOffered() && Boolean(studioSource);
  const photoOptions: PhotoView[] = !prepared.cutout
    ? ["original"]
    : [
        "cutout",
        "original",
        ...(offerStudio || prepared.studio ? (["studio"] as const) : []),
      ];

  function chooseKind(next: GarmentKind) {
    if (name === nameFor(kind!, prepared!.palette))
      setName(nameFor(next, prepared!.palette));
    setKind(next);
    const nextFixed = fixedStyles(next);
    if (nextFixed) setStyles(nextFixed);
    else if (fixed) setStyles(undefined);
  }

  function chooseCategory(next: Category) {
    if (next !== category) chooseKind(rankKinds(prepared!.labels, next)[0]!);
  }

  async function makeStudio() {
    if (!studioSource || studio.making) return;
    const file = await studio.make(studioSource, job.id, {
      category,
      kind,
      name,
      colour,
    });
    if (!file) return;
    let applied = false;
    await update((current) => {
      const next = setImportStudio(current, job.id, file);
      applied = next !== current;
      return next;
    }).catch(() => undefined);
    if (!applied) void discardPhoto(file).catch(() => undefined);
    else setPhoto("studio");
  }

  function pickPhoto(next: PhotoView) {
    if (next === "studio" && !prepared!.studio) {
      void makeStudio();
      return;
    }
    setPhoto(next);
  }

  function nextConfirm() {
    if (walk) return following;
    return run.find(
      (other) =>
        other !== job.id &&
        closet.imports.some(
          (item) => item.id === other && item.state === "review",
        ),
    );
  }

  function go(to: string) {
    if (busy || studio.making) return;
    if (dirty && name.trim()) {
      void save(to);
      return;
    }
    allowClose();
    router.setParams({ id: to });
  }

  async function save(to?: string) {
    if (!name.trim() || busy || studio.making) return;
    const next = to ?? nextConfirm();
    setBusy(true);
    setError(null);
    try {
      await update((current) =>
        correctImport(current, job.id, {
          kind,
          styles: fixed ? undefined : chosenStyles,
          name: name.trim(),
          ...photoChange(photo),
          ...(colour && colour !== initial.colour ? { colour } : {}),
          ...(attributeAsked && answer !== undefined
            ? { attribute: { key: attributeAsked, value: answer } }
            : {}),
        }),
      );
      allowClose();
      if (next) router.setParams({ id: next });
      else router.back();
    } catch {
      setError(t("capture.saveFailed"));
      setBusy(false);
    }
  }

  const styleSegmented = (label?: string) => (
    <Segmented
      label={label}
      options={styleChoices()}
      value={choiceOf(chosenStyles) ?? "western"}
      onChange={(choice) => setStyles(stylesOf(choice))}
    />
  );

  const categoryChips = (label: string) => (
    <ChipRow
      label={label}
      options={[
        ...shownCategories.map((option) => ({
          id: option as string,
          label: categoryName(option),
        })),
        ...(showAll
          ? []
          : [{ id: somethingElse, label: t("capture.somethingElse") }]),
      ]}
      value={category}
      onChange={(next) => {
        if (next === somethingElse) setShowAll(true);
        else if (typeof next === "string") chooseCategory(next as Category);
      }}
      testID="confirm-category"
    />
  );

  const kindChips = (label: string, switcher = false) => (
    <ChipRow
      label={label}
      options={[
        ...kindChoices.map((option) => ({
          id: option as string,
          label: kindName(option),
        })),
        ...(switcher
          ? [{ id: switchCategory, label: t("confirm.switchCategory") }]
          : []),
      ]}
      value={kind}
      onChange={(next) => {
        if (next === switchCategory) setPickCategory(true);
        else if (typeof next === "string") chooseKind(next as GarmentKind);
      }}
      testID="confirm-kind"
    />
  );

  return (
    <Screen
      title={title}
      headerTitleVisible
      leading="cancel"
      onCancel={() => router.back()}
      actions={trash}
      footer={
        <Footer
          error={error}
          actions={
            walk && run.length > 1
              ? [
                  {
                    label: t("confirm.previous"),
                    icon: "chevron.left",
                    onPress: () => previous && go(previous),
                    disabled: !previous || busy,
                    testID: "confirm-previous",
                  },
                  {
                    label: t("confirm.next"),
                    icon: "chevron.right",
                    iconAfter: true,
                    onPress: () => following && go(following),
                    disabled: !following || busy,
                    testID: "confirm-next",
                  },
                ]
              : undefined
          }
          primary={{
            label: t("common.looksRight"),
            onPress: () => void save(),
            busy,
            disabled: !name.trim() || studio.making,
            testID: "confirm-save",
          }}
        />
      }
      testID="confirm-screen"
    >
      <View style={styles.content}>
        {banner}
        <View style={styles.hero}>
          <Tile
            image={{ ...jobPiece(job), photo: shown.photo }}
            raw={shown.raw}
            size="hero"
            state={studio.making ? "preparing" : undefined}
            accessibilityLabel={name || t("capture.photo")}
          />
        </View>
        <PhotoToolbar
          options={photoOptions}
          value={photo}
          onChange={pickPhoto}
          adjust={adjust}
          making={studio.making}
          disabled={busy}
          testID="confirm-photo"
        />
        {studio.message ? (
          <View style={styles.block}>
            <Text role="footnote" tone="error">
              {studio.message}
            </Text>
            {studio.message !== t("photo.cleanLimit") ? (
              <View style={styles.bleed}>
                <Button
                  label={t("common.tryAgain")}
                  variant="quiet"
                  onPress={() => void makeStudio()}
                />
              </View>
            ) : null}
          </View>
        ) : null}
        {question === "category" ? (
          <View style={styles.block}>
            {categoryChips(asked ?? t("piece.category"))}
            {kindChips(t("piece.kind"))}
          </View>
        ) : question === "subcategory" ? (
          kindChips(asked ?? t("piece.kind"))
        ) : (
          <View style={styles.block}>
            {pickCategory ? categoryChips(t("piece.category")) : null}
            {kindChips(t("piece.kind"), !pickCategory)}
          </View>
        )}
        {question === "style" && !fixed
          ? styleSegmented(asked ?? t("piece.style"))
          : null}
        {attributeAsked ? (
          <ChipRow
            label={t(
              attributeQuestions[attributeAsked] ??
                attributeLabelKey(attributeAsked),
            )}
            options={optionsFor(attributeAsked).map((option) => ({
              id: String(option.id),
              label: t(attributeValueKey(attributeAsked, option.id)),
            }))}
            value={answer === undefined ? null : String(answer)}
            onChange={(next) => {
              const picked = optionsFor(attributeAsked).find(
                (option) => String(option.id) === next,
              );
              if (picked) setAnswer(picked.id);
            }}
            testID="confirm-attribute"
          />
        ) : null}
        {colour ? (
          <ColourChips
            label={t("fact.colour")}
            value={colour}
            onPick={setColour}
            testID="confirm-colour"
          />
        ) : null}
        <Field
          label={t("piece.name")}
          testID="check-name"
          value={name}
          onChangeText={setName}
          maxLength={80}
          returnKeyType="done"
        />
        {retakeRow}
      </View>
    </Screen>
  );
}

function openCutout(id: string) {
  router.push({
    pathname: "/cutout/[id]",
    params: { id, target: "import" },
  });
}

const styles = StyleSheet.create({
  content: { gap: theme.space.lg },
  block: { gap: theme.space.md },
  hero: { width: 240, alignSelf: "center" },
  bleed: { marginLeft: -theme.space.sm, alignSelf: "flex-start" },
});

import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import {
  categoryOf,
  fixedStyles,
  type Category,
  type Closet,
  type GarmentKind,
  type ImportJob,
  type Piece,
  type QuickCheck,
  type Style,
  type Variant,
} from "../../domain/closet";
import {
  confirmAttribute,
  fitAttributes,
  optionsFor,
  type AttributeKey,
  type AttributeValue,
} from "../../domain/attributes";
import {
  captureMembers,
  correctImport,
  dismissAdvice,
  type Details,
  importStudioSource,
  keepDuplicate,
  keepRejected,
  nameOptions,
  namingAttributes,
  renameAuto,
  setImportStudio,
  withColour,
} from "../../domain/importing";
import { importCutout } from "../../domain/cutout";
import { attributeLabelKey, attributeValueKey } from "../../domain/facts";
import { ownKind, ownKindsIn } from "../../domain/lists";
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
  Expander,
  Field,
  Footer,
  HeaderItem,
  Screen,
} from "../../ui";
import { confirmAction } from "../../ui/confirm";
import { theme } from "../../ui/theme";
import { AddOwn, addOwnId, addOwnOption } from "../AddOwn";
import { ColourChips } from "../ColourChips";
import { FactChips, detailFacts } from "../piece/FactChips";
import { useRetake, type CaptureProblem } from "../Retake";
import { jobColour, jobColours, jobPhoto, jobPiece } from "./jobs";
import { PiecePhoto, type PhotoChoice, type PhotoView } from "./PiecePhoto";
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
    own: job.ownKind ?? null,
    answer:
      job.attributeCheck &&
      job.attributeSources?.[job.attributeCheck] === "confirmed"
        ? job.attributes?.[job.attributeCheck]
        : undefined,
  }));
  const [name, setName] = useState(initial.name);
  const [kind, setKind] = useState(initial.kind);
  const [chosenStyles, setStyles] = useState(initial.styles);
  const [photo, setPhoto] = useState<PhotoView>(initial.photo);
  const [colour, setColour] = useState(initial.colour);
  const [own, setOwn] = useState<string | null>(initial.own);
  const [facts, setFacts] = useState<Piece | null>(null);
  const [more, setMore] = useState(false);
  const [addingKind, setAddingKind] = useState(false);
  const [answer, setAnswer] = useState<AttributeValue | undefined>(
    initial.answer,
  );
  const [touched, setTouched] = useState({
    kind: false,
    styles: false,
    colour: false,
  });
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
      own !== initial.own ||
      facts !== null ||
      answer !== initial.answer);
  const allowClose = useDiscardChanges(dirty, busy);

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
  const left = run.filter(
    (other) =>
      other === job.id ||
      closet.imports.some(
        (item) => item.id === other && item.state === "review",
      ),
  ).length;
  const title =
    run.length > 1 && step >= 0
      ? walk
        ? t("confirm.step", { n: step + 1, total: run.length })
        : left > 1
          ? t("confirm.titleLeft", { n: left })
          : t("confirm.title")
      : t("confirm.title");
  const previous = walk && step > 0 ? run[step - 1] : undefined;
  const following = walk && step >= 0 ? run[step + 1] : undefined;
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

  const duplicateJob = job.duplicateOf
    ? closet.imports.find((item) => item.id === job.duplicateOf)
    : undefined;
  const duplicate = job.duplicateOf
    ? (closet.pieces.find((item) => item.id === job.duplicateOf) ??
      (duplicateJob ? jobPiece(duplicateJob) : null))
    : null;
  const duplicateText = duplicateJob
    ? t("duplicate.batch")
    : t("duplicate.title");
  const checks = job.checks ?? [];

  const useAnyway = {
    label: t("advice.useAnyway"),
    variant: "quiet" as const,
    onPress: () =>
      void update((current) => dismissAdvice(current, job.id)).catch(
        () => undefined,
      ),
  };
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
      text={duplicateText}
      leading={duplicate ? { thumb: duplicate } : undefined}
      accessibilityLabel={
        duplicate?.name
          ? `${duplicateText} ${t("duplicate.named", { name: duplicate.name })}`
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
  ) : failed && job.error === "no-clothing" ? (
    <Banner
      tone="notice"
      text={t("capture.noClothing")}
      actions={[
        {
          label: t("capture.addAnyway"),
          variant: "secondary",
          onPress: () =>
            void act(() =>
              update((current) => keepRejected(current, job.id)).then(
                () => undefined,
              ),
            ),
          testID: "confirm-add-anyway",
        },
      ]}
      testID="confirm-rejected"
    />
  ) : job.advice && !failed ? (
    <Banner
      tone="notice"
      text={t(`advice.${job.advice}.title`)}
      actions={
        job.fromLink
          ? [useAnyway]
          : [
              {
                label: t("capture.retake"),
                variant: "secondary",
                onPress: () => void retakeFrom("camera"),
              },
              useAnyway,
            ]
      }
      testID="confirm-advice"
    />
  ) : null;

  const retakeRow = job.fromLink ? null : (
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

  const onePhoto =
    job.captureId &&
    new Set(captureMembers(closet, job.captureId).map((item) => item.source))
      .size === 1;
  const markMore =
    onePhoto && !job.fromLink ? (
      <View style={styles.mark}>
        <Button
          label={t("capture.pickPiece")}
          icon="plus"
          variant="secondary"
          disabled={busy}
          onPress={() =>
            router.push({
              pathname: "/capture/group/[id]",
              params: { id: job.captureId!, add: "1" },
            })
          }
          testID="confirm-add-piece"
        />
      </View>
    ) : null;

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
          <PiecePhoto
            choices={[{ id: "original", image: jobPiece(job), raw: true }]}
            value="original"
            onChange={() => undefined}
            adjust={adjust}
            accessibilityLabel={t("capture.photo")}
            heroID="confirm-hero"
            testID="confirm-photo"
          />
          {markMore}
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
  const photoChoices = photoOptions.map((view): PhotoChoice => {
    const preview = jobPhoto({
      ...job,
      ...photoChange(view === "studio" && !prepared.studio ? "cutout" : view),
    });
    return {
      id: view,
      image: { ...jobPiece(job), photo: preview.photo },
      raw: preview.raw,
    };
  });
  const kindGuessed =
    job.sources?.kind !== "confirmed" && kind === initial.kind && !touched.kind;
  const styleGuessed =
    job.sources?.styles !== "confirmed" &&
    choiceOf(chosenStyles) === choiceOf(initial.styles) &&
    !touched.styles;
  const colourGuessed =
    job.sources?.colour !== "confirmed" &&
    colour === initial.colour &&
    !touched.colour;
  const touch = (key: keyof typeof touched) =>
    setTouched((current) => ({ ...current, [key]: true }));
  const naming = (k: GarmentKind, c: string | null) => ({
    kind: k,
    palette: withColour(prepared.palette, c ?? undefined),
    attributes: namingAttributes(job),
  });
  const suggestions = nameOptions(
    kind,
    naming(kind, colour).palette,
    namingAttributes(job),
  );

  function chooseColour(next: string) {
    touch("colour");
    setName((current) =>
      renameAuto(current, naming(kind!, colour), naming(kind!, next)),
    );
    setColour(next);
  }

  function chooseKind(next: GarmentKind) {
    touch("kind");
    setOwn(null);
    setName((current) =>
      renameAuto(current, naming(kind!, colour), naming(next, colour)),
    );
    setKind(next);
    const nextFixed = fixedStyles(next);
    if (nextFixed) setStyles(nextFixed);
    else if (fixed) setStyles(undefined);
  }

  function chooseCategory(next: Category) {
    if (next !== category) chooseKind(rankKinds(prepared!.labels, next)[0]!);
    else touch("kind");
  }

  function chooseOwn(id: string) {
    const picked = ownKind(id);
    if (!picked) return;
    if (picked.category !== category)
      chooseKind(rankKinds(prepared!.labels, picked.category)[0]!);
    touch("kind");
    setOwn(id);
  }

  const shownCategory = (own ? ownKind(own)?.category : undefined) ?? category;
  const base = jobPiece(job);
  const draftBase: Piece = {
    ...base,
    name: name.trim() || kindName(kind),
    category: shownCategory,
    kind,
    ...(chosenStyles ? { styles: chosenStyles } : {}),
    attributes: facts?.attributes ?? job.attributes,
    sources: facts?.sources ?? job.attributeSources,
    ...(facts?.traits ? { traits: facts.traits } : {}),
    ...(facts?.ownFabric ? { ownFabric: facts.ownFabric } : {}),
  };
  const draft = fitAttributes(
    attributeAsked && answer !== undefined
      ? confirmAttribute(draftBase, attributeAsked, answer)
      : draftBase,
  );
  const details: Details | undefined = facts
    ? {
        attributes: draft.attributes,
        sources: draft.sources,
        traits: draft.traits,
        ...(draft.ownFabric ? { ownFabric: draft.ownFabric } : {}),
      }
    : undefined;

  const changeFacts = async (transform: (current: Closet) => Closet) => {
    const next = transform({ ...closet, pieces: [draft] }).pieces[0];
    if (!next) return;
    setFacts(next);
    if (
      !fixed &&
      next.sources?.styles === "confirmed" &&
      choiceOf(next.styles) !== choiceOf(chosenStyles)
    ) {
      touch("styles");
      setStyles(next.styles);
    }
    if (attributeAsked && next.sources?.[attributeAsked] === "confirmed")
      setAnswer(next.attributes?.[attributeAsked]);
  };

  async function makeStudio(note?: string) {
    if (!studioSource || studio.making) return;
    const before = prepared!.studio;
    const file = await studio.make(studioSource, job.id, {
      category,
      kind,
      name,
      colour,
      note,
    });
    if (!file) return;
    let applied = false;
    await update((current) => {
      const next = setImportStudio(current, job.id, file);
      applied = next !== current;
      return next;
    }).catch(() => undefined);
    if (!applied) void discardPhoto(file).catch(() => undefined);
    else {
      if (before && before !== file)
        void discardPhoto(before).catch(() => undefined);
      setPhoto("studio");
    }
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
    const order =
      step >= 0 ? [...run.slice(step + 1), ...run.slice(0, step)] : run;
    return order.find(
      (other) =>
        other !== job.id &&
        closet.imports.some(
          (item) => item.id === other && item.state === "review",
        ),
    );
  }

  async function go(to: string) {
    if (busy) return;
    if (dirty && name.trim()) {
      void save(to);
      return;
    }
    if (
      dirty &&
      !(await confirmAction(
        t("common.discardTitle"),
        t("common.discardBody"),
        t("common.discard"),
        t("common.keepEditing"),
      ))
    )
      return;
    allowClose();
    router.setParams({ id: to });
  }

  async function save(to?: string) {
    if (!name.trim() || busy) return;
    const next = to ?? nextConfirm();
    setBusy(true);
    setError(null);
    try {
      await update((current) =>
        correctImport(current, job.id, {
          kind,
          ownKind: own,
          ...(details ? { details } : {}),
          styles: fixed ? undefined : chosenStyles,
          name: name.trim(),
          ...photoChange(photo),
          ...(colour && (colour !== initial.colour || touched.colour)
            ? { colour }
            : {}),
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

  const styleChips = (label?: string) => (
    <ChipRow
      label={label}
      options={styleChoices()}
      value={choiceOf(chosenStyles)}
      onChange={(choice) => {
        if (typeof choice !== "string") return;
        touch("styles");
        setStyles(stylesOf(choice));
      }}
      guessed={styleGuessed}
      testID="confirm-style"
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
      guessed={kindGuessed}
      testID="confirm-category"
    />
  );

  const kindChips = (label: string, switcher = false) => (
    <ChipRow
      label={label}
      options={[
        ...ownKindsIn(category).map((option) => ({
          id: option.id,
          label: option.name,
        })),
        ...kindChoices.map((option) => ({
          id: option as string,
          label: kindName(option),
        })),
        ...(switcher
          ? [{ id: switchCategory, label: t("confirm.switchCategory") }]
          : []),
        addOwnOption(),
      ]}
      value={own ?? kind}
      onChange={(next) => {
        if (next === switchCategory) setPickCategory(true);
        else if (next === addOwnId) setAddingKind(true);
        else if (typeof next === "string" && ownKind(next)) chooseOwn(next);
        else if (typeof next === "string") chooseKind(next as GarmentKind);
      }}
      guessed={kindGuessed}
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
                    onPress: () => void (previous && go(previous)),
                    disabled: !previous || busy,
                    testID: "confirm-previous",
                  },
                  {
                    label: t("confirm.next"),
                    icon: "chevron.right",
                    iconAfter: true,
                    onPress: () => void (following && go(following)),
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
            disabled: !name.trim(),
            testID: "confirm-save",
          }}
        />
      }
      testID="confirm-screen"
    >
      <View style={styles.content}>
        {banner}
        <PiecePhoto
          choices={photoChoices}
          value={photo}
          onChange={pickPhoto}
          making={studio.making}
          made={Boolean(prepared.studio)}
          onMake={(note) => void makeStudio(note)}
          adjust={adjust}
          message={studio.message}
          note={offerStudio && !prepared.studio}
          disabled={busy}
          accessibilityLabel={name || t("capture.photo")}
          heroID="confirm-hero"
          testID="confirm-photo"
        />
        {markMore}
        {question === "category" ? (
          <View style={styles.block}>
            {categoryChips(asked ?? t("piece.category"))}
            {kindChips(t("piece.kind"))}
          </View>
        ) : (
          <View style={styles.block}>
            {pickCategory ? categoryChips(t("piece.category")) : null}
            {kindChips(
              question === "subcategory"
                ? (asked ?? t("piece.kind"))
                : t("piece.kind"),
              !pickCategory,
            )}
          </View>
        )}
        {addingKind ? (
          <AddOwn
            list="kinds"
            category={category}
            onAdded={(id) => {
              setAddingKind(false);
              chooseOwn(id);
            }}
            onCancel={() => setAddingKind(false)}
            testID="confirm-own-kind"
          />
        ) : null}
        {question === "style" && !fixed
          ? styleChips(asked ?? t("piece.style"))
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
        <ColourChips
          label={t("fact.colour")}
          value={colour}
          first={jobColours(job)}
          onPick={chooseColour}
          guessed={colourGuessed}
          photo={prepared.palette.map((swatch) => swatch.rgb)}
          testID="confirm-colour"
        />
        <Field
          label={t("piece.name")}
          testID="check-name"
          value={name}
          onChangeText={setName}
          maxLength={80}
          returnKeyType="done"
        />
        {suggestions.length > 1 ? (
          <ChipRow
            options={suggestions.map((option) => ({
              id: option,
              label: option,
            }))}
            value={suggestions.includes(name) ? name : null}
            onChange={(next) => {
              if (typeof next === "string") setName(next);
            }}
            layout="scroll"
            testID="confirm-name-options"
          />
        ) : null}
        {detailFacts(draft).length ? (
          <Expander
            id="confirm-more"
            title={t("editor.moreDetails")}
            open={more}
            onToggle={() => setMore((open) => !open)}
            testID="confirm-more"
          >
            <FactChips piece={draft} onChange={changeFacts} more />
          </Expander>
        ) : null}
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
  bleed: { marginLeft: -theme.space.sm, alignSelf: "flex-start" },
  mark: { alignItems: "center" },
});

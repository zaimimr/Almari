import { adviceReason } from "./quality";
import { findDuplicate, looksAlike } from "./duplicates";
import {
  attributeKeys,
  confirmAttribute,
  fabrics,
  patterns,
  type Attributes,
  mergeProposal,
  withDetails,
  type AttributeKey,
  type AttributeValue,
  type Described,
} from "./attributes";
import {
  categories,
  categoryOf,
  fixedStyles,
  isAvailable,
  kindLabel,
  savePiece,
  type Category,
  type Closet,
  type Frame,
  type GarmentKind,
  type ImportJob,
  type Piece,
  type Prepared,
  type Sources,
  type Style,
  type Variant,
} from "./closet";
import { categoryForRegion, wholePhoto, type CapturePlan } from "./capture";
import { withCareLabel, type CareLabel } from "./careLabel";
import { colorName, namedSwatch, type Swatch } from "./color";
import { attributeCheck, proposeAttributes, recognize } from "./recognition";
import { isSamplePhoto } from "./samples";
import { linkSet } from "./sets";
import { missingRoles } from "./styling";

export type CheckReason =
  "uncertain" | "no-cutout" | "several" | "attribute" | "partial";

export type RejectReason = "no-clothing";

export const minKindScore = 0.12;
export const flatBelow = 10;
export const smallerThan = 64;

function nameSlots(
  kind: GarmentKind,
  palette: Swatch[],
  attributes?: Attributes,
): (string | null)[] {
  const noun = kindLabel(kind).toLowerCase();
  const colour = palette[0] ? colorName(palette[0].rgb) : null;
  const second =
    palette[1] && palette[1].share >= 0.2 ? colorName(palette[1].rgb) : null;
  const fabric = fabrics.find((item) => item.id === attributes?.fabric);
  const pattern = patterns.find(
    (item) => item.id !== "solid" && item.id === attributes?.pattern,
  );
  return [
    colour && fabric ? `${colour} ${fabric.label.toLowerCase()} ${noun}` : null,
    colour ? `${colour} ${noun}` : null,
    colour && pattern
      ? `${colour} ${pattern.label.toLowerCase()} ${noun}`
      : null,
    colour && second && second !== colour
      ? `${colour} and ${second.toLowerCase()} ${noun}`
      : null,
    kindLabel(kind),
  ];
}

export function nameOptions(
  kind: GarmentKind,
  palette: Swatch[],
  attributes?: Attributes,
): string[] {
  return [
    ...new Set(
      nameSlots(kind, palette, attributes).filter(
        (name): name is string => name !== null,
      ),
    ),
  ];
}

export function nameFor(
  kind: GarmentKind,
  palette: Swatch[],
  attributes?: Attributes,
) {
  return nameOptions(kind, palette, attributes)[0]!;
}

export function renameAuto(
  name: string,
  before: { kind: GarmentKind; palette: Swatch[]; attributes?: Attributes },
  after: { kind: GarmentKind; palette: Swatch[]; attributes?: Attributes },
): string {
  const slot = nameSlots(
    before.kind,
    before.palette,
    before.attributes,
  ).indexOf(name);
  if (slot < 0) return name;
  return (
    nameSlots(after.kind, after.palette, after.attributes)[slot] ??
    nameFor(after.kind, after.palette)
  );
}

export function rejectReason(
  prepared: Prepared,
  size?: { width: number; height: number },
  known?: Category,
): RejectReason | null {
  if (size && Math.min(size.width, size.height) < smallerThan)
    return "no-clothing";
  if (
    !prepared.cutout &&
    (prepared.quality?.sharpness ?? flatBelow) < flatBelow
  )
    return "no-clothing";
  const kinds = prepared.labels.filter((label) => label.group === "kind");
  if (
    !known &&
    kinds.length &&
    Math.max(...kinds.map((label) => label.score)) < minKindScore
  )
    return "no-clothing";
  return null;
}

export function withColour(palette: Swatch[], colour: string | undefined) {
  return colour ? [namedSwatch(colour), ...palette.slice(1)] : palette;
}

export function queueImport(
  closet: Closet,
  job: Pick<ImportJob, "id" | "source" | "createdAt" | "linkName">,
): Closet {
  if (closet.imports.some((item) => item.id === job.id)) return closet;
  return {
    ...closet,
    imports: [...closet.imports, { ...job, state: "queued", attempts: 0 }],
  };
}

export function isSettled(job: ImportJob): boolean {
  return ["ready", "review", "failed"].includes(job.state);
}

function updateJob(
  closet: Closet,
  id: string,
  change: (job: ImportJob) => ImportJob | null,
): Closet {
  const job = closet.imports.find((item) => item.id === id);
  if (!job) return closet;
  const next = change(job);
  if (next === job) return closet;
  return {
    ...closet,
    imports: next
      ? closet.imports.map((item) => (item.id === id ? next : item))
      : closet.imports.filter((item) => item.id !== id),
  };
}

export function startImport(closet: Closet, id: string): Closet {
  return updateJob(closet, id, (job) =>
    job.state === "queued"
      ? { ...job, state: "preparing", attempts: job.attempts + 1 }
      : job,
  );
}

function reviewCapture(closet: Closet, id: string): Closet {
  return updateJob(closet, id, (job) => {
    if (!job.prepared || job.state === "failed") return job;
    const reason = adviceReason(job.prepared.quality);
    const advice =
      reason && !job.adviceShown?.includes(reason) ? reason : undefined;
    const duplicateOf =
      findDuplicate(closet, id, job.prepared.embedding) ?? undefined;
    return {
      ...job,
      advice,
      duplicateOf,
      state: duplicateOf ? "review" : job.state,
    };
  });
}

export function finishImport(
  closet: Closet,
  id: string,
  read: Prepared,
  size?: { width: number; height: number },
): Closet {
  const next = updateJob(closet, id, (job) => {
    if (job.state !== "preparing") return job;
    const prepared = { ...read, palette: withColour(read.palette, job.colour) };
    const known =
      (job.region && categoryForRegion(job.region.kind)) ?? undefined;
    const recognition = recognize(prepared.labels, known);
    const checks: CheckReason[] = [];
    if (recognition.question) checks.push("uncertain");
    if (!prepared.cutout) checks.push("no-cutout");
    if (prepared.instances > 1 || othersInWholePhoto(job))
      checks.push("several");
    const base: Described = {
      category: recognition.category,
      kind: recognition.kind,
    };
    const details = proposeAttributes(prepared.labels, base);
    const confirmed = attributeKeys.filter(
      (key) =>
        job.attributeSources?.[key] === "confirmed" &&
        job.attributes?.[key] !== undefined,
    );
    const asked = attributeCheck(
      {
        ...details,
        uncertain: details.uncertain.filter((key) => !confirmed.includes(key)),
      },
      checks.includes("uncertain"),
    );
    if (asked) checks.push("attribute");
    const described = mergeProposal(
      {
        ...base,
        attributes: Object.fromEntries(
          confirmed.map((key) => [key, job.attributes![key]]),
        ),
        sources: Object.fromEntries(confirmed.map((key) => [key, "confirmed"])),
      },
      details.attributes,
    );
    const styles = recognition.styles.length ? recognition.styles : undefined;
    const sources: Sources = {
      kind: "proposed",
      ...(styles ? { styles: "proposed" } : {}),
      ...(job.colour ? { colour: "confirmed" } : {}),
    };
    if (job.region?.partial && !checks.includes("partial"))
      checks.push("partial");
    const rejected = rejectReason(prepared, size, known);
    const fabric = details.uncertain.includes("fabric")
      ? undefined
      : (described.attributes as Attributes | undefined)?.fabric;
    return {
      ...job,
      state: rejected ? "failed" : checks.length ? "review" : "ready",
      prepared,
      kind: recognition.kind,
      name:
        job.linkName ?? nameFor(recognition.kind, prepared.palette, { fabric }),
      styles,
      question: recognition.question ?? undefined,
      sources,
      attributes: described.attributes,
      attributeSources: described.sources,
      attributeCheck: asked ?? undefined,
      checks,
      error: rejected ?? undefined,
    };
  });
  return next === closet ? closet : mergePair(reviewCapture(next, id), id);
}

function mergePair(closet: Closet, id: string): Closet {
  const job = closet.imports.find((item) => item.id === id);
  if (
    !job?.prepared ||
    !job.captureId ||
    job.state === "failed" ||
    job.region?.kind !== "shoes"
  )
    return closet;
  const twin = closet.imports.some(
    (other) =>
      other.id !== id &&
      other.captureId === job.captureId &&
      other.region?.kind === "shoes" &&
      other.state !== "failed" &&
      other.prepared &&
      other.kind === job.kind &&
      looksAlike(
        { kind: job.kind, palette: job.prepared!.palette },
        { kind: other.kind, palette: other.prepared.palette },
      ),
  );
  return twin ? removeImport(closet, id) : closet;
}

export function keepRejected(closet: Closet, id: string): Closet {
  return updateJob(closet, id, (job) =>
    job.state === "failed" && job.error === "no-clothing" && job.prepared
      ? {
          ...job,
          state: "review",
          error: undefined,
          checks: [
            "uncertain",
            ...(job.checks ?? []).filter((check) => check !== "uncertain"),
          ],
        }
      : job,
  );
}

export function dismissAdvice(closet: Closet, id: string): Closet {
  return updateJob(closet, id, (job) =>
    job.advice
      ? {
          ...job,
          advice: undefined,
          adviceShown: [...(job.adviceShown ?? []), job.advice],
        }
      : job,
  );
}

export function keepDuplicate(closet: Closet, id: string): Closet {
  return updateJob(closet, id, (job) =>
    job.duplicateOf
      ? {
          ...job,
          duplicateOf: undefined,
          state: job.checks?.length ? "review" : "ready",
        }
      : job,
  );
}

export function failImport(closet: Closet, id: string, error: string): Closet {
  return updateJob(closet, id, (job) =>
    job.state === "preparing" || job.state === "queued"
      ? { ...job, state: "failed", error }
      : job,
  );
}

export function importFailure(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return (
    ["storage", "unreadable"].find((item) => message.includes(item)) ??
    "processing"
  );
}

export function retryImport(closet: Closet, id: string): Closet {
  return updateJob(closet, id, (job) =>
    job.state === "failed"
      ? { ...job, state: "queued", error: undefined }
      : job,
  );
}

export function retakeImport(
  closet: Closet,
  id: string,
  source: string,
): Closet {
  return updateJob(closet, id, (job) => {
    if (job.source === source) return job;
    if (!isSettled(job)) return job;
    return {
      ...job,
      source,
      state: "queued",
      attempts: 0,
      prepared: undefined,
      kind: undefined,
      name: undefined,
      alternatives: undefined,
      checks: undefined,
      keepOriginal: undefined,
      variant: undefined,
      error: undefined,
      advice: undefined,
      duplicateOf: undefined,
      captureId: undefined,
      region: undefined,
      crop: undefined,
      stem: undefined,
      people: undefined,
      adviceShown: [
        ...(job.adviceShown ?? []),
        ...(job.advice ? [job.advice] : []),
      ],
    };
  });
}

export function recoverImports(closet: Closet): Closet {
  if (!closet.imports.some((job) => job.state === "preparing")) return closet;
  return {
    ...closet,
    imports: closet.imports.map((job) =>
      job.state === "preparing" ? { ...job, state: "queued" } : job,
    ),
  };
}

export function correctImport(
  closet: Closet,
  id: string,
  change: {
    kind?: GarmentKind;
    styles?: Style[];
    name?: string;
    keepOriginal?: boolean;
    variant?: Variant;
    attribute?: { key: AttributeKey; value: AttributeValue };
    colour?: string;
  },
): Closet {
  return updateJob(closet, id, (job) => {
    if (job.state !== "ready" && job.state !== "review") return job;
    const kind = change.kind ?? job.kind!;
    const fixed = fixedStyles(kind);
    const previous = fixedStyles(job.kind!) ? undefined : job.styles;
    const styles = fixed ?? (change.styles?.length ? change.styles : previous);
    const colour = change.colour ?? job.colour;
    const palette = withColour(job.prepared!.palette, change.colour);
    const renamed =
      change.name ??
      (change.kind || change.colour
        ? renameAuto(
            job.name!,
            {
              kind: job.kind!,
              palette: job.prepared!.palette,
              attributes: job.attributes,
            },
            { kind, palette, attributes: job.attributes },
          )
        : job.name!);
    const sources: Sources = {
      kind: change.kind ? "confirmed" : (job.sources?.kind ?? "proposed"),
      ...(colour ? { colour: "confirmed" } : {}),
    };
    if (styles)
      sources.styles =
        change.styles?.length || (fixed && change.kind)
          ? "confirmed"
          : (job.sources?.styles ?? "proposed");
    const category = categoryOf(kind);
    let described: Described = {
      category,
      kind,
      attributes: job.attributes,
      sources: job.attributeSources,
    };
    if (kind !== job.kind)
      described = mergeProposal(
        described,
        proposeAttributes(job.prepared!.labels, { category, kind }).attributes,
      );
    if (change.attribute)
      described = confirmAttribute(
        described,
        change.attribute.key,
        change.attribute.value,
      );
    return {
      ...job,
      prepared: { ...job.prepared!, palette },
      colour,
      kind,
      styles,
      name: renamed,
      attributes: described.attributes,
      attributeSources: described.sources,
      attributeCheck: undefined,
      keepOriginal: change.keepOriginal ?? job.keepOriginal,
      variant: change.variant ?? job.variant,
      duplicateOf: undefined,
      sources,
      question: undefined,
      checks: [],
      state: "ready",
    };
  });
}

export function setImportLabel(
  closet: Closet,
  id: string,
  label: CareLabel | undefined,
): Closet {
  return updateJob(closet, id, (job) => {
    if (job.state !== "ready" && job.state !== "review") return job;
    const next = { ...job };
    if (label) next.label = label;
    else delete next.label;
    return next;
  });
}

export function importStudioSource(job: ImportJob): string | null {
  if (!job.prepared?.cutout || !job.prepared.enhanced) return null;
  return job.prepared.enhanced;
}

export function setImportStudio(
  closet: Closet,
  id: string,
  studio: string,
): Closet {
  return updateJob(closet, id, (job) => {
    if (job.state !== "ready" && job.state !== "review") return job;
    if (!job.prepared || !importStudioSource(job)) return job;
    return { ...job, prepared: { ...job.prepared, studio }, variant: "studio" };
  });
}

export function removeImport(closet: Closet, id: string): Closet {
  return updateJob(closet, id, () => null);
}

export function fileStem(source: string): string {
  return source.replace(/-original(\.[^.]*)?$/, "").replace(/\.[^.]*$/, "");
}

function othersInWholePhoto(job: ImportJob): boolean {
  return (
    (job.people ?? 0) > 1 &&
    !job.region &&
    job.crop?.x === wholePhoto.x &&
    job.crop.y === wholePhoto.y &&
    job.crop.width === wholePhoto.width &&
    job.crop.height === wholePhoto.height
  );
}

export function jobStem(job: ImportJob): string {
  return job.stem ?? (job.region || job.crop ? job.id : fileStem(job.source));
}

export function splitCapture(
  closet: Closet,
  id: string,
  plan: CapturePlan,
): Closet {
  const job = closet.imports.find((item) => item.id === id);
  if (!job || job.state !== "preparing" || job.captureId) return closet;
  const people = plan.people ? { people: plan.people } : {};
  const jobs: ImportJob[] = plan.proposals.length
    ? plan.proposals.map((proposal, index) => ({
        id: index ? `${id}-${index + 1}` : id,
        source: job.source,
        createdAt: job.createdAt,
        state: "queued",
        attempts: 0,
        captureId: id,
        region: proposal.region,
        ...(index || !job.linkName ? {} : { linkName: job.linkName }),
        ...people,
      }))
    : [
        {
          ...job,
          state: "queued",
          captureId: id,
          ...people,
          ...(plan.checkWhole ? { crop: wholePhoto } : {}),
        },
      ];
  return {
    ...closet,
    imports: closet.imports.flatMap((item) => (item.id === id ? jobs : [item])),
  };
}

export function captureJobs(closet: Closet, captureId: string): ImportJob[] {
  return closet.imports.filter(
    (job) => job.captureId === captureId && Boolean(job.region || job.crop),
  );
}

export function cropCapture(
  closet: Closet,
  id: string,
  crop: Frame,
  stem: string,
): Closet {
  return updateJob(closet, id, (job) =>
    job.captureId && isSettled(job)
      ? {
          id: job.id,
          source: job.source,
          createdAt: job.createdAt,
          state: "queued",
          attempts: 0,
          captureId: job.captureId,
          ...(job.region ? { region: { ...job.region, partial: false } } : {}),
          ...(job.people ? { people: job.people } : {}),
          ...(job.label ? { label: job.label } : {}),
          ...(job.adviceShown ? { adviceShown: job.adviceShown } : {}),
          crop,
          stem,
        }
      : job,
  );
}

export function addToCapture(
  closet: Closet,
  captureId: string,
  id: string,
  crop: Frame,
  createdAt: string,
): Closet {
  const sibling = captureJobs(closet, captureId)[0];
  if (!sibling || closet.imports.some((job) => job.id === id)) return closet;
  return {
    ...closet,
    imports: [
      ...closet.imports,
      {
        id,
        source: sibling.source,
        createdAt,
        state: "queued",
        attempts: 0,
        captureId,
        ...(sibling.people ? { people: sibling.people } : {}),
        crop,
      },
    ],
  };
}

function jobFiles(job: ImportJob): (string | null | undefined)[] {
  return [
    job.source,
    job.label?.photo,
    job.region?.cutout,
    job.prepared?.original,
    job.prepared?.cutout,
    job.prepared?.thumbnail,
    job.prepared?.enhanced,
    job.prepared?.studio,
  ];
}

function pieceFiles(piece: Piece): (string | null | undefined)[] {
  return [
    piece.photo,
    piece.original,
    piece.label?.photo,
    piece.variants?.enhanced,
    piece.variants?.plain,
    piece.variants?.studio,
  ];
}

export function filesInUse(closet: Closet): Set<string> {
  return new Set(
    [
      ...closet.imports.flatMap(jobFiles),
      ...closet.pieces.flatMap(pieceFiles),
    ].filter((file): file is string => Boolean(file)),
  );
}

export function closetFiles(closet: Closet): string[] {
  return [
    ...new Set([
      ...closet.imports.flatMap(jobFiles),
      ...closet.pieces.flatMap(pieceFiles),
    ]),
  ].filter(
    (file): file is string => typeof file === "string" && !isSamplePhoto(file),
  );
}

export function orphanedFiles(before: Closet, after: Closet): string[] {
  const kept = filesInUse(after);
  return [...new Set(before.imports.flatMap(jobFiles))].filter(
    (file): file is string => typeof file === "string" && !kept.has(file),
  );
}

export function pieceFromImport(job: ImportJob): Piece | null {
  if (job.state !== "ready" || !job.prepared || !job.kind || !job.name)
    return null;
  const useCutout = Boolean(job.prepared.cutout) && !job.keepOriginal;
  const enhanced = useCutout ? (job.prepared.enhanced ?? null) : null;
  const studio = enhanced ? (job.prepared.studio ?? null) : null;
  const cutoutPhoto =
    studio && job.variant === "studio"
      ? studio
      : enhanced && job.variant !== "plain"
        ? enhanced
        : job.prepared.cutout!;
  const styles = job.styles ?? fixedStyles(job.kind);
  const sources: Sources =
    job.sources ??
    (styles ? { kind: "proposed", styles: "proposed" } : { kind: "proposed" });
  const piece: Piece = {
    id: job.id,
    name: job.name,
    category: categoryOf(job.kind),
    kind: job.kind,
    ...(styles ? { styles } : {}),
    sources,
    photo: useCutout ? cutoutPhoto : job.prepared.original,
    ...(enhanced
      ? {
          variants: {
            enhanced,
            plain: job.prepared.cutout!,
            ...(studio ? { studio } : {}),
          },
        }
      : {}),
    original: job.prepared.original,
    ...(useCutout && job.prepared.frame ? { frame: job.prepared.frame } : {}),
    ...(enhanced && job.prepared.area ? { cutoutArea: job.prepared.area } : {}),
    createdAt: job.createdAt,
    source: "owned",
    ...(job.captureId ? { captureId: job.captureId } : {}),
  };
  const accepted: Piece = {
    ...withDetails(piece, {
      attributes: job.attributes,
      sources: job.attributeSources,
    }),
    ...(job.prepared.palette.length ? { colors: job.prepared.palette } : {}),
    ...(job.prepared.embedding ? { embedding: job.prepared.embedding } : {}),
  };
  return job.label ? withCareLabel(accepted, job.label) : accepted;
}

export function acceptImports(closet: Closet, only?: string[]): Closet {
  let next = closet;
  const accepted: string[] = [];
  const sets = new Map<string, string[]>();
  for (const job of closet.imports) {
    if (only && !only.includes(job.id)) continue;
    const piece = pieceFromImport(job);
    if (!piece) continue;
    if (!closet.pieces.some((item) => item.id === piece.id)) {
      next = savePiece(next, piece);
      if (job.keepAsSet && job.captureId)
        sets.set(job.captureId, [...(sets.get(job.captureId) ?? []), job.id]);
    }
    accepted.push(job.id);
  }
  for (const [captureId, ids] of sets)
    if (ids.length > 1) next = linkSet(next, ids, captureId);
  return settleWardrobe({
    ...next,
    imports: next.imports.filter((job) => !accepted.includes(job.id)),
  });
}

export function settleWardrobe(closet: Closet): Closet {
  if (closet.styling.wardrobe !== "sample") return closet;
  const owned = closet.pieces.filter(
    (piece) => piece.source === "owned" && isAvailable(piece),
  );
  if (
    missingRoles(owned, { hijab: closet.styling.everyday?.hijab ?? null })
      .length
  )
    return closet;
  return {
    ...closet,
    styling: { ...closet.styling, wardrobe: "owned", today: null },
  };
}

export function sameCapture(pieces: Piece[]): boolean {
  const captureId = pieces[0]?.captureId;
  return (
    Boolean(captureId) && pieces.every((piece) => piece.captureId === captureId)
  );
}

export type CaptureProgress = {
  total: number;
  ready: number;
  confirm: number;
  failed: number;
  done: boolean;
  byCategory: { category: Category; count: number }[];
};

export function captureProgress(closet: Closet): CaptureProgress | null {
  const jobs = closet.imports;
  if (!jobs.length) return null;
  const count = (state: ImportJob["state"]) =>
    jobs.filter((job) => job.state === state).length;
  const sorted = jobs.flatMap((job) =>
    job.kind && (job.state === "ready" || job.state === "review")
      ? [categoryOf(job.kind)]
      : [],
  );
  return {
    total: jobs.length,
    ready: count("ready"),
    confirm: count("review"),
    failed: count("failed"),
    done: jobs.every(isSettled),
    byCategory: categories.flatMap(({ id }) => {
      const found = sorted.filter((category) => category === id).length;
      return found ? [{ category: id, count: found }] : [];
    }),
  };
}

export function setKeepAsSet(
  closet: Closet,
  captureId: string,
  keep: boolean,
): Closet {
  return {
    ...closet,
    imports: closet.imports.map((job) => {
      if (job.captureId !== captureId) return job;
      const { keepAsSet: _keepAsSet, ...rest } = job;
      return keep ? { ...rest, keepAsSet: true } : rest;
    }),
  };
}

export const attributeRefreshVersion = 1;

export function piecesToRefresh(closet: Closet): Piece[] {
  if ((closet.attributeRefresh ?? 0) >= attributeRefreshVersion) return [];
  return closet.pieces.filter(
    (piece) => piece.source === "owned" && piece.embedding === undefined,
  );
}

export function refreshPiece(
  closet: Closet,
  id: string,
  prepared: Prepared,
): Closet {
  const piece = closet.pieces.find((item) => item.id === id);
  if (!piece) return closet;
  const proposal = proposeAttributes(prepared.labels, piece);
  const palette =
    piece.sources?.colour === "confirmed" && piece.colors?.[0]
      ? [piece.colors[0], ...prepared.palette.slice(1)]
      : prepared.palette;
  const next: Piece = {
    ...mergeProposal(piece, proposal.attributes),
    ...(palette.length ? { colors: palette } : {}),
    ...(prepared.embedding ? { embedding: prepared.embedding } : {}),
  };
  return {
    ...closet,
    pieces: closet.pieces.map((item) => (item.id === id ? next : item)),
  };
}

export function finishRefresh(closet: Closet): Closet {
  return { ...closet, attributeRefresh: attributeRefreshVersion };
}

import { adviceReason } from "./quality";
import {
  confirmAttribute,
  mergeProposal,
  withDetails,
  type AttributeKey,
  type AttributeValue,
  type Described,
} from "./attributes";
import {
  categoryOf,
  fixedStyles,
  kindLabel,
  savePiece,
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
import { categoryForRegion, type CapturePlan } from "./capture";
import { withCareLabel, type CareLabel } from "./careLabel";
import { colorName, type Swatch } from "./color";
import { attributeCheck, proposeAttributes, recognize } from "./recognition";

export type CheckReason =
  "uncertain" | "no-cutout" | "several" | "attribute" | "partial";

export function nameFor(kind: GarmentKind, palette: Swatch[]) {
  const top = palette[0];
  if (!top) return kindLabel(kind);
  return `${colorName(top.rgb)} ${kindLabel(kind).toLowerCase()}`;
}

export function queueImport(
  closet: Closet,
  job: Pick<ImportJob, "id" | "source" | "createdAt">,
): Closet {
  if (closet.imports.some((item) => item.id === job.id)) return closet;
  return {
    ...closet,
    imports: [...closet.imports, { ...job, state: "queued", attempts: 0 }],
  };
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
    if (!job.prepared) return job;
    const reason = adviceReason(job.prepared.quality);
    const advice =
      reason && !job.adviceShown?.includes(reason) ? reason : undefined;
    return { ...job, advice };
  });
}

export function finishImport(
  closet: Closet,
  id: string,
  prepared: Prepared,
): Closet {
  const next = updateJob(closet, id, (job) => {
    if (job.state !== "preparing") return job;
    const recognition = recognize(
      prepared.labels,
      (job.region && categoryForRegion(job.region.kind)) ?? undefined,
    );
    const checks: CheckReason[] = [];
    if (recognition.question) checks.push("uncertain");
    if (!prepared.cutout) checks.push("no-cutout");
    if (prepared.instances > 1) checks.push("several");
    const base: Described = {
      category: recognition.category,
      kind: recognition.kind,
    };
    const details = proposeAttributes(prepared.labels, base);
    const asked = attributeCheck(details, checks.includes("uncertain"));
    if (asked) checks.push("attribute");
    const described = mergeProposal(base, details.attributes);
    const styles = recognition.styles.length ? recognition.styles : undefined;
    const sources: Sources = styles
      ? { kind: "proposed", styles: "proposed" }
      : { kind: "proposed" };
    if (job.region?.partial && !checks.includes("partial"))
      checks.push("partial");
    return {
      ...job,
      state: checks.length ? "review" : "ready",
      prepared,
      kind: recognition.kind,
      name: nameFor(recognition.kind, prepared.palette),
      styles,
      question: recognition.question ?? undefined,
      sources,
      attributes: described.attributes,
      attributeSources: described.sources,
      attributeCheck: asked ?? undefined,
      checks,
      error: undefined,
    };
  });
  return next === closet ? closet : reviewCapture(next, id);
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

export function failImport(closet: Closet, id: string, error: string): Closet {
  return updateJob(closet, id, (job) =>
    job.state === "preparing" ? { ...job, state: "failed", error } : job,
  );
}

export function retryImport(closet: Closet, id: string): Closet {
  return updateJob(closet, id, (job) =>
    job.state === "failed"
      ? { ...job, state: "queued", error: undefined }
      : job,
  );
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
  },
): Closet {
  return updateJob(closet, id, (job) => {
    if (job.state !== "ready" && job.state !== "review") return job;
    const kind = change.kind ?? job.kind!;
    const fixed = fixedStyles(kind);
    const previous = fixedStyles(job.kind!) ? undefined : job.styles;
    const styles = fixed ?? (change.styles?.length ? change.styles : previous);
    const renamed =
      change.name ??
      (change.kind && job.name === nameFor(job.kind!, job.prepared!.palette)
        ? nameFor(kind, job.prepared!.palette)
        : job.name!);
    const sources: Sources = {
      kind: change.kind ? "confirmed" : (job.sources?.kind ?? "proposed"),
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
      kind,
      styles,
      name: renamed,
      attributes: described.attributes,
      attributeSources: described.sources,
      attributeCheck: undefined,
      keepOriginal: change.keepOriginal ?? job.keepOriginal,
      variant: change.variant ?? job.variant,
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

export function removeImport(closet: Closet, id: string): Closet {
  return updateJob(closet, id, () => null);
}

export function fileStem(source: string): string {
  return source.replace(/-original(\.[^.]*)?$/, "").replace(/\.[^.]*$/, "");
}

export function jobStem(job: ImportJob): string {
  return job.region || job.crop ? job.id : fileStem(job.source);
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
        ...people,
      }))
    : [{ ...job, state: "queued", captureId: id, ...people }];
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

export function cropCapture(closet: Closet, id: string, crop: Frame): Closet {
  return updateJob(closet, id, (job) =>
    job.captureId && ["ready", "review", "failed"].includes(job.state)
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
          crop,
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
  ];
}

function pieceFiles(piece: Piece): (string | null | undefined)[] {
  return [
    piece.photo,
    piece.original,
    piece.label?.photo,
    piece.variants?.enhanced,
    piece.variants?.plain,
  ];
}

export function orphanedFiles(before: Closet, after: Closet): string[] {
  const kept = new Set([
    ...after.imports.flatMap(jobFiles),
    ...after.pieces.flatMap(pieceFiles),
  ]);
  return [...new Set(before.imports.flatMap(jobFiles))].filter(
    (file): file is string => Boolean(file) && !kept.has(file),
  );
}

export function pieceFromImport(job: ImportJob): Piece | null {
  if (job.state !== "ready" || !job.prepared || !job.kind || !job.name)
    return null;
  const useCutout = Boolean(job.prepared.cutout) && !job.keepOriginal;
  const enhanced = useCutout ? (job.prepared.enhanced ?? null) : null;
  const cutoutPhoto =
    enhanced && job.variant !== "plain" ? enhanced : job.prepared.cutout!;
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
      ? { variants: { enhanced, plain: job.prepared.cutout! } }
      : {}),
    original: job.prepared.original,
    ...(useCutout && job.prepared.frame ? { frame: job.prepared.frame } : {}),
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

export function acceptImports(closet: Closet): Closet {
  let next = closet;
  const accepted: string[] = [];
  for (const job of closet.imports) {
    const piece = pieceFromImport(job);
    if (!piece) continue;
    if (!closet.pieces.some((item) => item.id === piece.id))
      next = savePiece(next, piece);
    accepted.push(job.id);
  }
  return {
    ...next,
    imports: next.imports.filter((job) => !accepted.includes(job.id)),
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
  const next: Piece = {
    ...mergeProposal(piece, proposal.attributes),
    ...(prepared.palette.length ? { colors: prepared.palette } : {}),
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

import {
  categoryOf,
  fixedStyles,
  kindLabel,
  savePiece,
  type Closet,
  type GarmentKind,
  type ImportJob,
  type Piece,
  type Prepared,
  type Sources,
  type Style,
} from "./closet";
import { colorName, type Swatch } from "./color";
import { recognize } from "./recognition";

export type CheckReason = "uncertain" | "no-cutout" | "several" | "attribute";

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

export function finishImport(
  closet: Closet,
  id: string,
  prepared: Prepared,
): Closet {
  return updateJob(closet, id, (job) => {
    if (job.state !== "preparing") return job;
    const recognition = recognize(prepared.labels);
    const checks: CheckReason[] = [];
    if (recognition.question) checks.push("uncertain");
    if (!prepared.cutout) checks.push("no-cutout");
    if (prepared.instances > 1) checks.push("several");
    const styles = recognition.styles.length ? recognition.styles : undefined;
    const sources: Sources = styles
      ? { kind: "proposed", styles: "proposed" }
      : { kind: "proposed" };
    return {
      ...job,
      state: checks.length ? "review" : "ready",
      prepared,
      kind: recognition.kind,
      name: nameFor(recognition.kind, prepared.palette),
      styles,
      question: recognition.question ?? undefined,
      sources,
      checks,
      error: undefined,
    };
  });
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
    return {
      ...job,
      kind,
      styles,
      name: renamed,
      keepOriginal: change.keepOriginal ?? job.keepOriginal,
      sources,
      question: undefined,
      checks: [],
      state: "ready",
    };
  });
}

export function removeImport(closet: Closet, id: string): Closet {
  return updateJob(closet, id, () => null);
}

export function pieceFromImport(job: ImportJob): Piece | null {
  if (job.state !== "ready" || !job.prepared || !job.kind || !job.name)
    return null;
  const useCutout = Boolean(job.prepared.cutout) && !job.keepOriginal;
  const styles = job.styles ?? fixedStyles(job.kind);
  const sources: Sources =
    job.sources ??
    (styles ? { kind: "proposed", styles: "proposed" } : { kind: "proposed" });
  return {
    id: job.id,
    name: job.name,
    category: categoryOf(job.kind),
    kind: job.kind,
    ...(styles ? { styles } : {}),
    sources,
    photo: useCutout ? job.prepared.cutout! : job.prepared.original,
    original: job.prepared.original,
    ...(useCutout && job.prepared.frame ? { frame: job.prepared.frame } : {}),
    createdAt: job.createdAt,
    source: "owned",
  };
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

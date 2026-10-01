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
import { recognize } from "./recognition";

const palette: [string, number, number, number][] = [
  ["Black", 25, 25, 27],
  ["Charcoal", 62, 62, 64],
  ["Grey", 128, 128, 128],
  ["Light grey", 195, 195, 195],
  ["White", 248, 248, 246],
  ["Ivory", 236, 231, 218],
  ["Beige", 214, 198, 176],
  ["Camel", 193, 154, 107],
  ["Taupe", 142, 120, 106],
  ["Brown", 110, 75, 50],
  ["Chocolate", 78, 52, 42],
  ["Navy", 35, 45, 75],
  ["Blue", 50, 90, 170],
  ["Sky blue", 140, 180, 220],
  ["Teal", 30, 110, 115],
  ["Green", 50, 120, 70],
  ["Sage", 160, 170, 145],
  ["Olive", 107, 108, 78],
  ["Mustard", 200, 160, 50],
  ["Yellow", 235, 205, 70],
  ["Orange", 225, 120, 45],
  ["Rust", 165, 75, 45],
  ["Red", 190, 35, 40],
  ["Burgundy", 110, 30, 45],
  ["Pink", 230, 140, 170],
  ["Blush", 225, 185, 180],
  ["Mauve", 153, 108, 115],
  ["Lavender", 180, 160, 210],
  ["Purple", 110, 60, 130],
  ["Plum", 95, 50, 75],
];

function lab([r, g, b]: [number, number, number]) {
  const linear = (value: number) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [lr, lg, lb] = [linear(r), linear(g), linear(b)];
  const x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047;
  const y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722;
  const z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

const paletteLab = palette.map(([name, r, g, b]) => ({
  name,
  lab: lab([r, g, b]),
}));

export function colorName(rgb: [number, number, number]) {
  const target = lab(rgb);
  let best = paletteLab[0]!;
  let distance = Infinity;
  for (const entry of paletteLab) {
    const d = Math.hypot(
      entry.lab[0]! - target[0]!,
      entry.lab[1]! - target[1]!,
      entry.lab[2]! - target[2]!,
    );
    if (d < distance) {
      distance = d;
      best = entry;
    }
  }
  return best.name;
}

export type CheckReason = "uncertain" | "no-cutout" | "several";

export function nameFor(kind: GarmentKind, color: Prepared["color"]) {
  const label = kindLabel(kind).toLowerCase();
  if (!color) return kindLabel(kind);
  const shade = colorName(color);
  return `${shade} ${label}`;
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
      name: nameFor(recognition.kind, prepared.color),
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
      (change.kind && job.name === nameFor(job.kind!, job.prepared!.color)
        ? nameFor(kind, job.prepared!.color)
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

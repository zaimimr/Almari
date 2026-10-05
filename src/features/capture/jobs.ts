import {
  colorName,
  colourNames,
  mainColourName,
  namedSwatch,
} from "../../domain/color";
import { categoryOf, type ImportJob, type Piece } from "../../domain/closet";
import { t } from "../../i18n";
import type { TileState } from "../../ui";
import { colourLabel } from "../ColourChips";

export const hexOf = (name: string) =>
  `#${namedSwatch(name)
    .rgb.map((part) => part.toString(16).padStart(2, "0"))
    .join("")}`;

export function jobColour(job: ImportJob): string | null {
  if (job.colour) return job.colour;
  const main = mainColourName(job.prepared?.palette);
  return colourNames.find((name) => name.toLowerCase() === main) ?? null;
}

export function jobColours(job: ImportJob): string[] {
  return [
    ...new Set(
      (job.prepared?.palette ?? []).map((swatch) => colorName(swatch.rgb)),
    ),
  ].slice(0, 5);
}

export function jobPhoto(job: ImportJob): { photo: string; raw: boolean } {
  const prepared = job.prepared;
  if (!prepared)
    return { photo: job.region?.cutout ?? job.source, raw: !job.region };
  if (!prepared.cutout || job.keepOriginal || job.state === "failed")
    return { photo: prepared.original, raw: true };
  const enhanced = prepared.enhanced ?? null;
  const photo =
    job.variant === "studio" && prepared.studio
      ? prepared.studio
      : enhanced && job.variant !== "plain"
        ? enhanced
        : prepared.cutout;
  return { photo, raw: false };
}

export function jobPiece(job: ImportJob): Piece {
  return {
    id: job.id,
    name: job.name ?? "",
    category: job.kind ? categoryOf(job.kind) : "top",
    ...(job.kind ? { kind: job.kind } : {}),
    photo: jobPhoto(job).photo,
    createdAt: job.createdAt,
    source: "owned",
    ...(job.prepared?.palette.length ? { colors: job.prepared.palette } : {}),
  };
}

export function tileState(job: ImportJob): TileState {
  switch (job.state) {
    case "queued":
      return "queued";
    case "preparing":
      return "preparing";
    case "review":
      return "needsAnswers";
    case "failed":
      return "failed";
    default:
      return "ready";
  }
}

const stateKeys = {
  queued: "capture.stateQueued",
  preparing: "capture.statePreparing",
  ready: "capture.stateReady",
  review: "capture.stateConfirm",
  failed: "capture.stateFailed",
} as const;

export function jobName(job: ImportJob, number: number) {
  return job.name ?? t("capture.photoNumber", { number });
}

export function jobLabel(job: ImportJob, number: number) {
  const colour = job.state === "ready" ? jobColour(job) : null;
  return t("capture.jobLabel", {
    name: jobName(job, number),
    colour: colour ? colourLabel(colour) : "",
    state: t(stateKeys[job.state]),
  }).replace(", , ", ", ");
}

export function isGrouped(job: ImportJob) {
  return Boolean(job.captureId && (job.region || job.crop));
}

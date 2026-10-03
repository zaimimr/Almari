import type { Length, Sleeve } from "./attributes";
import type { CoverageNeed, HemNeed, Piece, SleeveNeed } from "./closet";
import { t, type Key } from "../i18n";
import type { Problem } from "./styling";
import type { Confirmation } from "./wardrobe";

export type Evidence = "yes" | "no" | "unknown";

export type Worn = {
  main?: Piece;
  bottom?: Piece;
  layer?: Piece;
  outer?: Piece;
};

export type Question =
  | { kind: "see-through"; sheer: boolean; open: boolean }
  | { kind: "sleeve"; proposed: Sleeve | null }
  | { kind: "length"; proposed: Length | null };

export type Answer = { sheer?: boolean; open?: boolean };

const choice = <T extends string>(id: T, key: Key) => ({
  id,
  get label() {
    return t(key);
  },
});

export const sleeveChoices: { id: Sleeve; label: string }[] = [
  choice("sleeveless", "value.sleeve.sleeveless"),
  choice("short", "value.sleeve.short"),
  choice("elbow", "value.sleeve.elbow"),
  choice("long", "value.sleeve.long"),
];

export const lengthChoices: { id: Length; label: string }[] = [
  choice("hip", "value.length.hip"),
  choice("thigh", "value.length.thigh"),
  choice("knee", "value.length.knee"),
  choice("calf", "value.length.calf"),
  choice("ankle", "value.length.ankle"),
];

const sleeveRank: Record<Sleeve, number> = {
  sleeveless: 0,
  short: 1,
  elbow: 2,
  long: 3,
};

const lengthRank: Record<Length, number> = {
  hip: 0,
  thigh: 1,
  knee: 2,
  calf: 3,
  ankle: 4,
};

const sheerFabrics: string[] = ["chiffon", "organza", "net"];

export function confirmedSleeve(piece: Piece) {
  return piece.sources?.sleeve === "proposed"
    ? undefined
    : piece.attributes?.sleeve;
}

export function confirmedLength(piece: Piece) {
  return piece.sources?.length === "proposed"
    ? undefined
    : piece.attributes?.length;
}

export function opacity(piece: Piece): Evidence {
  const sheer = piece.attributes?.sheer;
  if (sheer !== undefined && piece.sources?.sheer !== "proposed")
    return sheer ? "no" : "yes";
  return sheerFabrics.includes(piece.attributes?.fabric ?? "")
    ? "unknown"
    : "yes";
}

function openUnknown(piece: Piece) {
  return (
    piece.kind === "abaya" &&
    (piece.traits?.open === undefined || piece.sources?.open === "proposed")
  );
}

function reaches(
  piece: Piece,
  rank: number | undefined,
  need: number,
): Evidence {
  const cover = opacity(piece);
  if (cover === "no" || (rank !== undefined && rank < need)) return "no";
  if (rank === undefined || cover === "unknown") return "unknown";
  return "yes";
}

export function sleeveEvidence(
  piece: Piece,
  need: Exclude<SleeveNeed, "any">,
): Evidence {
  const sleeve = confirmedSleeve(piece);
  return reaches(
    piece,
    sleeve === undefined ? undefined : sleeveRank[sleeve],
    sleeveRank[need],
  );
}

export function hemEvidence(
  piece: Piece,
  need: Exclude<HemNeed, "any">,
): Evidence {
  if (piece.category === "bottom" && piece.kind !== "skirt")
    return opacity(piece);
  const length = confirmedLength(piece);
  return reaches(
    piece,
    length === undefined ? undefined : lengthRank[length],
    lengthRank[need],
  );
}

type Found =
  { state: "yes" } | { state: "no" } | { state: "unknown"; piece: Piece };

function decide(entries: [Piece, Evidence][]): Found {
  if (entries.some(([, evidence]) => evidence === "yes"))
    return { state: "yes" };
  const unsure = entries.find(([, evidence]) => evidence === "unknown");
  return unsure ? { state: "unknown", piece: unsure[0] } : { state: "no" };
}

function unsure(piece: Piece, ask: "sleeve" | "length"): Problem {
  const name = piece.name;
  const message =
    opacity(piece) === "unknown"
      ? t(ask === "sleeve" ? "coverage.sheerSleeves" : "coverage.sheerLength", {
          name,
        })
      : ask === "length" && openUnknown(piece)
        ? t("coverage.openLength", { name })
        : t(
            ask === "sleeve"
              ? "coverage.sleeveUnknown"
              : "coverage.lengthUnknown",
            { name },
          );
  return {
    code: "coverage-unknown",
    severity: "review",
    message,
    ids: [piece.id],
    actions: [{ type: "check-piece", id: piece.id, ask }],
  };
}

function uncovered(message: string): Problem {
  return {
    code: "coverage",
    severity: "missing",
    message,
    ids: [],
    actions: [],
  };
}

export function coverageProblems(
  worn: Worn,
  coverage: CoverageNeed | undefined,
): Problem[] {
  const problems: Problem[] = [];
  const sleeve = coverage?.sleeve;
  if (sleeve && sleeve !== "any") {
    const entries: [Piece, Evidence][] = [];
    for (const piece of [worn.main, worn.layer])
      if (piece) entries.push([piece, sleeveEvidence(piece, sleeve)]);
    const found = decide(entries);
    if (found.state === "unknown") problems.push(unsure(found.piece, "sleeve"));
    if (found.state === "no")
      problems.push(
        uncovered(
          t(
            sleeve === "long"
              ? "coverage.noSleevesWrist"
              : "coverage.noSleevesElbow",
          ),
        ),
      );
  }
  const hem = coverage?.hem;
  if (hem && hem !== "any") {
    const entries: [Piece, Evidence][] = [];
    if (worn.bottom) entries.push([worn.bottom, hemEvidence(worn.bottom, hem)]);
    if (worn.main?.category === "dress")
      entries.push([worn.main, hemEvidence(worn.main, hem)]);
    if (
      worn.outer &&
      openUnknown(worn.outer) &&
      hemEvidence(worn.outer, hem) !== "no"
    )
      entries.push([worn.outer, "unknown"]);
    const found = decide(entries);
    if (found.state === "unknown") problems.push(unsure(found.piece, "length"));
    if (found.state === "no")
      problems.push(
        uncovered(
          t(hem === "ankle" ? "coverage.noHemAnkle" : "coverage.noHemCalf"),
        ),
      );
  }
  return problems;
}

export function coverageQuestion(
  piece: Piece,
  ask: "sleeve" | "length",
): Question | null {
  const sheer = opacity(piece) === "unknown";
  const open = ask === "length" && openUnknown(piece);
  if (sheer || open) return { kind: "see-through", sheer, open };
  if (ask === "sleeve" && confirmedSleeve(piece) === undefined)
    return { kind: "sleeve", proposed: piece.attributes?.sleeve ?? null };
  if (ask === "length" && confirmedLength(piece) === undefined)
    return { kind: "length", proposed: piece.attributes?.length ?? null };
  return null;
}

export function seeThroughChoices(
  question: Extract<Question, { kind: "see-through" }>,
): { id: string; label: string; answer: Answer }[] {
  if (question.sheer && question.open)
    return [
      {
        id: "neither",
        label: t("coverage.neither"),
        answer: { sheer: false, open: false },
      },
      {
        id: "sheer",
        label: t("coverage.seeThrough"),
        answer: { sheer: true, open: false },
      },
      {
        id: "open",
        label: t("coverage.opensFront"),
        answer: { sheer: false, open: true },
      },
      {
        id: "both",
        label: t("coverage.both"),
        answer: { sheer: true, open: true },
      },
    ];
  if (question.open)
    return [
      {
        id: "closed",
        label: t("coverage.closedFront"),
        answer: { open: false },
      },
      { id: "open", label: t("coverage.opensFront"), answer: { open: true } },
    ];
  return [
    {
      id: "opaque",
      label: t("coverage.notSeeThrough"),
      answer: { sheer: false },
    },
    { id: "sheer", label: t("coverage.seeThrough"), answer: { sheer: true } },
  ];
}

export function seeThroughConfirmation(answer: Answer): Confirmation {
  return {
    ...(answer.sheer === undefined
      ? {}
      : { attributes: { sheer: answer.sheer } }),
    ...(answer.open === undefined ? {} : { traits: { open: answer.open } }),
  };
}

export function questionText(piece: Piece, question: Question) {
  const name = piece.name;
  switch (question.kind) {
    case "see-through":
      return question.sheer && question.open
        ? t("coverage.askBoth", { name })
        : question.open
          ? t("coverage.askOpen", { name })
          : t("coverage.askSheer", { name });
    case "sleeve":
      return t("coverage.askSleeve", { name });
    case "length":
      return t("coverage.askLength", { name });
  }
}

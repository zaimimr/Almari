import {
  categories,
  fixedStyles,
  kindsIn,
  offeredKinds,
  type Category,
  type GarmentKind,
  type LabelGroup,
  type LabelScore,
  type Style,
} from "./taxonomy";
import {
  applicableAttributes,
  choices,
  formalityFor,
  type AttributeKey,
  type Attributes,
  type ChoiceKey,
} from "./attributes";
import type { Piece, QuickCheck, Sources } from "./closet";

export const margin = 0.01;
const scale = 100;
const missing = -2;
const styleIds: Style[] = ["desi", "western"];

export type Recognition = {
  category: Category;
  kind: GarmentKind;
  styles: Style[];
  question: QuickCheck | null;
};

function scoresFor(labels: LabelScore[], group: LabelGroup) {
  const scores = new Map<string, number>();
  for (const label of labels)
    if (label.group === group)
      scores.set(
        label.value,
        Math.max(scores.get(label.value) ?? missing, label.score),
      );
  return scores;
}

function kindScores(labels: LabelScore[]) {
  const scores = scoresFor(labels, "kind");
  return new Map(
    offeredKinds.flatMap((kind): [string, number][] => {
      const score = scores.get(kind.id);
      return score === undefined ? [] : [[kind.id, score]];
    }),
  );
}

function pooled(scores: number[]) {
  const top = Math.max(...scores);
  const total = scores.reduce(
    (sum, score) => sum + Math.exp(scale * (score - top)),
    0,
  );
  return top + Math.log(total) / scale;
}

function categoryScores(labels: LabelScore[]) {
  const kinds = kindScores(labels);
  const scores = new Map<string, number>();
  for (const category of categories) {
    const inside = kindsIn(category.id).flatMap((kind) => {
      const score = kinds.get(kind.id);
      return score === undefined ? [] : [score];
    });
    if (inside.length) scores.set(category.id, pooled(inside));
  }
  return scores;
}

function ranked<T extends string>(
  ids: readonly T[],
  scores: Map<string, number>,
): T[] {
  return [...ids].sort(
    (a, b) => (scores.get(b) ?? missing) - (scores.get(a) ?? missing),
  );
}

function close(scores: Map<string, number>, order: readonly string[]) {
  const first = order[0] === undefined ? undefined : scores.get(order[0]);
  const second = order[1] === undefined ? undefined : scores.get(order[1]);
  return (
    first === undefined || (second !== undefined && first - second < margin)
  );
}

export function rankCategories(labels: LabelScore[]): Category[] {
  return ranked(
    categories.map((category) => category.id),
    categoryScores(labels),
  );
}

export function rankKinds(
  labels: LabelScore[],
  category: Category,
): GarmentKind[] {
  return ranked(
    kindsIn(category).map((kind) => kind.id),
    kindScores(labels),
  );
}

function proposeStyles(labels: LabelScore[], kind: GarmentKind): Style[] {
  const fixed = fixedStyles(kind);
  if (fixed) return fixed;
  const scores = scoresFor(labels, "style");
  const best = ranked(styleIds, scores)[0]!;
  return scores.has(best) ? [best] : [];
}

function questionFor(
  labels: LabelScore[],
  known: Category | undefined,
  categoryOrder: Category[],
  kindOrder: GarmentKind[],
): QuickCheck | null {
  if (!known && close(categoryScores(labels), categoryOrder)) return "category";
  if (close(kindScores(labels), kindOrder)) return "subcategory";
  const styleScores = scoresFor(labels, "style");
  if (
    !fixedStyles(kindOrder[0]!) &&
    close(styleScores, ranked(styleIds, styleScores))
  )
    return "style";
  return null;
}

export function recognize(labels: LabelScore[], known?: Category): Recognition {
  const categoryOrder = rankCategories(labels);
  const category = known ?? categoryOrder[0]!;
  const kindOrder = rankKinds(labels, category);
  const kind = kindOrder[0]!;
  return {
    category,
    kind,
    styles: proposeStyles(labels, kind),
    question: questionFor(labels, known, categoryOrder, kindOrder),
  };
}

export function applyRecognition(piece: Piece, labels: LabelScore[]): Piece {
  if (!labels.some((label) => label.group === "kind")) return piece;
  const sources: Sources = { ...piece.sources };
  let next = piece;
  if (piece.kind === undefined || sources.kind === "proposed") {
    const recognition = recognize(
      labels,
      piece.kind === undefined ? piece.category : undefined,
    );
    next = { ...next, kind: recognition.kind, category: recognition.category };
    sources.kind = "proposed";
  }
  if (
    next.kind &&
    (piece.styles === undefined || sources.styles === "proposed")
  ) {
    const styles = proposeStyles(labels, next.kind);
    if (styles.length) {
      next = { ...next, styles };
      sources.styles = "proposed";
    }
  }
  return next === piece ? piece : { ...next, sources };
}

export function confirmEdits(before: Piece | undefined, after: Piece): Piece {
  const sources: Sources = { ...before?.sources };
  for (const key of ["kind", "styles"] as const) {
    if (JSON.stringify(before?.[key]) === JSON.stringify(after[key])) continue;
    if (after[key] === undefined) delete sources[key];
    else sources[key] = "confirmed";
  }
  const { sources: _previous, ...rest } = after;
  return Object.keys(sources).length ? { ...rest, sources } : rest;
}

export const askedAttributes: AttributeKey[] = ["length", "sleeve"];

export type AttributeProposal = {
  attributes: Attributes;
  uncertain: AttributeKey[];
};

export function proposeAttributes(
  labels: LabelScore[],
  piece: { category: Category; kind?: GarmentKind },
): AttributeProposal {
  const attributes: Attributes = {};
  const uncertain: AttributeKey[] = [];
  const allowed = applicableAttributes(piece.category, piece.kind);
  for (const key of Object.keys(choices) as ChoiceKey[]) {
    if (!allowed.includes(key)) continue;
    if (
      key === "scale" &&
      (!attributes.pattern || attributes.pattern === "solid")
    )
      continue;
    const ranked = labels
      .filter(
        (label) =>
          label.group === key &&
          choices[key].some((option) => option.id === label.value),
      )
      .sort((a, b) => b.score - a.score);
    const top = ranked[0];
    if (!top) continue;
    Object.assign(attributes, { [key]: top.value });
    if (ranked[1] && top.score - ranked[1].score < margin) uncertain.push(key);
  }
  attributes.formality = formalityFor({
    category: piece.category,
    kind: piece.kind,
    fabric: attributes.fabric,
    embellishment: attributes.embellishment,
  });
  return { attributes, uncertain };
}

export function attributeCheck(
  proposal: AttributeProposal,
  alreadyAsking: boolean,
): AttributeKey | null {
  if (alreadyAsking) return null;
  return (
    askedAttributes.find((key) => proposal.uncertain.includes(key)) ?? null
  );
}

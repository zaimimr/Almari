import type { InspirationAnalysis } from "../../modules/closet-vision/src/ClosetVision.types";
import type { Attributes } from "./attributes";
import { baseRequest } from "./builder";
import { categoryForRegion } from "./capture";
import {
  isAvailable,
  type Closet,
  type OutfitRequest,
  type Piece,
} from "./closet";
import { deltaE, toLab, type Swatch } from "./color";
import { similarity } from "./duplicates";
import { ruleAllows } from "./personalRules";
import { proposeAttributes, recognize } from "./recognition";
import { rulesScorer } from "./scoring/rulesScorer";
import { scoreContext } from "./scoring/taste";
import { styleOutfits, type Candidate } from "./styling";

export type InspirationGarment = Pick<
  Piece,
  "category" | "kind" | "attributes" | "embedding"
> & {
  palette: Swatch[];
  partial: boolean;
};

export type InspirationMatch = Candidate & { resemblance: number };

export function inspirationGarments(
  analysis: InspirationAnalysis,
): InspirationGarment[] {
  if (analysis.people > 1) return [];
  return analysis.garments.flatMap((garment) => {
    const kinds = garment.labels.filter((label) => label.group === "kind");
    if (!kinds.length || Math.max(...kinds.map((label) => label.score)) < 0.095)
      return [];
    const recognized = recognize(
      garment.labels,
      categoryForRegion(garment.region) ?? undefined,
    );
    if (
      !kinds.some(
        (label) => label.value === recognized.kind && label.score >= 0.095,
      )
    )
      return [];
    if (
      garment.region === "head" &&
      recognized.kind !== "hijab" &&
      recognized.kind !== "instant-hijab"
    )
      return [];
    const attributes = proposeAttributes(garment.labels, recognized).attributes;
    return [
      {
        category: recognized.category,
        kind: recognized.kind,
        attributes,
        palette: garment.palette,
        ...(garment.embedding ? { embedding: garment.embedding } : {}),
        partial: garment.partial,
      },
    ];
  });
}

function dominant(palette: Swatch[]) {
  return [...palette].sort((a, b) => b.share - a.share)[0];
}

function attributeResemblance(
  left: Attributes | undefined,
  right: Attributes | undefined,
) {
  const keys = ["length", "sleeve", "volume", "pattern", "fabric"] as const;
  const known = keys.filter((key) => left?.[key] && right?.[key]);
  if (!known.length) return null;
  return (
    known.filter((key) => left?.[key] === right?.[key]).length / known.length
  );
}

export function garmentResemblance(
  reference: InspirationGarment,
  piece: Piece,
): number {
  if (reference.category !== piece.category) return 0;
  const scores: { score: number; weight: number }[] = [];
  if (reference.kind && piece.kind)
    scores.push({ score: reference.kind === piece.kind ? 1 : 0.35, weight: 3 });
  const shape = reference.partial
    ? null
    : attributeResemblance(reference.attributes, piece.attributes);
  if (shape !== null) scores.push({ score: shape, weight: 2 });
  const left = dominant(reference.palette);
  const right = dominant(piece.colors ?? []);
  if (left && right)
    scores.push({
      score: Math.max(0, 1 - deltaE(toLab(left.rgb), toLab(right.rgb)) / 55),
      weight: 3,
    });
  if (reference.embedding && piece.embedding) {
    try {
      scores.push({
        score: Math.max(0, similarity(reference.embedding, piece.embedding)),
        weight: 4,
      });
    } catch {
      return 0;
    }
  }
  const weight = scores.reduce((total, part) => total + part.weight, 0);
  return weight
    ? scores.reduce((total, part) => total + part.score * part.weight, 0) /
        weight
    : 0;
}

function outfitResemblance(
  references: InspirationGarment[],
  pieces: Piece[],
): number {
  const used = new Set<string>();
  const scores = references.map((reference) => {
    const ranked = pieces
      .filter((piece) => !used.has(piece.id))
      .map((piece) => ({ piece, score: garmentResemblance(reference, piece) }))
      .sort((a, b) => b.score - a.score);
    const best = ranked[0];
    if (best && best.score > 0) used.add(best.piece.id);
    return best?.score ?? 0;
  });
  return scores.length
    ? scores.reduce((total, score) => total + score, 0) / scores.length
    : 0;
}

export function inspirationRequest(closet: Closet): OutfitRequest {
  return {
    ...baseRequest(closet),
    wardrobe: "owned",
    keptIds: [],
    excludedIds: [],
    garmentType: null,
  };
}

export function inspirationOutfits(
  closet: Closet,
  references: InspirationGarment[],
  date: string,
): InspirationMatch[] {
  if (
    !references.some((garment) =>
      ["top", "tunic", "dress", "bottom", "outer", "layer"].includes(
        garment.category,
      ),
    )
  )
    return [];
  const request = inspirationRequest(closet);
  const pool = closet.pieces.filter(
    (piece) =>
      piece.source === "owned" &&
      isAvailable(piece) &&
      ruleAllows(closet, request, date)(piece),
  );
  const result = styleOutfits(
    pool,
    request,
    `inspiration:${date}`,
    {
      score(pieces, current, context) {
        const styled = rulesScorer.score(pieces, current, context);
        return {
          ...styled,
          score: styled.score + outfitResemblance(references, pieces) * 20,
        };
      },
    },
    scoreContext(closet),
  );
  return result.outfits
    .filter(
      (outfit) =>
        !outfit.problems.some(
          (problem) =>
            problem.severity === "conflict" ||
            problem.severity === "missing" ||
            problem.code === "coverage-unknown",
        ),
    )
    .map((outfit) => ({
      ...outfit,
      resemblance: outfitResemblance(
        references,
        pool.filter((piece) => outfit.ids.includes(piece.id)),
      ),
    }))
    .filter((outfit) => outfit.resemblance >= 0.55)
    .sort((a, b) => b.resemblance - a.resemblance || b.score - a.score);
}

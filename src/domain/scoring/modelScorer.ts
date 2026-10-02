import type { Piece } from "../closet";
import { roleOf, type Role } from "../styling";
import compatHead from "./compat-head.json";
import sampleEmbeddings from "./sample-embeddings.json";
import { rulesScorer } from "./rulesScorer";
import type { Scorer } from "./types";

export type CompatHead = {
  version: number;
  dim: number;
  types: string[];
  projection: number[][];
  masks: Record<string, number[]>;
};

export type ModelItem = { embedding: string; type: string };

const embeddingLength = 768;
const samplePrefix = "sample:";

const modelTypes: Record<Role, string> = {
  main: "main",
  bottom: "bottom",
  layer: "outer",
  outer: "outer",
  hijab: "scarf",
  shoes: "shoes",
  bag: "bag",
  accessory: "accessory",
};

export function embeddingVector(text: string): Float64Array | null {
  let binary: string;
  try {
    binary = atob(text);
  } catch {
    return null;
  }
  if (binary.length !== embeddingLength) return null;
  const vector = new Float64Array(embeddingLength);
  let norm = 0;
  for (let index = 0; index < embeddingLength; index++) {
    const byte = binary.charCodeAt(index);
    const value = byte > 127 ? byte - 256 : byte;
    vector[index] = value;
    norm += value * value;
  }
  if (!norm) return null;
  const length = Math.sqrt(norm);
  return vector.map((value) => value / length);
}

export function embeddingOf(
  piece: Piece,
  samples: Record<string, string> = sampleEmbeddings,
): string | undefined {
  if (piece.embedding) return piece.embedding;
  if (piece.source !== "sample" || !piece.photo.startsWith(samplePrefix))
    return undefined;
  return samples[piece.photo.slice(samplePrefix.length)];
}

function project(head: CompatHead, text: string) {
  const vector = embeddingVector(text);
  if (!vector) return null;
  return head.projection.map((weights) =>
    weights.reduce((sum, weight, index) => sum + weight * vector[index]!, 0),
  );
}

function pairKey(head: CompatHead, first: string, second: string) {
  return head.types.indexOf(first) <= head.types.indexOf(second)
    ? `${first}|${second}`
    : `${second}|${first}`;
}

function similarity(first: number[], second: number[], mask: number[]) {
  let dot = 0;
  let left = 0;
  let right = 0;
  for (let index = 0; index < mask.length; index++) {
    const x = first[index]! * mask[index]!;
    const y = second[index]! * mask[index]!;
    dot += x * y;
    left += x * x;
    right += y * y;
  }
  return left && right ? dot / Math.sqrt(left * right) : 0;
}

export function compatibilityOf(
  head: CompatHead,
  items: ModelItem[],
  cache = new Map<string, number[] | null>(),
): number | null {
  const projected = items.map((item) => {
    if (!cache.has(item.embedding))
      cache.set(item.embedding, project(head, item.embedding));
    return cache.get(item.embedding)!;
  });
  if (projected.some((features) => !features)) return null;
  let total = 0;
  let count = 0;
  for (let first = 0; first < items.length; first++)
    for (let second = first + 1; second < items.length; second++) {
      total += similarity(
        projected[first]!,
        projected[second]!,
        head.masks[pairKey(head, items[first]!.type, items[second]!.type)]!,
      );
      count++;
    }
  return count ? total / count : 0;
}

export function createModelScorer(
  head: CompatHead,
  samples: Record<string, string>,
): Scorer {
  const cache = new Map<string, number[] | null>();
  return {
    id: "model",
    score(outfit, request, context) {
      const rules = rulesScorer.score(outfit, request, context);
      const value = compatibilityOf(
        head,
        outfit.map((piece) => ({
          embedding: embeddingOf(piece, samples) ?? "",
          type: modelTypes[roleOf(piece)],
        })),
        cache,
      );
      return value === null
        ? { ...rules, fallback: "missing-embedding" }
        : { score: value, reasons: rules.reasons };
    },
  };
}

export const modelScorer = createModelScorer(compatHead, sampleEmbeddings);

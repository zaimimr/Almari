import type { Closet } from "./closet";

export const duplicateAbove = 0.93;

export function decodeEmbedding(value: string): Int8Array {
  return Int8Array.from(atob(value), (char) => char.charCodeAt(0));
}

export function similarity(a: string, b: string): number {
  const left = decodeEmbedding(a);
  const right = decodeEmbedding(b);
  if (!left.length || left.length !== right.length) return 0;
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index++) {
    const x = left[index]!;
    const y = right[index]!;
    dot += x * y;
    leftNorm += x * x;
    rightNorm += y * y;
  }
  return leftNorm && rightNorm ? dot / Math.sqrt(leftNorm * rightNorm) : 0;
}

export function findDuplicate(
  closet: Closet,
  jobId: string,
  embedding: string | null | undefined,
): string | null {
  if (!embedding) return null;
  const position = closet.imports.findIndex((job) => job.id === jobId);
  const current = closet.imports[position];
  const captureId = current?.captureId;
  const elsewhere = (item: { captureId?: string }) =>
    !captureId || item.captureId !== captureId;
  const earlier =
    position < 0
      ? []
      : closet.imports
          .slice(0, position)
          .filter((job) => elsewhere(job) || job.source !== current!.source);
  const candidates = [
    ...closet.pieces
      .filter((piece) => piece.source === "owned" && elsewhere(piece))
      .map((piece) => ({ id: piece.id, embedding: piece.embedding })),
    ...earlier.map((job) => ({
      id: job.id,
      embedding: job.prepared?.embedding,
    })),
  ];
  let best: string | null = null;
  let bestScore = duplicateAbove;
  for (const candidate of candidates) {
    if (!candidate.embedding || candidate.id === jobId) continue;
    const score = similarity(embedding, candidate.embedding);
    if (score > bestScore) {
      best = candidate.id;
      bestScore = score;
    }
  }
  return best;
}

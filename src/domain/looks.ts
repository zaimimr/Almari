import type { Closet, Occasion } from "./closet";
import { outfitName, type NameLocale } from "./outfitName";

export type LookEntry = {
  id: string;
  name: string;
  occasion: Occasion | null;
  pieceIds: string[];
  at: string;
  saved: boolean;
};

const sameSet = (ids: string[]) => [...ids].sort().join();

export function lookEntries(closet: Closet, locale: NameLocale): LookEntry[] {
  const saved: LookEntry[] = closet.looks.map((look) => ({
    id: look.id,
    name: look.name,
    occasion: look.occasion ?? null,
    pieceIds: look.pieceIds,
    at: look.createdAt,
    saved: true,
  }));
  const seen = new Set(saved.map((entry) => sameSet(entry.pieceIds)));
  const worn: LookEntry[] = [];
  for (const event of [...closet.feedback].reverse()) {
    if (event.kind !== "wore" || event.undone) continue;
    const key = sameSet(event.pieceIds);
    if (seen.has(key)) continue;
    const pieces = event.pieceIds.flatMap((id) => {
      const piece = closet.pieces.find((item) => item.id === id);
      return piece ? [piece] : [];
    });
    if (!pieces.length) continue;
    seen.add(key);
    worn.push({
      id: `worn-${event.id}`,
      name: outfitName(pieces, event.request.occasion, locale),
      occasion: event.request.occasion,
      pieceIds: event.pieceIds,
      at: event.at,
      saved: false,
    });
  }
  return [...worn, ...saved].sort((a, b) => b.at.localeCompare(a.at));
}

import { emptyCloset, savePiece, type Closet, type Piece } from "./closet";
import { addSampleWardrobe } from "./samples";
import { clockFor, saveEverydayStyle } from "./today";

export const oslo = "Europe/Oslo";
export const at = (iso: string) => clockFor(new Date(iso), oslo);
export function piece(
  id: string,
  category: Piece["category"],
  extra: Partial<Piece> = {},
): Piece {
  return {
    id,
    name: id,
    category,
    photo: `${id}.png`,
    createdAt: "2026-09-01T08:00:00.000Z",
    source: "owned",
    ...extra,
  };
}
export function ownedCloset(
  pieces: Piece[],
  base: Closet = emptyCloset,
): Closet {
  return pieces.reduce<Closet>((closet, item) => savePiece(closet, item), {
    ...base,
    styling: { ...base.styling, wardrobe: "owned" as const },
  });
}
export function styledSample(iso = "2026-10-02T08:00:00+02:00"): Closet {
  return saveEverydayStyle(
    addSampleWardrobe(emptyCloset),
    { occasion: "everyday", style: "western", hijab: "always", sample: true },
    at(iso),
    true,
  );
}

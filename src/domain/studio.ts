import type { Piece } from "./closet";

export function studioDetails(
  item: Pick<Piece, "attributes" | "sources">,
): string | undefined {
  const details = Object.entries(item.attributes ?? {})
    .filter(
      ([key, value]) =>
        value !== undefined &&
        key !== "formality" &&
        item.sources?.[key as keyof NonNullable<Piece["sources"]>] !==
          "proposed",
    )
    .map(([key, value]) => `${key}: ${value}`);
  return details.length ? details.join(", ") : undefined;
}

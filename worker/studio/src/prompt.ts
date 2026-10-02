import type { Category, StudioRequest } from "./request";

const nouns: Record<Category, string> = {
  hijab: "hijab",
  top: "top",
  tunic: "tunic",
  bottom: "bottoms",
  dress: "dress",
  layer: "outer layer",
  shoes: "shoes",
  bag: "bag",
  accessory: "accessory",
};

const ghost =
  "a ghost mannequin shot, front view, with a natural three dimensional shape and no visible mannequin";

const layouts: Record<Category, string> = {
  hijab:
    "a flat lay seen from directly above, neatly folded so the fabric and both ends show",
  top: ghost,
  tunic: ghost,
  dress: ghost,
  layer: ghost,
  bottom: "a flat lay seen from directly above, front facing, neatly laid out",
  shoes:
    "a product shot at a slight three quarter angle, standing on the surface",
  bag: "a product shot from the front, standing upright",
  accessory: "a flat lay seen from directly above, neatly arranged",
};

export function studioPrompt({
  category,
  kind,
  name,
  colour,
}: Omit<StudioRequest, "image">): string {
  const type = kind ? kind.replaceAll("-", " ") : nouns[category];
  return [
    "Turn this photo into a professional studio product photo of the exact same garment.",
    `Garment type: ${type} (${nouns[category]}). It must stay ${type}. Never turn it into another kind of clothing.`,
    name ? `The owner calls it "${name}".` : null,
    colour ? `Its main colour is ${colour}.` : null,
    "Keep the exact same colours, pattern, print, texture, fabric, length, cut, proportions, seams, buttons, pockets, embroidery and every other detail. Do not add or remove anything.",
    `Show it pressed and free of wrinkles as ${layouts[category]}.`,
    "Seamless soft white background, soft even studio light and a gentle natural shadow.",
    "No person, no body parts, no hands, no hanger and no props. Do not add any text, logos or watermarks.",
    "The whole item is centred and fully in frame with a small margin.",
  ]
    .filter(Boolean)
    .join(" ");
}

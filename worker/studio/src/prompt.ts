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

const layouts: Record<Category, string> = {
  hijab:
    "neatly arranged in a loose loop with softly draped ends; preserve fabric transparency, edge finish and natural folds",
  top: "a front-side-up overhead flat lay; neckline at the top, sleeves gently spread so the cut and cuffs remain visible",
  tunic:
    "a front-side-up overhead flat lay; neckline at the top, sleeves gently spread so the cut, cuffs and side slits remain visible, full original length visible",
  dress:
    "a front-side-up overhead flat lay; neckline at the top, sleeves gently spread, full original length and skirt shape visible",
  layer:
    "a front-facing catalogue arrangement with subtle natural volume; preserve the original closure state and show lapels, opening and sleeves clearly",
  bottom:
    "a front-side-up overhead flat lay; waistband at the top, legs naturally separated if it has legs, original length and leg or hem width preserved",
  shoes:
    "the supplied shoes side by side, seen from above, toes pointing upward; preserve each shoe's shape and details",
  bag: "upright at a slight three-quarter angle; show the front, handle and any attached strap clearly, preserving the original structure",
  accessory:
    "a neat overhead flat lay with the whole piece clearly visible, preserving its original shape",
};

export function studioPrompt({
  category,
  kind,
  colour,
}: Omit<StudioRequest, "image">): string {
  const type = kind ? kind.replaceAll("-", " ") : nouns[category];
  return [
    "Create a premium e-commerce catalogue photograph of the exact item shown in the source photo, suitable for a digital wardrobe.",
    `ITEM. Item category: ${type} (${nouns[category]}). It must stay ${type}. Never turn it into another kind of clothing. Preserve the item's original design. The source photo is the authority for its appearance.`,
    colour ? `Its main colour is ${colour}.` : null,
    "PRODUCT FIDELITY. Preserve the item's colour, pattern, print, fabric texture, sheen, transparency, silhouette, proportions and construction. Keep the original length, width, cut, sleeves, neckline, waistband, hems, seams, pockets, fastenings, embroidery and any existing logos or lettering. Do not redesign, embellish, simplify or substitute the item. Do not invent details that are not visible in the source. If presentation and fidelity conflict, prioritize fidelity.",
    `PREPARATION AND ARRANGEMENT. Remove the original background and any person, mannequin, hanger or unrelated objects. Arrange the item neatly as ${layouts[category]}. Smooth accidental wrinkles and handling creases while preserving intentional pleats, gathers, ruching, fabric texture and natural folds. Give the item a clean, balanced silhouette with subtle fabric volume. Do not stretch, slim, inflate or force it into perfect symmetry.`,
    "STUDIO STYLE. Use a seamless neutral white background with soft, diffuse, colour-neutral studio lighting. Keep the item's original colour without a warm or cool tint. Retain fine material detail and clear edges, including on white or pale fabrics. Use only a faint, soft contact shadow immediately beneath the item. No dramatic shadows, glossy floor, reflections, vignette or background texture. The result should look like a realistic professional product photograph.",
    "COMPOSITION. Show only this one item, including its attached components. Do not add any other clothing or items under, behind or around it. Centre the complete item on a square canvas with about 8 to 10 percent clear space around its outermost edges. Keep every part fully in frame. No additional clothing, styling accessories, props, people, body parts, hands, hangers, added text, added logos or watermarks.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

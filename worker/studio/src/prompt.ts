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

const scarf =
  "in a loose, open loop with softly draped ends. Show the fabric, borders and decorative details clearly. Preserve transparency and natural folds";
const top =
  "as a front-side-up overhead flat lay, neckline at the top and sleeves gently separated from the body. Preserve the original neckline, sleeve shape and closure state";
const tunic =
  "as a front-side-up overhead flat lay, neckline at the top and sleeves gently spread. Show the full hem, embroidery and visible side slits without shortening or widening the garment";
const trousers =
  "as a front-side-up overhead flat lay, waistband at the top and legs naturally separated. Preserve the original rise, length and leg width";
const skirt =
  "as a front-side-up overhead flat lay, waistband at the top. Arrange the skirt with a gentle natural spread that preserves its actual fullness, pleats and hem shape";
const dress =
  "as a front-side-up overhead flat lay, neckline at the top and sleeves gently separated. Preserve the full length, original skirt volume and natural drape without exaggerating the flare";
const layer =
  "as a front-side-up overhead flat lay with subtle natural volume. Show the collar or lapels clearly and preserve the closure state shown in the source. Separate sleeves gently where present";
const shoes =
  "neatly side by side, toes toward the top, photographed from above. Preserve the individual shape and details of each shoe. Show a pair only if both shoes are supplied";
const bag =
  "as an upright catalogue presentation at a slight three-quarter angle. Preserve the original structure. Arrange attached handles and straps neatly without hiding the bag or adding contents";

const categoryPoses: Record<Category, string> = {
  hijab: scarf,
  top,
  tunic,
  bottom: trousers,
  dress,
  layer,
  shoes,
  bag,
  accessory:
    "as a neat overhead product arrangement with the whole piece clearly visible, preserving its original shape",
};

const kindPoses: Record<string, string> = {
  "instant-hijab":
    "in its original shaped form, laid out with the face opening clearly visible. Preserve its stitched construction and attached sections",
  underscarf:
    "flat with its opening and original shape clearly visible. Do not stretch or inflate it",
  dupatta: scarf,
  shalwar:
    "as a front-side-up overhead flat lay, waistband at the top. Preserve the roomy upper shape, gathered fabric and narrowing toward the ankles",
  churidar:
    "as a front-side-up overhead flat lay, waistband at the top. Preserve the narrow legs, original length and characteristic ankle gathering where present",
  sharara:
    "as a front-side-up overhead flat lay, waistband at the top and legs gently separated. Preserve the original flare, panel construction and fullness",
  gharara:
    "as a front-side-up overhead flat lay, waistband at the top and legs gently separated. Preserve the original knee seams, gathers and flared lower sections",
  lehenga: skirt,
  skirt,
  boots:
    "side by side in a slightly angled catalogue view that clearly shows the full shafts, toes and heels. Preserve shaft height and structure",
  clutch:
    "with the main exterior face clearly visible, upright or lying flat as suits its construction. Preserve its shape, closure and any attached strap",
  jewellery:
    "as an overhead product arrangement with each supplied piece clearly visible. Gently extend chains without stretching them, preserve linked components and use soft lighting that retains the original metallic finish and stones",
  belt: "as an overhead flat lay in a loose oval or gentle curve, with the buckle and belt end visible. Preserve the original width, holes, hardware and material",
};

const fits: Record<string, { type: string; fit: string }> = {
  "wide-leg": { type: "trousers", fit: "wide-leg" },
};

export function studioPrompt({
  category,
  kind,
  colour,
}: Omit<StudioRequest, "image">): string {
  const fit = kind ? fits[kind] : undefined;
  const type =
    fit?.type ?? (kind ? kind.replaceAll("-", " ") : nouns[category]);
  const pose = (kind && kindPoses[kind]) ?? categoryPoses[category];
  return [
    "Create a premium e-commerce catalogue photograph of the exact item shown in the source photo, suitable for a digital wardrobe.",
    `ITEM. Item category: ${type} (${nouns[category]}).${fit ? ` Fit: ${fit.fit}.` : ""} It must stay ${type}. Never turn it into another kind of clothing. Preserve the item's original design. The source photo is the authority for its appearance.`,
    colour ? `Its main colour is ${colour}.` : null,
    "PRODUCT FIDELITY. Preserve the item's colour, pattern, print, fabric texture, sheen, transparency, silhouette, proportions and construction. Keep the original length, width, cut, sleeves, neckline, waistband, hems, seams, pockets, fastenings, embroidery and any existing logos or lettering. Do not redesign, embellish, simplify or substitute the item. Do not invent details that are not visible in the source. If the item is plain, keep it plain, with no added pattern, print or embroidery. If presentation and fidelity conflict, prioritize fidelity.",
    `PREPARATION AND ARRANGEMENT. Remove the original background and any person, mannequin, hanger or unrelated objects. Repair edges that were cut or damaged by background removal so the outline is complete and natural. Arrange the item neatly ${pose}. Smooth accidental wrinkles and handling creases while preserving intentional pleats, gathers, ruching, fabric texture and natural folds. Give the item a clean, balanced silhouette with subtle fabric volume. Do not stretch, slim, inflate or force it into perfect symmetry.`,
    "STUDIO STYLE. Use a seamless neutral white background with soft, diffuse, colour-neutral studio lighting. Keep the item's original colour without a warm or cool tint. Retain fine material detail and clear edges, including on white or pale fabrics. Use only a faint, soft contact shadow immediately beneath the item. No dramatic shadows, glossy floor, reflections, vignette or background texture. The result should look like a realistic professional product photograph.",
    "COMPOSITION. Show only the selected wardrobe item. Include its attached components and any matching pieces supplied as part of that item, such as a pair of shoes or earrings. Do not duplicate a single piece, invent a missing matching piece, or include unrelated garments or accessories under, behind or around it. Centre the complete item on a square canvas with about 8 to 10 percent clear space around its outermost edges. Keep every part fully in frame. No additional clothing, styling accessories, props, people, body parts, hands, hangers, added text, added logos or watermarks.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

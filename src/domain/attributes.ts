import { t } from "../i18n";
import type { Sources } from "./closet";
import type { Category, GarmentKind } from "./taxonomy";

export const lengths = [
  { id: "hip", label: "Hip" },
  { id: "thigh", label: "Thigh" },
  { id: "knee", label: "Knee" },
  { id: "calf", label: "Calf" },
  { id: "ankle", label: "Ankle" },
] as const;

export const sleeves = [
  { id: "sleeveless", label: "Sleeveless" },
  { id: "short", label: "Short" },
  { id: "elbow", label: "Elbow" },
  { id: "long", label: "Long" },
] as const;

export const volumes = [
  { id: "fitted", label: "Fitted" },
  { id: "straight", label: "Straight" },
  { id: "voluminous", label: "Voluminous" },
] as const;

export const patterns = [
  { id: "solid", label: "Solid" },
  { id: "print", label: "Print" },
  { id: "stripe", label: "Stripe" },
  { id: "check", label: "Check" },
  { id: "embroidered", label: "Embroidered" },
] as const;

export const patternScales = [
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
] as const;

export const fabrics = [
  { id: "lawn", label: "Lawn" },
  { id: "cotton", label: "Cotton" },
  { id: "linen", label: "Linen" },
  { id: "jersey", label: "Jersey" },
  { id: "modal", label: "Modal" },
  { id: "chiffon", label: "Chiffon" },
  { id: "silk", label: "Silk" },
  { id: "satin", label: "Satin" },
  { id: "velvet", label: "Velvet" },
  { id: "wool", label: "Wool" },
  { id: "knit", label: "Knit" },
  { id: "denim", label: "Denim" },
  { id: "khaddar", label: "Khaddar" },
  { id: "karandi", label: "Karandi" },
  { id: "organza", label: "Organza" },
  { id: "net", label: "Net" },
] as const;

export const embellishments = [
  { id: "none", label: "None" },
  { id: "light", label: "Light" },
  { id: "heavy", label: "Heavy" },
  { id: "bridal", label: "Bridal" },
] as const;

export const formalities = [
  { id: 1, label: "Casual" },
  { id: 2, label: "Smart" },
  { id: 3, label: "Dressy" },
  { id: 4, label: "Festive" },
  { id: 5, label: "Formal" },
  { id: 6, label: "Very formal" },
] as const;

export type Length = (typeof lengths)[number]["id"];
export type Sleeve = (typeof sleeves)[number]["id"];
export type Volume = (typeof volumes)[number]["id"];
export type Pattern = (typeof patterns)[number]["id"];
export type PatternScale = (typeof patternScales)[number]["id"];
export type Fabric = (typeof fabrics)[number]["id"];
export type Embellishment = (typeof embellishments)[number]["id"];
export type Formality = (typeof formalities)[number]["id"];

export type Attributes = {
  length?: Length;
  sleeve?: Sleeve;
  volume?: Volume;
  pattern?: Pattern;
  scale?: PatternScale;
  fabric?: Fabric;
  embellishment?: Embellishment;
  formality?: Formality;
  sheer?: boolean;
};

export const choices = {
  length: lengths,
  sleeve: sleeves,
  volume: volumes,
  pattern: patterns,
  scale: patternScales,
  fabric: fabrics,
  embellishment: embellishments,
} as const;

export type ChoiceKey = keyof typeof choices;
export type AttributeKey = ChoiceKey | "formality";
export type AttributeValue = NonNullable<Attributes[AttributeKey]>;

export const attributeKeys: AttributeKey[] = [
  "length",
  "sleeve",
  "volume",
  "pattern",
  "scale",
  "fabric",
  "embellishment",
  "formality",
];

export type Described = {
  category: Category;
  kind?: GarmentKind;
  attributes?: Attributes;
  sources?: Sources;
};

const garments: Category[] = [
  "hijab",
  "top",
  "tunic",
  "bottom",
  "dress",
  "layer",
];
const shaped: Category[] = ["top", "tunic", "dress", "layer"];

export function applicableAttributes(
  category: Category,
  kind?: GarmentKind,
): AttributeKey[] {
  const textile = garments.includes(category) || kind === "dupatta";
  return attributeKeys.filter((key) => {
    if (key === "formality") return true;
    if (key === "length" || key === "sleeve") return shaped.includes(category);
    if (key === "volume")
      return shaped.includes(category) || category === "bottom";
    return textile;
  });
}

const categoryFormality: Record<Category, Formality> = {
  hijab: 1,
  top: 1,
  tunic: 1,
  bottom: 1,
  dress: 2,
  layer: 2,
  shoes: 1,
  bag: 1,
  accessory: 1,
};

const kindFormality: Partial<Record<GarmentKind, Formality>> = {
  blouse: 2,
  shirt: 2,
  kurta: 2,
  kameez: 2,
  trousers: 2,
  anarkali: 4,
  sharara: 4,
  gharara: 4,
  lehenga: 5,
  blazer: 3,
  waistcoat: 2,
  loafers: 2,
  flats: 2,
  khussa: 2,
  heels: 3,
  handbag: 2,
  clutch: 4,
  jewellery: 3,
};

const dressyFabrics: Fabric[] = [
  "chiffon",
  "silk",
  "satin",
  "velvet",
  "organza",
  "net",
];
const casualFabrics: Fabric[] = ["jersey", "knit", "denim"];
const embellishmentSteps: Record<Embellishment, number> = {
  none: 0,
  light: 1,
  heavy: 2,
  bridal: 3,
};

export function formalityFor(piece: {
  category: Category;
  kind?: GarmentKind;
  fabric?: Fabric;
  embellishment?: Embellishment;
}): Formality {
  const base =
    (piece.kind && kindFormality[piece.kind]) ??
    categoryFormality[piece.category];
  const fabric = !piece.fabric
    ? 0
    : dressyFabrics.includes(piece.fabric)
      ? 1
      : casualFabrics.includes(piece.fabric)
        ? -1
        : 0;
  const shine = piece.embellishment
    ? embellishmentSteps[piece.embellishment]
    : 0;
  return Math.min(6, Math.max(1, base + fabric + shine)) as Formality;
}

export function optionsFor(
  key: AttributeKey,
): readonly { id: AttributeValue; label: string }[] {
  return key === "formality" ? formalities : choices[key];
}

export function isAttributeValue(
  key: AttributeKey,
  value: unknown,
): value is AttributeValue {
  return optionsFor(key).some((option) => option.id === value);
}

export function isAttributes(value: unknown): value is Attributes {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  return Object.entries(value).every(([key, item]) =>
    key === "sheer"
      ? typeof item === "boolean"
      : attributeKeys.includes(key as AttributeKey) &&
        isAttributeValue(key as AttributeKey, item),
  );
}

export function isSettled(item: Described, key: AttributeKey) {
  return (
    item.attributes?.[key] !== undefined && item.sources?.[key] !== "proposed"
  );
}

export function confirmAttribute<T extends Described>(
  item: T,
  key: AttributeKey,
  value: AttributeValue,
): T {
  if (!isAttributeValue(key, value)) throw new Error(t("error.listedOption"));
  return fitAttributes({
    ...item,
    attributes: { ...item.attributes, [key]: value },
    sources: { ...item.sources, [key]: "confirmed" },
  });
}

export function fitAttributes<T extends Described>(item: T): T {
  const allowed = applicableAttributes(item.category, item.kind);
  const attributes: Attributes = {};
  const sources: Sources = {};
  for (const [key, value] of Object.entries(item.attributes ?? {})) {
    if (key !== "sheer" && !allowed.includes(key as AttributeKey)) continue;
    if (key === "scale" && item.attributes?.pattern === "solid") continue;
    Object.assign(attributes, { [key]: value });
  }
  for (const [key, source] of Object.entries(item.sources ?? {})) {
    if (attributeKeys.includes(key as AttributeKey) && !(key in attributes))
      continue;
    Object.assign(sources, { [key]: source });
  }
  const next = { ...item, attributes, sources };
  if (isSettled(next, "formality")) return next;
  return {
    ...next,
    attributes: {
      ...attributes,
      formality: formalityFor({
        category: item.category,
        kind: item.kind,
        fabric: attributes.fabric,
        embellishment: attributes.embellishment,
      }),
    },
    sources: { ...sources, formality: "proposed" },
  };
}

export function mergeProposal<T extends Described>(
  item: T,
  proposed: Attributes,
): T {
  const attributes: Attributes = { ...item.attributes };
  const sources: Sources = { ...item.sources };
  for (const key of attributeKeys) {
    const value = proposed[key];
    if (key === "formality" || value === undefined || isSettled(item, key))
      continue;
    Object.assign(attributes, { [key]: value });
    sources[key] = "proposed";
  }
  return fitAttributes({ ...item, attributes, sources });
}

export function withDetails<T extends Described>(
  item: T,
  details: Pick<Described, "attributes" | "sources">,
): T {
  const sources: Sources = { ...item.sources };
  for (const key of attributeKeys) {
    delete sources[key];
    const source = details.sources?.[key];
    if (source) sources[key] = source;
  }
  return fitAttributes({ ...item, attributes: details.attributes, sources });
}

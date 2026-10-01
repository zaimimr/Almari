export type LabelMaterial = { fibre: string; percent: number | null };

export type LabelFields = {
  materials: LabelMaterial[];
  size?: string;
  brand?: string;
  origin?: string;
};

export type CareLabel = LabelFields & { photo: string };

const fibreWords: Record<string, string[]> = {
  cotton: ["cotton", "bomull"],
  polyester: ["polyester"],
  viscose: ["viscose", "viskose", "rayon"],
  elastane: ["elastane", "elastan", "spandex"],
  wool: ["wool", "ull", "merino", "merinoull", "lammeull", "lambswool"],
  cashmere: ["cashmere", "kasjmir"],
  silk: ["silk", "silke"],
  linen: ["linen", "lin"],
  polyamide: ["polyamide", "polyamid", "nylon"],
  acrylic: ["acrylic", "akryl"],
  modal: ["modal"],
  lyocell: ["lyocell"],
};

export const knownFibres = Object.keys(fibreWords);

const fibreByWord = new Map(
  Object.entries(fibreWords).flatMap(([fibre, words]) =>
    words.map((word) => [word, fibre] as const),
  ),
);

function clean(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function fibreName(value: string): string | null {
  for (const word of clean(value).split(/[^\p{L}]+/u)) {
    const fibre = fibreByWord.get(word);
    if (fibre) return fibre;
  }
  return null;
}

function unique(materials: LabelMaterial[]) {
  return materials.filter(
    (material, index) =>
      materials.findIndex((item) => item.fibre === material.fibre) === index,
  );
}

const fibreFirst = /(\p{L}+)\s*(\d{1,3})\s*%/gu;
const percentFirst = /(\d{1,3})\s*%\s*(\p{L}+)/gu;
const sizeAfterWord =
  /\b(?:size|str|størrelse|eur|eu)\b\.?\s*:?\s*(XXXL|XXL|XXS|XL|XS|S|M|L|\d{2})\b/iu;
const sizeAlone = /^(XXXL|XXL|XXS|XL|XS|S|M|L)$/i;
const madeIn =
  /\b(?:made in|produced in|laget i|produsert i)\s+(\p{L}+(?:[ -]\p{L}+)*)/iu;

function materialsIn(line: string): LabelMaterial[] {
  const pairs = (pattern: RegExp, fibreAt: 1 | 2) =>
    [...line.matchAll(pattern)].flatMap((match): LabelMaterial[] => {
      const fibre = fibreName(match[fibreAt]!);
      const percent = Number(match[fibreAt === 1 ? 2 : 1]);
      return fibre && percent <= 100 ? [{ fibre, percent }] : [];
    });
  const first = /^\s*\p{L}/u.test(line) ? pairs(fibreFirst, 1) : [];
  return first.length ? first : pairs(percentFirst, 2);
}

export function parseCareText(text: string): LabelFields {
  const lines = text.split("\n");
  const fields: LabelFields = { materials: unique(lines.flatMap(materialsIn)) };
  const size =
    text.match(sizeAfterWord)?.[1] ??
    lines.map((line) => line.trim()).find((line) => sizeAlone.test(line));
  const origin = text.match(madeIn)?.[1];
  if (size) fields.size = size.toUpperCase();
  if (origin) fields.origin = origin;
  return fields;
}

export type LabelModel = {
  available(): Promise<boolean>;
  extract(text: string): Promise<string | null>;
};

const limits = { fibre: 40, size: 20, brand: 40, origin: 40 };

function escape(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function printed(value: string, text: string) {
  const wanted = clean(value);
  if (!wanted) return false;
  return new RegExp(
    `(^|[^\\p{L}\\p{N}])${escape(wanted)}(?=$|[^\\p{L}\\p{N}])`,
    "u",
  ).test(clean(text));
}

function printedPercent(percent: number, text: string) {
  return new RegExp(`(^|[^\\p{N}])${percent}\\s*%`, "u").test(text);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown, max: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= max
  );
}

function isPercent(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 100
  );
}

function modelFields(json: string | null, text: string): LabelFields {
  const empty: LabelFields = { materials: [] };
  if (!json) return empty;
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return empty;
  }
  if (!isRecord(value)) return empty;
  const fields: LabelFields = {
    materials: unique(
      (Array.isArray(value.materials) ? value.materials : []).flatMap(
        (item): LabelMaterial[] => {
          if (!isRecord(item) || !isText(item.fibre, limits.fibre)) return [];
          const fibre = fibreName(item.fibre);
          if (!fibre || !printed(item.fibre, text)) return [];
          const percent =
            isPercent(item.percent) && printedPercent(item.percent, text)
              ? item.percent
              : null;
          return [{ fibre, percent }];
        },
      ),
    ),
  };
  for (const key of ["size", "brand", "origin"] as const) {
    const found = value[key];
    if (!isText(found, limits[key]) || !printed(found, text)) continue;
    if (key !== "size" && fibreByWord.has(clean(found))) continue;
    fields[key] = key === "size" ? found.trim().toUpperCase() : found.trim();
  }
  return fields;
}

export function mergeCareLabel(
  parsed: LabelFields,
  modelJson: string | null,
  text: string,
): LabelFields {
  const model = modelFields(modelJson, text);
  const merged: LabelFields = {
    materials: parsed.materials.length ? parsed.materials : model.materials,
  };
  for (const key of ["size", "brand", "origin"] as const) {
    const value = parsed[key] ?? model[key];
    if (value) merged[key] = value;
  }
  return merged;
}

export async function readCareLabelText(
  text: string,
  model: LabelModel,
): Promise<LabelFields> {
  const parsed = parseCareText(text);
  if (!text.trim()) return parsed;
  const json = await model
    .available()
    .then((ready) => (ready ? model.extract(text) : null))
    .catch(() => null);
  return mergeCareLabel(parsed, json, text);
}

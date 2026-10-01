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

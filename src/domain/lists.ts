import { en } from "../i18n/en";
import { nb } from "../i18n/nb";
import { fabrics } from "./attributes";
import {
  colorName,
  colourNames,
  namedSwatch,
  type Rgb,
  type Swatch,
} from "./color";
import {
  categories,
  garmentKinds,
  kindsIn,
  type Category,
  type GarmentKind,
} from "./taxonomy";

export type OwnColour = { id: string; name: string; rgb: Rgb };
export type OwnFabric = { id: string; name: string };
export type OwnKind = { id: string; name: string; category: Category };

export type Lists = {
  colours: OwnColour[];
  fabrics: OwnFabric[];
  kinds: OwnKind[];
};

export type ListKey = keyof Lists;

export const emptyLists: Lists = { colours: [], fabrics: [], kinds: [] };

const maxName = 40;

let current: Lists = emptyLists;

export function setLists(lists: Lists | undefined) {
  current = lists ?? emptyLists;
}

export const ownLists = () => current;

export const isOwnId = (value: unknown): value is string =>
  typeof value === "string" && /^own-[a-z]+-\d+$/.test(value);

export const ownColour = (id: string) =>
  current.colours.find((item) => item.id === id);

export const ownFabric = (id: string) =>
  current.fabrics.find((item) => item.id === id);

export const ownKind = (id: string) =>
  current.kinds.find((item) => item.id === id);

export function colourSwatch(id: string): Swatch {
  const own = ownColour(id);
  return own ? { rgb: [...own.rgb], share: 1 } : namedSwatch(id);
}

export function isColourId(value: unknown): value is string {
  return (
    colourNames.includes(value as string) ||
    (isOwnId(value) && Boolean(ownColour(value)))
  );
}

const sameRgb = (a: readonly number[], b: readonly number[]) =>
  a.every((part, index) => part === b[index]);

export function colourOf(rgb: Rgb): string {
  return (
    current.colours.find((item) => sameRgb(item.rgb, rgb))?.id ?? colorName(rgb)
  );
}

export const colourWord = (rgb: Rgb) => {
  const id = colourOf(rgb);
  return ownColour(id)?.name ?? id;
};

export const colourChoices = (): string[] => [
  ...current.colours.map((item) => item.id),
  ...colourNames,
];

export const ownKindsIn = (category: Category) =>
  current.kinds.filter((item) => item.category === category);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isName = (value: unknown): value is string =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.length <= maxName;

const isRgb = (value: unknown): value is Rgb =>
  Array.isArray(value) &&
  value.length === 3 &&
  value.every((part) => Number.isInteger(part) && part >= 0 && part <= 255);

const isCategory = (value: unknown): value is Category =>
  categories.some((category) => category.id === value);

function unique<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function entries<T extends { id: string }>(
  value: unknown,
  check: (item: Record<string, unknown>) => boolean,
  pick: (item: Record<string, unknown>) => T,
): T[] {
  if (!Array.isArray(value)) return [];
  return unique(
    value
      .filter(
        (item): item is Record<string, unknown> =>
          isRecord(item) &&
          isOwnId(item.id) &&
          isName(item.name) &&
          check(item),
      )
      .map(pick),
  );
}

export function cleanLists(value: unknown): Lists | undefined {
  if (!isRecord(value)) return undefined;
  const lists: Lists = {
    colours: entries(
      value.colours,
      (item) => isRgb(item.rgb),
      (item) => ({
        id: item.id as string,
        name: (item.name as string).trim(),
        rgb: [...(item.rgb as Rgb)],
      }),
    ),
    fabrics: entries(
      value.fabrics,
      () => true,
      (item) => ({ id: item.id as string, name: (item.name as string).trim() }),
    ),
    kinds: entries(
      value.kinds,
      (item) => isCategory(item.category),
      (item) => ({
        id: item.id as string,
        name: (item.name as string).trim(),
        category: item.category as Category,
      }),
    ),
  };
  return lists.colours.length || lists.fabrics.length || lists.kinds.length
    ? lists
    : undefined;
}

const listOf = (closet: { lists?: Lists }): Lists => closet.lists ?? emptyLists;

const same = (a: string, b: string) =>
  a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();

const catalogs = [en, nb] as Record<string, string>[];

const named = (key: string, name: string) =>
  catalogs.some(
    (catalog) => catalog[key] !== undefined && same(catalog[key]!, name),
  );

function builtIn(
  list: ListKey,
  name: string,
  category?: Category,
): string | null {
  if (list === "colours")
    return (
      colourNames.find(
        (id) =>
          same(id, name) ||
          named(`colour.${id.toLowerCase().replace(" ", "-")}`, name),
      ) ?? null
    );
  if (list === "fabrics")
    return (
      fabrics.find((item) => named(`value.fabric.${item.id}`, name))?.id ?? null
    );
  const kinds: readonly { id: GarmentKind }[] = category
    ? kindsIn(category)
    : garmentKinds;
  return kinds.find((item) => named(`kind.${item.id}`, name))?.id ?? null;
}

const prefix: Record<ListKey, string> = {
  colours: "colour",
  fabrics: "fabric",
  kinds: "kind",
};

function nextId(lists: Lists, list: ListKey) {
  const numbers = lists[list].map((item) =>
    Number(item.id.slice(item.id.lastIndexOf("-") + 1)),
  );
  return `own-${prefix[list]}-${Math.max(0, ...numbers) + 1}`;
}

export type Added<C> = { closet: C; id: string | null };

export function addOwn<C extends { lists?: Lists }>(
  closet: C,
  list: ListKey,
  entry: { name: string; rgb?: Rgb; category?: Category },
): Added<C> {
  const name = entry.name.trim();
  if (!isName(name)) return { closet, id: null };
  if (list === "colours" && !isRgb(entry.rgb)) return { closet, id: null };
  if (list === "kinds" && !isCategory(entry.category))
    return { closet, id: null };
  const lists = listOf(closet);
  const known = builtIn(list, name, entry.category);
  if (known) return { closet, id: known };
  const existing = lists[list].find(
    (item) =>
      same(item.name, name) &&
      (list !== "kinds" || (item as OwnKind).category === entry.category),
  );
  if (existing) return { closet, id: existing.id };
  const id = nextId(lists, list);
  const item =
    list === "colours"
      ? { id, name, rgb: [...entry.rgb!] as Rgb }
      : list === "kinds"
        ? { id, name, category: entry.category! }
        : { id, name };
  return {
    closet: { ...closet, lists: { ...lists, [list]: [...lists[list], item] } },
    id,
  };
}

export function renameOwn<C extends { lists?: Lists }>(
  closet: C,
  list: ListKey,
  id: string,
  name: string,
): C {
  const trimmed = name.trim();
  if (!isName(trimmed)) return closet;
  const lists = listOf(closet);
  if (!lists[list].some((item) => item.id === id)) return closet;
  return {
    ...closet,
    lists: {
      ...lists,
      [list]: lists[list].map((item) =>
        item.id === id ? { ...item, name: trimmed } : item,
      ),
    },
  };
}

type Owned = {
  ownKind?: string;
  ownFabric?: string;
  colour?: string;
};

function withoutOwn<T extends Owned>(item: T, list: ListKey, id: string): T {
  const key =
    list === "kinds" ? "ownKind" : list === "fabrics" ? "ownFabric" : "colour";
  if (item[key] !== id) return item;
  const { [key]: _gone, ...rest } = item;
  return rest as T;
}

export function removeOwn<
  C extends { lists?: Lists; pieces: Owned[]; imports: Owned[] },
>(closet: C, list: ListKey, id: string): C {
  const lists = listOf(closet);
  if (!lists[list].some((item) => item.id === id)) return closet;
  const next = {
    ...lists,
    [list]: lists[list].filter((item) => item.id !== id),
  };
  const { lists: _lists, ...rest } = closet;
  const kept = next.colours.length || next.fabrics.length || next.kinds.length;
  return {
    ...rest,
    ...(kept ? { lists: next } : {}),
    pieces: closet.pieces.map((piece) => withoutOwn(piece, list, id)),
    imports: closet.imports.map((job) => withoutOwn(job, list, id)),
  } as C;
}

export function dropUnknownOwn<T extends Owned>(item: T, lists: Lists): T {
  let next = item;
  if (next.ownKind && !lists.kinds.some((entry) => entry.id === next.ownKind))
    next = withoutOwn(next, "kinds", next.ownKind);
  if (
    next.ownFabric &&
    !lists.fabrics.some((entry) => entry.id === next.ownFabric)
  )
    next = withoutOwn(next, "fabrics", next.ownFabric);
  if (
    isOwnId(next.colour) &&
    !lists.colours.some((entry) => entry.id === next.colour)
  )
    next = withoutOwn(next, "colours", next.colour!);
  return next;
}

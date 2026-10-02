import {
  categories,
  garmentKinds,
  occasions,
  styleOptions,
  type Category,
  type GarmentKind,
  type Occasion,
  type SettingKey,
  type Style,
} from "../closet";
import type { Attributes } from "../attributes";
import type { ColorClass } from "../color";
import type { Role } from "../styling";
import data from "./rulebook.json";

export type ColorFamily =
  "red" | "pink" | "orange" | "yellow" | "green" | "blue" | "purple";

export type Shade = "pastel" | "jewel" | "neon";

type Values<K extends keyof Attributes> = NonNullable<Attributes[K]>[];

export type Selector = {
  role?: Role[];
  kind?: GarmentKind[];
  category?: Category[];
  style?: Style[];
  colorClass?: ColorClass[];
  family?: ColorFamily[];
  shade?: Shade[];
  pattern?: Values<"pattern">;
  scale?: Values<"scale">;
  fabric?: Values<"fabric">;
  embellishment?: Values<"embellishment">;
  length?: Values<"length">;
  volume?: Values<"volume">;
  sleeve?: Values<"sleeve">;
  formality?: { min?: number; max?: number };
  tagged?: "occasion" | "other";
  belowMinLength?: boolean;
};

export type Relation =
  | "same"
  | "tonal"
  | "flat"
  | "near-miss"
  | "analogous"
  | "complementary"
  | "complementary-loud"
  | "echo"
  | "contrast"
  | "same-length"
  | "longer"
  | "shorter";

export type Metric =
  | "accent-count"
  | "contrast-range"
  | "print-count"
  | "saturated-large"
  | "warm-cool-large"
  | "light-count"
  | "formality-below"
  | "formality-above"
  | "formality-fit"
  | "formality-spread"
  | "set-together"
  | "formal-set-split";

export type Comparison = "<" | "<=" | ">" | ">=" | "=";

export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { has: Selector; count?: { min?: number; max?: number } }
  | { pair: [Selector, Selector]; relation: Relation }
  | { outfit: Metric; op: Comparison; value: number };

export type WeatherWhen = "warm" | "mild" | "cold" | "unknown";

export type ProfileKey = SettingKey;

export type Rule = {
  id: string;
  source: string;
  layer: "style" | "color";
  when?: {
    occasion?: Occasion[];
    minFormality?: number;
    maxFormality?: number;
    style?: Style[];
    weather?: WeatherWhen[];
    profile?: Partial<Record<ProfileKey, (string | boolean | null)[]>>;
  };
  if: Condition;
  weight: number;
  reason?: true;
  scale?: { setting: ProfileKey; value: string | boolean; factor: number }[];
};

export type Thresholds = {
  neutralChroma: number;
  vividChroma: number;
  mutedChroma: number;
  loudChroma: number;
  saturatedChroma: number;
  sameDE: number;
  nearMissDE: [number, number];
  nearMissHue: number;
  tonalHue: number;
  tonalMinDL: number;
  analogousHue: [number, number];
  complementHue: [number, number];
  mutedDL: number;
  echoDE: number;
  accentJoinDE: number;
  contrastDL: number;
  lightL: number;
  paletteShare: number;
};

export type RuleBook = {
  version: number;
  thresholds: Thresholds;
  rules: Rule[];
};

const roles: Role[] = [
  "main",
  "bottom",
  "layer",
  "outer",
  "hijab",
  "shoes",
  "bag",
  "accessory",
];
const colorClasses: ColorClass[] = [
  "black",
  "white",
  "grey",
  "navy",
  "denim",
  "warm-neutral",
  "accent",
];
const families: ColorFamily[] = [
  "red",
  "pink",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
];
const shades: Shade[] = ["pastel", "jewel", "neon"];
const lengths: Values<"length"> = ["hip", "thigh", "knee", "calf", "ankle"];
const attributeValues: Record<string, readonly string[]> = {
  pattern: [
    "solid",
    "print",
    "stripe",
    "check",
    "embroidered",
  ] satisfies Values<"pattern">,
  scale: ["small", "medium", "large"] satisfies Values<"scale">,
  fabric: [
    "lawn",
    "cotton",
    "linen",
    "jersey",
    "modal",
    "chiffon",
    "silk",
    "satin",
    "velvet",
    "wool",
    "knit",
    "denim",
    "khaddar",
    "karandi",
    "organza",
    "net",
  ] satisfies Values<"fabric">,
  embellishment: ["none", "light", "heavy"] satisfies Values<"embellishment">,
  length: lengths,
  volume: ["fitted", "straight", "voluminous"] satisfies Values<"volume">,
  sleeve: ["sleeveless", "short", "elbow", "long"] satisfies Values<"sleeve">,
};
const listValues: Record<string, readonly string[]> = {
  ...attributeValues,
  role: roles,
  kind: garmentKinds.map((kind) => kind.id),
  category: categories.map((category) => category.id),
  style: styleOptions.map((style) => style.id),
  colorClass: colorClasses,
  family: families,
  shade: shades,
};
const relations: Relation[] = [
  "same",
  "tonal",
  "flat",
  "near-miss",
  "analogous",
  "complementary",
  "complementary-loud",
  "echo",
  "contrast",
  "same-length",
  "longer",
  "shorter",
];
const metrics: Metric[] = [
  "accent-count",
  "contrast-range",
  "print-count",
  "saturated-large",
  "warm-cool-large",
  "light-count",
  "formality-below",
  "formality-above",
  "formality-fit",
  "formality-spread",
  "set-together",
  "formal-set-split",
];
const comparisons: Comparison[] = ["<", "<=", ">", ">=", "="];
const profileValues: Record<ProfileKey, readonly (string | boolean | null)[]> =
  {
    beltOverOuter: [true, false, null],
    minTopLength: [...lengths, null],
    bottoms: ["trousers", "skirts", "both", null],
    printOnPrint: [true, false, null],
    avoidAtWeddings: ["white", "black"],
    dupattaExpected: [true, false, null],
    region: ["south-asian", "gulf", "turkish", "western-europe", null],
  };
const thresholdKeys: (keyof Thresholds)[] = [
  "neutralChroma",
  "vividChroma",
  "mutedChroma",
  "loudChroma",
  "saturatedChroma",
  "sameDE",
  "nearMissDE",
  "nearMissHue",
  "tonalHue",
  "tonalMinDL",
  "analogousHue",
  "complementHue",
  "mutedDL",
  "echoDE",
  "accentJoinDE",
  "contrastDL",
  "lightL",
  "paletteShare",
];

function fail(path: string, problem: string): never {
  throw new Error(`Rule book ${path}: ${problem}`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    fail(path, "must be an object");
  return value as Record<string, unknown>;
}

function only(value: Record<string, unknown>, keys: string[], path: string) {
  for (const key of Object.keys(value))
    if (!keys.includes(key)) fail(path, `unknown field ${key}`);
}

function finite(value: unknown, path: string) {
  if (typeof value !== "number" || !Number.isFinite(value))
    fail(path, "must be a number");
  return value;
}

function listOf(value: unknown, allowed: readonly unknown[], path: string) {
  if (!Array.isArray(value) || !value.length) fail(path, "must be a list");
  for (const item of value)
    if (!allowed.includes(item)) fail(path, `unknown value ${String(item)}`);
}

function checkSelector(value: unknown, path: string) {
  const selector = record(value, path);
  only(
    selector,
    [...Object.keys(listValues), "formality", "tagged", "belowMinLength"],
    path,
  );
  for (const [key, allowed] of Object.entries(listValues))
    if (selector[key] !== undefined)
      listOf(selector[key], allowed, `${path}.${key}`);
  if (selector.formality !== undefined) {
    const range = record(selector.formality, `${path}.formality`);
    only(range, ["min", "max"], `${path}.formality`);
    if (range.min !== undefined) finite(range.min, `${path}.formality.min`);
    if (range.max !== undefined) finite(range.max, `${path}.formality.max`);
  }
  if (
    selector.tagged !== undefined &&
    selector.tagged !== "occasion" &&
    selector.tagged !== "other"
  )
    fail(`${path}.tagged`, "must be occasion or other");
  if (selector.belowMinLength !== undefined && selector.belowMinLength !== true)
    fail(`${path}.belowMinLength`, "must be true");
}

function checkCondition(value: unknown, path: string) {
  const condition = record(value, path);
  if ("all" in condition || "any" in condition) {
    const key = "all" in condition ? "all" : "any";
    only(condition, [key], path);
    const list = condition[key];
    if (!Array.isArray(list) || !list.length) fail(path, `${key} is empty`);
    list.forEach((item, index) =>
      checkCondition(item, `${path}.${key}[${index}]`),
    );
  } else if ("not" in condition) {
    only(condition, ["not"], path);
    checkCondition(condition.not, `${path}.not`);
  } else if ("has" in condition) {
    only(condition, ["has", "count"], path);
    checkSelector(condition.has, `${path}.has`);
    if (condition.count !== undefined) {
      const count = record(condition.count, `${path}.count`);
      only(count, ["min", "max"], `${path}.count`);
      if (count.min !== undefined) finite(count.min, `${path}.count.min`);
      if (count.max !== undefined) finite(count.max, `${path}.count.max`);
    }
  } else if ("pair" in condition) {
    only(condition, ["pair", "relation"], path);
    if (!Array.isArray(condition.pair) || condition.pair.length !== 2)
      fail(`${path}.pair`, "needs two selectors");
    condition.pair.forEach((item, index) =>
      checkSelector(item, `${path}.pair[${index}]`),
    );
    listOf([condition.relation], relations, `${path}.relation`);
  } else if ("outfit" in condition) {
    only(condition, ["outfit", "op", "value"], path);
    listOf([condition.outfit], metrics, `${path}.outfit`);
    listOf([condition.op], comparisons, `${path}.op`);
    finite(condition.value, `${path}.value`);
  } else fail(path, "is not a condition");
}

function checkRule(value: unknown, path: string) {
  const rule = record(value, path);
  only(
    rule,
    ["id", "source", "layer", "when", "if", "weight", "reason", "scale"],
    path,
  );
  if (typeof rule.id !== "string" || !/^[a-z0-9-]+$/.test(rule.id))
    fail(`${path}.id`, "must be lower-case words joined by dashes");
  if (typeof rule.source !== "string" || !rule.source.includes(":"))
    fail(`${path}.source`, "must name a report and rule number");
  listOf([rule.layer], ["style", "color"], `${path}.layer`);
  const weight = finite(rule.weight, `${path}.weight`);
  if (weight === 0 || Math.abs(weight) > 3)
    fail(`${path}.weight`, "must be between -3 and 3 and not 0");
  if (rule.reason !== undefined) {
    if (rule.reason !== true) fail(`${path}.reason`, "reason must be true");
    if (weight < 0) fail(`${path}.reason`, "only positive rules give reasons");
  }
  if (rule.when !== undefined) {
    const when = record(rule.when, `${path}.when`);
    only(
      when,
      [
        "occasion",
        "minFormality",
        "maxFormality",
        "style",
        "weather",
        "profile",
      ],
      `${path}.when`,
    );
    if (when.occasion !== undefined)
      listOf(
        when.occasion,
        occasions.map((occasion) => occasion.id),
        `${path}.when.occasion`,
      );
    if (when.minFormality !== undefined)
      finite(when.minFormality, `${path}.when.minFormality`);
    if (when.maxFormality !== undefined)
      finite(when.maxFormality, `${path}.when.maxFormality`);
    if (when.style !== undefined)
      listOf(
        when.style,
        styleOptions.map((style) => style.id),
        `${path}.when.style`,
      );
    if (when.weather !== undefined)
      listOf(
        when.weather,
        ["warm", "mild", "cold", "unknown"],
        `${path}.when.weather`,
      );
    if (when.profile !== undefined) {
      const gate = record(when.profile, `${path}.when.profile`);
      for (const [key, allowed] of Object.entries(gate)) {
        if (!(key in profileValues))
          fail(`${path}.when.profile`, `unknown setting ${key}`);
        listOf(
          allowed,
          profileValues[key as ProfileKey],
          `${path}.when.profile.${key}`,
        );
      }
    }
  }
  if (rule.scale !== undefined) {
    if (!Array.isArray(rule.scale)) fail(`${path}.scale`, "must be a list");
    rule.scale.forEach((item, index) => {
      const scale = record(item, `${path}.scale[${index}]`);
      only(scale, ["setting", "value", "factor"], `${path}.scale[${index}]`);
      if (!(String(scale.setting) in profileValues))
        fail(`${path}.scale[${index}]`, "unknown setting");
      listOf(
        [scale.value],
        profileValues[scale.setting as ProfileKey],
        `${path}.scale[${index}].value`,
      );
      const factor = finite(scale.factor, `${path}.scale[${index}].factor`);
      if (factor < 0 || factor > 3)
        fail(`${path}.scale[${index}].factor`, "must be between 0 and 3");
    });
  }
  checkCondition(rule.if, `${path}.if`);
}

export function parseRuleBook(value: unknown): RuleBook {
  const book = record(value, "");
  only(book, ["version", "thresholds", "rules"], "");
  if (!Number.isInteger(book.version) || (book.version as number) < 1)
    fail("version", "must be a whole number");
  const thresholds = record(book.thresholds, "thresholds");
  only(thresholds, thresholdKeys, "thresholds");
  for (const key of thresholdKeys) {
    const item = thresholds[key];
    if (Array.isArray(item)) {
      if (item.length !== 2) fail(`thresholds.${key}`, "needs two numbers");
      item.forEach((part) => finite(part, `thresholds.${key}`));
    } else finite(item, `thresholds.${key}`);
  }
  if (!Array.isArray(book.rules) || !book.rules.length)
    fail("rules", "must be a list");
  const ids = new Set<string>();
  book.rules.forEach((rule, index) => {
    checkRule(rule, `rules[${index}]`);
    const id = (rule as Rule).id;
    if (ids.has(id)) fail(`rules[${index}].id`, `duplicate id ${id}`);
    ids.add(id);
  });
  return value as RuleBook;
}

export const ruleBook = parseRuleBook(data);

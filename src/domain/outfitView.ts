import type {
  Category,
  GarmentKind,
  OutfitRequest,
  Piece,
  StyleProfile,
} from "./closet";
import type { Rgb } from "./color";
import { colourWord, garmentWord, say, type NameLocale } from "./outfitName";
import { ruleBook } from "./scoring/rulebook";
import { baseWeight, occasionLevel, ruleHits } from "./scoring/rules";
import { roleOf, type Role } from "./styling";
import { t, type Key } from "../i18n";

export type Check = {
  id: "sleeves" | "hem" | "hijab" | "neckline";
  state: "ok" | "gap" | "unknown";
  text: string;
};

export type Tip = { kind: GarmentKind; rgb: Rgb };

const garmentRoles: Role[] = ["main", "bottom", "layer", "outer"];
const columnRoles: Role[] = ["hijab", "accessory", "bag", "shoes"];

export function flatLay(pieces: Piece[]) {
  const byRole = (roles: Role[]) =>
    roles.flatMap((role) => pieces.filter((piece) => roleOf(piece) === role));
  const garments = byRole(garmentRoles);
  return {
    large: garments[0] ?? null,
    garments: garments.slice(1),
    column: byRole(columnRoles),
  };
}

const sleeveOrder = ["sleeveless", "short", "elbow", "long"];
const lengthOrder = ["hip", "thigh", "knee", "calf", "ankle"];
const needs = {
  full: { sleeve: "long", length: "ankle" },
  moderate: { sleeve: "elbow", length: "calf" },
} as const;

function confirmed(piece: Piece, key: "sleeve" | "length"): string | null {
  const value = piece.attributes?.[key];
  return value !== undefined && piece.sources?.[key] !== "proposed"
    ? value
    : null;
}

function measure(
  values: (string | null)[],
  order: string[],
  need: string | null,
): { state: Check["state"]; value: string | null } {
  const known = values.filter((value): value is string => value !== null);
  const best = known.length
    ? known.reduce((a, b) => (order.indexOf(b) > order.indexOf(a) ? b : a))
    : null;
  if (best && (!need || order.indexOf(best) >= order.indexOf(need)))
    return { state: "ok", value: best };
  if (!values.length || known.length < values.length)
    return { state: "unknown", value: null };
  return { state: "gap", value: best };
}

function checkFor(
  id: "sleeves" | "hem",
  result: { state: Check["state"]; value: string | null },
): Check {
  const detail = result.state === "ok" ? result.value : result.state;
  const text = t(`coverage.${id}.${detail}` as Key);
  return { id, state: result.state, text };
}

export function coverageChecks(
  pieces: Piece[],
  request: OutfitRequest,
  profile: StyleProfile,
): Check[] {
  const level = profile.coverageLevel;
  const need = level === "full" || level === "moderate" ? needs[level] : null;
  const arms = pieces.filter(
    (piece) =>
      ["main", "layer", "outer"].includes(roleOf(piece)) &&
      piece.attributes?.sheer !== true,
  );
  const legs = pieces.filter((piece) =>
    ["main", "bottom"].includes(roleOf(piece)),
  );
  const checks = [
    checkFor(
      "sleeves",
      measure(
        arms.map((piece) => confirmed(piece, "sleeve")),
        sleeveOrder,
        need?.sleeve ?? null,
      ),
    ),
    checkFor(
      "hem",
      measure(
        legs.map((piece) => confirmed(piece, "length")),
        lengthOrder,
        need?.length ?? null,
      ),
    ),
  ];
  if (
    request.hijab === "always" &&
    pieces.some((piece) => roleOf(piece) === "hijab")
  )
    checks.push({ id: "hijab", state: "ok", text: t("coverage.hijab") });
  checks.push({
    id: "neckline",
    state: "unknown",
    text: t("coverage.neckline"),
  });
  return checks;
}

const neutrals: Rgb[] = [
  [236, 231, 218],
  [25, 25, 27],
  [35, 45, 75],
  [78, 52, 42],
  [142, 120, 106],
];
const tipGain = 0.5;

function ruleScore(
  pieces: Piece[],
  request: OutfitRequest,
  profile: StyleProfile,
) {
  return ruleHits(ruleBook, pieces, request, profile).reduce(
    (total, hit) => total + baseWeight(hit.rule, profile),
    0,
  );
}

export function outfitTip(
  outfit: Piece[],
  owned: Piece[],
  request: OutfitRequest,
  profile: StyleProfile,
): Tip | null {
  const owns = (roles: Role[], kind?: GarmentKind) =>
    [...owned, ...outfit].some(
      (piece) =>
        roles.includes(roleOf(piece)) && (!kind || piece.kind === kind),
    );
  const level = occasionLevel(request);
  const cold =
    request.weather.source !== "unknown" && request.weather.warmth === "cold";
  const options: { kind: GarmentKind; category: Category }[] = [
    ...(request.hijab === null && !owns(["hijab"])
      ? [{ kind: "hijab" as const, category: "hijab" as const }]
      : []),
    ...(request.style === "desi" &&
    level >= 3 &&
    !owns(["accessory"], "dupatta")
      ? [{ kind: "dupatta" as const, category: "accessory" as const }]
      : []),
    ...(!owns(["bag"])
      ? [
          {
            kind: level >= 4 ? ("clutch" as const) : ("handbag" as const),
            category: "bag" as const,
          },
        ]
      : []),
    ...(cold && !owns(["layer", "outer"])
      ? [{ kind: "coat" as const, category: "layer" as const }]
      : []),
  ];
  if (!options.length) return null;
  const main = outfit.find((piece) => roleOf(piece) === "main");
  const colours = [
    ...(main?.colors ?? []).map((swatch) => swatch.rgb),
    ...neutrals,
  ];
  const base = ruleScore(outfit, request, profile);
  let best: { tip: Tip; gain: number } | null = null;
  for (const option of options)
    for (const rgb of colours) {
      const extra: Piece = {
        id: "tip",
        name: "tip",
        category: option.category,
        kind: option.kind,
        photo: "",
        createdAt: "",
        source: "owned",
        attributes: { pattern: "solid" },
        colors: [{ rgb, share: 1 }],
      };
      const gain = ruleScore([...outfit, extra], request, profile) - base;
      if (!best || gain > best.gain)
        best = { tip: { kind: option.kind, rgb }, gain };
    }
  return best && best.gain >= tipGain ? best.tip : null;
}

export function tipText(tip: Tip, locale: NameLocale) {
  return say(locale, "outfitTip", {
    garment: garmentWord({ kind: tip.kind, category: "accessory" }, locale),
    colour: colourWord(tip.rgb, locale),
  });
}

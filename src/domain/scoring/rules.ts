import {
  occasionPhrase,
  occasions,
  type OutfitRequest,
  type Piece,
  type SourceKey,
  type Sparkle,
  type StyleProfile,
} from "../closet";
import { formalityFor, type Attributes } from "../attributes";
import { sparkleOf } from "../facts";
import { deltaE, type Lab } from "../color";
import { bestColours } from "../colourAnalysis";
import { t, type Key } from "../../i18n";
import { en } from "../../i18n/en";
import { roleOf, type Role } from "../styling";
import {
  colorFacts,
  colorMetric,
  colorRelation,
  toneSide,
  type ColorFacts,
} from "./harmony";
import type {
  Comparison,
  Condition,
  ProfileKey,
  Rule,
  RuleBook,
  Selector,
  Thresholds,
} from "./rulebook";

export type Facts = {
  piece: Piece;
  role: Role;
  print: boolean;
  formality: number;
  color: ColorFacts;
  sparkle: Sparkle | null;
};

export type Hit = { rule: Rule; bound: Facts[]; certain: boolean };

type Scope = {
  request: OutfitRequest;
  profile: StyleProfile;
  thresholds: Thresholds;
  outfit: Facts[];
  metrics: Map<string, number | null>;
  best: Lab[] | null;
};

type Outcome = { ok: boolean; bound: Facts[]; certain: boolean };

const lengths = ["hip", "thigh", "knee", "calf", "ankle"];
const coreRoles: Role[] = ["main", "bottom", "layer", "outer"];
const printPatterns = ["print", "stripe", "check"];

const selectorSources: Partial<Record<keyof Selector, SourceKey>> = {
  kind: "kind",
  style: "styles",
  pattern: "pattern",
  scale: "scale",
  fabric: "fabric",
  embellishment: "embellishment",
  length: "length",
  volume: "volume",
  sleeve: "sleeve",
  formality: "formality",
  belowMinLength: "length",
};

export function occasionLevel(request: OutfitRequest) {
  return (
    occasions.find((occasion) => occasion.id === request.occasion)?.formality ??
    1
  );
}

const known = new WeakMap<Piece, Facts>();

export function factsFor(pieces: Piece[], thresholds: Thresholds): Facts[] {
  return pieces.map((piece) => {
    const cached = known.get(piece);
    if (cached) return cached;
    const attributes = piece.attributes ?? {};
    const facts: Facts = {
      piece,
      role: roleOf(piece),
      print:
        printPatterns.includes(attributes.pattern ?? "") ||
        (attributes.pattern === "embroidered" &&
          ruleEmbellishment(attributes) === "heavy"),
      formality:
        attributes.formality ??
        formalityFor({
          category: piece.category,
          kind: piece.kind,
          fabric: attributes.fabric,
          embellishment: attributes.embellishment,
        }),
      color: colorFacts(piece, thresholds),
      sparkle: sparkleOf(piece),
    };
    known.set(piece, facts);
    return facts;
  });
}

function proposed(piece: Piece, key: SourceKey) {
  return piece.sources?.[key] === "proposed";
}

function certainFor(facts: Facts, selector: Selector, scope: Scope) {
  if (
    (selector.bestColour || selector.undertoneClash) &&
    scope.profile.colour?.source !== "confirmed"
  )
    return false;
  return (Object.keys(selector) as (keyof Selector)[]).every((key) => {
    const source = selectorSources[key];
    return !source || !proposed(facts.piece, source);
  });
}

const ruleEmbellishment = ({ embellishment }: Attributes) =>
  embellishment === "bridal" ? "heavy" : embellishment;

function among<T>(list: T[] | undefined, value: T | null | undefined) {
  return (
    !list || (value !== undefined && value !== null && list.includes(value))
  );
}

function matches(facts: Facts, selector: Selector, scope: Scope): boolean {
  const { piece } = facts;
  const attributes = piece.attributes ?? {};
  if (!among(selector.role, facts.role)) return false;
  if (!among(selector.kind, piece.kind)) return false;
  if (!among(selector.category, piece.category)) return false;
  if (
    selector.style &&
    !piece.styles?.some((style) => selector.style!.includes(style))
  )
    return false;
  if (!among(selector.colorClass, facts.color.main?.colorClass)) return false;
  if (!among(selector.family, facts.color.family)) return false;
  if (!among(selector.shade, facts.color.shade)) return false;
  if (!among(selector.pattern, attributes.pattern)) return false;
  if (!among(selector.scale, attributes.scale)) return false;
  if (!among(selector.fabric, attributes.fabric)) return false;
  if (!among(selector.embellishment, ruleEmbellishment(attributes)))
    return false;
  if (!among(selector.length, attributes.length)) return false;
  if (!among(selector.volume, attributes.volume)) return false;
  if (!among(selector.sleeve, attributes.sleeve)) return false;
  if (selector.formality) {
    if (facts.formality < (selector.formality.min ?? 1)) return false;
    if (facts.formality > (selector.formality.max ?? 6)) return false;
  }
  if (selector.tagged) {
    const tags = piece.traits?.occasions;
    if (!tags) return false;
    const suits = tags.includes(scope.request.occasion);
    if ((selector.tagged === "occasion") !== suits) return false;
  }
  if (selector.belowMinLength) {
    const minimum = scope.profile.minTopLength;
    if (!minimum || !attributes.length) return false;
    if (lengths.indexOf(attributes.length) >= lengths.indexOf(minimum))
      return false;
  }
  if (selector.bestColour) {
    const tone = facts.color.main;
    if (!tone || !scope.best) return false;
    if (
      !scope.best.some((lab) => deltaE(tone.lab, lab) < scope.thresholds.bestDE)
    )
      return false;
  }
  if (selector.undertoneClash) {
    const tone = facts.color.main;
    const undertone = scope.profile.colour?.undertone;
    if (!tone || !undertone || undertone === "neutral") return false;
    if (tone.lch[1] < scope.thresholds.vividChroma) return false;
    const side = toneSide(tone);
    if (!side || side === undertone) return false;
  }
  return true;
}

function lengthRelation(name: string, a: Facts, b: Facts) {
  const x = lengths.indexOf(a.piece.attributes?.length ?? "");
  const y = lengths.indexOf(b.piece.attributes?.length ?? "");
  if (x < 0 || y < 0) return false;
  if (name === "same-length") return x === y;
  if (name === "longer") return x >= y;
  return x < y;
}

function relation(name: string, a: Facts, b: Facts, scope: Scope) {
  return ["same-length", "longer", "shorter"].includes(name)
    ? lengthRelation(name, a, b)
    : colorRelation(name, a.color, b.color, scope.thresholds);
}

function printCount(outfit: Facts[]) {
  const prints = outfit.filter((facts) => facts.print);
  const groups = new Set(
    prints.map((facts) => facts.piece.setId ?? facts.piece.id),
  );
  return groups.size;
}

function metric(name: string, scope: Scope): number | null {
  if (!scope.metrics.has(name)) scope.metrics.set(name, measure(name, scope));
  return scope.metrics.get(name)!;
}

function measure(name: string, scope: Scope): number | null {
  const outfit = scope.outfit;
  const level = occasionLevel(scope.request);
  const known = outfit
    .filter((facts) => coreRoles.includes(facts.role))
    .map((facts) => facts.formality);
  const everyKnown = outfit
    .filter((facts) => facts.role !== "hijab")
    .map((facts) => facts.formality);
  const sets = new Map<string, Facts[]>();
  for (const facts of outfit)
    if (facts.piece.setId)
      sets.set(facts.piece.setId, [
        ...(sets.get(facts.piece.setId) ?? []),
        facts,
      ]);
  switch (name) {
    case "print-count":
      return printCount(outfit);
    case "formality-below":
      return known.length ? level - Math.max(...known) : null;
    case "formality-above":
      return known.length ? Math.min(...known) - level : null;
    case "formality-fit":
      return known.length &&
        Math.abs(Math.max(...known) - level) <= 1 &&
        Math.min(...known) - level <= 1
        ? 1
        : 0;
    case "formality-spread":
      return everyKnown.length < 2
        ? null
        : Math.max(...everyKnown) - Math.min(...everyKnown);
    case "set-together":
      return Math.max(0, ...[...sets.values()].map((group) => group.length));
    case "formal-set-split":
      return [...sets.values()].filter(
        (group) => group.length === 1 && group[0]!.formality >= 4,
      ).length;
    default:
      return colorMetric(
        name,
        outfit.map(({ role, print, color }) => ({ role, print, color })),
        scope.thresholds,
      );
  }
}

function compare(value: number, op: Comparison, target: number) {
  switch (op) {
    case "<":
      return value < target;
    case "<=":
      return value <= target;
    case ">":
      return value > target;
    case ">=":
      return value >= target;
    case "=":
      return value === target;
  }
}

const no: Outcome = { ok: false, bound: [], certain: true };

function evaluate(condition: Condition, scope: Scope): Outcome {
  if ("all" in condition) {
    const outcomes = [];
    for (const child of condition.all) {
      const outcome = evaluate(child, scope);
      if (!outcome.ok) return no;
      outcomes.push(outcome);
    }
    return {
      ok: true,
      bound: outcomes.flatMap((outcome) => outcome.bound),
      certain: outcomes.every((outcome) => outcome.certain),
    };
  }
  if ("any" in condition) {
    for (const child of condition.any) {
      const outcome = evaluate(child, scope);
      if (outcome.ok) return outcome;
    }
    return no;
  }
  if ("not" in condition)
    return { ok: !evaluate(condition.not, scope).ok, bound: [], certain: true };
  if ("has" in condition) {
    const found = scope.outfit.filter((facts) =>
      matches(facts, condition.has, scope),
    );
    const min = condition.count ? (condition.count.min ?? 0) : 1;
    const max = condition.count?.max ?? Infinity;
    return {
      ok: found.length >= min && found.length <= max,
      bound: found,
      certain: found.every((facts) => certainFor(facts, condition.has, scope)),
    };
  }
  if ("pair" in condition) {
    const [first, second] = condition.pair;
    for (const a of scope.outfit)
      for (const b of scope.outfit)
        if (
          a !== b &&
          matches(a, first, scope) &&
          matches(b, second, scope) &&
          relation(condition.relation, a, b, scope)
        )
          return {
            ok: true,
            bound: [a, b],
            certain:
              certainFor(a, first, scope) && certainFor(b, second, scope),
          };
    return no;
  }
  const value = metric(condition.outfit, scope);
  return {
    ok: value !== null && compare(value, condition.op, condition.value),
    bound: [],
    certain: scope.outfit.every(
      (facts) =>
        !proposed(facts.piece, "formality") &&
        !proposed(facts.piece, "pattern"),
    ),
  };
}

function applies(rule: Rule, request: OutfitRequest, profile: StyleProfile) {
  const when = rule.when;
  if (!when) return true;
  const level = occasionLevel(request);
  const weather =
    request.weather.source === "unknown" ? "unknown" : request.weather.warmth;
  if (when.occasion && !when.occasion.includes(request.occasion)) return false;
  if (when.minFormality !== undefined && level < when.minFormality)
    return false;
  if (when.maxFormality !== undefined && level > when.maxFormality)
    return false;
  if (when.style && !when.style.includes(request.style)) return false;
  if (when.weather && !when.weather.includes(weather)) return false;
  for (const [key, allowed] of Object.entries(when.profile ?? {})) {
    const setting = profile[key as ProfileKey];
    const passes = Array.isArray(setting)
      ? setting.some((item) => allowed.includes(item))
      : allowed.includes(setting);
    if (!passes) return false;
  }
  return true;
}

export function baseWeight(rule: Rule, profile: StyleProfile) {
  return (rule.scale ?? []).reduce((weight, scale) => {
    const setting = profile[scale.setting];
    const active = Array.isArray(setting)
      ? setting.includes(scale.value as never)
      : setting === scale.value;
    return active ? weight * scale.factor : weight;
  }, rule.weight);
}

export function ruleHits(
  book: RuleBook,
  pieces: Piece[],
  request: OutfitRequest,
  profile: StyleProfile,
): Hit[] {
  const scope: Scope = {
    request,
    profile,
    thresholds: book.thresholds,
    outfit: factsFor(pieces, book.thresholds),
    metrics: new Map(),
    best: profile.colour ? bestColours(profile.colour) : null,
  };
  return book.rules.flatMap((rule) => {
    if (!applies(rule, request, profile)) return [];
    const outcome = evaluate(rule.if, scope);
    return outcome.ok
      ? [{ rule, bound: outcome.bound, certain: outcome.certain }]
      : [];
  });
}

function lower(piece: Piece) {
  return piece.name.charAt(0).toLowerCase() + piece.name.slice(1);
}

export function reasonFor(hit: Hit, request: OutfitRequest): string | null {
  if (!hit.rule.reason) return null;
  const key = `reason.${hit.rule.id}`;
  const template = (en as Record<string, string>)[key] ?? "";
  const [a, b] = hit.bound.map((facts) => lower(facts.piece));
  if (template.includes("{a}") && !a) return null;
  if (template.includes("{b}") && !b) return null;
  return t(key as Key, {
    a: a ?? "",
    b: b ?? "",
    occasion: occasionPhrase(request.occasion),
  });
}

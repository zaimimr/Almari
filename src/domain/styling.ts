import { t, type Key } from "../i18n";
import {
  isAvailable,
  kindLabel,
  styleLabel,
  type OutfitRequest,
  type Piece,
  type Style,
} from "./closet";
import type { ScoreContext, Scorer } from "./scoring/types";
import { coverageProblems } from "./coverage";
import { confirmedWeather, unconfirmedWeather } from "./pieceWeather";
import { isNeverWear } from "./preferences";
import { neededWarmth } from "./weather";

export type Role =
  | "main"
  | "bottom"
  | "under"
  | "layer"
  | "outer"
  | "hijab"
  | "shoes"
  | "bag"
  | "accessory";

const roleLimits: Record<Role, number> = {
  main: 1,
  bottom: 1,
  under: 1,
  layer: 1,
  outer: 1,
  hijab: 1,
  shoes: 1,
  bag: 1,
  accessory: 2,
};

const roleName = (role: Role) => t(`role.${role}`);

export type ProblemAction =
  | { type: "release"; id: string }
  | { type: "clear-type" }
  | { type: "set-style"; style: Style }
  | { type: "clear-weather" }
  | { type: "clear-excluded" }
  | { type: "choose-pieces" }
  | { type: "add-pieces" }
  | { type: "use-samples" }
  | { type: "check-piece"; id: string; ask: "sleeve" | "length" }
  | { type: "edit-piece"; id: string };

export type Problem = {
  code:
    | "empty-closet"
    | "kept-missing"
    | "kept-conflict"
    | "style-conflict"
    | "no-garment-type"
    | "missing-role"
    | "incomplete"
    | "weather-gap"
    | "style-unknown"
    | "coverage"
    | "coverage-unknown";
  severity: "conflict" | "missing" | "review";
  message: string;
  ids: string[];
  actions: ProblemAction[];
};

export type Candidate = {
  ids: string[];
  score: number;
  reasons: string[];
  problems: Problem[];
  outdoor: string[];
};

export type StyleResult = {
  status: "ready" | "review" | "conflict" | "missing";
  outfits: Candidate[];
  problems: Problem[];
  limited: boolean;
  partial?: { ids: string[]; missing: Role[] };
};

const maxCombinations = 4000;
const maxOutfits = 30;

const overSkirts: readonly string[] = [
  "skirt",
  "lehenga",
  "sharara",
  "gharara",
];
const underKinds: readonly string[] = ["tights", "leggings", "churidar"];
const baseTops: readonly string[] = ["blouse", "shirt", "t-shirt", "top"];

const wears = (outfit: Piece[], kinds: readonly string[]) =>
  outfit.some((piece) => kinds.includes(piece.kind ?? ""));

export function roleOf(piece: Piece, outfit: Piece[] = []): Role {
  switch (piece.kind) {
    case "abaya":
      return piece.traits?.open === false ? "main" : "outer";
    case "coat":
      return "outer";
    case "shawl":
    case "underscarf":
      return "accessory";
    case "tights":
      return "under";
    case "leggings":
    case "churidar":
      return wears(outfit, overSkirts) ? "under" : "bottom";
    case "sweater":
      return wears(outfit, baseTops) ? "layer" : "main";
    default:
      break;
  }
  switch (piece.category) {
    case "top":
    case "tunic":
    case "dress":
      return "main";
    default:
      return piece.category;
  }
}

const kindWarmth: Partial<Record<string, number>> = {
  sweater: 2,
  hoodie: 2,
  abaya: 1,
  cardigan: 1,
  blazer: 1,
  waistcoat: 1,
  jacket: 2,
  coat: 3,
};

export const warmthOf = (piece: Piece) => kindWarmth[piece.kind ?? ""] ?? 0;

function needsBottom(piece: Piece) {
  return piece.category === "top" || piece.category === "tunic";
}

export function missingRoles(
  pieces: Piece[],
  request: Pick<OutfitRequest, "hijab">,
): Role[] {
  const has = (role: Role) => pieces.some((piece) => roleOf(piece) === role);
  const mains = pieces.filter(
    (piece) => roleOf(piece) === "main" || piece.kind === "abaya",
  );
  const whole = mains.some(
    (piece) => piece.category === "dress" || piece.kind === "abaya",
  );
  return [
    ...(mains.length ? [] : ["main" as const]),
    ...(whole || has("bottom") ? [] : ["bottom" as const]),
    ...(has("shoes") ? [] : ["shoes" as const]),
    ...(request.hijab === "always" && !has("hijab") ? ["hijab" as const] : []),
  ];
}

function otherStyle(style: Style): Style {
  return style === "desi" ? "western" : "desi";
}

function fitsStyle(piece: Piece, style: Style) {
  return !piece.styles || piece.styles.includes(style);
}

const gymMains: readonly string[] = ["sports-top", "hoodie", "t-shirt"];
const gymBottoms: readonly string[] = ["leggings", "joggers", "shorts"];

const offAtGym: readonly string[] = ["heels", "blazer", "cardigan"];
const dressyHijabFabrics: readonly string[] = ["chiffon", "silk", "satin"];

function fitsOccasion(piece: Piece, request: OutfitRequest) {
  if (request.occasion !== "gym") return true;
  if (piece.category === "dress" || piece.category === "bag") return false;
  if (piece.category === "accessory") return false;
  if (piece.kind && offAtGym.includes(piece.kind)) return false;
  const role = roleOf(piece);
  if (role === "hijab")
    return !dressyHijabFabrics.includes(piece.attributes?.fabric ?? "");
  if (role === "main") return gymMains.includes(piece.kind ?? "");
  if (role === "bottom") return gymBottoms.includes(piece.kind ?? "");
  if (piece.category === "shoes") return piece.kind === "sneakers";
  if (piece.kind === "coat")
    return (
      request.weather.source !== "unknown" && request.weather.warmth === "cold"
    );
  return true;
}

function outside(request: OutfitRequest) {
  return (
    request.weather.source !== "unknown" &&
    request.weather.exposure !== "mostly-indoors"
  );
}

function names(pieces: Piece[]) {
  return pieces.map((piece) => piece.name).join(` ${t("word.and")} `);
}

function structureProblems(pieces: Piece[], kept: boolean): Problem[] {
  const problems: Problem[] = [];
  const release = (group: Piece[]) =>
    kept
      ? group.map((piece) => ({ type: "release" as const, id: piece.id }))
      : [];
  const dress = pieces.filter(
    (piece) => piece.category === "dress" && roleOf(piece, pieces) === "main",
  );
  const skirts = pieces.filter((piece) =>
    overSkirts.includes(piece.kind ?? ""),
  );
  if (dress.length && skirts.length)
    problems.push({
      code: "kept-conflict",
      severity: "conflict",
      message: t("styling.dressWithSkirt", {
        names: names([...dress, ...skirts]),
      }),
      ids: [...dress, ...skirts].map((piece) => piece.id),
      actions: release([...dress, ...skirts]),
    });
  for (const role of Object.keys(roleLimits) as Role[]) {
    const group = pieces.filter((piece) => roleOf(piece, pieces) === role);
    if (group.length > roleLimits[role]) {
      problems.push({
        code: "kept-conflict",
        severity: "conflict",
        message:
          roleLimits[role] === 1
            ? t("styling.tooManyOfOne", {
                names: names(group),
                role: roleName(role),
              })
            : t("styling.tooManyOfMany", {
                names: names(group),
                count: roleLimits[role],
                role: roleName(role),
              }),
        ids: group.map((piece) => piece.id),
        actions: release(group),
      });
    }
  }
  return problems;
}

function styleProblems(pieces: Piece[], request: OutfitRequest): Problem[] {
  return pieces
    .filter((piece) => !fitsStyle(piece, request.style))
    .map((piece) => ({
      code: "style-conflict" as const,
      severity: "conflict" as const,
      message: t("styling.styleConflict", {
        name: piece.name,
        other: styleLabel(otherStyle(request.style)),
        style: styleLabel(request.style),
      }),
      ids: [piece.id],
      actions: [
        { type: "set-style" as const, style: otherStyle(request.style) },
        { type: "release" as const, id: piece.id },
      ],
    }));
}

function weatherProblems(
  outfit: Piece[],
  request: OutfitRequest,
  pool: Piece[],
): Problem[] {
  const weather = request.weather;
  if (weather.source === "unknown") return [];
  const clear: ProblemAction[] =
    weather.source === "manual" ? [{ type: "clear-weather" }] : [];
  const problems: Problem[] = [];
  const role = (piece: Piece) => roleOf(piece, outfit);
  const shoes = outfit.find((piece) => role(piece) === "shoes");
  const shoeIds = shoes ? [shoes.id] : [];
  const poolShoes = pool.filter((piece) => roleOf(piece) === "shoes");
  const unconfirmed = (piece: Piece, message: string): Problem => ({
    code: "weather-gap",
    severity: "review",
    message,
    ids: [piece.id],
    actions: [{ type: "edit-piece", id: piece.id }, ...clear],
  });
  if (weather.warmth === "cold" && outside(request)) {
    const layers = outfit.filter(
      (piece) => role(piece) === "layer" || role(piece) === "outer",
    );
    const maybe = layers.find(
      (piece) => unconfirmedWeather(piece, "warmth") === "warm",
    );
    if (!layers.some((piece) => confirmedWeather(piece, "warmth") === "warm"))
      problems.push(
        maybe
          ? unconfirmed(
              maybe,
              t("pieceWeather.warmUnconfirmed", { name: maybe.name }),
            )
          : {
              code: "weather-gap",
              severity: "review",
              message: pool.some(
                (piece) => confirmedWeather(piece, "warmth") === "warm",
              )
                ? t("styling.noWarmLayer")
                : t("styling.noWarmLayerCloset"),
              ids: [],
              actions: clear,
            },
      );
  }
  const footwear = (key: "rain" | "snow") => {
    if (shoes && confirmedWeather(shoes, key) === true) return;
    if (shoes && unconfirmedWeather(shoes, key) === true) {
      problems.push(
        unconfirmed(
          shoes,
          t(
            key === "rain"
              ? "pieceWeather.rainUnconfirmed"
              : "pieceWeather.snowUnconfirmed",
            { name: shoes.name },
          ),
        ),
      );
      return;
    }
    problems.push({
      code: "weather-gap",
      severity: "review",
      message: poolShoes.some((piece) => confirmedWeather(piece, key) === true)
        ? t(key === "rain" ? "styling.shoesNotRain" : "styling.shoesNotSnow", {
            name: shoes?.name ?? t("styling.theseShoes"),
          })
        : t(key === "rain" ? "styling.noRainShoes" : "styling.noSnowShoes"),
      ids: shoeIds,
      actions: clear,
    });
  };
  if (weather.precipitation === "snow") footwear("snow");
  if (weather.precipitation === "rain" && outside(request)) footwear("rain");
  return problems;
}

export function evaluateOutfit(
  outfit: Piece[],
  request: OutfitRequest,
  pool: Piece[],
): Problem[] {
  const problems = [
    ...structureProblems(outfit, false),
    ...styleProblems(outfit, request),
  ];
  const role = (piece: Piece) => roleOf(piece, outfit);
  const mains = outfit.filter((piece) => role(piece) === "main");
  const missing = (message: string): Problem => ({
    code: "incomplete",
    severity: "missing",
    message,
    ids: [],
    actions: [],
  });
  if (!mains.length) problems.push(missing(t("styling.addMain")));
  if (
    mains.some(needsBottom) &&
    !outfit.some((piece) => role(piece) === "bottom")
  )
    problems.push(missing(t("styling.addBottom")));
  if (!outfit.some((piece) => role(piece) === "shoes"))
    problems.push(missing(t("styling.addShoes")));
  if (
    request.hijab === "always" &&
    !outfit.some((piece) => role(piece) === "hijab")
  )
    problems.push(missing(t("styling.addHijab")));
  if (
    request.garmentType &&
    !outfit.some((piece) => piece.kind === request.garmentType)
  )
    problems.push(
      missing(
        t("styling.addKind", {
          kind: kindLabel(request.garmentType).toLowerCase(),
        }),
      ),
    );
  const worn = (wanted: Role) => outfit.find((piece) => role(piece) === wanted);
  problems.push(
    ...coverageProblems(
      {
        main: worn("main"),
        bottom: worn("bottom"),
        layer: worn("layer"),
        outer: worn("outer"),
      },
      request.coverage,
    ),
  );
  problems.push(...weatherProblems(outfit, request, pool));
  const unmarked = outfit.filter(
    (piece) =>
      !piece.styles &&
      ["main", "outer", "layer", "bottom"].includes(role(piece)),
  );
  if (unmarked.length)
    problems.push({
      code: "style-unknown",
      severity: "review",
      message:
        unmarked.length === 1
          ? t("styling.unmarkedOne", { names: names(unmarked) })
          : t("styling.unmarkedMany", { names: names(unmarked) }),
      ids: unmarked.map((piece) => piece.id),
      actions: [],
    });
  return problems;
}

export function hash(text: string) {
  let value = 2166136261;
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function difference(a: string[], b: string[]) {
  const set = new Set(a);
  return b.filter((id) => !set.has(id)).length;
}

function diversify(
  candidates: Candidate[],
  seed: string,
  core: (id: string) => boolean,
) {
  const remaining = [...candidates].sort(
    (a, b) =>
      b.score - a.score ||
      hash(seed + a.ids.join()) - hash(seed + b.ids.join()),
  );
  const ordered: Candidate[] = [];
  const uses = new Map<string, number>();
  while (remaining.length && ordered.length < maxOutfits) {
    const last = ordered[ordered.length - 1];
    let index = 0;
    let best = -Infinity;
    remaining.forEach((candidate, at) => {
      if (last && difference(last.ids, candidate.ids) < 2) return;
      const value =
        candidate.score -
        candidate.ids
          .filter(core)
          .reduce((sum, id) => sum + (uses.get(id) ?? 0), 0);
      if (value > best) {
        best = value;
        index = at;
      }
    });
    const picked = remaining.splice(index, 1)[0]!;
    ordered.push(picked);
    for (const id of picked.ids.filter(core))
      uses.set(id, (uses.get(id) ?? 0) + 1);
  }
  return ordered;
}

type Need = "main" | "bottom" | "shoes" | "hijab";

const needOrder: Need[] = ["shoes", "hijab", "main", "bottom"];

function needMessage(needs: Need[], request: OutfitRequest) {
  const gym = request.occasion === "gym";
  if (!gym && needs.length === 1 && needs[0] === "main")
    return t("styling.gapMain");
  if (!gym && needs.length === 1 && needs[0] === "bottom")
    return t("styling.gapBottom", { style: styleLabel(request.style) });
  if (!gym && needs.length === 1 && needs[0] === "shoes")
    return t("styling.gapShoes");
  const clothes = gym && needs.includes("main") && needs.includes("bottom");
  const words = [...needs]
    .sort((a, b) => needOrder.indexOf(a) - needOrder.indexOf(b))
    .flatMap((need): Key[] => {
      if (clothes && need === "bottom") return [];
      if (clothes && need === "main") return ["styling.need.gymClothes"];
      if (gym && need === "main") return ["styling.need.gymTop"];
      if (gym && need === "bottom") return ["styling.need.gymBottom"];
      if (gym && need === "shoes") return ["styling.need.sneakers"];
      return [`styling.need.${need}`];
    })
    .map((key) => t(key));
  const list =
    words.length > 1
      ? `${words.slice(0, -1).join(", ")} ${t("word.and")} ${words[words.length - 1]}`
      : words[0]!;
  return t("styling.gapList", { list });
}

function mainPieceWords(style: Style) {
  return t("styling.noMainForStyle", { style: styleLabel(style) });
}

export function styleOutfits(
  closetPieces: Piece[],
  request: OutfitRequest,
  seed: string,
  scorer: Scorer,
  context: ScoreContext,
): StyleResult {
  const fail = (
    status: "conflict" | "missing",
    problems: Problem[],
  ): StyleResult => ({ status, outfits: [], problems, limited: false });
  const pool = closetPieces.filter(
    (piece) => piece.source === request.wardrobe && isAvailable(piece),
  );
  if (!pool.length)
    return fail("missing", [
      {
        code: "empty-closet",
        severity: "missing",
        message:
          request.wardrobe === "owned"
            ? t("styling.addOwnPieces")
            : t("styling.sampleEmpty"),
        ids: [],
        actions:
          request.wardrobe === "owned"
            ? [{ type: "add-pieces" }, { type: "use-samples" }]
            : [{ type: "add-pieces" }],
      },
    ]);

  const keptAway = closetPieces.filter(
    (piece) =>
      request.keptIds.includes(piece.id) &&
      piece.source === request.wardrobe &&
      piece.status,
  );
  if (keptAway.length)
    return fail(
      "missing",
      keptAway.map((piece) => ({
        code: "kept-missing",
        severity: "missing",
        message: t(
          piece.status === "archived"
            ? "stylist.keptArchived"
            : "stylist.keptAway",
          { name: piece.name },
        ),
        ids: [piece.id],
        actions: [{ type: "release", id: piece.id }],
      })),
    );

  const missingKept = request.keptIds.filter(
    (id) => !pool.some((piece) => piece.id === id),
  );
  if (missingKept.length)
    return fail(
      "missing",
      missingKept.map((id) => ({
        code: "kept-missing",
        severity: "missing",
        message: closetPieces.some(
          (piece) => piece.id === id && piece.source === request.wardrobe,
        )
          ? t("styling.keptUnavailable")
          : t("styling.keptGone"),
        ids: [id],
        actions: [{ type: "release", id }],
      })),
    );
  const kept = request.keptIds.map((id) =>
    pool.find((piece) => piece.id === id)!,
  );
  const keptProblems = [
    ...structureProblems(kept, true),
    ...styleProblems(kept, request),
  ];
  if (keptProblems.length) return fail("conflict", keptProblems);

  const keptIds = new Set(request.keptIds);
  const excluded = new Set(request.excludedIds);
  const available = pool.filter(
    (piece) =>
      !keptIds.has(piece.id) &&
      !excluded.has(piece.id) &&
      !isNeverWear(context.profile, piece),
  );
  const eligible = available.filter(
    (piece) => fitsStyle(piece, request.style) && fitsOccasion(piece, request),
  );
  const keptRole = (role: Role) =>
    kept.filter((piece) => roleOf(piece, kept) === role);
  const eligibleRole = (role: Role) =>
    eligible.filter((piece) => roleOf(piece) === role);

  const type = request.garmentType;
  if (type && !kept.some((piece) => piece.kind === type)) {
    if (!eligible.some((piece) => piece.kind === type)) {
      const other = available.find((piece) => piece.kind === type);
      const label = kindLabel(type).toLowerCase();
      return fail("missing", [
        {
          code: "no-garment-type",
          severity: "missing",
          message: other
            ? t("styling.kindOtherStyle", {
                kind: label,
                other: styleLabel(otherStyle(request.style)),
                style: styleLabel(request.style),
              })
            : pool.some((piece) => piece.kind === type)
              ? t("styling.kindSetAside", { kind: label })
              : t("styling.kindNone", { kind: label }),
          ids: other ? [other.id] : [],
          actions: [
            { type: "clear-type" },
            ...(other
              ? [
                  {
                    type: "set-style" as const,
                    style: otherStyle(request.style),
                  },
                ]
              : []),
            ...(excluded.size ? [{ type: "clear-excluded" as const }] : []),
          ],
        },
      ]);
    }
  }

  const gym = request.occasion === "gym";
  const gaps: Problem[] = [];
  const needs: Need[] = [];
  const mains = keptRole("main").length
    ? keptRole("main")
    : eligibleRole("main");
  if (!mains.length) {
    if (
      available.some(
        (piece) => roleOf(piece) === "main" && fitsOccasion(piece, request),
      )
    )
      gaps.push({
        code: "missing-role",
        severity: "missing",
        message: mainPieceWords(request.style),
        ids: [],
        actions: [{ type: "set-style", style: otherStyle(request.style) }],
      });
    else needs.push("main");
  }
  const bottoms = keptRole("bottom").length
    ? keptRole("bottom")
    : eligibleRole("bottom");
  if (
    !bottoms.length &&
    (mains.length ? mains.every(needsBottom) : gym && needs.includes("main"))
  )
    needs.push("bottom");
  if (!keptRole("shoes").length && !eligibleRole("shoes").length)
    needs.push("shoes");
  if (
    request.hijab === "always" &&
    !keptRole("hijab").length &&
    !eligibleRole("hijab").length
  )
    needs.push("hijab");
  if (needs.length)
    gaps.push({
      code: "missing-role",
      severity: "missing",
      message: needMessage(needs, request),
      ids: [],
      actions: [{ type: "add-pieces" }],
    });
  if (gaps.length) {
    const partial =
      needs.length && gaps.length === 1
        ? {
            ids: (["main", "bottom", "shoes", "hijab"] as const).flatMap(
              (role) => {
                if (needs.includes(role)) return [];
                if (role === "hijab" && request.hijab === "not-needed")
                  return [];
                if (keptRole(role).length)
                  return keptRole(role).map((piece) => piece.id);
                const first = [...eligibleRole(role)].sort(
                  (a, b) => hash(seed + a.id) - hash(seed + b.id),
                )[0];
                if (!first) return [];
                if (
                  role === "bottom" &&
                  mains.length &&
                  !mains.some(needsBottom)
                )
                  return [];
                return [first.id];
              },
            ),
            missing: needs,
          }
        : undefined;
    return { ...fail("missing", gaps), ...(partial ? { partial } : {}) };
  }

  const target = neededWarmth(request.weather);
  const outdoors = outside(request);
  const free = (piece: Piece) => !kept.includes(piece) && piece.kind !== type;
  const warmth = (pieces: Piece[]) =>
    pieces.reduce((sum, piece) => sum + warmthOf(piece), 0);
  const layerCombos = (prefix: Piece[]): Piece[][] => {
    const layers = keptRole("layer").length
      ? [keptRole("layer")]
      : [
          [],
          ...[
            ...eligibleRole("layer"),
            ...(wears(prefix, baseTops)
              ? eligible.filter((piece) => piece.kind === "sweater")
              : []),
          ].map((piece) => [piece]),
        ];
    const outers = keptRole("outer").length
      ? [keptRole("outer")]
      : [
          [],
          ...eligibleRole("outer")
            .filter(
              (piece) =>
                target === null ||
                outdoors ||
                target >= 2 ||
                piece.kind === type,
            )
            .map((piece) => [piece]),
        ];
    const cross = (layer: Piece[]) =>
      outers.map((outer) => [...layer, ...outer]);
    if (target === null) return layers.flatMap(cross);
    const indoor = (layer: Piece[]) => warmth([...prefix, ...layer]);
    const reachable = Math.min(target, 1, Math.max(...layers.map(indoor)));
    const fitting = layers.filter((layer) => {
      const total = indoor(layer);
      return (
        total >= reachable &&
        layer.filter(free).every((piece) => total - warmthOf(piece) < reachable)
      );
    });
    if (!outdoors) return fitting.flatMap(cross);
    return fitting.flatMap((layer) => {
      const totals = outers.map((outer) => indoor(layer) + warmth(outer));
      const enough = totals.filter((total) => total >= target);
      const goal = enough.length ? Math.min(...enough) : Math.max(...totals);
      return outers
        .filter(
          (outer, at) =>
            totals[at] === goal || (outer.length > 0 && !outer.some(free)),
        )
        .map((outer) => [...layer, ...outer]);
    });
  };
  const underOptions = (prefix: Piece[]): Piece[][] => {
    if (keptRole("under").length) return [keptRole("under")];
    if (
      !wears(prefix, overSkirts) &&
      !prefix.some((piece) => piece.category === "dress")
    )
      return [[]];
    return [
      [],
      ...eligible
        .filter(
          (piece) =>
            underKinds.includes(piece.kind ?? "") &&
            !prefix.includes(piece) &&
            roleOf(piece, [...prefix, piece]) === "under",
        )
        .map((piece) => [piece]),
    ];
  };
  const fixedOr = (role: Role, options: Piece[][]) =>
    keptRole(role).length ? [keptRole(role)] : options;

  const slotsFor = (prefix: Piece[]): Piece[][][] => [
    fixedOr("hijab", [
      ...(request.hijab === "not-needed" || !eligibleRole("hijab").length
        ? [[]]
        : eligibleRole("hijab").map((piece) => [piece])),
    ]),
    underOptions(prefix),
    layerCombos(prefix),
    fixedOr(
      "shoes",
      eligibleRole("shoes").map((piece) => [piece]),
    ),
    [keptRole("bag")],
    [keptRole("accessory")],
  ];

  const outfits: Candidate[] = [];
  const reviews: Candidate[] = [];
  let limited = false;
  let coverageBlocked = false;
  const considered = new Map<string, number | null>();
  const consider = (ids: Piece[]): number | null => {
    const key = ids.map((piece) => piece.id).join();
    if (considered.has(key)) return considered.get(key)!;
    if (new Set(ids).size !== ids.length) return null;
    considered.set(key, null);
    const problems = evaluateOutfit(ids, request, pool);
    if (problems.some((problem) => problem.severity !== "review")) {
      if (
        problems.every(
          (problem) =>
            problem.severity === "review" || problem.code === "coverage",
        )
      )
        coverageBlocked = true;
      return null;
    }
    const { score, reasons } = scorer.score(ids, request, context);
    const candidate = {
      ids: ids.map((piece) => piece.id),
      score,
      reasons,
      problems,
      outdoor: ids
        .filter((piece) => roleOf(piece, ids) === "outer")
        .map((piece) => piece.id),
    };
    (problems.length ? reviews : outfits).push(candidate);
    const rank = problems.length ? score - 100 : score;
    considered.set(key, rank);
    return rank;
  };
  const extras = [
    keptRole("bag").length ? [] : eligibleRole("bag"),
    request.style === "desi" && !kept.some((piece) => piece.kind === "dupatta")
      ? eligible.filter((piece) => piece.kind === "dupatta")
      : [],
  ];
  const accessorise = (candidate: Candidate): Candidate => {
    let best = candidate;
    for (const options of extras) {
      const start = best;
      for (const extra of options) {
        const pieces = [...start.ids, extra.id].map((id) =>
          pool.find((piece) => piece.id === id)!,
        );
        if (
          evaluateOutfit(pieces, request, pool).some(
            (problem) => problem.severity !== "review",
          )
        )
          continue;
        const result = scorer.score(pieces, request, context);
        if (result.score > best.score)
          best = { ...candidate, ids: [...start.ids, extra.id], ...result };
      }
    }
    return best;
  };
  const pairs = mains.flatMap((main) => {
    const bottomOptions: Piece[][] = keptRole("bottom").length
      ? [keptRole("bottom")]
      : needsBottom(main)
        ? bottoms.map((piece) => [piece])
        : [
            [],
            ...bottoms
              .filter(
                (piece) =>
                  main.category !== "dress" ||
                  !overSkirts.includes(piece.kind ?? ""),
              )
              .map((piece) => [piece]),
          ];
    return bottomOptions.map((bottom) => [main, ...bottom]);
  });
  const chosenPairs =
    pairs.length > maxCombinations
      ? [...pairs]
          .sort(
            (a, b) =>
              hash(seed + a.map((piece) => piece.id).join()) -
              hash(seed + b.map((piece) => piece.id).join()),
          )
          .slice(0, maxCombinations)
      : pairs;
  if (chosenPairs.length < pairs.length) limited = true;
  const budget = Math.max(1, Math.floor(maxCombinations / chosenPairs.length));
  for (const prefix of chosenPairs) {
    const slots = slotsFor(prefix);
    const total = slots.reduce(
      (product, options) => product * options.length,
      1,
    );
    const combination = (index: number) => {
      const outfit = [...prefix];
      let rest = index;
      for (const options of slots) {
        outfit.push(...options[rest % options.length]!);
        rest = Math.floor(rest / options.length);
      }
      return outfit;
    };
    if (total <= budget) {
      for (let index = 0; index < total; index++) consider(combination(index));
      continue;
    }
    limited = true;
    const build = (picks: number[]) => [
      ...prefix,
      ...slots.flatMap((options, slot) => options[picks[slot]!]!),
    ];
    let picks = slots.map((options) =>
      options.length > 1 && options[0]!.length
        ? hash(seed + prefix.map((piece) => piece.id).join()) % options.length
        : 0,
    );
    let best = consider(build(picks)) ?? -Infinity;
    for (let round = 0; round < 3; round++) {
      let improved = false;
      slots.forEach((options, slot) =>
        options.forEach((_, option) => {
          if (option === picks[slot]) return;
          const next = picks.map((pick, at) => (at === slot ? option : pick));
          const score = consider(build(next));
          if (score === null || score <= best) return;
          best = score;
          picks = next;
          improved = true;
        }),
      );
      if (!improved) break;
    }
  }
  const coreIds = new Set(
    pool
      .filter((piece) => {
        const role = roleOf(piece);
        return role === "main" || role === "bottom";
      })
      .map((piece) => piece.id),
  );
  const core = (id: string) => coreIds.has(id);

  if (outfits.length)
    return {
      status: "ready",
      outfits: diversify(outfits, seed, core).map(accessorise),
      problems: [],
      limited,
    };
  if (reviews.length) {
    const ordered = diversify(reviews, seed, core).map(accessorise);
    return {
      status: "review",
      outfits: ordered,
      problems: ordered[0]!.problems,
      limited,
    };
  }
  return {
    status: "missing",
    outfits: [],
    problems: [
      coverageBlocked && !limited
        ? {
            code: "coverage",
            severity: "missing",
            message: t("coverage.none"),
            ids: [],
            actions: [{ type: "add-pieces" }],
          }
        : {
            code: "incomplete",
            severity: "missing",
            message: limited ? t("styling.tooMany") : t("styling.incomplete"),
            ids: [],
            actions: [
              ...(type ? [{ type: "clear-type" as const }] : []),
              { type: "choose-pieces" },
            ],
          },
    ],
    limited,
  };
}

export type Replacement = { piece: Piece; problems: Problem[]; score: number };

export function replacementsFor(
  closetPieces: Piece[],
  request: OutfitRequest,
  currentIds: string[],
  targetId: string,
  scorer: Scorer,
  context: ScoreContext,
): Replacement[] {
  const wardrobe = closetPieces.filter(
    (piece) => piece.source === request.wardrobe,
  );
  const pool = wardrobe.filter(isAvailable);
  const target = wardrobe.find((piece) => piece.id === targetId);
  if (!target) return [];
  const role = roleOf(target);
  const others = currentIds
    .filter((id) => id !== targetId)
    .flatMap((id) => wardrobe.filter((piece) => piece.id === id));
  return pool
    .filter(
      (piece) =>
        roleOf(piece) === role &&
        !currentIds.includes(piece.id) &&
        !request.excludedIds.includes(piece.id) &&
        !isNeverWear(context.profile, piece) &&
        fitsOccasion(piece, request),
    )
    .map((piece) => {
      const outfit = currentIds.map((id) =>
        id === targetId ? piece : others.find((item) => item.id === id)!,
      );
      return {
        piece,
        problems: evaluateOutfit(outfit, request, pool),
        score: scorer.score(outfit, request, context).score,
      };
    })
    .filter(({ problems }) =>
      problems.every((problem) => problem.severity === "review"),
    )
    .sort(
      (a, b) => b.score - a.score || a.piece.name.localeCompare(b.piece.name),
    );
}

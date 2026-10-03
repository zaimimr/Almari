import { t } from "../i18n";
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

export type Role =
  | "main"
  | "bottom"
  | "layer"
  | "outer"
  | "hijab"
  | "shoes"
  | "bag"
  | "accessory";

const roleLimits: Record<Role, number> = {
  main: 1,
  bottom: 1,
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
};

export type StyleResult = {
  status: "ready" | "review" | "conflict" | "missing";
  outfits: Candidate[];
  problems: Problem[];
  limited: boolean;
};

const maxCombinations = 4000;
const maxOutfits = 30;

export function roleOf(piece: Piece): Role {
  switch (piece.kind) {
    case "abaya":
      return piece.traits?.open === false ? "main" : "outer";
    case "coat":
      return "outer";
    case "shawl":
    case "underscarf":
      return "accessory";
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
  for (const role of Object.keys(roleLimits) as Role[]) {
    const group = pieces.filter((piece) => roleOf(piece) === role);
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
        actions: kept
          ? group.map((piece) => ({ type: "release" as const, id: piece.id }))
          : [],
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
  const shoes = outfit.find((piece) => roleOf(piece) === "shoes");
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
      (piece) => roleOf(piece) === "layer" || roleOf(piece) === "outer",
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
  const mains = outfit.filter((piece) => roleOf(piece) === "main");
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
    !outfit.some((piece) => roleOf(piece) === "bottom")
  )
    problems.push(missing(t("styling.addBottom")));
  if (!outfit.some((piece) => roleOf(piece) === "shoes"))
    problems.push(missing(t("styling.addShoes")));
  if (
    request.hijab === "always" &&
    !outfit.some((piece) => roleOf(piece) === "hijab")
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
  const worn = (role: Role) => outfit.find((piece) => roleOf(piece) === role);
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
      ["main", "outer", "layer", "bottom"].includes(roleOf(piece)),
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

function diversify(candidates: Candidate[], seed: string) {
  const remaining = [...candidates].sort(
    (a, b) =>
      b.score - a.score ||
      hash(seed + a.ids.join()) - hash(seed + b.ids.join()),
  );
  const ordered: Candidate[] = [];
  while (remaining.length && ordered.length < maxOutfits) {
    const last = ordered[ordered.length - 1];
    const index = last
      ? Math.max(
          0,
          remaining.findIndex(
            (candidate) => difference(last.ids, candidate.ids) >= 2,
          ),
        )
      : 0;
    ordered.push(remaining.splice(index, 1)[0]!);
  }
  return ordered;
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
  const eligible = available.filter((piece) => fitsStyle(piece, request.style));
  const keptRole = (role: Role) =>
    kept.filter((piece) => roleOf(piece) === role);
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

  const gaps: Problem[] = [];
  const gap = (message: string, actions: ProblemAction[] = []) =>
    gaps.push({
      code: "missing-role",
      severity: "missing",
      message,
      ids: [],
      actions,
    });
  const mains = keptRole("main").length
    ? keptRole("main")
    : eligibleRole("main");
  if (!mains.length) {
    if (available.some((piece) => roleOf(piece) === "main"))
      gap(mainPieceWords(request.style), [
        { type: "set-style", style: otherStyle(request.style) },
      ]);
    else gap(t("styling.gapMain"), [{ type: "add-pieces" }]);
  }
  const bottoms = keptRole("bottom").length
    ? keptRole("bottom")
    : eligibleRole("bottom");
  if (mains.length && mains.every(needsBottom) && !bottoms.length)
    gap(t("styling.gapBottom", { style: styleLabel(request.style) }), [
      { type: "add-pieces" },
    ]);
  if (!keptRole("shoes").length && !eligibleRole("shoes").length)
    gap(t("styling.gapShoes"), [{ type: "add-pieces" }]);
  if (
    request.hijab === "always" &&
    !keptRole("hijab").length &&
    !eligibleRole("hijab").length
  )
    gap(t("styling.gapHijab"), [{ type: "add-pieces" }]);
  if (gaps.length) return fail("missing", gaps);

  const warm =
    request.weather.source !== "unknown" && request.weather.warmth === "warm";
  const layerOptions = (role: "layer" | "outer") => {
    if (keptRole(role).length) return [keptRole(role)];
    const options = eligibleRole(role).filter(
      (piece) => !warm || piece.kind === type,
    );
    return [[], ...options.map((piece) => [piece])];
  };
  const fixedOr = (role: Role, options: Piece[][]) =>
    keptRole(role).length ? [keptRole(role)] : options;

  const slots: Piece[][][] = [
    fixedOr("hijab", [
      ...(request.hijab === "not-needed" || !eligibleRole("hijab").length
        ? [[]]
        : eligibleRole("hijab").map((piece) => [piece])),
    ]),
    layerOptions("layer"),
    layerOptions("outer"),
    fixedOr(
      "shoes",
      eligibleRole("shoes").map((piece) => [piece]),
    ),
    [keptRole("bag")],
    [keptRole("accessory")],
  ];

  const outfits: Candidate[] = [];
  const reviews: Candidate[] = [];
  let count = 0;
  let limited = false;
  let coverageBlocked = false;
  const consider = (ids: Piece[]) => {
    const problems = evaluateOutfit(ids, request, pool);
    if (problems.some((problem) => problem.severity !== "review")) {
      if (
        problems.every(
          (problem) =>
            problem.severity === "review" || problem.code === "coverage",
        )
      )
        coverageBlocked = true;
      return;
    }
    const { score, reasons } = scorer.score(ids, request, context);
    const candidate = {
      ids: ids.map((piece) => piece.id),
      score,
      reasons,
      problems,
    };
    (problems.length ? reviews : outfits).push(candidate);
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
  const expand = (prefix: Piece[], rest: Piece[][][]) => {
    if (limited) return;
    if (!rest.length) {
      if (++count > maxCombinations) {
        limited = true;
        return;
      }
      consider(prefix);
      return;
    }
    for (const option of rest[0]!)
      expand([...prefix, ...option], rest.slice(1));
  };
  for (const main of mains) {
    const bottomOptions: Piece[][] = keptRole("bottom").length
      ? [keptRole("bottom")]
      : needsBottom(main)
        ? bottoms.map((piece) => [piece])
        : [[], ...bottoms.map((piece) => [piece])];
    expand([main], [bottomOptions, ...slots]);
  }

  if (outfits.length)
    return {
      status: "ready",
      outfits: diversify(outfits, seed).map(accessorise),
      problems: [],
      limited,
    };
  if (reviews.length) {
    const ordered = diversify(reviews, seed).map(accessorise);
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
        !isNeverWear(context.profile, piece),
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

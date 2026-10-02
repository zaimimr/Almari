import {
  isAvailable,
  kindLabel,
  styleLabel,
  type OutfitRequest,
  type Piece,
  type Style,
} from "./closet";

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

const roleNames: Record<Role, string> = {
  main: "main pieces",
  bottom: "trousers or skirts",
  layer: "layers",
  outer: "outer layers",
  hijab: "hijabs",
  shoes: "pairs of shoes",
  bag: "bags",
  accessory: "accessories",
};

export type ProblemAction =
  | { type: "release"; id: string }
  | { type: "clear-type" }
  | { type: "set-style"; style: Style }
  | { type: "clear-weather" }
  | { type: "clear-excluded" }
  | { type: "choose-pieces" }
  | { type: "add-pieces" }
  | { type: "use-samples" };

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
    | "style-unknown";
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
  return pieces.map((piece) => piece.name).join(" and ");
}

function structureProblems(pieces: Piece[], kept: boolean): Problem[] {
  const problems: Problem[] = [];
  for (const role of Object.keys(roleLimits) as Role[]) {
    const group = pieces.filter((piece) => roleOf(piece) === role);
    if (group.length > roleLimits[role]) {
      problems.push({
        code: "kept-conflict",
        severity: "conflict",
        message: `${names(group)} cannot be worn together. An outfit uses ${roleLimits[role] === 1 ? "one" : roleLimits[role]} of these ${roleNames[role]}.`,
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
      message: `${piece.name} is marked ${styleLabel(otherStyle(request.style))}, and this outfit is ${styleLabel(request.style)}.`,
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
  const problems: Problem[] = [];
  const shoes = outfit.find((piece) => roleOf(piece) === "shoes");
  const shoeIds = shoes ? [shoes.id] : [];
  const poolShoes = pool.filter((piece) => roleOf(piece) === "shoes");
  if (weather.warmth === "cold" && outside(request)) {
    const warm = outfit.some(
      (piece) =>
        (roleOf(piece) === "layer" || roleOf(piece) === "outer") &&
        piece.traits?.warmth === "warm",
    );
    if (!warm)
      problems.push({
        code: "weather-gap",
        severity: "review",
        message: pool.some((piece) => piece.traits?.warmth === "warm")
          ? "This outfit has no layer marked warm enough for time outside in the cold."
          : "Your closet does not have a layer marked warm enough for time outside in the cold.",
        ids: [],
        actions: [{ type: "clear-weather" }],
      });
  }
  if (weather.precipitation === "snow" && shoes?.traits?.snow !== true)
    problems.push({
      code: "weather-gap",
      severity: "review",
      message: poolShoes.some((piece) => piece.traits?.snow === true)
        ? `${shoes?.name ?? "These shoes"} are not marked suitable for snow.`
        : "Your closet does not have footwear marked suitable for snow.",
      ids: shoeIds,
      actions: [{ type: "clear-weather" }],
    });
  if (
    weather.precipitation === "rain" &&
    outside(request) &&
    shoes?.traits?.rain !== true
  )
    problems.push({
      code: "weather-gap",
      severity: "review",
      message: poolShoes.some((piece) => piece.traits?.rain === true)
        ? `${shoes?.name ?? "These shoes"} are not marked suitable for rain.`
        : "Your closet does not have footwear marked suitable for rain.",
      ids: shoeIds,
      actions: [{ type: "clear-weather" }],
    });
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
  if (!mains.length) problems.push(missing("Add a top, tunic, or dress."));
  if (
    mains.some(needsBottom) &&
    !outfit.some((piece) => roleOf(piece) === "bottom")
  )
    problems.push(missing("Add trousers or a skirt."));
  if (!outfit.some((piece) => roleOf(piece) === "shoes"))
    problems.push(missing("Add shoes."));
  if (
    request.hijab === "always" &&
    !outfit.some((piece) => roleOf(piece) === "hijab")
  )
    problems.push(missing("Add a hijab."));
  if (
    request.garmentType &&
    !outfit.some((piece) => piece.kind === request.garmentType)
  )
    problems.push(
      missing(`Add a ${kindLabel(request.garmentType).toLowerCase()}.`),
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
      message: `${names(unmarked)} ${unmarked.length === 1 ? "is" : "are"} not marked Desi or Western yet.`,
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

function lower(piece: Piece) {
  return piece.name.charAt(0).toLowerCase() + piece.name.slice(1);
}

export function scoreOutfit(outfit: Piece[], request: OutfitRequest) {
  let score = 0;
  const reasons: string[] = [];
  const byRole = (role: Role) => outfit.find((piece) => roleOf(piece) === role);
  const main = byRole("main");
  const hijab = byRole("hijab");
  const bottom = byRole("bottom");
  const layer = byRole("layer") ?? byRole("outer");
  const shoes = byRole("shoes");
  const tagged = outfit.filter((piece) => piece.traits?.occasions);
  const suited = tagged.filter((piece) =>
    piece.traits!.occasions!.includes(request.occasion),
  );
  score += suited.length - (tagged.length - suited.length) * 1.5;
  if (tagged.length && suited.length === tagged.length)
    reasons.push(
      `Every piece is marked for ${request.occasion === "everyday" ? "everyday wear" : request.occasion}.`,
    );
  const weather = request.weather;
  if (layer && weather.source !== "unknown" && weather.warmth !== "warm") {
    score += weather.warmth === "cold" ? 2 : 0.5;
    reasons.push(
      `The ${lower(layer)} adds a layer for a ${weather.warmth} day.`,
    );
  } else if (layer && request.occasion === "work") score += 0.5;
  if (
    byRole("layer") &&
    byRole("outer") &&
    !(weather.source !== "unknown" && weather.warmth === "cold")
  )
    score -= 1.5;
  if (main && bottom && roleOf(main) === "main" && !needsBottom(main))
    score -= 1.5;
  if (hijab?.traits?.tone && main?.traits?.tone) {
    if (hijab.traits.tone !== main.traits.tone) {
      score += 1;
      reasons.push(
        `The ${lower(hijab)} brings contrast to the ${lower(main)}.`,
      );
    } else score -= 0.5;
    const echoes = [layer, shoes].find(
      (piece) => piece && piece.traits?.tone === hijab.traits!.tone,
    );
    if (echoes) {
      score += 0.5;
      if (hijab.traits.tone !== main.traits.tone)
        reasons.push(`It echoes the ${lower(echoes)}.`);
    }
  }
  const tones = [main, bottom, hijab]
    .map((piece) => piece?.traits?.tone)
    .filter(Boolean);
  if (tones.length === 3 && tones.every((tone) => tone === "light")) score -= 1;
  return { score, reasons: reasons.slice(0, 2) };
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
  return `None of your tops, tunics, or dresses are marked ${styleLabel(style)}.`;
}

export function styleOutfits(
  closetPieces: Piece[],
  request: OutfitRequest,
  seed: string,
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
            ? "Add a few of your own pieces to get outfit suggestions."
            : "The sample closet is empty.",
        ids: [],
        actions:
          request.wardrobe === "owned"
            ? [{ type: "add-pieces" }, { type: "use-samples" }]
            : [{ type: "add-pieces" }],
      },
    ]);

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
          ? "A piece you chose to keep is marked unavailable."
          : "A piece you chose to keep is no longer in this closet.",
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
    (piece) => !keptIds.has(piece.id) && !excluded.has(piece.id),
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
            ? `Your ${label} is marked ${styleLabel(otherStyle(request.style))}. There is no ${label} for a ${styleLabel(request.style)} outfit.`
            : pool.some((piece) => piece.kind === type)
              ? `Your only ${label} is set aside for this request.`
              : `There is no ${label} in this closet yet.`,
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
    else
      gap("Add a top, tunic, or dress to style a complete outfit.", [
        { type: "add-pieces" },
      ]);
  }
  const bottoms = keptRole("bottom").length
    ? keptRole("bottom")
    : eligibleRole("bottom");
  if (mains.length && mains.every(needsBottom) && !bottoms.length)
    gap(
      `Add trousers or a skirt that suits a ${styleLabel(request.style)} outfit.`,
      [{ type: "add-pieces" }],
    );
  if (!keptRole("shoes").length && !eligibleRole("shoes").length)
    gap("Add shoes to complete an outfit.", [{ type: "add-pieces" }]);
  if (
    request.hijab === "always" &&
    !keptRole("hijab").length &&
    !eligibleRole("hijab").length
  )
    gap("Add a hijab to complete an outfit.", [{ type: "add-pieces" }]);
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
  const consider = (ids: Piece[]) => {
    const problems = evaluateOutfit(ids, request, pool);
    if (problems.some((problem) => problem.severity !== "review")) return;
    const { score, reasons } = scoreOutfit(ids, request);
    const candidate = {
      ids: ids.map((piece) => piece.id),
      score,
      reasons,
      problems,
    };
    (problems.length ? reviews : outfits).push(candidate);
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
      outfits: diversify(outfits, seed),
      problems: [],
      limited,
    };
  if (reviews.length) {
    const ordered = diversify(reviews, seed);
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
      {
        code: "incomplete",
        severity: "missing",
        message: limited
          ? "There are too many combinations to check at once. Keep a piece or choose a garment type to narrow the search."
          : "These choices do not make a complete outfit.",
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
        !request.excludedIds.includes(piece.id),
    )
    .map((piece) => {
      const outfit = currentIds.map((id) =>
        id === targetId ? piece : others.find((item) => item.id === id)!,
      );
      return {
        piece,
        problems: evaluateOutfit(outfit, request, pool),
        score: scoreOutfit(outfit, request).score,
      };
    })
    .filter(({ problems }) =>
      problems.every((problem) => problem.severity === "review"),
    )
    .sort(
      (a, b) => b.score - a.score || a.piece.name.localeCompare(b.piece.name),
    );
}

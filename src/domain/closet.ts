import {
  categories,
  garmentKinds,
  occasions,
  styleOptions,
  type Category,
  type GarmentKind,
  type Occasion,
  type Style,
} from "./taxonomy";

export * from "./taxonomy";

export type Tone = "light" | "mid" | "dark";
export type Warmth = "light" | "medium" | "warm";

export type Traits = {
  tone?: Tone;
  occasions?: Occasion[];
  warmth?: Warmth;
  rain?: boolean;
  snow?: boolean;
  open?: boolean;
};

export type Frame = { x: number; y: number; width: number; height: number };

export type Source = "proposed" | "label" | "confirmed";

export const sourceKeys = ["kind", "styles"] as const;

export type SourceKey = (typeof sourceKeys)[number];

export type Sources = Partial<Record<SourceKey, Source>>;

export type QuickCheck = "category" | "subcategory" | "style";

export type Piece = {
  id: string;
  name: string;
  category: Category;
  photo: string;
  createdAt: string;
  source: "sample" | "owned";
  kind?: GarmentKind;
  styles?: Style[];
  traits?: Traits;
  original?: string;
  frame?: Frame;
  sources?: Sources;
};

export type Prepared = {
  original: string;
  cutout: string | null;
  thumbnail: string | null;
  frame: Frame | null;
  instances: number;
  kinds: { kind: string; score: number }[];
  color: [number, number, number] | null;
};

export type ImportJob = {
  id: string;
  source: string;
  createdAt: string;
  state: "queued" | "preparing" | "ready" | "review" | "failed";
  attempts: number;
  prepared?: Prepared;
  kind?: GarmentKind;
  name?: string;
  alternatives?: GarmentKind[];
  checks?: ("uncertain" | "no-cutout" | "several")[];
  keepOriginal?: boolean;
  error?: string;
};

export type Look = {
  id: string;
  name: string;
  pieceIds: string[];
  createdAt: string;
};

export type HijabPreference = "always" | "not-needed" | null;
export type WardrobeMode = "sample" | "owned";

export type Weather =
  | { source: "unknown" }
  | {
      source: "manual";
      warmth: "warm" | "mild" | "cold";
      precipitation: "dry" | "rain" | "snow";
      exposure: "mostly-indoors" | "time-outside" | null;
    };

export type EverydayStyle = {
  version: number;
  occasion: Occasion;
  style: Style;
  hijab: HijabPreference;
  sample: boolean;
};

export type OutfitRequest = {
  occasion: Occasion;
  style: Style;
  garmentType: GarmentKind | null;
  keptIds: string[];
  excludedIds: string[];
  weather: Weather;
  hijab: HijabPreference;
  wardrobe: WardrobeMode;
};

export type Session = {
  revision: number;
  request: OutfitRequest;
  cursor: number;
  pieceIds: string[];
  previousPieceIds: string[] | null;
};

export type TodayState = {
  localDate: string;
  timeZone: string;
  presetVersion: number;
  everyday: Session;
  occasion: Session | null;
  active: "everyday" | "occasion";
};

export type Styling = {
  everyday: EverydayStyle | null;
  wardrobe: WardrobeMode;
  today: TodayState | null;
};

export type Closet = {
  version: 2;
  pieces: Piece[];
  looks: Look[];
  sampleCatalog: number;
  styling: Styling;
  imports: ImportJob[];
  photoTipsSeen?: boolean;
};

export const emptyStyling: Styling = {
  everyday: null,
  wardrobe: "sample",
  today: null,
};

export const emptyCloset: Closet = {
  version: 2,
  pieces: [],
  looks: [],
  sampleCatalog: 0,
  styling: emptyStyling,
  imports: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOneOf<T extends string>(
  options: readonly { id: T }[],
  value: unknown,
): value is T {
  return options.some((option) => option.id === value);
}

function isUniqueStrings(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(isString) &&
    new Set(value).size === value.length
  );
}

function optional<T>(value: unknown, check: (value: unknown) => value is T) {
  return value === undefined || check(value);
}

const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";
const isTone = (value: unknown): value is Tone =>
  value === "light" || value === "mid" || value === "dark";
const isWarmth = (value: unknown): value is Warmth =>
  value === "light" || value === "medium" || value === "warm";
const isOccasion = (value: unknown): value is Occasion =>
  isOneOf(occasions, value);
const isStyle = (value: unknown): value is Style =>
  isOneOf(styleOptions, value);
const isKind = (value: unknown): value is GarmentKind =>
  isOneOf(garmentKinds, value);

function isTraits(value: unknown): value is Traits {
  return (
    isRecord(value) &&
    optional(value.tone, isTone) &&
    optional(value.warmth, isWarmth) &&
    optional(value.rain, isBoolean) &&
    optional(value.snow, isBoolean) &&
    optional(value.open, isBoolean) &&
    optional(
      value.occasions,
      (list): list is Occasion[] =>
        Array.isArray(list) && list.every(isOccasion),
    )
  );
}

const sourceValues = ["proposed", "label", "confirmed"];

function isSources(value: unknown): value is Sources {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([key, source]) =>
        (sourceKeys as readonly string[]).includes(key) &&
        sourceValues.includes(source as string),
    )
  );
}

function isPieceBase(value: unknown): value is Record<string, unknown> {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.photo) &&
    isString(value.createdAt) &&
    categories.some((category) => category.id === value.category)
  );
}

function isPiece(value: unknown): value is Piece {
  return (
    isPieceBase(value) &&
    (value.source === "sample" || value.source === "owned") &&
    optional(value.kind, isKind) &&
    (value.kind === undefined ||
      garmentKinds.find((kind) => kind.id === value.kind)?.category ===
        value.category) &&
    optional(
      value.styles,
      (list): list is Style[] =>
        Array.isArray(list) &&
        list.every(isStyle) &&
        new Set(list).size === list.length,
    ) &&
    optional(value.traits, isTraits) &&
    optional(value.original, isString) &&
    optional(value.frame, isFrame) &&
    optional(value.sources, isSources)
  );
}

function isFrame(value: unknown): value is Frame {
  return (
    isRecord(value) &&
    ["x", "y", "width", "height"].every(
      (key) => typeof value[key] === "number" && Number.isFinite(value[key]),
    )
  );
}

function isPrepared(value: unknown): value is Prepared {
  return (
    isRecord(value) &&
    isString(value.original) &&
    (value.cutout === null || isString(value.cutout)) &&
    (value.thumbnail === null || isString(value.thumbnail)) &&
    (value.frame === null || isFrame(value.frame)) &&
    Number.isInteger(value.instances) &&
    Array.isArray(value.kinds) &&
    value.kinds.every(
      (entry) =>
        isRecord(entry) &&
        isString(entry.kind) &&
        typeof entry.score === "number",
    ) &&
    (value.color === null ||
      (Array.isArray(value.color) &&
        value.color.length === 3 &&
        value.color.every((part) => typeof part === "number")))
  );
}

const jobStates = ["queued", "preparing", "ready", "review", "failed"];
const checkReasons = ["uncertain", "no-cutout", "several"];

function isImportJob(value: unknown): value is ImportJob {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.source) &&
    isString(value.createdAt) &&
    jobStates.includes(value.state as string) &&
    Number.isInteger(value.attempts) &&
    optional(value.prepared, isPrepared) &&
    optional(value.kind, isKind) &&
    optional(value.name, isString) &&
    optional(
      value.alternatives,
      (list): list is GarmentKind[] =>
        Array.isArray(list) && list.every(isKind),
    ) &&
    optional(
      value.checks,
      (list): list is string[] =>
        Array.isArray(list) &&
        list.every((item) => checkReasons.includes(item as string)),
    ) &&
    optional(value.keepOriginal, isBoolean) &&
    optional(value.error, isString) &&
    (!["ready", "review"].includes(value.state as string) ||
      (value.prepared !== undefined &&
        value.kind !== undefined &&
        value.name !== undefined))
  );
}

function isLook(value: unknown): value is Look {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.createdAt) &&
    isUniqueStrings(value.pieceIds) &&
    value.pieceIds.length > 0
  );
}

function isHijabPreference(value: unknown): value is HijabPreference {
  return value === null || value === "always" || value === "not-needed";
}

function isWardrobe(value: unknown): value is WardrobeMode {
  return value === "sample" || value === "owned";
}

function isWeather(value: unknown): value is Weather {
  if (!isRecord(value)) return false;
  if (value.source === "unknown") return true;
  return (
    value.source === "manual" &&
    ["warm", "mild", "cold"].includes(value.warmth as string) &&
    ["dry", "rain", "snow"].includes(value.precipitation as string) &&
    (value.exposure === null ||
      value.exposure === "mostly-indoors" ||
      value.exposure === "time-outside")
  );
}

function isEverydayStyle(value: unknown): value is EverydayStyle {
  return (
    isRecord(value) &&
    Number.isInteger(value.version) &&
    isOccasion(value.occasion) &&
    isStyle(value.style) &&
    isHijabPreference(value.hijab) &&
    isBoolean(value.sample)
  );
}

function isRequest(value: unknown): value is OutfitRequest {
  return (
    isRecord(value) &&
    isOccasion(value.occasion) &&
    isStyle(value.style) &&
    (value.garmentType === null || isKind(value.garmentType)) &&
    isUniqueStrings(value.keptIds) &&
    isUniqueStrings(value.excludedIds) &&
    isWeather(value.weather) &&
    isHijabPreference(value.hijab) &&
    isWardrobe(value.wardrobe)
  );
}

function isSession(value: unknown): value is Session {
  return (
    isRecord(value) &&
    Number.isInteger(value.revision) &&
    Number.isInteger(value.cursor) &&
    isRequest(value.request) &&
    isUniqueStrings(value.pieceIds) &&
    (value.previousPieceIds === null || isUniqueStrings(value.previousPieceIds))
  );
}

function isToday(value: unknown): value is TodayState {
  return (
    isRecord(value) &&
    isString(value.localDate) &&
    isString(value.timeZone) &&
    Number.isInteger(value.presetVersion) &&
    isSession(value.everyday) &&
    (value.occasion === null || isSession(value.occasion)) &&
    (value.active === "everyday" ||
      (value.active === "occasion" && value.occasion !== null))
  );
}

function isStyling(value: unknown): value is Styling {
  return (
    isRecord(value) &&
    (value.everyday === null || isEverydayStyle(value.everyday)) &&
    isWardrobe(value.wardrobe) &&
    (value.today === null || isToday(value.today))
  );
}

function hasUniqueIds(items: { id: string }[]) {
  return new Set(items.map((item) => item.id)).size === items.length;
}

const unreadable = () =>
  new Error("This closet could not be opened. Your saved data has been kept.");

export type SampleTraits = Pick<Piece, "kind" | "styles" | "traits"> & {
  category: Category;
};

export function migrateV1(
  value: unknown,
  sampleTraits: Record<string, SampleTraits>,
): Closet {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    optional(value.sampleWardrobeAdded, isBoolean) === false ||
    !Array.isArray(value.pieces) ||
    !Array.isArray(value.looks) ||
    !value.pieces.every(isPieceBase) ||
    !value.looks.every(isLook) ||
    !hasUniqueIds(value.pieces as Piece[]) ||
    !hasUniqueIds(value.looks)
  ) {
    throw unreadable();
  }
  const pieces = (value.pieces as Record<string, unknown>[]).map(
    (old): Piece => {
      const base = {
        id: old.id as string,
        name: old.name as string,
        category: old.category as Category,
        photo: old.photo as string,
        createdAt: old.createdAt as string,
      };
      const sample = sampleTraits[base.id];
      if (!sample) return { ...base, source: "owned" };
      if (sample.category !== base.category)
        return { ...base, source: "sample" };
      return {
        ...base,
        source: "sample",
        kind: sample.kind,
        styles: sample.styles,
        traits: sample.traits,
      };
    },
  );
  return {
    version: 2,
    pieces,
    looks: value.looks,
    sampleCatalog: value.sampleWardrobeAdded ? 1 : 0,
    styling: emptyStyling,
    imports: [],
  };
}

export function decodeCloset(
  raw: string | null,
  sampleTraits: Record<string, SampleTraits> = {},
): Closet {
  if (raw === null) return emptyCloset;
  const value: unknown = JSON.parse(raw);
  if (isRecord(value) && value.version === 1)
    return migrateV1(value, sampleTraits);
  if (
    !isRecord(value) ||
    value.version !== 2 ||
    !Number.isInteger(value.sampleCatalog) ||
    !Array.isArray(value.pieces) ||
    !Array.isArray(value.looks) ||
    !value.pieces.every(isPiece) ||
    !value.looks.every(isLook) ||
    !hasUniqueIds(value.pieces) ||
    !hasUniqueIds(value.looks) ||
    !isStyling(value.styling) ||
    !optional(
      value.imports,
      (list): list is ImportJob[] =>
        Array.isArray(list) && list.every(isImportJob),
    ) ||
    !optional(value.photoTipsSeen, isBoolean)
  ) {
    throw unreadable();
  }
  return {
    ...(value as Closet),
    imports: (value.imports as ImportJob[]) ?? [],
  };
}

export function savePiece(closet: Closet, piece: Piece): Closet {
  const clean = { ...piece, name: piece.name.trim() };
  if (!isPiece(clean))
    throw new Error("Add a photo, a name, and a category for this piece.");
  const exists = closet.pieces.some((item) => item.id === piece.id);
  return {
    ...closet,
    pieces: exists
      ? closet.pieces.map((item) => (item.id === piece.id ? clean : item))
      : [clean, ...closet.pieces],
  };
}

export function saveLook(closet: Closet, look: Look): Closet {
  const clean = {
    ...look,
    name: look.name.trim(),
    pieceIds: [...new Set(look.pieceIds)],
  };
  if (!isLook(clean))
    throw new Error("Name your look and choose at least one piece.");
  if (
    clean.pieceIds.some((id) => !closet.pieces.some((piece) => piece.id === id))
  ) {
    throw new Error(
      "A selected piece is no longer in your closet. Choose another piece.",
    );
  }
  const exists = closet.looks.some((item) => item.id === look.id);
  return {
    ...closet,
    looks: exists
      ? closet.looks.map((item) => (item.id === look.id ? clean : item))
      : [clean, ...closet.looks],
  };
}

export function piecesForLook(closet: Closet, look: Look): Piece[] {
  return look.pieceIds.flatMap((id) => {
    const piece = closet.pieces.find((item) => item.id === id);
    return piece ? [piece] : [];
  });
}

export function removePiece(closet: Closet, id: string): Closet {
  return {
    ...closet,
    pieces: closet.pieces.filter((piece) => piece.id !== id),
  };
}

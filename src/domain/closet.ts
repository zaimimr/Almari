import {
  categories,
  garmentKinds,
  occasions,
  styleOptions,
  type Category,
  type GarmentKind,
  type LabelScore,
  type Occasion,
  type Style,
} from "./taxonomy";
import {
  attributeKeys,
  isAttributes,
  patterns,
  type AttributeKey,
  type Attributes,
  type Length,
  type Pattern,
} from "./attributes";
import { isCareLabel, withCareLabel, type CareLabel } from "./careLabel";
import { colourNames, isSwatches, type Swatch } from "./color";
import { t } from "../i18n";
import { withWeatherProposals } from "./pieceWeather";

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

export type QualityEdge = "top" | "bottom" | "left" | "right";

export type Quality = {
  sharpness: number;
  brightness: number;
  clipped: QualityEdge[];
  coverage: number | null;
  lightSpread: number | null;
};

export type Variant = "enhanced" | "plain" | "studio";

export type Variants = { enhanced?: string; plain?: string; studio?: string };

export const adviceReasons = [
  "merged",
  "clipped",
  "blur",
  "dark",
  "mixed-light",
] as const;

export type AdviceReason = (typeof adviceReasons)[number];

export const garmentRegionKinds = [
  "head",
  "upper",
  "skirt",
  "pants",
  "dress",
  "belt",
  "shoes",
  "bag",
  "sunglasses",
] as const;

export type GarmentRegionKind = (typeof garmentRegionKinds)[number];

export type GarmentRegion = {
  kind: GarmentRegionKind;
  cutout: string;
  frame: Frame;
  share: number;
  partial: boolean;
};

export type Source = "proposed" | "label" | "confirmed";

export type SourceKey =
  | keyof Attributes
  | "kind"
  | "styles"
  | "warmth"
  | "rain"
  | "snow"
  | "open"
  | "colour";

export type Sources = Partial<Record<SourceKey, Source>>;

export type QuickCheck = "category" | "subcategory" | "style";

export type AwayReason = "wash" | "lent" | "repair";

export const awayReasons: readonly AwayReason[] = ["wash", "lent", "repair"];

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
  attributes?: Attributes;
  colors?: Swatch[];
  embedding?: string;
  status?: "away" | "archived";
  away?: AwayReason;
  label?: CareLabel;
  captureId?: string;
  variants?: Variants;
  cutoutArea?: Frame;
  setId?: string;
  price?: Price;
};

export type Price = { amount: number; currency: string };

export type Prepared = {
  original: string;
  cutout: string | null;
  thumbnail: string | null;
  frame: Frame | null;
  instances: number;
  labels: LabelScore[];
  palette: Swatch[];
  embedding: string | null;
  enhanced?: string | null;
  studio?: string | null;
  quality?: Quality | null;
  area?: Frame | null;
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
  styles?: Style[];
  question?: QuickCheck;
  sources?: Sources;
  attributes?: Attributes;
  attributeSources?: Sources;
  attributeCheck?: AttributeKey;
  checks?: ("uncertain" | "no-cutout" | "several" | "attribute" | "partial")[];
  keepOriginal?: boolean;
  variant?: Variant;
  advice?: AdviceReason;
  adviceShown?: AdviceReason[];
  duplicateOf?: string;
  captureId?: string;
  region?: GarmentRegion;
  crop?: Frame;
  stem?: string;
  people?: number;
  error?: string;
  label?: CareLabel;
  keepAsSet?: boolean;
  colour?: string;
};

export type Look = {
  id: string;
  name: string;
  pieceIds: string[];
  createdAt: string;
  occasion?: Occasion;
  plannedFor?: string;
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
    }
  | {
      source: "forecast";
      warmth: "warm" | "mild" | "cold";
      precipitation: "dry" | "rain" | "snow";
      exposure: "mostly-indoors" | "time-outside" | null;
      at: string;
    };

export type ForecastWeather = Extract<Weather, { source: "forecast" }>;

export type Units = "metric" | "imperial";
export type Coverage = "full" | "moderate" | "relaxed" | "own";

export const hijabStyles = [
  "hijab",
  "shayla",
  "al-amira",
  "khimar",
  "chador",
  "niqab",
  "burqa",
] as const;
export type HijabStyle = (typeof hijabStyles)[number];

export const sparkles = ["plain", "little", "heavy", "bridal"] as const;
export type Sparkle = (typeof sparkles)[number];

export type NeverWear =
  | { kind: GarmentKind }
  | { colour: string; on: "clothes" | "hijabs" }
  | { pattern: Pattern };

export const notificationTimes = ["06:00", "07:00", "08:00", "21:00"] as const;
export type NotificationTime = (typeof notificationTimes)[number];

export const bodyShapes = [
  "pear",
  "apple",
  "hourglass",
  "rectangle",
  "inverted-triangle",
  "athletic",
] as const;
export type BodyShape = (typeof bodyShapes)[number];

export const seasons = [
  "light-spring",
  "warm-spring",
  "clear-spring",
  "light-summer",
  "cool-summer",
  "soft-summer",
  "soft-autumn",
  "warm-autumn",
  "deep-autumn",
  "deep-winter",
  "cool-winter",
  "clear-winter",
] as const;
export type Season = (typeof seasons)[number];

export type ColourProfile = {
  skin: [number, number, number] | null;
  hair: [number, number, number] | null;
  eyes: [number, number, number] | null;
  undertone: "warm" | "cool" | "neutral";
  depth: "light" | "medium" | "deep";
  contrast: "low" | "medium" | "high";
  season: Season;
  source: "measured" | "swatch" | "confirmed";
};

export type StyleProfile = {
  coverageLevel: Coverage | null;
  heightCm: number | null;
  bodyShape: BodyShape | null;
  fit: "loose" | "structured" | "depends" | null;
  colourLean: "bold" | "soft" | "depends" | null;
  styleLean: "desi" | "western" | "both" | null;
  colour: ColourProfile | null;
  beltOverOuter: boolean | null;
  minTopLength: Length | null;
  bottoms: "trousers" | "skirts" | "both" | null;
  printOnPrint: boolean | null;
  avoidAtWeddings: ("white" | "black")[];
  dupattaExpected: boolean | null;
  region: "south-asian" | "gulf" | "turkish" | "western-europe" | null;
  hijabStyles?: HijabStyle[];
  sparkle?: Sparkle | null;
  neverWear?: NeverWear[];
  wearMore?: string[];
  hijabAnswered?: true;
  coverageAnswered?: true;
  bodyAnswered?: true;
};

export const settingKeys = [
  "beltOverOuter",
  "minTopLength",
  "bottoms",
  "printOnPrint",
  "avoidAtWeddings",
  "dupattaExpected",
  "region",
] as const;

export type SettingKey = (typeof settingKeys)[number];

export type Taste = {
  weights: Record<string, number>;
  pairs: Record<string, { worn: number; rejected: number }>;
};

export type FeedbackKind =
  | "wore"
  | "saved"
  | "swap"
  | "too-formal"
  | "too-plain"
  | "too-warm"
  | "too-cold"
  | "hijab-mismatch"
  | "not-my-style"
  | "liked"
  | "disliked";

export type FeedbackEvent = {
  id: string;
  at: string;
  kind: FeedbackKind;
  pieceIds: string[];
  request: OutfitRequest;
  engine?: Engine;
  cursor?: number;
  swap?: { from: string; to: string };
  undone?: boolean;
  against?: string[];
  scope?: "piece";
};

export const sleeveNeeds = [
  {
    id: "any",
    get label() {
      return t("coverage.anyLength");
    },
  },
  {
    id: "elbow",
    get label() {
      return t("coverage.toElbow");
    },
  },
  {
    id: "long",
    get label() {
      return t("coverage.toWrist");
    },
  },
] as const;
export type SleeveNeed = (typeof sleeveNeeds)[number]["id"];

export const hemNeeds = [
  {
    id: "any",
    get label() {
      return t("coverage.anyLength");
    },
  },
  {
    id: "calf",
    get label() {
      return t("coverage.toCalf");
    },
  },
  {
    id: "ankle",
    get label() {
      return t("coverage.toAnkle");
    },
  },
] as const;
export type HemNeed = (typeof hemNeeds)[number]["id"];

export type CoverageNeed = { sleeve: SleeveNeed | null; hem: HemNeed | null };

export function coverageNeedFor(
  level: Coverage | null,
  own?: CoverageNeed,
): CoverageNeed | undefined {
  if (level === "full") return { sleeve: "long", hem: "ankle" };
  if (level === "moderate") return { sleeve: "elbow", hem: "calf" };
  if (level === "relaxed") return { sleeve: "any", hem: "any" };
  if (level === "own") return own;
  return undefined;
}

export const heightRange = { min: 120, max: 220 };

export type Place = {
  name: string;
  latitude: number;
  longitude: number;
  source?: "device" | "search";
};

export type ForecastHour = {
  at: string;
  celsius: number;
  precipitation: "none" | "rain" | "snow";
  chance: number;
  windMs: number;
};

export type Forecast = {
  date: string;
  fetchedAt: string;
  weather: ForecastWeather;
  low: number;
  high: number;
  attribution: { logo: string; url: string };
};

export type CardLayout = "minimal" | "reasons" | "full";

export type Language = "system" | "en" | "nb";

export type ScanMode = "auto" | "manual";

export type EverydayStyle = {
  version: number;
  occasion: Occasion;
  style: Style;
  hijab: HijabPreference;
  sample: boolean;
  coverage?: CoverageNeed;
  exposure?: "mostly-indoors" | "time-outside" | null;
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
  coverage?: CoverageNeed;
};

export type Engine = "rules" | "model";

export type Session = {
  revision: number;
  request: OutfitRequest;
  cursor: number;
  pieceIds: string[];
  previousPieceIds: string[] | null;
  engine?: Engine;
  date?: string;
};

export type TodayState = {
  localDate: string;
  timeZone: string;
  presetVersion: number;
  everyday: Session;
  occasion: Session | null;
  tomorrow?: Session;
  active: "everyday" | "occasion" | "tomorrow";
};

export type Styling = {
  everyday: EverydayStyle | null;
  wardrobe: WardrobeMode;
  today: TodayState | null;
  profile: StyleProfile;
  taste: Taste;
  units: Units;
  place: Place | null;
  forecast: Forecast | null;
  onboarded: boolean;
  layout: CardLayout;
  language: Language;
  scan: ScanMode;
  name?: string;
  notification?: NotificationTime | null;
};

export type Closet = {
  version: 3;
  pieces: Piece[];
  looks: Look[];
  sampleCatalog: number;
  styling: Styling;
  imports: ImportJob[];
  feedback: FeedbackEvent[];
  photoTipsSeen?: boolean;
  attributeRefresh?: number;
  setNames?: Record<string, string>;
};

export const neutralProfile: StyleProfile = {
  coverageLevel: null,
  heightCm: null,
  bodyShape: null,
  fit: null,
  colourLean: null,
  styleLean: null,
  colour: null,
  beltOverOuter: null,
  minTopLength: null,
  bottoms: null,
  printOnPrint: null,
  avoidAtWeddings: [],
  dupattaExpected: null,
  region: null,
};

export const emptyTaste: Taste = { weights: {}, pairs: {} };

export const emptyStyling: Styling = {
  everyday: null,
  wardrobe: "sample",
  today: null,
  profile: neutralProfile,
  taste: emptyTaste,
  units: "metric",
  place: null,
  forecast: null,
  onboarded: false,
  layout: "reasons",
  language: "system",
  scan: "auto",
};

export const emptyCloset: Closet = {
  version: 3,
  pieces: [],
  looks: [],
  sampleCatalog: 0,
  styling: emptyStyling,
  imports: [],
  feedback: [],
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
const isStyles = (value: unknown): value is Style[] =>
  Array.isArray(value) &&
  value.every(isStyle) &&
  new Set(value).size === value.length;

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

const sourceKeys: readonly SourceKey[] = [
  "kind",
  "styles",
  "sheer",
  ...attributeKeys,
  "warmth",
  "rain",
  "snow",
  "open",
  "colour",
];

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

const isEmbedding = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9+/]{1024}$/.test(value);

const isRgb = (value: unknown): value is [number, number, number] =>
  Array.isArray(value) &&
  value.length === 3 &&
  value.every((part) => typeof part === "number");

const isWholeNumber = (value: unknown): value is number =>
  Number.isInteger(value);

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
    optional(value.styles, isStyles) &&
    optional(value.traits, isTraits) &&
    optional(value.original, isString) &&
    optional(value.frame, isFrame) &&
    optional(value.sources, isSources) &&
    optional(value.attributes, isAttributes) &&
    optional(value.colors, isSwatches) &&
    optional(value.embedding, isEmbedding) &&
    optional(
      value.status,
      (status): status is "away" | "archived" =>
        status === "away" || status === "archived",
    ) &&
    optional(value.away, (reason): reason is AwayReason =>
      awayReasons.includes(reason as AwayReason),
    ) &&
    (value.status === "away") === (value.away !== undefined) &&
    optional(value.label, isCareLabel) &&
    optional(value.captureId, isString) &&
    optional(value.variants, isVariants) &&
    optional(value.cutoutArea, isFrame) &&
    optional(value.setId, isString) &&
    optional(value.price, isPrice)
  );
}

function isPrice(value: unknown): value is Price {
  return (
    isRecord(value) &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount) &&
    value.amount >= 0 &&
    isString(value.currency) &&
    /^[A-Z]{3}$/.test(value.currency)
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

function isLabelScore(value: unknown): value is LabelScore {
  return (
    isRecord(value) &&
    isString(value.group) &&
    isString(value.value) &&
    typeof value.score === "number"
  );
}

const qualityEdges = ["top", "bottom", "left", "right"];

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || typeof value === "number";

const isNullableString = (value: unknown): value is string | null =>
  value === null || isString(value);

function isQuality(value: unknown): value is Quality {
  return (
    isRecord(value) &&
    typeof value.sharpness === "number" &&
    typeof value.brightness === "number" &&
    Array.isArray(value.clipped) &&
    value.clipped.every((edge) => qualityEdges.includes(edge as string)) &&
    optional(value.coverage, isNullableNumber) &&
    optional(value.lightSpread, isNullableNumber)
  );
}

const isNullableQuality = (value: unknown): value is Quality | null =>
  value === null || isQuality(value);

function isVariants(value: unknown): value is Variants {
  return (
    isRecord(value) &&
    optional(value.enhanced, isString) &&
    optional(value.plain, isString) &&
    optional(value.studio, isString)
  );
}

const isVariant = (value: unknown): value is Variant =>
  value === "enhanced" || value === "plain" || value === "studio";

function isPrepared(value: unknown): value is Prepared {
  return (
    isRecord(value) &&
    isString(value.original) &&
    (value.cutout === null || isString(value.cutout)) &&
    (value.thumbnail === null || isString(value.thumbnail)) &&
    (value.frame === null || isFrame(value.frame)) &&
    Number.isInteger(value.instances) &&
    Array.isArray(value.labels) &&
    value.labels.every(isLabelScore) &&
    (value.palette === undefined
      ? value.color === null || isRgb(value.color)
      : isSwatches(value.palette) &&
        (value.embedding === null || isEmbedding(value.embedding))) &&
    optional(value.enhanced, isNullableString) &&
    optional(value.studio, isNullableString) &&
    optional(value.quality, isNullableQuality) &&
    optional(
      value.area,
      (area): area is Frame | null => area === null || isFrame(area),
    )
  );
}

const jobStates = ["queued", "preparing", "ready", "review", "failed"];
const checkReasons = [
  "uncertain",
  "no-cutout",
  "several",
  "attribute",
  "partial",
];
const quickChecks = ["category", "subcategory", "style"];

function isGarmentRegion(value: unknown): value is GarmentRegion {
  return (
    isRecord(value) &&
    garmentRegionKinds.includes(value.kind as GarmentRegionKind) &&
    isString(value.cutout) &&
    isFrame(value.frame) &&
    typeof value.share === "number" &&
    isBoolean(value.partial)
  );
}

const isCount = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0;

const isAdviceReason = (value: unknown): value is AdviceReason =>
  adviceReasons.includes(value as AdviceReason);

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
    optional(value.styles, isStyles) &&
    optional(value.question, (item): item is QuickCheck =>
      quickChecks.includes(item as string),
    ) &&
    optional(value.sources, isSources) &&
    optional(value.attributes, isAttributes) &&
    optional(value.attributeSources, isSources) &&
    optional(value.attributeCheck, (key): key is AttributeKey =>
      attributeKeys.includes(key as AttributeKey),
    ) &&
    optional(
      value.checks,
      (list): list is string[] =>
        Array.isArray(list) &&
        list.every((item) => checkReasons.includes(item as string)),
    ) &&
    optional(value.keepOriginal, isBoolean) &&
    optional(value.variant, isVariant) &&
    optional(value.advice, isAdviceReason) &&
    optional(
      value.adviceShown,
      (list): list is AdviceReason[] =>
        Array.isArray(list) && list.every(isAdviceReason),
    ) &&
    optional(value.duplicateOf, isString) &&
    optional(value.captureId, isString) &&
    optional(value.region, isGarmentRegion) &&
    optional(value.crop, isFrame) &&
    optional(value.stem, isString) &&
    optional(value.people, isCount) &&
    optional(value.error, isString) &&
    optional(value.label, isCareLabel) &&
    optional(value.keepAsSet, isBoolean) &&
    optional(value.colour, (name): name is string =>
      colourNames.includes(name as string),
    ) &&
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
    value.pieceIds.length > 0 &&
    optional(value.plannedFor, isString)
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
  const known =
    ["warm", "mild", "cold"].includes(value.warmth as string) &&
    ["dry", "rain", "snow"].includes(value.precipitation as string);
  const exposure =
    value.exposure === null ||
    value.exposure === "mostly-indoors" ||
    value.exposure === "time-outside";
  if (value.source === "forecast")
    return known && exposure && isString(value.at);
  return value.source === "manual" && known && exposure;
}

function isCoverageNeed(value: unknown): value is CoverageNeed {
  return (
    isRecord(value) &&
    (value.sleeve === null || isOneOf(sleeveNeeds, value.sleeve)) &&
    (value.hem === null || isOneOf(hemNeeds, value.hem))
  );
}

function isEverydayStyle(value: unknown): value is EverydayStyle {
  return (
    isRecord(value) &&
    Number.isInteger(value.version) &&
    isOccasion(value.occasion) &&
    isStyle(value.style) &&
    isHijabPreference(value.hijab) &&
    isBoolean(value.sample) &&
    optional(value.coverage, isCoverageNeed) &&
    optional(value.exposure, (exposure): exposure is string | null =>
      [null, "mostly-indoors", "time-outside"].includes(exposure as string),
    )
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
    isWardrobe(value.wardrobe) &&
    optional(value.coverage, isCoverageNeed)
  );
}

const isUnsetOr =
  (options: readonly unknown[]) =>
  (value: unknown): boolean =>
    value === undefined || value === null || options.includes(value);

function hasSettings(value: unknown) {
  return (
    isRecord(value) &&
    isUnsetOr([true, false])(value.beltOverOuter) &&
    isUnsetOr(["hip", "thigh", "knee", "calf", "ankle"])(value.minTopLength) &&
    isUnsetOr(["trousers", "skirts", "both"])(value.bottoms) &&
    isUnsetOr([true, false])(value.printOnPrint) &&
    (value.avoidAtWeddings === undefined ||
      (Array.isArray(value.avoidAtWeddings) &&
        value.avoidAtWeddings.every(
          (item) => item === "white" || item === "black",
        ))) &&
    isUnsetOr([true, false])(value.dupattaExpected) &&
    isUnsetOr(["south-asian", "gulf", "turkish", "western-europe"])(
      value.region,
    )
  );
}

function isTaste(value: unknown): value is Taste {
  return (
    isRecord(value) &&
    isRecord(value.weights) &&
    Object.values(value.weights).every(
      (weight) => typeof weight === "number" && Number.isFinite(weight),
    ) &&
    isRecord(value.pairs) &&
    Object.values(value.pairs).every(
      (pair) => isRecord(pair) && isCount(pair.worn) && isCount(pair.rejected),
    )
  );
}

const isEngine = (value: unknown): value is Engine =>
  value === "rules" || value === "model";

const feedbackKinds: FeedbackKind[] = [
  "wore",
  "saved",
  "swap",
  "too-formal",
  "too-plain",
  "too-warm",
  "too-cold",
  "hijab-mismatch",
  "not-my-style",
  "liked",
  "disliked",
];

function isFeedbackEvent(value: unknown): value is FeedbackEvent {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.at) &&
    feedbackKinds.includes(value.kind as FeedbackKind) &&
    isUniqueStrings(value.pieceIds) &&
    isRequest(value.request) &&
    optional(value.engine, isEngine) &&
    optional(
      value.swap,
      (swap): swap is { from: string; to: string } =>
        isRecord(swap) && isString(swap.from) && isString(swap.to),
    ) &&
    optional(value.undone, isBoolean) &&
    optional(value.against, isUniqueStrings) &&
    optional(value.cursor, (cursor): cursor is number =>
      Number.isInteger(cursor),
    ) &&
    optional(value.scope, (scope): scope is "piece" => scope === "piece")
  );
}

function hasStylistState(closet: Closet) {
  const stored = closet as unknown as Record<string, unknown>;
  const styling = closet.styling as unknown as Record<string, unknown>;
  const sessions = closet.styling.today
    ? [closet.styling.today.everyday, closet.styling.today.occasion]
    : [];
  return (
    (styling.profile === undefined || hasSettings(styling.profile)) &&
    optional(styling.taste, isTaste) &&
    optional(
      stored.feedback,
      (list): list is FeedbackEvent[] =>
        Array.isArray(list) && list.every(isFeedbackEvent),
    ) &&
    closet.looks.every((look) => optional(look.occasion, isOccasion)) &&
    sessions.every((session) => !session || optional(session.engine, isEngine))
  );
}

function withStylistState(closet: Closet): Closet {
  if (!hasStylistState(closet)) throw unreadable();
  const { engine: _engine, ...styling } = closet.styling as Styling & {
    engine?: unknown;
  };
  return {
    ...closet,
    feedback: closet.feedback ?? [],
    styling: {
      ...styling,
      profile: { ...neutralProfile, ...closet.styling.profile },
      taste: closet.styling.taste ?? emptyTaste,
    },
  };
}

function isSession(value: unknown): value is Session {
  return (
    isRecord(value) &&
    Number.isInteger(value.revision) &&
    Number.isInteger(value.cursor) &&
    isRequest(value.request) &&
    isUniqueStrings(value.pieceIds) &&
    (value.previousPieceIds === null ||
      isUniqueStrings(value.previousPieceIds)) &&
    optional(value.date, isString)
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
    optional(value.tomorrow, isSession) &&
    (value.active === "everyday" ||
      (value.active === "occasion" && value.occasion !== null) ||
      (value.active === "tomorrow" && value.tomorrow !== undefined))
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

const unreadable = () => new Error(t("closet.openError"));

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
    version: 3,
    pieces,
    looks: value.looks,
    sampleCatalog: value.sampleWardrobeAdded ? 1 : 0,
    styling: {
      ...emptyStyling,
      onboarded: pieces.some((piece) => piece.source === "owned"),
    },
    imports: [],
    feedback: [],
  };
}

function upgradeJob(job: unknown): unknown {
  if (
    !isRecord(job) ||
    !isRecord(job.prepared) ||
    !Array.isArray(job.prepared.kinds)
  )
    return job;
  const { kinds, ...prepared } = job.prepared;
  return {
    ...job,
    prepared: {
      ...prepared,
      labels: (kinds as unknown[]).map((entry) =>
        isRecord(entry)
          ? { group: "kind", value: entry.kind, score: entry.score }
          : entry,
      ),
    },
  };
}

function migrateV2(value: Record<string, unknown>): Record<string, unknown> {
  return {
    ...value,
    version: 3,
    imports: Array.isArray(value.imports)
      ? value.imports.map(upgradeJob)
      : value.imports,
  };
}

type LegacyPrepared = Omit<Prepared, "palette" | "embedding"> & {
  color?: [number, number, number] | null;
  palette?: Swatch[];
};

function withPalette(job: ImportJob): ImportJob {
  const prepared = job.prepared as LegacyPrepared | undefined;
  if (!prepared || prepared.palette) return job;
  const { color, ...rest } = prepared;
  return {
    ...job,
    prepared: {
      ...rest,
      palette: color ? [{ rgb: color, share: 1 }] : [],
      embedding: null,
    },
  };
}

export function renameCelebration(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(renameCelebration);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      key === "occasion" && item === "celebration"
        ? "party"
        : key === "occasions" && Array.isArray(item)
          ? [
              ...new Set(
                item.map((entry) =>
                  entry === "celebration" ? "party" : entry,
                ),
              ),
            ]
          : renameCelebration(item),
    ]),
  );
}

function decodeStored(
  raw: string | null,
  sampleTraits: Record<string, SampleTraits> = {},
): Closet {
  if (raw === null) return emptyCloset;
  const parsed = renameCelebration(JSON.parse(raw));
  if (isRecord(parsed) && parsed.version === 1)
    return migrateV1(parsed, sampleTraits);
  const value =
    isRecord(parsed) && parsed.version === 2 ? migrateV2(parsed) : parsed;
  if (
    !isRecord(value) ||
    value.version !== 3 ||
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
    !optional(value.photoTipsSeen, isBoolean) ||
    !optional(value.attributeRefresh, isWholeNumber) ||
    !optional(
      value.setNames,
      (names): names is Record<string, string> =>
        isRecord(names) && Object.values(names).every(isString),
    )
  ) {
    throw unreadable();
  }
  return withStylistState({
    ...(value as Closet),
    imports: (value.imports as ImportJob[]) ?? [],
  });
}

export const isNullableIn =
  (options: readonly unknown[]) =>
  (value: unknown): boolean =>
    value === null || options.includes(value);

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isLab = (value: unknown) =>
  value === null ||
  (Array.isArray(value) && value.length === 3 && value.every(isNumber));

function isColourProfile(value: unknown): value is ColourProfile {
  return (
    isRecord(value) &&
    isLab(value.skin) &&
    isLab(value.hair) &&
    isLab(value.eyes) &&
    ["warm", "cool", "neutral"].includes(value.undertone as string) &&
    ["light", "medium", "deep"].includes(value.depth as string) &&
    ["low", "medium", "high"].includes(value.contrast as string) &&
    seasons.includes(value.season as Season) &&
    ["measured", "swatch", "confirmed"].includes(value.source as string)
  );
}

function isProfile(value: unknown): value is StyleProfile {
  return (
    isRecord(value) &&
    isNullableIn(["full", "moderate", "relaxed", "own"])(value.coverageLevel) &&
    (value.heightCm === null ||
      (Number.isInteger(value.heightCm) &&
        (value.heightCm as number) >= heightRange.min &&
        (value.heightCm as number) <= heightRange.max)) &&
    isNullableIn(bodyShapes)(value.bodyShape) &&
    isNullableIn(["loose", "structured", "depends"])(value.fit) &&
    isNullableIn(["bold", "soft", "depends"])(value.colourLean) &&
    isNullableIn(["desi", "western", "both"])(value.styleLean) &&
    (value.colour === null || isColourProfile(value.colour))
  );
}

function isPlace(value: unknown): value is Place {
  return (
    isRecord(value) &&
    isString(value.name) &&
    isNumber(value.latitude) &&
    Math.abs(value.latitude) <= 90 &&
    isNumber(value.longitude) &&
    Math.abs(value.longitude) <= 180 &&
    optional(
      value.source,
      (source): source is "device" | "search" =>
        source === "device" || source === "search",
    )
  );
}

function isForecast(value: unknown): value is Forecast {
  return (
    isRecord(value) &&
    isString(value.date) &&
    isString(value.fetchedAt) &&
    isWeather(value.weather) &&
    value.weather.source === "forecast" &&
    isNumber(value.low) &&
    isNumber(value.high) &&
    isRecord(value.attribution) &&
    isString(value.attribution.logo) &&
    isString(value.attribution.url)
  );
}

function isNeverWear(value: unknown): value is NeverWear {
  if (!isRecord(value)) return false;
  if ("kind" in value) return isKind(value.kind);
  if ("pattern" in value) return isOneOf(patterns, value.pattern);
  return (
    isString(value.colour) && (value.on === "clothes" || value.on === "hijabs")
  );
}

const listOf =
  (check: (item: unknown) => unknown) =>
  (value: unknown): unknown =>
    Array.isArray(value) ? value.filter(check) : undefined;

const oneOf =
  (options: readonly unknown[]) =>
  (value: unknown): unknown =>
    options.includes(value) ? value : undefined;

function cleaned(
  record: Record<string, unknown>,
  rules: Record<string, (value: unknown) => unknown>,
) {
  const result = { ...record };
  for (const [key, clean] of Object.entries(rules)) {
    if (result[key] === undefined) continue;
    const value = clean(result[key]);
    if (value === undefined) delete result[key];
    else result[key] = value;
  }
  return result;
}

function withOnboardingState(closet: Closet): Closet {
  const { studio: _studio, ...stored } = cleaned(
    closet.styling as Record<string, unknown>,
    {
      name: (name) => (isString(name) ? name : undefined),
      notification: oneOf([null, ...notificationTimes]),
    },
  );
  const profile =
    stored.profile === undefined
      ? neutralProfile
      : isRecord(stored.profile)
        ? cleaned(
            { ...neutralProfile, ...stored.profile },
            {
              hijabStyles: listOf(oneOf(hijabStyles)),
              sparkle: oneOf([null, ...sparkles]),
              neverWear: listOf(isNeverWear),
              wearMore: listOf(isString),
              hijabAnswered: oneOf([true]),
              coverageAnswered: oneOf([true]),
              bodyAnswered: oneOf([true]),
            },
          )
        : null;
  const styling = {
    ...stored,
    profile,
    units: stored.units ?? "metric",
    place: stored.place ?? null,
    forecast: stored.forecast ?? null,
    onboarded:
      stored.onboarded ??
      closet.pieces.some((piece) => piece.source === "owned"),
    layout: stored.layout ?? "reasons",
    language: stored.language ?? "system",
    scan: stored.scan ?? "auto",
  };
  if (
    !isProfile(styling.profile) ||
    (styling.units !== "metric" && styling.units !== "imperial") ||
    !(styling.place === null || isPlace(styling.place)) ||
    !(styling.forecast === null || isForecast(styling.forecast)) ||
    !isBoolean(styling.onboarded) ||
    !["minimal", "reasons", "full"].includes(styling.layout as string) ||
    !["system", "en", "nb"].includes(styling.language as string) ||
    !["auto", "manual"].includes(styling.scan as string)
  )
    throw unreadable();
  return { ...closet, styling: styling as Styling };
}

function decodeWithoutOnboarding(
  ...args: Parameters<typeof decodeStored>
): Closet {
  const closet = decodeStored(...args);
  return { ...closet, imports: closet.imports.map(withPalette) };
}

export function decodeCloset(
  ...args: Parameters<typeof decodeWithoutOnboarding>
): Closet {
  return withOnboardingState(decodeWithoutOnboarding(...args));
}

export function savePiece(closet: Closet, piece: Piece): Closet {
  const clean = withWeatherProposals({ ...piece, name: piece.name.trim() });
  if (!isPiece(clean)) throw new Error(t("closet.pieceInvalid"));
  const exists = closet.pieces.some((item) => item.id === piece.id);
  return {
    ...closet,
    pieces: exists
      ? closet.pieces.map((item) => (item.id === piece.id ? clean : item))
      : [clean, ...closet.pieces],
  };
}

export function pieceVariant(piece: Piece): Variant | null {
  const { enhanced, plain, studio } = piece.variants ?? {};
  if (!enhanced || !plain) return null;
  if (piece.photo === enhanced) return "enhanced";
  if (studio && piece.photo === studio) return "studio";
  if (piece.photo === plain) return "plain";
  return null;
}

export function withVariant(piece: Piece, variant: Variant): Piece {
  const photo = piece.variants?.[variant];
  return photo && photo !== piece.photo ? { ...piece, photo } : piece;
}

export function studioSource(piece: Piece): string | null {
  if (!pieceVariant(piece)) return null;
  return piece.variants!.enhanced ?? piece.variants!.plain!;
}

export function withStudio(piece: Piece, studio: string): Piece {
  if (!studioSource(piece)) return piece;
  return {
    ...piece,
    photo: studio,
    variants: { ...piece.variants, studio },
  };
}

export function saveLook(closet: Closet, look: Look): Closet {
  const clean = {
    ...look,
    name: look.name.trim(),
    pieceIds: [...new Set(look.pieceIds)],
  };
  if (!isLook(clean)) throw new Error(t("closet.lookInvalid"));
  if (
    clean.pieceIds.some((id) => !closet.pieces.some((piece) => piece.id === id))
  ) {
    throw new Error(t("closet.lookPieceGone"));
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

export const isAvailable = (piece: Piece) => piece.status === undefined;

export function setAway(
  closet: Closet,
  id: string,
  reason: AwayReason | null,
): Closet {
  const target = closet.pieces.find((piece) => piece.id === id);
  if (!target || target.status === "archived") return closet;
  return {
    ...closet,
    pieces: closet.pieces.map((piece): Piece => {
      if (piece.id !== id) return piece;
      const { status: _status, away: _away, ...rest } = piece;
      return reason ? { ...rest, status: "away", away: reason } : rest;
    }),
  };
}

export function usedIn(closet: Closet, id: string) {
  return closet.looks.filter((look) => look.pieceIds.includes(id)).length;
}

export function setPieceLabel(
  closet: Closet,
  id: string,
  label: CareLabel | undefined,
): Closet {
  const piece = closet.pieces.find((item) => item.id === id);
  if (!piece) return closet;
  return savePiece(closet, withCareLabel(piece, label));
}

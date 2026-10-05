import {
  emptyCloset,
  type Occasion,
  type OutfitRequest,
  type Piece,
  type Style,
  type Weather,
} from "../src/domain/closet";
import { realisticPieces } from "../src/domain/realistic-closet.fixture";
import { samplePieces } from "../src/domain/samples";
import { rulesScorer } from "../src/domain/scoring/rulesScorer";
import { scoreContext } from "../src/domain/scoring/taste";
import { roleOf, styleOutfits } from "../src/domain/styling";

const which = process.argv[2] ?? "sample";
const runs = Number(process.argv[3] ?? 50);
const pieces: Piece[] =
  which === "real"
    ? realisticPieces
    : samplePieces.map((piece) => ({ ...piece, source: "owned" as const }));

const occasionList: Occasion[] = [
  "everyday",
  "work",
  "gym",
  "dinner",
  "eid",
  "party",
  "wedding",
  "barat",
];
const weathers: Record<string, Weather> = {
  unknown: { source: "unknown" },
  cold: {
    source: "manual",
    warmth: "cold",
    rain: false,
    snow: false,
    exposure: "time-outside",
  } as Weather,
};

const label = (id: string) =>
  pieces.find((piece) => piece.id === id)?.name ?? id;
const byId = (id: string) => pieces.find((piece) => piece.id === id)!;
const totals = { outfits: 0, distinct: 0, layered: 0, failed: 0 };

for (const style of ["western", "desi"] as Style[])
  for (const occasion of occasionList) {
    const weatherKey = process.argv[4] ?? "unknown";
    const request: OutfitRequest = {
      occasion,
      style,
      garmentType: null,
      keptIds: [],
      excludedIds: [],
      weather: weathers[weatherKey]!,
      hijab: "always",
      wardrobe: "owned",
    };
    const seen = new Map<string, number>();
    let failed = "";
    for (let run = 0; run < runs; run++) {
      const day = new Date(Date.UTC(2026, 9, 1 + run))
        .toISOString()
        .slice(0, 10);
      const result = styleOutfits(
        pieces,
        request,
        `${day}:owned`,
        rulesScorer,
        scoreContext(emptyCloset),
      );
      const top = result.outfits[0];
      if (!top) {
        failed = result.problems.map((problem) => problem.message).join("; ");
        continue;
      }
      const key = top.ids.map(label).join(" + ");
      totals.outfits++;
      if (
        occasion !== "work" &&
        (process.argv[4] ?? "unknown") === "unknown" &&
        top.ids.some((id) => {
          const piece = byId(id);
          const role = roleOf(piece);
          return (
            (role === "layer" || role === "outer") && piece.kind !== "abaya"
          );
        })
      )
        totals.layered++;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    console.log(`\n## ${style} ${occasion} (${weatherKey})`);
    if (failed) console.log(`  FAILED: ${failed}`);
    if (failed) totals.failed++;
    totals.distinct += seen.size;
    for (const [key, count] of [...seen].sort((a, b) => b[1] - a[1]))
      console.log(`  ${String(count).padStart(2)}x ${key}`);
  }
console.log("\nTOTALS", JSON.stringify(totals));

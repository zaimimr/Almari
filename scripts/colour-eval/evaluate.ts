import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  fromSelfie,
  type SelfieReading,
} from "../../src/domain/colourAnalysis";

type Label = {
  id: string;
  depth: string;
  undertone: string;
  seasons: string[];
  hairCovered: boolean;
};

const half = process.argv.find((arg) => arg.startsWith("--half="))?.slice(7);
const all: Label[] = JSON.parse(
  readFileSync(join(__dirname, "labels.json"), "utf8"),
);
const halfOf = (label: Label) => {
  const group = all
    .filter((other) => other.depth === label.depth)
    .map((other) => other.id)
    .sort();
  return group.indexOf(label.id) % 2 === 0 ? "tune" : "test";
};
const labels = half ? all.filter((label) => halfOf(label) === half) : all;
const readings: Record<string, Partial<SelfieReading>> = JSON.parse(
  readFileSync(process.argv[2] ?? 0, "utf8"),
);

let measured = 0;
let depth = 0;
let undertone = 0;
let season = 0;
const deepAsLight: string[] = [];
const byDepth: Record<string, [number, number]> = {};
const rows: string[] = [];
for (const label of labels) {
  const reading = readings[label.id];
  const outcome = fromSelfie(
    {
      skin: reading?.skin ?? null,
      hair: reading?.hair ?? null,
      eyes: reading?.eyes ?? null,
      light: (reading?.light as SelfieReading["light"]) ?? "ok",
    },
    label.hairCovered,
  );
  if ("retake" in outcome) {
    rows.push(`${label.id.padEnd(9)} retake ${outcome.retake}`);
    continue;
  }
  const { profile } = outcome;
  measured++;
  const depthOk = profile.depth === label.depth;
  const undertoneOk = profile.undertone === label.undertone;
  const seasonOk = label.seasons.includes(profile.season);
  depth += depthOk ? 1 : 0;
  const [hits, total] = byDepth[label.depth] ?? [0, 0];
  byDepth[label.depth] = [hits + (depthOk ? 1 : 0), total + 1];
  undertone += undertoneOk ? 1 : 0;
  season += seasonOk ? 1 : 0;
  if (
    label.depth === "deep" &&
    (profile.depth === "light" || profile.season.endsWith("summer"))
  )
    deepAsLight.push(label.id);
  const skin = profile.skin!.map((value) => value.toFixed(0)).join(" ");
  rows.push(
    [
      label.id.padEnd(9),
      `${label.depth}/${label.undertone}`.padEnd(15),
      `${depthOk ? " " : "x"}${profile.depth}`.padEnd(8),
      `${undertoneOk ? " " : "x"}${profile.undertone}`.padEnd(9),
      `${seasonOk ? " " : "x"}${profile.season}`.padEnd(14),
      `Lab ${skin}`,
    ].join(" "),
  );
}

const share = (count: number, total: number) =>
  `${count}/${total} (${Math.round((count / Math.max(1, total)) * 100)}%)`;
console.log(rows.join("\n"));
console.log(`\nmeasured  ${share(measured, labels.length)}`);
console.log(`depth     ${share(depth, measured)}`);
for (const [name, [hits, total]] of Object.entries(byDepth))
  console.log(`  ${name.padEnd(7)} ${share(hits, total)}`);
console.log(`undertone ${share(undertone, measured)}`);
console.log(`season    ${share(season, measured)}`);
console.log(`deep skin in a light or summer season: ${deepAsLight.length}`);
if (process.argv.includes("--strict") && deepAsLight.length > 0)
  process.exit(1);

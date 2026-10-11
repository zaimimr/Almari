import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { studioPrompt } from "../worker/studio/src/prompt";
import type { StudioRequest } from "../worker/studio/src/request";

const live = process.argv.includes("--live");
const photos = process.argv.includes("--photos");
const output = resolve(
  "planning/build/studio/crop-eval",
  ...(live ? [] : ["preview"]),
  ...(photos ? ["real-photos"] : []),
);
mkdirSync(output, { recursive: true });
const caseName = process.argv
  .slice(2)
  .find((argument) => !argument.startsWith("--"));
if (live) process.loadEnvFile(".env");
const studioUrl = process.env.EXPO_PUBLIC_STUDIO_URL;
const studioToken = process.env.EXPO_PUBLIC_STUDIO_TOKEN;
if (live && (!studioUrl || !studioToken))
  throw new Error("Studio configuration required");
type EvaluationCase = {
  id: string;
  source: string;
  selection?: string;
  crop?: string;
  piece: Omit<StudioRequest, "image" | "original">;
};
const fixtureCases: EvaluationCase[] = [
  {
    id: "kameez-hem",
    source: "assets/fixtures/scan/kameez-dupatta/frame-1.jpg",
    crop: "410x200+330+940",
    piece: {
      category: "tunic",
      kind: "kameez",
      name: "Sage embroidered kameez",
      colour: "sage green",
      details: "length knee, sleeve long",
      note: "Long sage green kameez with full sleeves and cream embroidery at neckline cuffs and hem. The crop only shows the hem.",
      area: {
        x: 330 / 1080,
        y: 940 / 1440,
        width: 410 / 1080,
        height: 200 / 1440,
      },
    },
  },
  {
    id: "hijab-end",
    source: "assets/fixtures/scan/kameez-dupatta/frame-2.jpg",
    crop: "220x280+560+560",
    piece: {
      category: "top",
      kind: "t-shirt",
      name: "Ivory chiffon hijab",
      colour: "ivory",
      note: "This is an ivory chiffon hijab, a long rectangular scarf with two draped ends, not a shirt. Preserve the fabric and plain border.",
      area: {
        x: 560 / 1080,
        y: 560 / 1440,
        width: 220 / 1080,
        height: 280 / 1440,
      },
    },
  },
  {
    id: "trousers-waist",
    source: "assets/wardrobe/charcoal-trousers.png",
    crop: "500x250+250+80",
    piece: {
      category: "bottom",
      kind: "shorts",
      name: "Charcoal trousers",
      colour: "charcoal",
      note: "Full length charcoal tailored trousers with two straight legs. The cropped waistband does not mean they are shorts.",
    },
  },
  {
    id: "blazer-sleeve",
    source: "assets/wardrobe/navy-blazer.png",
    crop: "210x600+80+250",
    piece: {
      category: "layer",
      kind: "blazer",
      name: "Navy blazer",
      colour: "navy",
      details: "sleeve long, volume straight",
      note: "Navy blazer with full sleeves, lapels and flap pockets. Restore the whole jacket from the original photo.",
    },
  },
  {
    id: "kameez-original",
    source: "assets/fixtures/scan/kameez-dupatta/frame-1.jpg",
    piece: {
      category: "tunic",
      kind: "kameez",
      name: "Sage embroidered kameez",
    },
  },
  {
    id: "hijab-name-only",
    source: "assets/fixtures/scan/kameez-dupatta/frame-2.jpg",
    crop: "220x280+560+560",
    piece: {
      category: "top",
      kind: "t-shirt",
      name: "Ivory chiffon hijab",
    },
  },
];

const photoSubjects = {
  head: { category: "hijab", kind: "scarf", name: "Scarf" },
  pants: { category: "bottom", kind: "trousers", name: "Trousers" },
  coat: { category: "layer", kind: "jacket", name: "Jacket" },
} as const;
type PhotoEntry = {
  file: string;
  sha256: string;
  scene: string;
  kind: keyof typeof photoSubjects;
};

function photoCase(entry: PhotoEntry, path: string): EvaluationCase {
  const review = resolve("planning/build/studio/crop-eval/native-photos");
  const stem = `${basename(entry.file).replace(/\.[^.]+$/, "")}-${entry.kind}`;
  const metadata = JSON.parse(
    readFileSync(resolve(review, `${stem}.json`), "utf8"),
  ) as {
    sourceSha256: string;
    sourceWidth: number;
    sourceHeight: number;
    bounds: number[];
  };
  const sourceHash = createHash("sha256")
    .update(readFileSync(resolve(dirname(path), entry.file)))
    .digest("hex");
  if (sourceHash !== entry.sha256 || metadata.sourceSha256 !== sourceHash)
    throw new Error(`Real-photo evidence does not match ${entry.file}`);
  const { sourceWidth, sourceHeight, bounds } = metadata;
  if (
    !(entry.kind in photoSubjects) ||
    !Number.isFinite(sourceWidth) ||
    sourceWidth <= 0 ||
    !Number.isFinite(sourceHeight) ||
    sourceHeight <= 0 ||
    bounds.length !== 4 ||
    !bounds.every(Number.isFinite)
  )
    throw new Error(`Invalid real-photo metadata: ${entry.file}`);
  const [x, y, width, height] = bounds;
  if (
    x < 0 ||
    y < 0 ||
    width <= 0 ||
    height <= 0 ||
    x + width > sourceWidth ||
    y + height > sourceHeight
  )
    throw new Error(`Invalid real-photo bounds: ${entry.file}`);
  return {
    id: stem,
    source: resolve(review, `${stem}-original-input.png`),
    selection: resolve(review, `${stem}-input.png`),
    piece: {
      ...photoSubjects[entry.kind],
      note: entry.scene,
      area: {
        x: x / sourceWidth,
        y: y / sourceHeight,
        width: width / sourceWidth,
        height: height / sourceHeight,
      },
    },
  };
}

function photoCases(): EvaluationCase[] {
  return ["sources", "unresolved", "external"].flatMap((manifest) => {
    const path = resolve(`tests/fixtures/vision/${manifest}.json`);
    const entries = JSON.parse(readFileSync(path, "utf8")) as PhotoEntry[];
    return entries.flatMap((entry) => {
      const full = photoCase(entry, path);
      const area = full.piece.area!;
      return [
        full,
        {
          ...full,
          id: `${full.id}-fragment`,
          crop: "40%x30%+0+0",
          piece: {
            ...full.piece,
            area: {
              x: area.x + area.width * 0.3,
              y: area.y + area.height * 0.35,
              width: area.width * 0.4,
              height: area.height * 0.3,
            },
          },
        },
      ];
    });
  });
}

const cases = photos ? photoCases() : fixtureCases;
if (caseName && !cases.some((entry) => entry.id === caseName))
  throw new Error(`Unknown Studio case: ${caseName}`);

async function evaluate() {
  for (const entry of cases) {
    if (caseName && entry.id !== caseName) continue;
    const original = resolve(output, `${entry.id}-original.jpg`);
    const selected = resolve(output, `${entry.id}-selection.jpg`);
    execFileSync("magick", [
      entry.source,
      "-background",
      "white",
      "-alpha",
      "remove",
      "-resize",
      "500x500>",
      original,
    ]);
    execFileSync("magick", [
      entry.selection ?? entry.source,
      ...(entry.selection && entry.crop ? ["-gravity", "center"] : []),
      ...(entry.crop ? ["-crop", entry.crop, "+repage"] : []),
      "-background",
      "white",
      "-alpha",
      "remove",
      "-resize",
      "500x500>",
      selected,
    ]);
    const image = new File([readFileSync(selected)], "selection.jpg", {
      type: "image/jpeg",
    });
    const reference =
      entry.crop || entry.selection
        ? new File([readFileSync(original)], "original.jpg", {
            type: "image/jpeg",
          })
        : undefined;
    const prompt = studioPrompt({ ...entry.piece, original: reference });
    writeFileSync(resolve(output, `${entry.id}-prompt.txt`), prompt);
    const hash = (bytes: string | Uint8Array) =>
      createHash("sha256").update(bytes).digest("hex");
    const record = {
      caseId: entry.id,
      mode: live ? "live" : "preview",
      createdAt: new Date().toISOString(),
      parameters: entry.piece,
      promptHash: hash(prompt),
      selectionHash: hash(readFileSync(selected)),
      originalHash: reference ? hash(readFileSync(original)) : null,
    };
    const recordPath = resolve(output, `${entry.id}-request.json`);
    writeFileSync(recordPath, JSON.stringify(record, null, 2));
    if (!live) {
      console.log(`${entry.id}: inputs and prompt prepared, no inference`);
      continue;
    }
    const form = new FormData();
    form.append("image", image);
    if (reference) form.append("original", reference);
    for (const [key, value] of Object.entries(entry.piece)) {
      if (value !== undefined)
        form.append(
          key,
          typeof value === "string" ? value : JSON.stringify(value),
        );
    }
    const started = Date.now();
    const response = await fetch(studioUrl!, {
      method: "POST",
      headers: {
        "x-app-token": studioToken!,
        "x-install-id": "studio-crop-evaluation",
      },
      body: form,
    });
    if (
      !response.ok ||
      !response.headers.get("content-type")?.startsWith("image/")
    )
      throw new Error(`${entry.id}: generation failed (${response.status})`);
    const generated = resolve(output, `${entry.id}-result.jpg`);
    const bytes = Buffer.from(await response.arrayBuffer());
    writeFileSync(generated, bytes);
    writeFileSync(
      recordPath,
      JSON.stringify(
        { ...record, elapsedMs: Date.now() - started, outputHash: hash(bytes) },
        null,
        2,
      ),
    );
    execFileSync("magick", [
      original,
      selected,
      generated,
      "-resize",
      "400x400",
      "-background",
      "#eee",
      "-gravity",
      "center",
      "-extent",
      "400x400",
      "+append",
      resolve(output, `${entry.id}-compare.jpg`),
    ]);
    console.log(`${entry.id}: ${((Date.now() - started) / 1000).toFixed(1)}s`);
  }
}

void evaluate().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Studio evaluation failed",
  );
  process.exitCode = 1;
});

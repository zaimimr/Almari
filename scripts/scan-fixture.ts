import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";
import { scanCols, scanRows } from "../src/domain/scan";

type Rect = { x: number; y: number; width: number; height: number };
type Cell = { label: number; rgb: [number, number, number] };

const folder = "assets/fixtures/scan/kameez-dupatta";
const total = scanCols * scanRows;

function block(cells: Cell[], area: Rect, cell: Cell) {
  for (let y = area.y; y < area.y + area.height; y++)
    for (let x = area.x; x < area.x + area.width; x++)
      cells[y * scanCols + x] = cell;
}

function body(): Cell[] {
  const cells: Cell[] = Array.from({ length: total }, () => ({
    label: 0,
    rgb: [28, 26, 32],
  }));
  block(
    cells,
    { x: 15, y: 5, width: 6, height: 7 },
    {
      label: 11,
      rgb: [196, 154, 126],
    },
  );
  block(
    cells,
    { x: 11, y: 12, width: 14, height: 18 },
    {
      label: 4,
      rgb: [58, 58, 62],
    },
  );
  block(
    cells,
    { x: 12, y: 30, width: 12, height: 16 },
    {
      label: 6,
      rgb: [40, 40, 46],
    },
  );
  block(
    cells,
    { x: 9, y: 12, width: 2, height: 17 },
    {
      label: 14,
      rgb: [190, 150, 120],
    },
  );
  block(
    cells,
    { x: 25, y: 12, width: 2, height: 17 },
    {
      label: 15,
      rgb: [190, 150, 120],
    },
  );
  return cells;
}

function held(file: string, label: number, area: Rect) {
  const png = PNG.sync.read(readFileSync(file));
  let minX = png.width;
  let minY = png.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < png.height; y++)
    for (let x = 0; x < png.width; x++)
      if (png.data[(y * png.width + x) * 4 + 3]! > 128) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
  const scale = Math.min(
    area.width / (maxX - minX + 1),
    area.height / (maxY - minY + 1),
  );
  const width = Math.round((maxX - minX + 1) * scale);
  const height = Math.round((maxY - minY + 1) * scale);
  const left = area.x + Math.floor((area.width - width) / 2);
  const top = area.y + Math.floor((area.height - height) / 2);
  const cells = body();
  for (let row = 0; row < height; row++)
    for (let col = 0; col < width; col++) {
      const fromX = minX + Math.floor(col / scale);
      const toX = minX + Math.floor((col + 1) / scale);
      const fromY = minY + Math.floor(row / scale);
      const toY = minY + Math.floor((row + 1) / scale);
      let opaque = 0;
      const sum = [0, 0, 0];
      for (let y = fromY; y < toY; y++)
        for (let x = fromX; x < toX; x++) {
          const index = (y * png.width + x) * 4;
          if (png.data[index + 3]! <= 128) continue;
          opaque++;
          sum[0] += png.data[index]!;
          sum[1] += png.data[index + 1]!;
          sum[2] += png.data[index + 2]!;
        }
      if (opaque * 2 < (toX - fromX) * (toY - fromY)) continue;
      cells[(top + row) * scanCols + left + col] = {
        label,
        rgb: [
          Math.round(sum[0]! / opaque),
          Math.round(sum[1]! / opaque),
          Math.round(sum[2]! / opaque),
        ],
      };
    }
  const box = {
    x: left / scanCols,
    y: top / scanRows,
    width: width / scanCols,
    height: height / scanRows,
  };
  const middle = box.y + box.height / 2;
  return {
    cells,
    box,
    hands: [
      [box.x, middle],
      [box.x + box.width, middle],
    ],
  };
}

function frame(
  cells: Cell[],
  hands: number[][],
  image: number,
  cutout: string,
) {
  return {
    at: 0,
    cols: scanCols,
    rows: scanRows,
    labels: Buffer.from(cells.map((cell) => cell.label)).toString("base64"),
    colours: Buffer.from(cells.flatMap((cell) => cell.rgb)).toString("base64"),
    hands,
    milliseconds: { parse: 40 },
    image,
    cutout,
  };
}

const sides = [
  [0.25, 0.6],
  [0.75, 0.6],
];
const kameez = held("assets/wardrobe/sage-kurta.png", 4, {
  x: 8,
  y: 9,
  width: 20,
  height: 32,
});
const dupatta = held("assets/wardrobe/ivory-hijab.png", 17, {
  x: 10,
  y: 10,
  width: 16,
  height: 18,
});
const repeat = <T>(count: number, item: T) =>
  Array.from({ length: count }, () => item);

writeFileSync(
  `${folder}/frames.json`,
  JSON.stringify([
    ...repeat(6, frame(body(), sides, 0, "kameez")),
    ...repeat(8, frame(kameez.cells, kameez.hands, 0, "kameez")),
    ...repeat(4, frame(body(), sides, 1, "dupatta")),
    ...repeat(8, frame(dupatta.cells, dupatta.hands, 1, "dupatta")),
  ]),
);
console.log(JSON.stringify({ kameez: kameez.box, dupatta: dupatta.box }));

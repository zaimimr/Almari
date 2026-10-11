import { afterEach, describe, expect, it, vi } from "vitest";
import { prepareStudioInput } from "../src/state/studioInput";

vi.mock("../src/storage/local", () => ({
  photoUri: (source: string) => source,
}));

afterEach(() => vi.unstubAllGlobals());

describe("Studio reference preparation", () => {
  it.each([
    [34, 150, 64, 150, 15, 0],
    [72, 54, 72, 64, 0, 5],
    [62, 150, 64, 150, 1, 0],
    [1000, 800, 500, 400, 0, 0],
  ])(
    "keeps %i by %i fabric proportional on a valid canvas",
    async (width, height, canvasWidth, canvasHeight, x, y) => {
      const image = {
        naturalWidth: width,
        naturalHeight: height,
        decode: async () => undefined,
      };
      const drawing = { fillStyle: "", fillRect: vi.fn(), drawImage: vi.fn() };
      const canvas = {
        width: 0,
        height: 0,
        getContext: () => drawing,
        toDataURL: () => "data:image/jpeg;base64,photo",
      };
      vi.stubGlobal(
        "Image",
        class {
          constructor() {
            return image;
          }
        },
      );
      vi.stubGlobal("document", { createElement: () => canvas });

      expect(await prepareStudioInput("reference.png", "item")).toBe(
        "data:image/jpeg;base64,photo",
      );
      expect([canvas.width, canvas.height]).toEqual([
        canvasWidth,
        canvasHeight,
      ]);
      expect(drawing.fillStyle).toBe("white");
      expect(drawing.fillRect).toHaveBeenCalledWith(
        0,
        0,
        canvasWidth,
        canvasHeight,
      );
      const scale = Math.min(1, 500 / Math.max(width, height));
      expect(drawing.drawImage).toHaveBeenCalledWith(
        image,
        x,
        y,
        Math.floor(width * scale),
        Math.floor(height * scale),
      );
    },
  );
});

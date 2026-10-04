import type { ColourProfile, Season } from "../../domain/closet";
import { colorName, toRgb, type Lab } from "../../domain/color";
import { labHex, paletteFor } from "../../domain/colourAnalysis";
import { t } from "../../i18n";
import { colourLabel } from "../ColourChips";

export const seasonLabel = (season: Season) => t(`season.${season}`);

const named = (lab: Lab) => ({
  hex: labHex(lab),
  name: colourLabel(colorName(toRgb(lab))),
});

export function paletteOf(profile: Pick<ColourProfile, "season">) {
  const { best, goEasy } = paletteFor(profile);
  return { best: best.map(named), goEasy: goEasy.map(named) };
}

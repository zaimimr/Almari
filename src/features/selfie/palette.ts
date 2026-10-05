import type { ColourProfile, Season } from "../../domain/closet";
import { colorName, toRgb, type Lab } from "../../domain/color";
import { labHex, paletteFor } from "../../domain/colourAnalysis";
import { metalHex, seasonMetals, seasonNeutrals } from "../../domain/seasons";
import { t } from "../../i18n";
import { colourLabel } from "../ColourChips";

export type Colour = { hex: string; name: string };

export const seasonLabel = (season: Season) => t(`season.${season}`);

export const named = (lab: Lab): Colour => ({
  hex: labHex(lab),
  name: colourLabel(colorName(toRgb(lab))),
});

export function paletteOf(profile: Pick<ColourProfile, "season" | "palette">) {
  const { best, goEasy } = paletteFor(profile);
  return {
    best: best.map(named),
    goEasy: goEasy.map(named),
    neutrals: seasonNeutrals(profile.season).map(named),
    metals: seasonMetals[profile.season].map((metal) => ({
      hex: metalHex[metal],
      name: t(`metal.${metal}`),
    })),
  };
}

export type Palette = ReturnType<typeof paletteOf>;

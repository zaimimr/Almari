import type { Season } from "../domain/closet";
import type { Swatch } from "../domain/colourAnalysis";
import { t } from "../i18n";

export const seasonLabel = (season: Season) => t(`season.${season}`);

export const swatchLabel = (swatch: Swatch) =>
  `${t(`depth.${swatch.depth}`)}, ${t(`undertone.${swatch.undertone}`).toLocaleLowerCase()}`;

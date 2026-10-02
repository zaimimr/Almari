import {
  isAvailable,
  type Closet,
  type Engine,
  type OutfitRequest,
  type Styling,
} from "../closet";
import { t } from "../../i18n";
import { hash } from "../styling";
import { embeddingVector, embeddingOf, modelScorer } from "./modelScorer";
import { rulesScorer } from "./rulesScorer";
import type { Scorer } from "./types";

export type EngineChoice = Styling["engine"];

export const engineChoices = [
  "rules",
  "model",
  "compare",
] as const satisfies readonly EngineChoice[];

const engineNames = {
  rules: "stylist.rules",
  model: "stylist.model",
  compare: "stylist.compare",
} as const;

export function engineName(engine: EngineChoice) {
  return t(engineNames[engine]);
}

export function firstEngine(localDate: string): Engine {
  return hash(`engine:${localDate}`) % 2 === 0 ? "rules" : "model";
}

export function modelReady(closet: Closet, request: OutfitRequest) {
  return closet.pieces
    .filter(
      (piece) =>
        piece.source === request.wardrobe &&
        isAvailable(piece) &&
        (!piece.styles || piece.styles.includes(request.style)),
    )
    .every((piece) => embeddingVector(embeddingOf(piece) ?? "") !== null);
}

export function engineFor(
  closet: Closet,
  request: OutfitRequest,
  localDate: string,
  previous: Engine | null,
): Engine {
  const choice = closet.styling.engine;
  const wanted: Engine =
    choice !== "compare"
      ? choice
      : previous
        ? previous === "rules"
          ? "model"
          : "rules"
        : firstEngine(localDate);
  return wanted === "model" && !modelReady(closet, request) ? "rules" : wanted;
}

export function scorerFor(engine: Engine): Scorer {
  return engine === "model" ? modelScorer : rulesScorer;
}

export function setEngine(closet: Closet, engine: EngineChoice): Closet {
  return closet.styling.engine === engine
    ? closet
    : { ...closet, styling: { ...closet.styling, engine } };
}

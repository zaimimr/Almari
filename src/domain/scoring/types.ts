import type { OutfitRequest, Piece, StyleProfile, Taste } from "../closet";

export type ScoreResult = {
  score: number;
  reasons: string[];
};

export type ScoreContext = {
  profile: StyleProfile;
  taste: Taste;
  wear: Record<string, number>;
};

export type Scorer = {
  score(
    outfit: Piece[],
    request: OutfitRequest,
    context: ScoreContext,
  ): ScoreResult;
};

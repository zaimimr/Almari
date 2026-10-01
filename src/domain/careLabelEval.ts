import fixtures from "./fixtures/care-labels.json";
import recorded from "./fixtures/care-labels.model.json";
import { mergeCareLabel, parseCareText, type LabelFields } from "./careLabel";

export type CareLabelFixture = {
  id: string;
  language: "en" | "nb" | "mixed";
  text: string;
  ideal: Record<string, unknown> | null;
  expected: LabelFields;
};

export type Score = {
  expected: number;
  correct: number;
  wrong: number;
  missed: number;
};

export const careLabelFixtures = fixtures as unknown as CareLabelFixture[];

export const recordedModel = recorded as Record<string, string | null>;

export const hasRecordedModel = Object.keys(recordedModel).length > 0;

export const readers = {
  parser: (fixture: CareLabelFixture) => parseCareText(fixture.text),
  model: (fixture: CareLabelFixture) =>
    mergeCareLabel(
      { materials: [] },
      recordedModel[fixture.id] ?? null,
      fixture.text,
    ),
  merged: (fixture: CareLabelFixture) =>
    mergeCareLabel(
      parseCareText(fixture.text),
      recordedModel[fixture.id] ?? null,
      fixture.text,
    ),
};

function facts(fields: LabelFields) {
  return new Set([
    ...fields.materials.map(
      (material) => `material:${material.fibre}:${material.percent ?? ""}`,
    ),
    ...(["size", "brand", "origin"] as const).flatMap((key) => {
      const value = fields[key];
      return value ? [`${key}:${value.toLowerCase()}`] : [];
    }),
  ]);
}

export function scoreLabels(
  read: (fixture: CareLabelFixture) => LabelFields,
): Score {
  const score: Score = { expected: 0, correct: 0, wrong: 0, missed: 0 };
  for (const fixture of careLabelFixtures) {
    const wanted = facts(fixture.expected);
    const found = facts(read(fixture));
    const correct = [...found].filter((fact) => wanted.has(fact)).length;
    score.expected += wanted.size;
    score.correct += correct;
    score.wrong += found.size - correct;
    score.missed += wanted.size - correct;
  }
  return score;
}

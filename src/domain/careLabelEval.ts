import fixtures from "./fixtures/care-labels.json";
import type { LabelFields } from "./careLabel";

export type CareLabelFixture = {
  id: string;
  language: "en" | "nb" | "mixed";
  text: string;
  ideal: Record<string, unknown> | null;
  expected: LabelFields;
};

export const careLabelFixtures = fixtures as unknown as CareLabelFixture[];

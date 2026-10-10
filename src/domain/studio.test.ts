import assert from "node:assert/strict";
import { test } from "node:test";
import { studioDetails } from "./studio";

test("studio sends confirmed construction and label fabric without treating guesses as facts", () => {
  assert.equal(
    studioDetails({
      attributes: {
        length: "ankle",
        sleeve: "long",
        fabric: "cotton",
        pattern: "print",
        sheer: false,
        formality: 3,
      },
      sources: {
        length: "confirmed",
        sleeve: "confirmed",
        fabric: "label",
        pattern: "proposed",
        sheer: "confirmed",
        formality: "confirmed",
      },
    }),
    "length: ankle, sleeve: long, fabric: cotton, sheer: false",
  );
  assert.equal(studioDetails({}), undefined);
  assert.equal(
    studioDetails({ attributes: { sleeve: "short" } }),
    "sleeve: short",
  );
});

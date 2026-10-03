import { hyphenateSync as nbSync } from "hyphen/nb";
import { hyphenateSync as enSync } from "hyphen/en-us";

const minimum = { en: 11, nb: 12 } as const;
const engines = { en: enSync, nb: nbSync } as const;

export function hyphenate(text: string, locale: "en" | "nb"): string {
  return text.replace(/[\p{L}]+/gu, (word) =>
    word.length >= minimum[locale]
      ? engines[locale](word, {
          hyphenChar: "­",
          minWordLength: minimum[locale],
        })
      : word,
  );
}

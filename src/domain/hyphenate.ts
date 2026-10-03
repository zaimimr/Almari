import { hyphenateSync as nbSync } from "hyphen/nb";
import { hyphenateSync as enSync } from "hyphen/en-us";

const soft = "­";
const minimum = { en: 11, nb: 12 } as const;
const engines = { en: enSync, nb: nbSync } as const;
const englishShortTail = /­(?=\p{L}{2}$)/u;

function breakWord(word: string, locale: "en" | "nb"): string {
  const broken = engines[locale](word, {
    hyphenChar: soft,
    minWordLength: minimum[locale],
  });
  return locale === "en" ? broken.replace(englishShortTail, "") : broken;
}

export function hyphenate(text: string, locale: "en" | "nb"): string {
  return text.replace(/[\p{L}]+/gu, (word) =>
    word.length >= minimum[locale] ? breakWord(word, locale) : word,
  );
}

export type Locale = "en" | "nb";

export type Vars = Record<string, string | number>;

const norwegian = ["nb", "no", "nn"];

export function localeFor(languageCode: string | null | undefined): Locale {
  return norwegian.includes((languageCode ?? "").toLowerCase()) ? "nb" : "en";
}

export function localeFrom(
  language: "system" | Locale,
  languageCode: string | null | undefined,
): Locale {
  return language === "system" ? localeFor(languageCode) : language;
}

export function translate<K extends string>(
  catalogs: Record<Locale, Record<K, string>>,
  locale: Locale,
  key: K,
  vars: Vars = {},
): string {
  return catalogs[locale][key].replace(/\{(\w+)\}/g, (hole, name: string) =>
    name in vars ? String(vars[name]) : hole,
  );
}

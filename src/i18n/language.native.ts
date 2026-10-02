import { getLocales } from "expo-localization";

export function deviceLanguage(): string | undefined {
  return getLocales()[0]?.languageCode ?? undefined;
}

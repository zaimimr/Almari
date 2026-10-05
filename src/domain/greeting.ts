import { en } from "../i18n/en";
import { nb } from "../i18n/nb";
import { translate, type Locale } from "../i18n/translate";

export function greeting(
  name: string | null | undefined,
  hour: number,
  locale: Locale,
): string {
  const part =
    hour < 5 || hour >= 18 ? "evening" : hour < 12 ? "morning" : "afternoon";
  return name
    ? translate({ en, nb }, locale, `today.greeting.${part}`, { name })
    : translate({ en, nb }, locale, `today.greeting.${part}Plain`);
}

export function greetingShort(name: string, locale: Locale): string {
  return translate({ en, nb }, locale, "today.greeting.short", { name });
}

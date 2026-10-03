import type {
  Category,
  GarmentKind,
  Language,
  Occasion,
  Style,
} from "../domain/closet";
import { setAccessibilityLanguage } from "../../modules/accessibility-language/src";
import { deviceLanguage } from "./deviceLanguage";
import { en, type Key } from "./en";
import { nb } from "./nb";
import {
  localeFor,
  localeFrom,
  translate,
  type Locale,
  type Vars,
} from "./translate";

export type { Key, Locale };

const phoneLanguage = deviceLanguage();

export let locale: Locale = localeFor(phoneLanguage);

const speakIn = (next: Locale) =>
  setAccessibilityLanguage(next === "nb" ? "nb-NO" : "en");

speakIn(locale);

export function setLanguage(language: Language) {
  locale = localeFrom(language, phoneLanguage);
  speakIn(locale);
}

export const t = (key: Key, vars?: Vars) =>
  translate({ en, nb }, locale, key, vars);

export const categoryName = (id: Category) => t(`category.${id}`);

export const kindName = (id: GarmentKind) => t(`kind.${id}`);

export const styleName = (id: Style) => t(`style.${id}`);

export const stylesName = (styles: readonly Style[]) =>
  styles.map(styleName).join(` ${t("word.and")} `);

export const occasionName = (id: Occasion) => t(`occasion.${id}`);

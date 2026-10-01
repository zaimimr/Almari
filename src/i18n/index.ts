import { getLocales } from "expo-localization";
import type { Category, GarmentKind, Occasion, Style } from "../domain/closet";
import { en, type Key } from "./en";
import { nb } from "./nb";
import { localeFor, translate, type Locale, type Vars } from "./translate";

export type { Key, Locale };

export const locale: Locale = localeFor(getLocales()[0]?.languageCode);

export const t = (key: Key, vars?: Vars) =>
  translate({ en, nb }, locale, key, vars);

export const categoryName = (id: Category) => t(`category.${id}`);

export const kindName = (id: GarmentKind) => t(`kind.${id}`);

export const styleName = (id: Style) => t(`style.${id}`);

export const stylesName = (styles: readonly Style[]) =>
  styles.map(styleName).join(` ${t("word.and")} `);

export const occasionName = (id: Occasion) => t(`occasion.${id}`);

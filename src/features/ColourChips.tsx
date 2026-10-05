import { useState } from "react";
import { colourNames, namedSwatch } from "../domain/color";
import { t, type Key } from "../i18n";
import { ChipRow } from "../ui";

export const colourLabel = (name: string) =>
  t(`colour.${name.toLowerCase().replace(" ", "-")}` as Key);

const hex = (name: string) =>
  `#${namedSwatch(name)
    .rgb.map((part) => part.toString(16).padStart(2, "0"))
    .join("")}`;

const more = "more-colours";

export function ColourChips({
  value,
  onPick,
  inSurface,
  label,
  first,
  guessed,
  testID,
}: {
  value: string | null;
  onPick: (name: string) => void;
  inSurface?: boolean;
  label?: string;
  first?: string[];
  guessed?: boolean;
  testID?: string;
}) {
  const [all, setAll] = useState(!first?.length);
  const shown = all
    ? colourNames
    : [...new Set([...(value ? [value] : []), ...(first ?? [])])];
  return (
    <ChipRow
      label={label}
      options={[
        ...shown.map((name) => ({
          id: name,
          label: colourLabel(name),
          swatch: hex(name),
        })),
        ...(all ? [] : [{ id: more, label: t("colour.more") }]),
      ]}
      value={value}
      onChange={(next) => {
        if (next === more) setAll(true);
        else if (typeof next === "string") onPick(next);
      }}
      inSurface={inSurface}
      guessed={guessed}
      testID={testID}
    />
  );
}

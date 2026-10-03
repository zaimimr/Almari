import { colourNames, namedSwatch } from "../domain/color";
import { t, type Key } from "../i18n";
import { ChipRow } from "../ui";

export const colourLabel = (name: string) =>
  t(`colour.${name.toLowerCase().replace(" ", "-")}` as Key);

const hex = (name: string) =>
  `#${namedSwatch(name)
    .rgb.map((part) => part.toString(16).padStart(2, "0"))
    .join("")}`;

export function ColourChips({
  value,
  onPick,
  inSurface,
}: {
  value: string | null;
  onPick: (name: string) => void;
  inSurface?: boolean;
}) {
  return (
    <ChipRow
      options={colourNames.map((name) => ({
        id: name,
        label: colourLabel(name),
        swatch: hex(name),
      }))}
      value={value}
      onChange={(next) => {
        if (typeof next === "string") onPick(next);
      }}
      inSurface={inSurface}
    />
  );
}

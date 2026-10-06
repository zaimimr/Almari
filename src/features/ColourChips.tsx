import { useState } from "react";
import { View } from "react-native";
import type { Rgb } from "../domain/color";
import { colourChoices, colourSwatch, ownColour } from "../domain/lists";
import { t, type Key } from "../i18n";
import { ChipRow } from "../ui";
import { theme } from "../ui/theme";
import { AddOwn, addOwnId, addOwnOption } from "./AddOwn";

export const colourLabel = (name: string) =>
  ownColour(name)?.name ??
  t(`colour.${name.toLowerCase().replace(" ", "-")}` as Key);

export const colourHex = (name: string) =>
  `#${colourSwatch(name)
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
  photo,
  testID,
}: {
  value: string | null;
  onPick: (name: string) => void;
  inSurface?: boolean;
  label?: string;
  first?: string[];
  guessed?: boolean;
  photo?: Rgb[];
  testID?: string;
}) {
  const [all, setAll] = useState(!first?.length);
  const [adding, setAdding] = useState(false);
  const shown = all
    ? colourChoices()
    : [...new Set([...(value ? [value] : []), ...(first ?? [])])];
  return (
    <View style={{ gap: theme.space.md }}>
      <ChipRow
        label={label}
        options={[
          ...shown.map((name) => ({
            id: name,
            label: colourLabel(name),
            swatch: colourHex(name),
          })),
          all ? addOwnOption() : { id: more, label: t("colour.more") },
        ]}
        value={value}
        onChange={(next) => {
          if (next === more) setAll(true);
          else if (next === addOwnId) setAdding(true);
          else if (typeof next === "string") onPick(next);
        }}
        inSurface={inSurface}
        guessed={guessed}
        testID={testID}
      />
      {adding ? (
        <AddOwn
          list="colours"
          photo={photo}
          onAdded={(id) => {
            setAdding(false);
            onPick(id);
          }}
          onCancel={() => setAdding(false)}
          testID={testID ? `${testID}-own` : undefined}
        />
      ) : null}
    </View>
  );
}

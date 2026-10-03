import { SymbolView, type SFSymbol } from "expo-symbols";
import { toneColor, type TextTone } from "./Text";
import { useColors } from "./useColors";
import { useLargeText } from "./useLargeText";

export function Symbol({
  name,
  size,
  tone,
  weight = "medium",
}: {
  name: SFSymbol;
  size: number;
  tone: TextTone;
  weight?: "regular" | "medium" | "semibold";
}) {
  const colors = useColors();
  const { symbolScale } = useLargeText();
  return (
    <SymbolView
      name={name}
      size={size * symbolScale}
      tintColor={colors[toneColor[tone]]}
      weight={weight}
      scale="medium"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

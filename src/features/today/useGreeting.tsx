import { useState } from "react";
import { Text as NativeText, View, useWindowDimensions } from "react-native";
import { greeting, greetingShort } from "../../domain/greeting";
import { locale, t } from "../../i18n";
import { gutterFor } from "../../ui/theme";
import { useLargeText } from "../../ui/useLargeText";

const hiddenLayer = {
  position: "absolute",
  top: 0,
  left: 0,
  opacity: 0,
} as const;

export function useGreeting(name: string | undefined, hour: number) {
  const { width } = useWindowDimensions();
  const { fontScale, bold } = useLargeText();
  const room = width - 2 * gutterFor(width);
  const candidates = [
    greeting(name, hour, locale),
    ...(name ? [greetingShort(name, locale)] : []),
    greeting(null, hour, locale),
  ];
  const key = `${room}:${fontScale}:${bold}`;
  const [fits, setFits] = useState<Record<string, boolean>>({});
  const known = candidates.map((text) => fits[`${key}:${text}`]);
  const title = known.includes(undefined)
    ? null
    : (candidates.find((_, index) => known[index]) ?? t("nav.today"));

  const layer = (
    <View
      style={hiddenLayer}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {candidates.map((text) => (
        <NativeText
          key={`${key}:${text}`}
          allowFontScaling={false}
          style={{
            width: room,
            fontFamily: bold ? "Georgia-Bold" : "Georgia",
            fontSize: 34 * Math.min(fontScale, 1.76),
          }}
          onTextLayout={(event) => {
            const one = event.nativeEvent.lines.length <= 1;
            setFits((current) =>
              current[`${key}:${text}`] === one
                ? current
                : { ...current, [`${key}:${text}`]: one },
            );
          }}
        >
          {text}
        </NativeText>
      ))}
    </View>
  );

  return [title ?? candidates[candidates.length - 1]!, layer] as const;
}

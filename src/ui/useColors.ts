import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { theme, type Colors } from "./theme";

export function useColors(): Colors {
  const [darker, setDarker] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isDarkerSystemColorsEnabled().then((enabled) => {
      if (active) setDarker(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "darkerSystemColorsChanged",
      setDarker,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return darker
    ? { ...theme.colors, ...theme.colorsIncreasedContrast }
    : theme.colors;
}

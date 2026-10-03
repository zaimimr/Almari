import { useEffect, useState } from "react";
import { AccessibilityInfo, useWindowDimensions } from "react-native";

export function useLargeText(): {
  fontScale: number;
  large: boolean;
  ax: boolean;
  bold: boolean;
  symbolScale: number;
} {
  const { fontScale } = useWindowDimensions();
  const [bold, setBold] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isBoldTextEnabled().then((enabled) => {
      if (active) setBold(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "boldTextChanged",
      setBold,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return {
    fontScale,
    large: fontScale >= 1.35,
    ax: fontScale >= 1.6,
    bold,
    symbolScale: Math.min(fontScale, 2),
  };
}

import { requireNativeView } from "expo";
import type { Ref } from "react";
import type { NativeSyntheticEvent, ViewProps } from "react-native";
import type { CameraFrame } from "./ClosetVision.types";

export type SelfieCameraHandle = { capture(): Promise<string> };

export type SelfieCameraProps = ViewProps & {
  ref?: Ref<SelfieCameraHandle>;
  onReading?: (event: NativeSyntheticEvent<CameraFrame>) => void;
  onState?: (
    event: NativeSyntheticEvent<{ state: "ready" | "unavailable" }>,
  ) => void;
};

export const SelfieCameraView = requireNativeView<SelfieCameraProps>(
  "ClosetVision",
  "SelfieCameraView",
);

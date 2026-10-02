import { requireNativeView } from "expo";
import type { ComponentType, Ref } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import type {
  LiveScanHandle,
  ScanCameraState,
  ScanFrameEvent,
} from "./ClosetVision.types";

export type LiveScanProps = {
  style?: StyleProp<ViewStyle>;
  facing: "front" | "back";
  active: boolean;
  fps: number;
  onFrame: (event: { nativeEvent: ScanFrameEvent }) => void;
  onCamera: (event: { nativeEvent: { state: ScanCameraState } }) => void;
  ref?: Ref<LiveScanHandle>;
};

export const LiveScanView: ComponentType<LiveScanProps> =
  requireNativeView("ClosetVision", "LiveScanView");

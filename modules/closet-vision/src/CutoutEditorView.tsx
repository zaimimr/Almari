import { requireNativeView } from "expo";
import type { ComponentType, Ref } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import type { CutoutEditorHandle } from "./ClosetVision.types";

export type CutoutEditorProps = {
  style?: StyleProp<ViewStyle>;
  original: string;
  cutout: string | null;
  area?: { x: number; y: number; width: number; height: number } | null;
  mode: "restore" | "erase";
  brushSize: number;
  onReady: (event: { nativeEvent: { state: "ready" | "failed" } }) => void;
  onEdit: (event: { nativeEvent: { canUndo: boolean } }) => void;
  onSelect?: () => void;
  onSelecting?: (event: {
    nativeEvent: { selecting: boolean; found?: boolean };
  }) => void;
  labels?: Record<string, string>;
  ref?: Ref<CutoutEditorHandle>;
};

export const CutoutEditorView: ComponentType<CutoutEditorProps> =
  requireNativeView("ClosetVision", "CutoutEditorView");

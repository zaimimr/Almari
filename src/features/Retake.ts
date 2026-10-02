import * as ImagePicker from "expo-image-picker";
import { randomUUID } from "expo-crypto";
import type { ImportJob } from "../domain/closet";
import { retakeImport } from "../domain/importing";
import type { Key } from "../i18n/en";
import { useCloset } from "../state/closet";
import { changeImports } from "../state/imports";
import { discardPhoto, keepPhotoAs, lowOnSpace } from "../storage/local";

export type CaptureProblem =
  "camera-off" | "unavailable" | "low-space" | "failed";

export const problemMessages: Record<CaptureProblem, Key> = {
  "camera-off": "problem.camera-off",
  unavailable: "problem.unavailable",
  "low-space": "problem.low-space",
  failed: "problem.failed",
};

const options: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  quality: 1,
  exif: false,
};

export function useRetake() {
  const { update } = useCloset();
  return async function retake(
    job: ImportJob,
    from: "camera" | "library",
  ): Promise<"done" | "cancelled" | CaptureProblem> {
    if (lowOnSpace()) return "low-space";
    let uri: string | undefined;
    try {
      if (from === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return "camera-off";
      }
      const result =
        from === "camera"
          ? await ImagePicker.launchCameraAsync(options).catch(() =>
              ImagePicker.launchImageLibraryAsync(options),
            )
          : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return "cancelled";
      uri = result.assets[0]?.uri;
    } catch {
      return "unavailable";
    }
    if (!uri) return "cancelled";
    let source: string | null = null;
    try {
      source = await keepPhotoAs(uri, randomUUID());
      const stored = source;
      await changeImports(update, (current) =>
        retakeImport(current, job.id, stored),
      );
      return "done";
    } catch {
      if (source) void discardPhoto(source).catch(() => undefined);
      return lowOnSpace() ? "low-space" : "failed";
    }
  };
}

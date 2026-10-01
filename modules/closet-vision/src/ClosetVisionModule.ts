import { NativeModule, requireOptionalNativeModule } from "expo";
import type { PreparedGarment } from "./ClosetVision.types";

declare class ClosetVisionModule extends NativeModule {
  isAvailable(): boolean;
  prepare(sourceUri: string, id: string): Promise<PreparedGarment>;
}

const native = requireOptionalNativeModule<ClosetVisionModule>("ClosetVision");

export default native ?? {
  isAvailable: () => false,
  prepare: (_sourceUri: string, _id: string): Promise<PreparedGarment> =>
    Promise.reject(new Error("unavailable")),
};

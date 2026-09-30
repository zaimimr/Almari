import { NativeModule, requireNativeModule } from "expo";
import type { PreparedGarment } from "./ClosetVision.types";

declare class ClosetVisionModule extends NativeModule {
  isAvailable(): boolean;
  prepare(sourceUri: string, id: string): Promise<PreparedGarment>;
}

export default requireNativeModule<ClosetVisionModule>("ClosetVision");

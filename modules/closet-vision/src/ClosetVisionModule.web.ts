import type { PreparedGarment } from "./ClosetVision.types";

export default {
  isAvailable: () => false,
  prepare: (_sourceUri: string, _id: string): Promise<PreparedGarment> =>
    Promise.reject(new Error("unavailable")),
};

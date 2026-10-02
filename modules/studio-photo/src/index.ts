import { NativeModule, requireOptionalNativeModule } from "expo";

export type StudioModelState = {
  supported: boolean;
  ready: boolean;
  bytes: number;
  size: number;
};

export type StudioDownload = { bytes: number; size: number };

declare class StudioPhotoModule extends NativeModule<{
  onDownload: (event: StudioDownload) => void;
}> {
  modelState(): Promise<StudioModelState>;
  download(): Promise<void>;
  cancelDownload(): Promise<void>;
  deleteModel(): Promise<void>;
  render(cutout: string, id: string): Promise<string>;
}

const native = requireOptionalNativeModule<StudioPhotoModule>("StudioPhoto");

const unavailable: StudioModelState = {
  supported: false,
  ready: false,
  bytes: 0,
  size: 0,
};

export const studioPhoto = {
  modelState: () => native?.modelState() ?? Promise.resolve(unavailable),
  download: () =>
    native?.download() ?? Promise.reject(new Error("unavailable")),
  cancelDownload: () => native?.cancelDownload() ?? Promise.resolve(),
  deleteModel: () => native?.deleteModel() ?? Promise.resolve(),
  render: (cutout: string, id: string) =>
    native?.render(cutout, id) ?? Promise.reject(new Error("unavailable")),
  onDownload: (listener: (event: StudioDownload) => void) =>
    native?.addListener("onDownload", listener) ?? { remove: () => undefined },
};

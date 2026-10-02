import { useEffect, useState, useSyncExternalStore } from "react";
import {
  studioPhoto,
  type StudioModelState,
} from "../../modules/studio-photo/src";
import { t } from "../i18n";

export type StudioModel = StudioModelState & {
  downloading: boolean;
  failed: boolean;
};

let state: StudioModel = {
  supported: false,
  ready: false,
  bytes: 0,
  size: 0,
  downloading: false,
  failed: false,
};
const listeners = new Set<() => void>();

function set(change: Partial<StudioModel>) {
  state = { ...state, ...change };
  for (const listener of listeners) listener();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export async function refreshStudioModel() {
  set(await studioPhoto.modelState().catch(() => ({})));
}

export async function downloadStudioModel() {
  if (state.downloading) return;
  set({ downloading: true, failed: false });
  const subscription = studioPhoto.onDownload(({ bytes, size }) =>
    set({ bytes, size }),
  );
  try {
    await studioPhoto.download();
  } catch {
    set({ failed: true });
  } finally {
    subscription.remove();
    set({ downloading: false });
    await refreshStudioModel();
  }
}

export async function deleteStudioModel() {
  await studioPhoto.cancelDownload();
  await studioPhoto.deleteModel();
  await refreshStudioModel();
}

export const cancelStudioDownload = () => studioPhoto.cancelDownload();

export function useStudioModel(): StudioModel {
  useEffect(() => {
    void refreshStudioModel();
  }, []);
  return useSyncExternalStore(subscribe, () => state);
}

export const renderStudio = (cutout: string, id: string) =>
  studioPhoto.render(cutout, id);

export function studioFailure(error: unknown): "warm" | "failed" | null {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("cancelled")) return null;
  return message.includes("thermal") ? "warm" : "failed";
}

export function useStudioMaker() {
  const [making, setMaking] = useState(false);
  const [problem, setProblem] = useState<"warm" | "failed" | null>(null);
  async function make(cutout: string, id: string): Promise<string | null> {
    setMaking(true);
    setProblem(null);
    try {
      return await renderStudio(cutout, id);
    } catch (error) {
      setProblem(studioFailure(error));
      return null;
    } finally {
      setMaking(false);
    }
  }
  const message =
    problem === "warm"
      ? t("photo.studioWarm")
      : problem === "failed"
        ? t("photo.studioFailed")
        : null;
  return { making, message, make };
}

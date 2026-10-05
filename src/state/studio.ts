import { getNetworkStateAsync } from "expo-network";
import { useState } from "react";
import type { Category, GarmentKind } from "../domain/taxonomy";
import { t } from "../i18n";
import ClosetVision from "../../modules/closet-vision/src";
import {
  discardPhoto,
  installId,
  keepPhotoAs,
  keepPhotoBytes,
  photoUpload,
  photoUri,
} from "../storage/local";
import { fixtures } from "../testing/fixtures";

export type StudioPiece = {
  category: Category;
  kind?: GarmentKind;
  name?: string;
  colour?: string | null;
};

type StudioProblem = "offline" | "limit" | "failed";

const studioUrl = process.env.EXPO_PUBLIC_STUDIO_URL;
const studioToken = process.env.EXPO_PUBLIC_STUDIO_TOKEN;

export const studioTimeout = 45000;

export const studioAvailable = Boolean(studioUrl && studioToken);

export function studioOffered() {
  return studioAvailable || Boolean(fixtures.studio);
}

const fixtureErrors = {
  offline: "offline",
  limit: "limit",
  fail: "failed",
} as const;

async function fixtureStudio(source: string, id: string) {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  if (fixtures.studio !== "ok")
    throw new Error(fixtureErrors[fixtures.studio ?? "fail"]);
  return keepPhotoAs(photoUri(source), `${id}-studio`);
}

async function studioInput(source: string, id: string) {
  if (!ClosetVision.isAvailable()) return null;
  try {
    return await ClosetVision.studioInput(photoUri(source), id);
  } catch {
    throw new Error("failed");
  }
}

export async function isOffline() {
  try {
    const state = await getNetworkStateAsync();
    return state.isConnected === false || state.isInternetReachable === false;
  } catch {
    return false;
  }
}

export async function renderStudio(
  source: string,
  id: string,
  piece: StudioPiece,
): Promise<string> {
  if (fixtures.studio) return fixtureStudio(source, id);
  const input = await studioInput(source, id);
  const body = new FormData();
  body.append("image", (await photoUpload(input ?? source)) as Blob);
  body.append("category", piece.category);
  if (piece.kind) body.append("kind", piece.kind);
  if (piece.name?.trim()) body.append("name", piece.name.trim());
  if (piece.colour) body.append("colour", piece.colour);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), studioTimeout);
  let response: Response;
  let bytes: Uint8Array;
  try {
    try {
      response = await fetch(studioUrl!, {
        method: "post",
        headers: {
          "x-app-token": studioToken!,
          "x-install-id": await installId(),
        },
        body,
        signal: controller.signal,
      });
    } catch {
      throw new Error(
        !controller.signal.aborted && (await isOffline())
          ? "offline"
          : "failed",
      );
    } finally {
      if (input) void discardPhoto(input).catch(() => undefined);
    }
    if (response.status === 429) throw new Error("limit");
    if (!response.ok) throw new Error("failed");
    bytes = new Uint8Array(await response.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
  const type = response.headers.get("content-type") ?? "";
  const extension = type.includes("png") ? ".png" : ".jpg";
  if (!ClosetVision.isAvailable())
    return keepPhotoBytes(bytes, `${id}-studio${extension}`);
  const raw = await keepPhotoBytes(bytes, `${id}-studio-raw${extension}`);
  try {
    const white = await ClosetVision.whitenBackground(photoUri(raw), id);
    void discardPhoto(raw).catch(() => undefined);
    return white;
  } catch {
    return raw;
  }
}

export function studioFailure(error: unknown): StudioProblem {
  const message = error instanceof Error ? error.message : "";
  return message === "offline" || message === "limit" ? message : "failed";
}

const messages = {
  offline: "common.offline",
  limit: "photo.cleanLimit",
  failed: "photo.cleanFailed",
} as const;

export function useStudioMaker() {
  const [making, setMaking] = useState(false);
  const [problem, setProblem] = useState<StudioProblem | null>(null);
  async function make(
    source: string,
    id: string,
    piece: StudioPiece,
  ): Promise<string | null> {
    setMaking(true);
    setProblem(null);
    try {
      return await renderStudio(source, id, piece);
    } catch (error) {
      setProblem(studioFailure(error));
      return null;
    } finally {
      setMaking(false);
    }
  }
  const message = problem ? t(messages[problem]) : null;
  return { making, message, make };
}

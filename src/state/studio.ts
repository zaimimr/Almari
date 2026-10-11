import { getNetworkStateAsync } from "expo-network";
import { useState } from "react";
import type { Category, GarmentKind } from "../domain/taxonomy";
import type { Frame } from "../domain/closet";
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
import { track } from "./telemetry";
import { prepareStudioInput } from "./studioInput";

export type StudioPiece = {
  category: Category;
  kind?: GarmentKind;
  name?: string;
  colour?: string | null;
  note?: string;
  original?: string;
  area?: Frame;
  details?: string;
};

type StudioProblem = "offline" | "limit" | "failed";

const studioUrl = process.env.EXPO_PUBLIC_STUDIO_URL;
const studioToken = process.env.EXPO_PUBLIC_STUDIO_TOKEN;

export const studioTimeout = 90000;

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
  return keepPhotoAs(
    photoUri(source),
    `${id}-studio-${Date.now().toString(36)}`,
  );
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
  track("studio_enhance_requested", { category: piece.category });
  try {
    return await makeStudio(source, id, piece);
  } catch (error) {
    track("studio_enhance_failed", {
      category: piece.category,
      reason: studioFailure(error),
    });
    throw error;
  }
}

async function makeStudio(
  source: string,
  id: string,
  piece: StudioPiece,
): Promise<string> {
  if (fixtures.studio) return fixtureStudio(source, id);
  const temporary: string[] = [];
  try {
    const body = await studioForm(source, id, piece, temporary);
    const { bytes, extension } = await requestStudio(body);
    const name = `${id}-studio-${Date.now().toString(36)}`;
    if (!ClosetVision.isAvailable())
      return keepPhotoBytes(bytes, `${name}${extension}`);
    const raw = await keepPhotoBytes(bytes, `${name}-raw${extension}`);
    const clear = await clearStudio(raw, name);
    if (!clear) return raw;
    void discardPhoto(raw).catch(() => undefined);
    return clear;
  } finally {
    for (const file of temporary)
      void discardPhoto(file).catch(() => undefined);
  }
}

async function studioForm(
  source: string,
  id: string,
  piece: StudioPiece,
  temporary: string[],
) {
  const input = await prepareStudioInput(source, `${id}-selection`);
  temporary.push(input);
  const body = new FormData();
  body.append("image", (await photoUpload(input)) as Blob);
  if (piece.original && piece.original !== source) {
    const original = await prepareStudioInput(
      piece.original,
      `${id}-reference`,
    );
    temporary.push(original);
    body.append("original", (await photoUpload(original)) as Blob);
    if (piece.area) body.append("area", JSON.stringify(piece.area));
  }
  body.append("category", piece.category);
  if (piece.kind) body.append("kind", piece.kind);
  if (piece.name?.trim()) body.append("name", piece.name.trim());
  if (piece.colour) body.append("colour", piece.colour);
  if (piece.note) body.append("note", piece.note);
  if (piece.details) body.append("details", piece.details);
  return body;
}

async function requestStudio(body: FormData) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), studioTimeout);
  try {
    let response: Response;
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
    }
    if (response.status === 429) throw new Error("limit");
    if (!response.ok) throw new Error("failed");
    const bytes = new Uint8Array(await response.arrayBuffer());
    const type = response.headers.get("content-type") ?? "";
    if (!bytes.length || !/^image\/(jpeg|png)(;|$)/i.test(type))
      throw new Error("failed");
    return { bytes, extension: type.includes("png") ? ".png" : ".jpg" };
  } finally {
    clearTimeout(timer);
  }
}

export async function clearStudio(
  file: string,
  name: string,
): Promise<string | null> {
  try {
    return await ClosetVision.clearBackground(photoUri(file), name);
  } catch {
    return null;
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

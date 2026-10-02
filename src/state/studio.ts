import { useState } from "react";
import type { Category, GarmentKind } from "../domain/taxonomy";
import { t } from "../i18n";
import ClosetVision from "../../modules/closet-vision/src";
import {
  discardPhoto,
  installId,
  keepPhotoBytes,
  photoUpload,
  photoUri,
} from "../storage/local";

export type StudioPiece = {
  category: Category;
  kind?: GarmentKind;
  name?: string;
  colour?: string | null;
};

type StudioProblem = "offline" | "limit" | "failed";

const studioUrl = process.env.EXPO_PUBLIC_STUDIO_URL;
const studioToken = process.env.EXPO_PUBLIC_STUDIO_TOKEN;

export const studioAvailable = Boolean(studioUrl && studioToken);

async function studioInput(source: string, id: string) {
  if (!ClosetVision.isAvailable()) return null;
  try {
    return await ClosetVision.studioInput(photoUri(source), id);
  } catch {
    throw new Error("failed");
  }
}

export async function renderStudio(
  source: string,
  id: string,
  piece: StudioPiece,
): Promise<string> {
  const input = await studioInput(source, id);
  const body = new FormData();
  body.append("image", (await photoUpload(input ?? source)) as Blob);
  body.append("category", piece.category);
  if (piece.kind) body.append("kind", piece.kind);
  if (piece.name?.trim()) body.append("name", piece.name.trim());
  if (piece.colour) body.append("colour", piece.colour);
  let response: Response;
  try {
    response = await fetch(studioUrl!, {
      method: "post",
      headers: {
        "x-app-token": studioToken!,
        "x-install-id": await installId(),
      },
      body,
    });
  } catch {
    throw new Error("offline");
  } finally {
    if (input) void discardPhoto(input).catch(() => undefined);
  }
  if (response.status === 429) throw new Error("limit");
  if (!response.ok) throw new Error("failed");
  const type = response.headers.get("content-type") ?? "";
  const extension = type.includes("png") ? ".png" : ".jpg";
  const bytes = new Uint8Array(await response.arrayBuffer());
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
  offline: "photo.studioOffline",
  limit: "photo.studioLimit",
  failed: "photo.studioFailed",
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

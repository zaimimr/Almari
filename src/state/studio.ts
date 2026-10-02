import { useState } from "react";
import type { Category, GarmentKind } from "../domain/taxonomy";
import { t } from "../i18n";
import { installId, keepPhotoBytes, photoUpload } from "../storage/local";

export type StudioPiece = {
  category: Category;
  kind?: GarmentKind;
  name?: string;
};

type StudioProblem = "offline" | "limit" | "failed";

const studioUrl = process.env.EXPO_PUBLIC_STUDIO_URL;
const studioToken = process.env.EXPO_PUBLIC_STUDIO_TOKEN;

export const studioAvailable = Boolean(studioUrl && studioToken);

export async function renderStudio(
  cutout: string,
  id: string,
  piece: StudioPiece,
): Promise<string> {
  const body = new FormData();
  body.append("image", (await photoUpload(cutout)) as Blob);
  body.append("category", piece.category);
  if (piece.kind) body.append("kind", piece.kind);
  if (piece.name?.trim()) body.append("name", piece.name.trim());
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
  }
  if (response.status === 429) throw new Error("limit");
  if (!response.ok) throw new Error("failed");
  const type = response.headers.get("content-type") ?? "";
  return keepPhotoBytes(
    new Uint8Array(await response.arrayBuffer()),
    `${id}-studio${type.includes("png") ? ".png" : ".jpg"}`,
  );
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
    cutout: string,
    id: string,
    piece: StudioPiece,
  ): Promise<string | null> {
    setMaking(true);
    setProblem(null);
    try {
      return await renderStudio(cutout, id, piece);
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

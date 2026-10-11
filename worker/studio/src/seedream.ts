import { studioPrompt } from "./prompt";
import { imageType, maxImageBytes, type StudioRequest } from "./request";

export const seedreamModel = "bytedance/seedream-5-pro";

export function seedreamPrompt(piece: Omit<StudioRequest, "image">) {
  const prompt = studioPrompt(piece, 1);
  if (!piece.original || !piece.area) return prompt;
  const { x, y, width, height } = piece.area;
  const coordinate = (value: number) =>
    Math.max(0, Math.min(999, Math.round(value * 1000)));
  const left = coordinate(x);
  const top = coordinate(y);
  const right = coordinate(x + width);
  const bottom = coordinate(y + height);
  if (left >= right || top >= bottom) return prompt;
  return `SELECTED ITEM. Identify the wardrobe item whose fabric is at Image 2 <bbox>${left} ${top} ${right} ${bottom}</bbox> and matches Image 1. This box locates the selected fabric, not the item's complete outline. Recover that whole item, including parts outside the box, and exclude all neighbors.\n\n${prompt}`;
}

async function imageReference(image: File) {
  const bytes = new Uint8Array(await image.arrayBuffer());
  const chunkSize = 32768;
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += chunkSize)
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + chunkSize),
    );
  return `data:${image.type};base64,${btoa(binary)}`;
}

function outputUrl(result: Record<string, unknown>) {
  const output = result.result;
  if (!output || typeof output !== "object" || !("images" in output))
    return null;
  if (!Array.isArray(output.images) || typeof output.images[0] !== "string")
    return null;
  const url = new URL(output.images[0]);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    ![".volces.com", ".bytepluses.com"].some((host) =>
      url.hostname.endsWith(host),
    )
  )
    throw new Error("Untrusted Studio output URL");
  return url;
}

async function downloadImage(url: URL, signal: AbortSignal) {
  const response = await fetch(url, { signal, redirect: "manual" });
  if (!response.ok)
    throw new Error(`Studio output status code ${response.status}`);
  if (Number(response.headers.get("content-length")) > maxImageBytes) {
    await response.body?.cancel();
    throw new Error("Studio output exceeds image size limit");
  }
  if (!response.body) {
    console.error("studio", "empty Seedream output");
    return null;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxImageBytes) {
      await reader.cancel();
      throw new Error("Studio output exceeds image size limit");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  const type = imageType(bytes);
  if (type !== "image/jpeg" && type !== "image/png") {
    console.error("studio", "Seedream output is not JPEG or PNG");
    return null;
  }
  return { bytes, type };
}

export async function generateSeedream(
  ai: Ai,
  piece: StudioRequest,
  signal: AbortSignal,
) {
  const images = [piece.image, ...(piece.original ? [piece.original] : [])];
  const result = await ai.run(
    seedreamModel,
    {
      prompt: seedreamPrompt(piece),
      image: await Promise.all(images.map(imageReference)),
      size: "1024x1024",
      watermark: false,
    },
    { signal },
  );
  const url = outputUrl(result);
  if (!url) {
    console.error("studio", "Seedream response has no image");
    return null;
  }
  return downloadImage(url, signal);
}

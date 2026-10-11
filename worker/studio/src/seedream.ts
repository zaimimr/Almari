import { studioPrompt } from "./prompt";
import { imageType, maxImageBytes, type StudioRequest } from "./request";

export const seedreamModel = "bytedance/seedream-5-pro";

function selectionBox(area: StudioRequest["area"]) {
  if (!area) return null;
  const { x, y, width, height } = area;
  const coordinate = (value: number) =>
    Math.max(0, Math.min(999, Math.round(value * 1000)));
  const left = coordinate(x);
  const top = coordinate(y);
  const right = coordinate(x + width);
  const bottom = coordinate(y + height);
  return left < right && top < bottom
    ? `<bbox>${left} ${top} ${right} ${bottom}</bbox>`
    : null;
}

export function seedreamPrompt(piece: Omit<StudioRequest, "image">) {
  const prompt = studioPrompt(piece, 1);
  const box = piece.original && selectionBox(piece.area);
  if (!box) return prompt;
  return `SELECTED ITEM. Identify the wardrobe item whose fabric is at Image 2 ${box} and matches Image 1. This box locates the selected fabric, not the item's complete outline. Recover that whole item, including parts outside the box, and exclude all neighbors.\n\n${prompt}`;
}

export function seedreamCorrectionPrompt(piece: Omit<StudioRequest, "image">) {
  const draft = piece.original ? "Image 3" : "Image 2";
  const box = piece.original && selectionBox(piece.area);
  return [
    `Correct ${draft}, a draft catalogue photograph, to match the real selected garment. Image 1 identifies the selected item.${piece.original ? " Image 2 is the original photo." : ""} ${draft} supplies only the product pose. The source photographs and explicit owner details are the authority for identity.`,
    box
      ? `Identify the selected fabric at Image 2 ${box}, matching Image 1. Recover the whole item, including parts outside the box.`
      : null,
    "Keep the garment's colour, material, texture, pattern, transparency and all construction actually visible in either source. Compare every visible pocket, seam, closure, fastening and decorative feature in the draft with the source garment. Remove invented pocket openings, patch pockets, labels, cuff straps, belts, jewelry and extra fastenings that are absent from the source and owner description. Retain all pockets and hardware that the source actually shows, including features outside the selected patch. Complete unseen areas with the same fabric and minimum necessary shape, without adding a typical garment design.",
    piece.note ? `Owner description: ${piece.note}.` : null,
    piece.name ? `Item name: ${piece.name}.` : null,
    piece.details ? `Confirmed details: ${piece.details}.` : null,
    piece.colour ? `Confirmed colour: ${piece.colour}.` : null,
    "The owner description determines the item type and construction when it disagrees with an automatic guess. Descriptions of folding, wearing or hanging describe the source scene, not the final product pose. Keep clothing completely unfolded in an overhead flat lay, with sleeves and legs fully shown. Scarves have two separate free ends, not a closed infinity loop, unless the source or owner confirms that construction. Shoes remain side by side. Bags retain their original structure in an upright catalogue view. Preserve the supported construction and shape. Remove all people, body parts, source props, neighbors and unrelated accessories. Pure white background with neutral light and no cast shadows. Fit the entire garment inside the central 80 percent of a square canvas. Change only what is required to restore fidelity and the white background. Do not add features or text.",
  ]
    .filter(Boolean)
    .join("\n\n");
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

async function requestSeedream(
  ai: Ai,
  images: string[],
  prompt: string,
  signal: AbortSignal,
) {
  if (signal.aborted) return null;
  const result = await ai.run(
    seedreamModel,
    {
      prompt,
      image: images,
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

export async function generateSeedream(
  ai: Ai,
  piece: StudioRequest,
  signal: AbortSignal,
) {
  const sources = [piece.image, ...(piece.original ? [piece.original] : [])];
  const images = await Promise.all(sources.map(imageReference));
  const draft = await requestSeedream(
    ai,
    images,
    seedreamPrompt(piece),
    signal,
  );
  if (!draft || signal.aborted) return null;
  const reference = await imageReference(
    new File([draft.bytes], "draft", { type: draft.type }),
  );
  return requestSeedream(
    ai,
    [...images, reference],
    seedreamCorrectionPrompt(piece),
    signal,
  );
}

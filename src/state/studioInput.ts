import { photoUri } from "../storage/local";

export async function prepareStudioInput(
  source: string,
  _id: string,
): Promise<string> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = photoUri(source);
  await image.decode();
  const scale = Math.min(
    1,
    500 / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.floor(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("failed");
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

import { keyedStorage, type ClosetStorage } from "../domain/repository";

export const closetStorage: ClosetStorage = keyedStorage(
  async (key) => window.localStorage.getItem(key),
  async (key, value) => window.localStorage.setItem(key, value),
  async (key) => window.localStorage.removeItem(key),
);

export async function keepPhoto(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(new Error("This photo could not be opened. Choose it again."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

export async function keepPhotoAs(uri: string, _id: string) {
  return keepPhoto(uri);
}

export function photoUri(photo: string) {
  return photo;
}

export async function discardPhoto(_photo: string) {}

export async function discardAllPhotos() {}

export async function exportFolder(_json: string): Promise<string> {
  throw new Error("unavailable");
}

export function lowOnSpace() {
  return false;
}

export async function discardTemporary(_uri: string) {}

export async function keepPhotoBytes(bytes: Uint8Array, filename: string) {
  return keepPhoto(
    URL.createObjectURL(
      new Blob([bytes as Uint8Array<ArrayBuffer>], {
        type: filename.endsWith(".png") ? "image/png" : "image/jpeg",
      }),
    ),
  );
}

export async function photoUpload(photo: string) {
  return (await fetch(photo)).blob();
}

export async function installId() {
  const stored = window.localStorage.getItem("installId");
  if (stored) return stored;
  const id = crypto.randomUUID();
  window.localStorage.setItem("installId", id);
  return id;
}

export async function discardStudioModel() {}

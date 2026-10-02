import { keyedStorage, type ClosetStorage } from "../domain/repository";

export const closetStorage: ClosetStorage = keyedStorage(
  async (key) => window.localStorage.getItem(key),
  async (key, value) => window.localStorage.setItem(key, value),
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

export function lowOnSpace() {
  return false;
}

import type { ClosetStorage } from "../domain/repository";

const key = "closet.v2";
const previousKey = "closet.v1";

export const closetStorage: ClosetStorage = {
  async read() {
    return (
      window.localStorage.getItem(key) ??
      window.localStorage.getItem(previousKey)
    );
  },
  async write(value) {
    window.localStorage.setItem(key, value);
  },
};

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

export function photoUri(photo: string) {
  return photo;
}

export async function discardPhoto(_photo: string) {}

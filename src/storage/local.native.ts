import Storage from "expo-sqlite/kv-store";
import { Directory, File, Paths } from "expo-file-system";
import { randomUUID } from "expo-crypto";
import type { ClosetStorage } from "../domain/repository";

const key = "closet.v1";
const photos = new Directory(Paths.document, "closet-photos");

export const closetStorage: ClosetStorage = {
  read: () => Storage.getItem(key),
  write: (value) => Storage.setItem(key, value),
};

export async function keepPhoto(uri: string): Promise<string> {
  photos.create({ intermediates: true, idempotent: true });
  const source = new File(uri);
  const filename = `${randomUUID()}${source.extension || ".jpg"}`;
  source.copy(new File(photos, filename));
  return filename;
}

export function photoUri(photo: string) {
  return new File(photos, photo).uri;
}

export async function discardPhoto(photo: string) {
  const file = new File(photos, photo);
  if (file.exists) file.delete();
}

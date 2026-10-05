import Storage from "expo-sqlite/kv-store";
import { Directory, File, Paths } from "expo-file-system";
import { randomUUID } from "expo-crypto";
import { keyedStorage, type ClosetStorage } from "../domain/repository";
import { isSamplePhoto } from "../domain/samples";
import { fixtures } from "../testing/fixtures";

const photos = new Directory(Paths.document, "closet-photos");

const stored = keyedStorage(
  (key) => Storage.getItem(key),
  (key, value) => Storage.setItem(key, value),
  (key) => Storage.removeItem(key),
);

export const closetStorage: ClosetStorage = {
  ...stored,
  async write(value) {
    if (fixtures.failWrite) {
      fixtures.failWrite = false;
      throw new Error("fixture");
    }
    return stored.write(value);
  },
};

export async function keepPhoto(uri: string): Promise<string> {
  photos.create({ intermediates: true, idempotent: true });
  const source = new File(uri);
  const filename = `${randomUUID()}${source.extension || ".jpg"}`;
  source.copy(new File(photos, filename));
  return filename;
}

export async function keepPhotoAs(uri: string, id: string): Promise<string> {
  photos.create({ intermediates: true, idempotent: true });
  const source = new File(uri);
  const filename = `${id}-original${source.extension || ".jpg"}`;
  const target = new File(photos, filename);
  if (!target.exists) source.copy(target);
  return filename;
}

export function photoUri(photo: string) {
  return new File(photos, photo).uri;
}

export async function discardPhoto(photo: string) {
  if (isSamplePhoto(photo)) return;
  const file = new File(photos, photo);
  if (file.exists) file.delete();
}

export async function discardAllPhotos() {
  if (photos.exists) photos.delete();
}

export async function exportFolder(json: string): Promise<string> {
  const folder = new Directory(Paths.cache, "Almari");
  if (folder.exists) folder.delete();
  folder.create({ intermediates: true });
  new File(folder, "closet.json").write(json);
  if (photos.exists) photos.copy(folder);
  return folder.uri;
}

export function lowOnSpace() {
  return Paths.availableDiskSpace < 300 * 1024 * 1024;
}

export async function discardTemporary(uri: string) {
  const file = new File(uri);
  if (file.exists) file.delete();
}

export async function keepPhotoBytes(bytes: Uint8Array, filename: string) {
  photos.create({ intermediates: true, idempotent: true });
  new File(photos, filename).write(bytes);
  return filename;
}

export async function photoUpload(photo: string) {
  const file = new File(photos, photo);
  return {
    name: photo,
    type: photo.endsWith(".png") ? "image/png" : "image/jpeg",
    bytes: async () => new Uint8Array(await file.arrayBuffer()),
  };
}

export async function installId() {
  const stored = await Storage.getItem("installId");
  if (stored) return stored;
  const id = randomUUID();
  await Storage.setItem("installId", id);
  return id;
}

export async function discardStudioModel() {
  const model = new Directory(
    Paths.document.parentDirectory,
    "Library",
    "Application Support",
    "studio-model",
  );
  if (model.exists) model.delete();
}

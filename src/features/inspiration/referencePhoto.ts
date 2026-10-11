import { Directory, File, Paths } from "expo-file-system";
import { randomUUID } from "expo-crypto";

export type ReferencePhoto = { uri: string; dispose(): void };

export function referencePhoto(uri: string): ReferencePhoto {
  if (!uri.startsWith("file://")) throw new Error("unreadable");
  const source = new File(uri);
  const folder = new Directory(Paths.cache, `inspiration-${randomUUID()}`);
  folder.create();
  try {
    const photo = new File(folder, `reference${source.extension || ".jpg"}`);
    source.copy(photo);
    return {
      uri: photo.uri,
      dispose: () => {
        if (folder.exists) folder.delete();
      },
    };
  } catch (error) {
    if (folder.exists) folder.delete();
    throw error;
  }
}

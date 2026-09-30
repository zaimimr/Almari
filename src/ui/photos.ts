import type { ImageSource } from "expo-image";
import { photoUri } from "../storage/local";

const samplePhotos: Record<string, number> = {
  "sample:mauve-hijab": require("../../assets/wardrobe/mauve-hijab.png"),
  "sample:ivory-hijab": require("../../assets/wardrobe/ivory-hijab.png"),
  "sample:chocolate-hijab": require("../../assets/wardrobe/chocolate-hijab.png"),
  "sample:ivory-tunic": require("../../assets/wardrobe/ivory-tunic.png"),
  "sample:sage-kurta": require("../../assets/wardrobe/sage-kurta.png"),
  "sample:navy-blazer": require("../../assets/wardrobe/navy-blazer.png"),
  "sample:taupe-abaya": require("../../assets/wardrobe/taupe-abaya.png"),
  "sample:ivory-trousers": require("../../assets/wardrobe/ivory-trousers.png"),
  "sample:charcoal-trousers": require("../../assets/wardrobe/charcoal-trousers.png"),
  "sample:ivory-salwar": require("../../assets/wardrobe/ivory-salwar.png"),
  "sample:chocolate-loafers": require("../../assets/wardrobe/chocolate-loafers.png"),
  "sample:taupe-bag": require("../../assets/wardrobe/taupe-bag.png"),
};

export function photoSource(photo: string): ImageSource | number {
  return samplePhotos[photo] ?? { uri: photoUri(photo) };
}

import { Share } from "react-native";
import ClosetVision from "../../modules/closet-vision/src";
import type { Closet } from "../domain/closet";
import { exportFolder } from "../storage/local";

export async function shareData(closet: Closet) {
  const folder = await exportFolder(JSON.stringify(closet, null, 2));
  const zip = await ClosetVision.zipFolder(folder);
  await Share.share({ url: zip });
}

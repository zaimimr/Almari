import ClosetVision from "../../modules/closet-vision/src";
import { photoUri } from "../storage/local";

export async function prepareStudioInput(
  source: string,
  id: string,
): Promise<string> {
  return ClosetVision.studioInput(photoUri(source), id);
}

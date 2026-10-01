import ClosetVision from "../../modules/closet-vision/src";
import {
  readCareLabelText,
  type LabelFields,
  type LabelModel,
} from "../domain/careLabel";

export const nativeLabelModel: LabelModel = {
  available: () => ClosetVision.labelModelAvailable(),
  extract: async (text) => (await ClosetVision.extractLabel(text)).json,
};

export async function readCareLabel(
  sourceUri: string,
  id: string,
): Promise<{ photo: string; fields: LabelFields }> {
  const { photo, lines } = await ClosetVision.readLabel(sourceUri, id);
  return {
    photo,
    fields: await readCareLabelText(lines.join("\n"), nativeLabelModel),
  };
}

import ClosetVision from "../../modules/closet-vision/src";
import {
  knownFibres,
  readCareLabelText,
  type LabelFields,
  type LabelModel,
} from "../domain/careLabel";
import { t, type Key } from "../i18n";

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

export function fibreLabel(fibre: string) {
  return knownFibres.includes(fibre) ? t(`fibre.${fibre}` as Key) : fibre;
}

export function labelLines(fields: LabelFields): string[] {
  return [
    fields.materials
      .map((material) =>
        material.percent === null
          ? fibreLabel(material.fibre)
          : `${material.percent}% ${fibreLabel(material.fibre)}`,
      )
      .join(", "),
    fields.size ? t("careLabel.lineSize", { size: fields.size }) : "",
    fields.brand ? t("careLabel.lineBrand", { brand: fields.brand }) : "",
    fields.origin ? t("careLabel.lineOrigin", { origin: fields.origin }) : "",
  ].filter(Boolean);
}

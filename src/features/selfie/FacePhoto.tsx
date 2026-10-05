import { Image, View } from "react-native";

export type FaceBox = [number, number, number, number];
export type PhotoSize = { width: number; height: number };

export function FacePhoto({
  uri,
  face,
  size,
  diameter,
  ring,
}: {
  uri: string;
  face: FaceBox | null;
  size: PhotoSize | null;
  diameter: number;
  ring: string;
}) {
  const crop = cropFor(face, size, diameter);
  return (
    <View
      accessibilityIgnoresInvertColors
      style={{
        width: diameter,
        height: diameter,
        borderRadius: diameter / 2,
        borderWidth: 3,
        borderColor: ring,
        overflow: "hidden",
      }}
    >
      <Image
        source={{ uri }}
        resizeMode="cover"
        style={crop ?? { width: "100%", height: "100%" }}
      />
    </View>
  );
}

const faceShare = 1.7;

function cropFor(
  face: FaceBox | null,
  size: PhotoSize | null,
  diameter: number,
) {
  if (!face || !size || size.width <= 0 || size.height <= 0) return null;
  const [x, y, w, h] = face;
  const span = Math.max(w * size.width, h * size.height) * faceShare;
  const scale = Math.max(
    diameter / span,
    diameter / Math.min(size.width, size.height),
  );
  const width = size.width * scale;
  const height = size.height * scale;
  const clamp = (value: number, length: number) =>
    Math.min(0, Math.max(diameter - length, value));
  return {
    position: "absolute" as const,
    width,
    height,
    left: clamp(diameter / 2 - (x + w / 2) * width, width),
    top: clamp(diameter / 2 - (y + h * 0.45) * height, height),
  };
}

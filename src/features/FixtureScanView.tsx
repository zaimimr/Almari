import {
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Image as NativeImage, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import type { LiveScanProps } from "../../modules/closet-vision/src";
import { keepPhotoAs } from "../storage/local";
import { fixtures, scanFixture } from "../testing/fixtures";

const assetUri = (asset: number) => NativeImage.resolveAssetSource(asset).uri;

export function FixtureScanView({
  style,
  active,
  frozen,
  fps,
  onFrame,
  onCamera,
  ref,
}: LiveScanProps) {
  const feed = scanFixture(fixtures.scan ?? "");
  const position = useRef(-1);
  const [shown, setShown] = useState(0);

  const ready = useEffectEvent(() =>
    onCamera({ nativeEvent: { state: feed ? "ready" : "unavailable" } }),
  );
  const tick = useEffectEvent(() => {
    if (!feed) return;
    position.current = Math.min(position.current + 1, feed.frames.length - 1);
    onFrame({
      nativeEvent: { ...feed.frames[position.current]!, at: Date.now() },
    });
    setShown(position.current);
  });

  useEffect(() => {
    if (active) ready();
  }, [active]);

  useEffect(() => {
    if (!feed || !active || frozen) return;
    const timer = setInterval(tick, 1000 / fps);
    return () => clearInterval(timer);
  }, [feed, active, frozen, fps]);

  useImperativeHandle(
    ref,
    () => ({
      async capture(id, box) {
        const frame = feed?.frames[Math.max(position.current, 0)];
        if (!feed || !frame) throw new Error("fixture");
        const photo = await keepPhotoAs(
          assetUri(feed.images[frame.image]!),
          id,
        );
        const sticker = await keepPhotoAs(
          assetUri(feed.cutouts[frame.cutout]!),
          `${id}-sticker`,
        );
        return {
          photo,
          region: null,
          sticker: { name: sticker, frame: box },
          box,
          milliseconds: {},
        };
      },
    }),
    [feed],
  );

  const frame = feed?.frames[shown];
  return (
    <View style={style}>
      {feed && frame ? (
        <Image
          source={feed.images[frame.image]}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </View>
  );
}

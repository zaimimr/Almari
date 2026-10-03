import {
  Accuracy,
  getCurrentPositionAsync,
  requestForegroundPermissionsAsync,
  reverseGeocodeAsync,
} from "expo-location";
import { getNetworkStateAsync } from "expo-network";
import { fixtures } from "../testing/fixtures";

export type Located = { name: string; latitude: number; longitude: number };

async function isOffline() {
  if (fixtures.offline) return true;
  try {
    return (await getNetworkStateAsync()).isConnected === false;
  } catch {
    return false;
  }
}

export async function locatePhone(): Promise<
  | { ok: true; place: Located }
  | { ok: false; reason: "denied" | "unavailable" | "offline" }
> {
  const { granted } = await requestForegroundPermissionsAsync();
  if (!granted) return { ok: false, reason: "denied" };
  try {
    if (fixtures.offline) throw new Error("fixture");
    const { coords } = await getCurrentPositionAsync({
      accuracy: Accuracy.Low,
    });
    const { latitude, longitude } = coords;
    const [address] = await reverseGeocodeAsync({ latitude, longitude });
    const name = address?.city ?? address?.subregion ?? address?.region;
    if (!name) return { ok: false, reason: "unavailable" };
    return { ok: true, place: { name, latitude, longitude } };
  } catch {
    return {
      ok: false,
      reason: (await isOffline()) ? "offline" : "unavailable",
    };
  }
}

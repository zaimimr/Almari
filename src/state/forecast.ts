import ClosetVision, {
  type ForecastResult,
} from "../../modules/closet-vision/src";
import { fixtures } from "../testing/fixtures";

export async function fetchForecast(
  latitude: number,
  longitude: number,
): Promise<ForecastResult | null> {
  if (fixtures.offline || fixtures.forecast === "fail")
    throw new Error("fixture");
  return fixtures.forecast ?? ClosetVision.forecast(latitude, longitude);
}

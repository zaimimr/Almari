import CoreLocation
import ExpoModulesCore
import Foundation
import MapKit
import WeatherKit

struct CityResult: Record {
  @Field var name: String = ""
  @Field var latitude: Double = 0
  @Field var longitude: Double = 0
}

struct ForecastHourRecord: Record {
  @Field var at: String = ""
  @Field var celsius: Double = 0
  @Field var precipitation: String = "none"
  @Field var chance: Double = 0
  @Field var windMs: Double = 0
}

struct AttributionRecord: Record {
  @Field var logo: String = ""
  @Field var url: String = ""
}

struct ForecastRecord: Record {
  @Field var hours: [ForecastHourRecord] = []
  @Field var attribution: AttributionRecord = AttributionRecord()
}

enum WeatherLookup {
  static func city(_ name: String) async -> CityResult? {
    let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty, let request = MKGeocodingRequest(addressString: trimmed) else { return nil }
    let items: [MKMapItem]? = await withCheckedContinuation { continuation in
      request.getMapItems { items, _ in continuation.resume(returning: items) }
    }
    guard let item = items?.first else { return nil }
    var result = CityResult()
    result.name = item.name ?? trimmed
    result.latitude = item.location.coordinate.latitude
    result.longitude = item.location.coordinate.longitude
    return result
  }

  static func forecast(latitude: Double, longitude: Double) async -> ForecastRecord? {
    let location = CLLocation(latitude: latitude, longitude: longitude)
    let start = Calendar.current.startOfDay(for: Date())
    guard let end = Calendar.current.date(byAdding: .day, value: 2, to: start) else { return nil }
    do {
      let hourly = try await WeatherService.shared.weather(
        for: location, including: .hourly(startDate: start, endDate: end))
      let attribution = try await WeatherService.shared.attribution
      let formatter = ISO8601DateFormatter()
      var result = ForecastRecord()
      result.hours = hourly.forecast.map { hour in
        var item = ForecastHourRecord()
        item.at = formatter.string(from: hour.date)
        item.celsius = hour.temperature.converted(to: .celsius).value
        item.precipitation = kind(hour.precipitation)
        item.chance = hour.precipitationChance
        item.windMs = hour.wind.speed.converted(to: .metersPerSecond).value
        return item
      }
      var mark = AttributionRecord()
      mark.logo = attribution.combinedMarkLightURL.absoluteString
      mark.url = attribution.legalPageURL.absoluteString
      result.attribution = mark
      return result
    } catch {
      return nil
    }
  }

  private static func kind(_ precipitation: Precipitation) -> String {
    switch precipitation {
    case .rain, .hail: return "rain"
    case .snow, .sleet, .mixed: return "snow"
    default: return "none"
    }
  }
}

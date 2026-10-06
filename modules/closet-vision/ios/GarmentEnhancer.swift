import CoreImage
import Foundation

struct GarmentBitmap {
  let width: Int
  let height: Int
  let data: [UInt8]

  func rgb(_ index: Int) -> (red: Double, green: Double, blue: Double, alpha: Double) {
    let alpha = Double(data[index * 4 + 3]) / 255
    guard alpha > 0 else { return (0, 0, 0, 0) }
    return (
      min(255, Double(data[index * 4]) / alpha),
      min(255, Double(data[index * 4 + 1]) / alpha),
      min(255, Double(data[index * 4 + 2]) / alpha),
      alpha
    )
  }

  func value(_ index: Int) -> Double { Double(data[index * 4]) / 255 }
}

struct GarmentEnhancer {
  struct Neutral {
    let red: Double
    let green: Double
    let blue: Double
    let lab: (l: Double, a: Double, b: Double)
  }

  let context: CIContext
  let sRGB = CGColorSpace(name: CGColorSpace.sRGB)!

  static func lab(red: Double, green: Double, blue: Double) -> (l: Double, a: Double, b: Double) {
    func linear(_ value: Double) -> Double {
      let c = value / 255
      return c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4)
    }
    func f(_ t: Double) -> Double { t > 0.008856 ? cbrt(t) : 7.787 * t + 16 / 116 }
    let r = linear(red)
    let g = linear(green)
    let bl = linear(blue)
    let x = (r * 0.4124 + g * 0.3576 + bl * 0.1805) / 0.95047
    let y = r * 0.2126 + g * 0.7152 + bl * 0.0722
    let z = (r * 0.0193 + g * 0.1192 + bl * 0.9505) / 1.08883
    return (116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z)))
  }

  func bitmap(_ image: CIImage, longEdge: CGFloat) -> GarmentBitmap {
    let origin = image.transformed(
      by: CGAffineTransform(translationX: -image.extent.minX, y: -image.extent.minY))
    let scale = min(1, longEdge / max(origin.extent.width, origin.extent.height))
    let small = origin.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
    let width = max(1, Int(small.extent.width.rounded(.down)))
    let height = max(1, Int(small.extent.height.rounded(.down)))
    var data = [UInt8](repeating: 0, count: width * height * 4)
    context.render(
      small, toBitmap: &data, rowBytes: width * 4,
      bounds: CGRect(x: 0, y: 0, width: width, height: height), format: .RGBA8, colorSpace: sRGB)
    return GarmentBitmap(width: width, height: height, data: data)
  }

  func neutralPixels(photo: CIImage, mask: CIImage) -> [Neutral] {
    let picture = bitmap(photo, longEdge: 256)
    let cover = bitmap(mask, longEdge: 256)
    guard picture.width == cover.width, picture.height == cover.height else { return [] }
    var result: [Neutral] = []
    for index in 0..<(picture.width * picture.height) where cover.value(index) < 0.1 {
      let pixel = picture.rgb(index)
      if pixel.alpha < 0.99 { continue }
      let lab = Self.lab(red: pixel.red, green: pixel.green, blue: pixel.blue)
      if lab.l > 30 && (lab.a * lab.a + lab.b * lab.b).squareRoot() < 12 {
        result.append(Neutral(red: pixel.red, green: pixel.green, blue: pixel.blue, lab: lab))
      }
    }
    return result
  }
}

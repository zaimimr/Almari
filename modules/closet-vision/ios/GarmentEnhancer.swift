import CoreImage
import Foundation

struct LightCorrection {
  var gains: [CGFloat] = [1, 1, 1]
  var exposure: CGFloat = 0
}

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
      if lab.l > 30 && (lab.a * lab.a + lab.b * lab.b).squareRoot() < 20 {
        result.append(Neutral(red: pixel.red, green: pixel.green, blue: pixel.blue, lab: lab))
      }
    }
    return result
  }

  func correction(photo: CIImage, mask: CIImage) -> LightCorrection {
    let neutral = neutralPixels(photo: photo, mask: mask)
    guard neutral.count >= 200 else { return LightCorrection() }
    let count = Double(neutral.count)
    let means = [
      neutral.reduce(0) { $0 + $1.red } / count,
      neutral.reduce(0) { $0 + $1.green } / count,
      neutral.reduce(0) { $0 + $1.blue } / count,
    ]
    let grey = means.reduce(0, +) / 3
    let lightness = neutral.reduce(0) { $0 + $1.lab.l } / count / 100
    return LightCorrection(
      gains: means.map { CGFloat(min(1.12, max(0.88, grey / max($0, 1)))) },
      exposure: lightness < 0.45 ? CGFloat(min(0.4, log2(0.45 / lightness))) : 0
    )
  }

  func enhance(_ garment: CIImage, correction: LightCorrection) -> CIImage {
    let balanced = garment.applyingFilter(
      "CIColorMatrix",
      parameters: [
        "inputRVector": CIVector(x: correction.gains[0], y: 0, z: 0, w: 0),
        "inputGVector": CIVector(x: 0, y: correction.gains[1], z: 0, w: 0),
        "inputBVector": CIVector(x: 0, y: 0, z: correction.gains[2], w: 0),
      ])
    let exposed =
      correction.exposure > 0
      ? balanced.applyingFilter("CIExposureAdjust", parameters: [kCIInputEVKey: correction.exposure])
      : balanced
    return
      exposed
      .applyingFilter(
        "CIHighlightShadowAdjust", parameters: ["inputShadowAmount": 0.25, "inputHighlightAmount": 1.0]
      )
      .applyingFilter("CIUnsharpMask", parameters: [kCIInputRadiusKey: 1.5, kCIInputIntensityKey: 0.35])
      .cropped(to: garment.extent)
  }

  func withShadow(_ image: CIImage) -> CIImage {
    let side = max(image.extent.width, image.extent.height)
    let shadow =
      image
      .applyingFilter(
        "CIColorMatrix",
        parameters: [
          "inputRVector": CIVector(x: 0, y: 0, z: 0, w: 0),
          "inputGVector": CIVector(x: 0, y: 0, z: 0, w: 0),
          "inputBVector": CIVector(x: 0, y: 0, z: 0, w: 0),
          "inputAVector": CIVector(x: 0, y: 0, z: 0, w: 0.2),
        ]
      )
      .applyingGaussianBlur(sigma: Double(side * 0.012))
      .transformed(by: CGAffineTransform(translationX: 0, y: -side * 0.01))
    return image.composited(over: shadow).cropped(to: image.extent)
  }

  func meanHue(_ image: CIImage) -> (hue: Double, chroma: Double)? {
    let picture = bitmap(image, longEdge: 256)
    var a = 0.0
    var b = 0.0
    var count = 0.0
    for index in 0..<(picture.width * picture.height) {
      let pixel = picture.rgb(index)
      if pixel.alpha < 0.9 { continue }
      let lab = Self.lab(red: pixel.red, green: pixel.green, blue: pixel.blue)
      a += lab.a
      b += lab.b
      count += 1
    }
    guard count > 0 else { return nil }
    let hue = atan2(b / count, a / count) * 180 / .pi
    return (hue < 0 ? hue + 360 : hue, (a * a + b * b).squareRoot() / count)
  }
}

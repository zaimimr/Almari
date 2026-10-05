import CoreImage
import ExpoModulesCore
import Foundation
import Vision

struct SelfiePoint: Record {
  @Field var part: String = "skin"
  @Field var x: Double = 0
  @Field var y: Double = 0
  @Field var radius: Double = 0
}

struct SelfieResult: Record {
  @Field var skin: [Double]? = nil
  @Field var hair: [Double]? = nil
  @Field var eyes: [Double]? = nil
  @Field var light: String = "ok"
  @Field var points: [SelfiePoint] = []
  @Field var face: [Double]? = nil
  @Field var gains: [Double] = [1, 1, 1]
  @Field var width: Double = 0
  @Field var height: Double = 0
}

private struct Colour {
  var r: Double
  var g: Double
  var b: Double

  var luma: Double { 0.2126 * r + 0.7152 * g + 0.0722 * b }

  var saturation: Double {
    let high = max(r, g, b)
    return high > 0 ? (high - min(r, g, b)) / high : 0
  }

  func balanced(_ gains: Colour) -> Colour {
    Colour(r: min(1, r * gains.r), g: min(1, g * gains.g), b: min(1, b * gains.b))
  }

  var lab: [Double] {
    func linear(_ value: Double) -> Double {
      value <= 0.04045 ? value / 12.92 : pow((value + 0.055) / 1.055, 2.4)
    }
    let (lr, lg, lb) = (linear(r), linear(g), linear(b))
    let x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047
    let y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722
    let z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883
    func f(_ t: Double) -> Double { t > 0.008856 ? cbrt(t) : 7.787 * t + 16 / 116 }
    return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))]
  }

  static func mean(_ colours: [Colour]) -> Colour? {
    guard !colours.isEmpty else { return nil }
    let count = Double(colours.count)
    return Colour(
      r: colours.reduce(0) { $0 + $1.r } / count,
      g: colours.reduce(0) { $0 + $1.g } / count,
      b: colours.reduce(0) { $0 + $1.b } / count)
  }

  static func trimmed(_ colours: [Colour], from low: Double, to high: Double) -> [Colour] {
    let sorted = colours.sorted { $0.luma < $1.luma }
    let start = Int(Double(sorted.count) * low)
    let end = Int(Double(sorted.count) * high)
    return start < end ? Array(sorted[start..<end]) : sorted
  }
}

private struct Bitmap {
  let width: Int
  let height: Int
  let pixels: [UInt8]
  let parse: ClothesParse?

  func colour(_ x: Int, _ y: Int) -> Colour {
    let index = (y * width + x) * 4
    return Colour(
      r: Double(pixels[index]) / 255, g: Double(pixels[index + 1]) / 255, b: Double(pixels[index + 2]) / 255)
  }

  func label(_ x: Int, _ y: Int) -> UInt8? {
    guard let parse else { return nil }
    let area = parse.area
    let px = CGFloat(x) + 0.5
    let py = CGFloat(height - y) - 0.5
    guard area.contains(CGPoint(x: px, y: py)) else { return 0 }
    let grid = parse.grid
    let gx = min(grid.width - 1, Int((px - area.minX) / area.width * CGFloat(grid.width)))
    let gy = min(grid.height - 1, Int((area.maxY - py) / area.height * CGFloat(grid.height)))
    return grid.labels[gy * grid.width + gx]
  }

  func disc(_ centre: CGPoint, radius: CGFloat, only wanted: UInt8? = nil) -> [Colour] {
    let r = max(1, Int(radius.rounded(.up)))
    let cx = Int(centre.x)
    let cy = Int(centre.y)
    var found: [Colour] = []
    for y in stride(from: max(0, cy - r), through: min(height - 1, cy + r), by: 1) {
      for x in stride(from: max(0, cx - r), through: min(width - 1, cx + r), by: 1) {
        let dx = x - cx
        let dy = y - cy
        guard dx * dx + dy * dy <= r * r else { continue }
        if let wanted, let label = label(x, y), label != wanted { continue }
        found.append(colour(x, y))
      }
    }
    return found
  }

  func every(_ wanted: UInt8) -> [Colour] {
    everyPoint(wanted).map { $0.colour }
  }

  func everyPoint(_ wanted: UInt8) -> [(colour: Colour, point: CGPoint)] {
    guard parse != nil else { return [] }
    var found: [(colour: Colour, point: CGPoint)] = []
    for y in stride(from: 0, to: height, by: 2) {
      for x in stride(from: 0, to: width, by: 2) where label(x, y) == wanted {
        found.append((colour(x, y), CGPoint(x: x, y: y)))
      }
    }
    return found
  }
}

private struct Eye {
  let outline: [CGPoint]
  let pupil: CGPoint

  var width: CGFloat { (outline.map(\.x).max() ?? 0) - (outline.map(\.x).min() ?? 0) }

  var centre: CGPoint {
    CGPoint(
      x: outline.map(\.x).reduce(0, +) / CGFloat(outline.count),
      y: outline.map(\.y).reduce(0, +) / CGFloat(outline.count))
  }

  var corners: [CGPoint] {
    [outline.min { $0.x < $1.x }, outline.max { $0.x < $1.x }].compactMap { $0 }
  }
}

final class SelfieColours {
  static let shared = SelfieColours()

  private let context = CIContext(options: [.workingColorSpace: CGColorSpace(name: CGColorSpace.sRGB)!])
  private let backgroundClass = UInt8(ClothesClass.background.rawValue)
  private let hairClass = UInt8(ClothesClass.hair.rawValue)
  private let faceClass = UInt8(ClothesClass.face.rawValue)
  private let lock = NSLock()
  private var cached: (uri: String, bitmap: Bitmap)?

  private static let trims: [String: (Double, Double)] = [
    "skin": (0.1, 0.9), "eyes": (0.2, 0.7), "hair": (0.05, 0.9),
  ]

  func sample(uri: String, part: String, x: Double, y: Double, radius: Double, gains: [Double]) throws -> [Double]? {
    lock.lock()
    let hit = cached?.uri == uri ? cached?.bitmap : nil
    lock.unlock()
    let bitmap = try hit ?? load(uri, parse: false).0
    if hit == nil {
      lock.lock()
      cached = (uri, bitmap)
      lock.unlock()
    }
    guard gains.count == 3, let trim = Self.trims[part] else { return nil }
    let balance = Colour(r: gains[0], g: gains[1], b: gains[2])
    let width = CGFloat(bitmap.width)
    let pixels = bitmap.disc(
      CGPoint(x: CGFloat(x) * width, y: CGFloat(y) * CGFloat(bitmap.height)), radius: CGFloat(radius) * width
    ).map { $0.balanced(balance) }
    return Colour.mean(Colour.trimmed(pixels, from: trim.0, to: trim.1))?.lab
  }

  func analyze(uri: String) throws -> SelfieResult {
    let (bitmap, cgImage) = try load(uri, parse: true)
    lock.lock()
    cached = (uri, bitmap)
    lock.unlock()
    let request = VNDetectFaceLandmarksRequest()
    #if targetEnvironment(simulator)
      if let devices = try? request.supportedComputeStageDevices {
        for (stage, options) in devices {
          if let cpu = options.first(where: { $0.description.localizedCaseInsensitiveContains("cpu") }) {
            request.setComputeDevice(cpu, for: stage)
          }
        }
      }
    #endif
    try VNImageRequestHandler(cgImage: cgImage).perform([request])
    guard
      let face = request.results?.max(by: {
        $0.boundingBox.width * $0.boundingBox.height < $1.boundingBox.width * $1.boundingBox.height
      }),
      let landmarks = face.landmarks,
      let leftEye = landmarks.leftEye, let rightEye = landmarks.rightEye,
      let leftPupil = landmarks.leftPupil, let rightPupil = landmarks.rightPupil
    else { return SelfieResult() }

    let size = CGSize(width: bitmap.width, height: bitmap.height)
    let flip = { (points: [CGPoint]) in points.map { CGPoint(x: $0.x, y: size.height - $0.y) } }
    let eyes = [(leftEye, leftPupil), (rightEye, rightPupil)].compactMap { pair -> Eye? in
      let outline = flip(pair.0.pointsInImage(imageSize: size))
      guard outline.count > 1, let pupil = flip(pair.1.pointsInImage(imageSize: size)).first else { return nil }
      return Eye(outline: outline, pupil: pupil)
    }
    guard eyes.count == 2 else { return SelfieResult() }
    let faceWidth = face.boundingBox.width * size.width
    let faceHeight = face.boundingBox.height * size.height

    var result = SelfieResult()
    result.face = [
      Double(face.boundingBox.minX), Double(1 - face.boundingBox.maxY), Double(face.boundingBox.width),
      Double(face.boundingBox.height),
    ]
    result.width = Double(size.width)
    result.height = Double(size.height)
    let rawCheeks = eyes.map { eye in
      bitmap.disc(
        CGPoint(x: eye.centre.x, y: eye.centre.y + 0.18 * faceHeight), radius: 0.06 * faceWidth, only: faceClass)
    }
    let allCheeks = rawCheeks.flatMap { $0 }
    guard !allCheeks.isEmpty, rawCheeks.allSatisfy({ !$0.isEmpty }) else { return result }
    if (Colour.mean(allCheeks)?.luma ?? 0) < 0.25 {
      result.light = "dark"
      return result
    }
    let clipped = Double(allCheeks.filter { max($0.r, $0.g, $0.b) >= 0.98 }.count) / Double(allCheeks.count)
    if clipped > 0.25 {
      result.light = "mixed"
      return result
    }

    let scleraPixels = eyes.flatMap { eye in
      eye.corners.flatMap { corner in
        bitmap.disc(
          CGPoint(
            x: eye.pupil.x + 0.6 * (corner.x - eye.pupil.x), y: eye.pupil.y + 0.6 * (corner.y - eye.pupil.y)),
          radius: max(1, 0.07 * eye.width))
      }
    }
    let sclera = Colour.mean(Colour.trimmed(scleraPixels, from: 0.5, to: 0.95))
    let neutralPixels = bitmap.every(backgroundClass).filter {
      $0.saturation < 0.12 && $0.luma > 0.3 && $0.luma < 0.95
    }
    let neutral = neutralPixels.count >= 500 ? Colour.mean(neutralPixels) : nil
    if let a = sclera, let b = neutral, a.g > 0, b.g > 0,
      abs(a.r / a.g - b.r / b.g) > 0.12 || abs(a.b / a.g - b.b / b.g) > 0.12
    {
      result.light = "mixed"
      return result
    }
    let references = [sclera, neutral].compactMap { $0 }
    let gains =
      Colour.mean(
        references.map { reference in
          let grey = (reference.r + reference.g + reference.b) / 3
          return Colour(r: grey / max(reference.r, 0.01), g: grey / max(reference.g, 0.01), b: grey / max(reference.b, 0.01))
        }) ?? Colour(r: 1, g: 1, b: 1)
    if [gains.r, gains.g, gains.b].contains(where: { $0 < 0.75 || $0 > 1.33 }) {
      result.light = "mixed"
      return result
    }
    let balance = { (colours: [Colour]) in colours.map { $0.balanced(gains) } }

    let cheeks = rawCheeks.map { Colour.trimmed(balance($0), from: 0.1, to: 0.9) }
    let cheekLabs = cheeks.compactMap { Colour.mean($0)?.lab }
    guard cheekLabs.count == 2 else { return result }
    if abs(cheekLabs[0][0] - cheekLabs[1][0]) > 15 {
      result.light = "mixed"
      return result
    }
    result.skin = Colour.mean(cheeks.flatMap { $0 })?.lab
    let irises = eyes.flatMap { eye in
      Colour.trimmed(balance(bitmap.disc(eye.pupil, radius: max(1, 0.22 * eye.width))), from: 0.2, to: 0.7)
    }
    result.eyes = Colour.mean(irises)?.lab
    let hair = bitmap.everyPoint(hairClass)
    var hairPoint = CGPoint(
      x: face.boundingBox.midX * size.width,
      y: max(0, (1 - face.boundingBox.maxY) * size.height - 0.08 * faceHeight))
    if bitmap.parse != nil, Double(hair.count) >= 0.03 * Double(faceWidth * faceHeight) / 4 {
      result.hair = Colour.mean(Colour.trimmed(balance(hair.map { $0.colour }), from: 0.05, to: 0.9))?.lab
      let centre = CGPoint(
        x: hair.map { $0.point.x }.reduce(0, +) / CGFloat(hair.count),
        y: hair.map { $0.point.y }.reduce(0, +) / CGFloat(hair.count))
      hairPoint =
        hair.min(by: {
          hypot($0.point.x - centre.x, $0.point.y - centre.y) < hypot($1.point.x - centre.x, $1.point.y - centre.y)
        })?.point ?? hairPoint
    }
    let point = { (part: String, at: CGPoint, radius: CGFloat) -> SelfiePoint in
      var item = SelfiePoint()
      item.part = part
      item.x = Double(at.x / size.width)
      item.y = Double(at.y / size.height)
      item.radius = Double(radius / size.width)
      return item
    }
    result.points = [
      point("skin", CGPoint(x: eyes[0].centre.x, y: eyes[0].centre.y + 0.18 * faceHeight), 0.06 * faceWidth),
      point("hair", hairPoint, 0.06 * faceWidth),
      point("eyes", eyes[0].pupil, max(1, 0.22 * eyes[0].width)),
    ]
    result.gains = [gains.r, gains.g, gains.b]
    return result
  }

  func palettePixels(uri: String) throws -> [[Double]] {
    let (bitmap, _) = try load(uri, parse: false)
    let step = max(1, max(bitmap.width, bitmap.height) / 72)
    let reach = 3
    let close = { (a: Colour, b: Colour) in
      abs(a.r - b.r) < 0.05 && abs(a.g - b.g) < 0.05 && abs(a.b - b.b) < 0.05
    }
    var colours: [Colour] = []
    for y in stride(from: reach, to: bitmap.height - reach, by: step) {
      for x in stride(from: reach, to: bitmap.width - reach, by: step) {
        let colour = bitmap.colour(x, y)
        let even = [(reach, 0), (-reach, 0), (0, reach), (0, -reach)].allSatisfy {
          close(colour, bitmap.colour(x + $0.0, y + $0.1))
        }
        if even { colours.append(colour) }
      }
    }
    let whites = colours.filter { $0.saturation < 0.15 }.sorted { $0.luma > $1.luma }
      .prefix(max(1, colours.count / 20))
    var gains = Colour(r: 1, g: 1, b: 1)
    if let white = Colour.mean(Array(whites)), white.luma > 0.5 {
      let grey = (white.r + white.g + white.b) / 3
      let gain = { (channel: Double) in min(1.25, max(0.8, grey / max(channel, 0.01))) }
      gains = Colour(r: gain(white.r), g: gain(white.g), b: gain(white.b))
    }
    return colours.map { $0.balanced(gains).lab }
  }

  private func load(_ uri: String, parse wantsParse: Bool) throws -> (Bitmap, CGImage) {
    let url = uri.hasPrefix("file://") ? URL(string: uri)! : URL(fileURLWithPath: uri)
    guard var image = CIImage(contentsOf: url, options: [.applyOrientationProperty: true]) else {
      throw PrepareError.unreadable
    }
    image = image.transformed(by: CGAffineTransform(translationX: -image.extent.minX, y: -image.extent.minY))
    let scale = min(1, 1024 / max(image.extent.width, image.extent.height))
    image = image.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
    let width = Int(image.extent.width.rounded(.down))
    let height = Int(image.extent.height.rounded(.down))
    let bounds = CGRect(x: 0, y: 0, width: width, height: height)
    guard width > 0, height > 0, let cgImage = context.createCGImage(image, from: bounds) else {
      throw PrepareError.unreadable
    }
    var pixels = [UInt8](repeating: 0, count: width * height * 4)
    context.render(
      image, toBitmap: &pixels, rowBytes: width * 4, bounds: bounds, format: .RGBA8,
      colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
    let parse = wantsParse ? GarmentPipeline.shared.parseSelfie(image) : nil
    return (Bitmap(width: width, height: height, pixels: pixels, parse: parse), cgImage)
  }
}

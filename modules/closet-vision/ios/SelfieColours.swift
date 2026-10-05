import CoreImage
import ExpoModulesCore
import Foundation

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
  @Field var paper: Bool = false
}

final class SelfieColours {
  static let shared = SelfieColours()

  private let hairClass = UInt8(ClothesClass.hair.rawValue)
  private let lock = NSLock()
  private var cached: (uri: String, bitmap: Bitmap)?

  private static let trims: [String: (Double, Double)] = [
    "skin": (0.2, 0.6), "eyes": (0.2, 0.7), "hair": (0.05, 0.9),
  ]

  func sample(uri: String, part: String, x: Double, y: Double, radius: Double, gains: [Double]) throws -> [Double]? {
    lock.lock()
    let hit = cached?.uri == uri ? cached?.bitmap : nil
    lock.unlock()
    let bitmap = try hit ?? load(uri).0
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

  func analyze(uri: String, paper: Bool = false) throws -> SelfieResult {
    let (bitmap, cgImage, image) = try load(uri)
    lock.lock()
    cached = (uri, bitmap)
    lock.unlock()
    guard let face = try FaceColours.landmarks(cgImage), let reading = FaceColours.read(bitmap, face: face, paper: paper) else {
      return SelfieResult()
    }
    let size = CGSize(width: bitmap.width, height: bitmap.height)
    var result = SelfieResult()
    result.face = [
      Double(reading.face.minX), Double(reading.face.minY), Double(reading.face.width), Double(reading.face.height),
    ]
    result.width = Double(size.width)
    result.height = Double(size.height)
    result.light = reading.light
    guard reading.light == "ok", let skin = reading.skin else { return result }
    result.skin = skin
    result.paper = reading.paper
    result.eyes = reading.eyes
    let gains = reading.gains
    let faceWidth = reading.face.width * size.width
    let faceHeight = reading.face.height * size.height
    let hair = GarmentPipeline.shared.parseSelfie(image).map { hairPoints(bitmap, parse: $0) } ?? []
    var hairPoint = CGPoint(x: reading.face.midX * size.width, y: max(0, reading.face.minY * size.height - 0.08 * faceHeight))
    if Double(hair.count) >= 0.03 * Double(faceWidth * faceHeight) / 4 {
      result.hair = Colour.mean(Colour.trimmed(hair.map { $0.colour.balanced(gains) }, from: 0.05, to: 0.9))?.lab
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
      point("skin", reading.cheek, reading.cheekRadius),
      point("hair", hairPoint, 0.06 * faceWidth),
      point("eyes", reading.pupil, reading.pupilRadius),
    ]
    result.gains = [gains.r, gains.g, gains.b]
    return result
  }

  private func hairPoints(_ bitmap: Bitmap, parse: ClothesParse) -> [(colour: Colour, point: CGPoint)] {
    let area = parse.area
    let grid = parse.grid
    var found: [(colour: Colour, point: CGPoint)] = []
    for y in stride(from: 0, to: bitmap.height, by: 2) {
      for x in stride(from: 0, to: bitmap.width, by: 2) {
        let px = CGFloat(x) + 0.5
        let py = CGFloat(bitmap.height - y) - 0.5
        guard area.contains(CGPoint(x: px, y: py)) else { continue }
        let gx = min(grid.width - 1, Int((px - area.minX) / area.width * CGFloat(grid.width)))
        let gy = min(grid.height - 1, Int((area.maxY - py) / area.height * CGFloat(grid.height)))
        if grid.labels[gy * grid.width + gx] == hairClass { found.append((bitmap.colour(x, y), CGPoint(x: x, y: y))) }
      }
    }
    return found
  }

  func palettePixels(uri: String) throws -> [[Double]] {
    let (bitmap, _, _) = try load(uri)
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

  private func load(_ uri: String) throws -> (Bitmap, CGImage, CIImage) {
    let url = uri.hasPrefix("file://") ? URL(string: uri)! : URL(fileURLWithPath: uri)
    guard let image = FaceColours.image(url), let (bitmap, cgImage) = FaceColours.bitmap(image) else {
      throw PrepareError.unreadable
    }
    return (bitmap, cgImage, image)
  }
}

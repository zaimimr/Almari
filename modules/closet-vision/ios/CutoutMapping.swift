import CoreGraphics
import Foundation

struct CutoutPixels {
  let width: Int
  let height: Int
  let rgb: [Float]
  let alpha: [UInt8]

  init?(_ image: CGImage, width: Int, height: Int) {
    guard width > 0, height > 0, let space = CGColorSpace(name: CGColorSpace.sRGB) else { return nil }
    var data = [UInt8](repeating: 0, count: width * height * 4)
    let drawn = data.withUnsafeMutableBytes { buffer -> Bool in
      guard
        let context = CGContext(
          data: buffer.baseAddress, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
          space: space, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
      else { return false }
      context.interpolationQuality = .high
      context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
      return true
    }
    guard drawn else { return nil }
    var rgb = [Float](repeating: 0, count: width * height * 3)
    var alpha = [UInt8](repeating: 0, count: width * height)
    for index in 0..<(width * height) {
      let a = data[index * 4 + 3]
      alpha[index] = a
      guard a > 0 else { continue }
      let share = 255 / Float(a)
      rgb[index * 3] = min(255, Float(data[index * 4]) * share)
      rgb[index * 3 + 1] = min(255, Float(data[index * 4 + 1]) * share)
      rgb[index * 3 + 2] = min(255, Float(data[index * 4 + 2]) * share)
    }
    self.width = width
    self.height = height
    self.rgb = rgb
    self.alpha = alpha
  }

  func alphaAt(_ x: Int, _ y: Int) -> UInt8 {
    guard x >= 0, y >= 0, x < width, y < height else { return 0 }
    return alpha[y * width + x]
  }

  @inline(__always)
  func distance(_ x: Float, _ y: Float, to value: SIMD3<Float>) -> Float {
    let fx = min(max(x, 0), Float(width - 1))
    let fy = min(max(y, 0), Float(height - 1))
    let x0 = min(Int(fx), width - 2 < 0 ? 0 : width - 2)
    let y0 = min(Int(fy), height - 2 < 0 ? 0 : height - 2)
    let x1 = min(x0 + 1, width - 1)
    let y1 = min(y0 + 1, height - 1)
    let tx = fx - Float(x0)
    let ty = fy - Float(y0)
    let a = (y0 * width + x0) * 3
    let b = (y0 * width + x1) * 3
    let c = (y1 * width + x0) * 3
    let d = (y1 * width + x1) * 3
    let top0 = rgb[a] + (rgb[b] - rgb[a]) * tx
    let top1 = rgb[a + 1] + (rgb[b + 1] - rgb[a + 1]) * tx
    let top2 = rgb[a + 2] + (rgb[b + 2] - rgb[a + 2]) * tx
    let low0 = rgb[c] + (rgb[d] - rgb[c]) * tx
    let low1 = rgb[c + 1] + (rgb[d + 1] - rgb[c + 1]) * tx
    let low2 = rgb[c + 2] + (rgb[d + 2] - rgb[c + 2]) * tx
    let r = top0 + (low0 - top0) * ty - value.x
    let g = top1 + (low1 - top1) * ty - value.y
    let bl = top2 + (low2 - top2) * ty - value.z
    return r * r + g * g + bl * bl
  }
}

struct CutoutPoint {
  let x: Float
  let y: Float
  let rgb: SIMD3<Float>
}

struct CutoutMatch {
  let origin: CGPoint
  let scale: CGFloat
  let error: Float
}

enum CutoutMapping {
  static func area(
    garmentOrigin: CGPoint, scale: CGFloat, side: CGFloat, offset: CGPoint, garment: CGSize, photo: CGSize
  ) -> CGRect {
    let left = garmentOrigin.x - offset.x / scale
    let top = garmentOrigin.y - (side - offset.y - garment.height) / scale
    let size = side / scale
    return CGRect(
      x: left / photo.width, y: top / photo.height, width: size / photo.width, height: size / photo.height)
  }

  static func area(of match: CutoutMatch, side: Int, photo: CGSize) -> CGRect {
    let size = CGFloat(side) / match.scale
    return CGRect(
      x: match.origin.x / photo.width, y: match.origin.y / photo.height, width: size / photo.width,
      height: size / photo.height)
  }

  static func record(_ rect: CGRect) -> [String: Double] {
    ["x": Double(rect.minX), "y": Double(rect.minY), "width": Double(rect.width), "height": Double(rect.height)]
  }

  static func rect(_ record: [String: Double]?) -> CGRect? {
    guard let record, let x = record["x"], let y = record["y"], let width = record["width"],
      let height = record["height"], width > 0, height > 0, x.isFinite, y.isFinite, width.isFinite, height.isFinite
    else { return nil }
    return CGRect(x: x, y: y, width: width, height: height)
  }

  static func alpha(of cutout: CGImage, area: CGRect, width: Int, height: Int) -> [UInt8]? {
    guard
      let drawing = CGContext(
        data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
        space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue),
      let data = drawing.data
    else { return nil }
    let size = CGSize(width: width, height: height)
    drawing.interpolationQuality = .high
    drawing.draw(
      cutout,
      in: CGRect(
        x: area.minX * size.width, y: (1 - area.maxY) * size.height, width: area.width * size.width,
        height: area.height * size.height))
    let bytes = data.assumingMemoryBound(to: UInt8.self)
    var alpha = [UInt8](repeating: 0, count: width * height)
    for index in 0..<(width * height) { alpha[index] = bytes[index * 4 + 3] }
    return alpha
  }

  static func bounds(_ alpha: [UInt8], width: Int, height: Int) -> CGRect? {
    var minX = width
    var minY = height
    var maxX = -1
    var maxY = -1
    for y in 0..<height {
      let row = y * width
      for x in 0..<width where alpha[row + x] > 12 {
        if x < minX { minX = x }
        if x > maxX { maxX = x }
        if y < minY { minY = y }
        if y > maxY { maxY = y }
      }
    }
    guard maxX - minX >= 8, maxY - minY >= 8 else { return nil }
    return CGRect(x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1)
  }

  static func scales(forCutoutSide side: Int, photo: CGSize) -> ClosedRange<CGFloat> {
    let longest = max(photo.width, photo.height)
    guard CGFloat(side) / 1.06 >= 1534, longest > 1536 else { return 1...1 }
    return (1536 / longest)...1
  }

  static func points(_ pixels: CutoutPixels, limit: Int, soft: Bool) -> [CutoutPoint] {
    var edge: [Int] = []
    var inner: [Int] = []
    for y in 0..<pixels.height {
      for x in 0..<pixels.width {
        let alpha = pixels.alphaAt(x, y)
        if soft, alpha >= 48, alpha < 250 {
          edge.append(y * pixels.width + x)
          continue
        }
        guard alpha >= 250, pixels.alphaAt(x - 1, y) >= 250, pixels.alphaAt(x + 1, y) >= 250,
          pixels.alphaAt(x, y - 1) >= 250, pixels.alphaAt(x, y + 1) >= 250
        else { continue }
        let near =
          pixels.alphaAt(x - 3, y) < 128 || pixels.alphaAt(x + 3, y) < 128 || pixels.alphaAt(x, y - 3) < 128
          || pixels.alphaAt(x, y + 3) < 128
        if near { edge.append(y * pixels.width + x) } else { inner.append(y * pixels.width + x) }
      }
    }
    func pick(_ list: [Int], _ count: Int) -> [Int] {
      guard list.count > count, count > 0 else { return list }
      let step = Double(list.count) / Double(count)
      return (0..<count).map { list[Int(Double($0) * step)] }
    }
    let edgeShare = min(edge.count, limit / 2)
    return (pick(edge, edgeShare) + pick(inner, limit - edgeShare)).map { index in
      CutoutPoint(
        x: Float(index % pixels.width) + 0.5, y: Float(index / pixels.width) + 0.5,
        rgb: SIMD3(pixels.rgb[index * 3], pixels.rgb[index * 3 + 1], pixels.rgb[index * 3 + 2]))
    }
  }

  static func score(
    _ points: [CutoutPoint], in photo: CutoutPixels, origin: CGPoint, step: Float, limit: Float
  ) -> Float {
    var total: Float = 0
    let ox = Float(origin.x) - 0.5
    let oy = Float(origin.y) - 0.5
    for point in points {
      total += photo.distance(ox + point.x * step, oy + point.y * step, to: point.rgb)
      if total > limit { return total }
    }
    return total
  }

  private struct Level {
    let photo: CutoutPixels
    let points: [CutoutPoint]
    let photoRatio: CGFloat
    let templateRatio: CGFloat

    init?(template: CGImage, photo: CGImage, factor: CGFloat, limit: Int, soft: Bool) {
      let width = max(1, Int((CGFloat(photo.width) * factor).rounded()))
      let height = max(1, Int((CGFloat(photo.height) * factor).rounded()))
      let templateWidth = max(1, Int((CGFloat(template.width) * factor).rounded()))
      let templateHeight = max(1, Int((CGFloat(template.height) * factor).rounded()))
      guard let pixels = CutoutPixels(photo, width: width, height: height),
        let cut = CutoutPixels(template, width: templateWidth, height: templateHeight)
      else { return nil }
      self.photo = pixels
      points = CutoutMapping.points(cut, limit: limit, soft: soft)
      photoRatio = CGFloat(width) / CGFloat(photo.width)
      templateRatio = CGFloat(templateWidth) / CGFloat(template.width)
    }

    func score(origin: CGPoint, scale: CGFloat, limit: Float) -> Float {
      CutoutMapping.score(
        points, in: photo, origin: CGPoint(x: origin.x * photoRatio, y: origin.y * photoRatio),
        step: Float(photoRatio / templateRatio / scale), limit: limit)
    }
  }

  private typealias Candidate = (score: Float, scale: CGFloat, origin: CGPoint)

  private static func distinct(_ list: [Candidate], count: Int, apart: CGFloat) -> [Candidate] {
    var chosen: [Candidate] = []
    for item in list.sorted(by: { $0.score < $1.score }) where chosen.count < count {
      if chosen.contains(where: {
        abs($0.origin.x - item.origin.x) < apart && abs($0.origin.y - item.origin.y) < apart
          && abs($0.scale / item.scale - 1) < 0.004
      }) { continue }
      chosen.append(item)
    }
    return chosen
  }

  private static func refine(
    _ list: [Candidate], level: Level, scales: ClosedRange<CGFloat>, ratio: CGFloat, reach: Int, spacing: CGFloat
  ) -> [Candidate] {
    var results: [Candidate] = []
    for item in list {
      let options =
        scales.lowerBound < scales.upperBound
        ? (-3...3).map { min(scales.upperBound, max(scales.lowerBound, item.scale * pow(ratio, CGFloat($0) / 3))) }
        : [item.scale]
      var best = Float.infinity
      var found = item
      for scale in options {
        for dy in -reach...reach {
          for dx in -reach...reach {
            let origin = CGPoint(
              x: item.origin.x + CGFloat(dx) * spacing, y: item.origin.y + CGFloat(dy) * spacing)
            let value = level.score(origin: origin, scale: scale, limit: best)
            if value < best {
              best = value
              found = (value, scale, origin)
            }
          }
        }
      }
      results.append(found)
    }
    return results.sorted { $0.score < $1.score }
  }

  static func locate(template: CGImage, photo: CGImage, scales: ClosedRange<CGFloat>) -> CutoutMatch? {
    let longest = CGFloat(max(photo.width, photo.height))
    let coarseFactor = min(1, 256 / longest)
    let middleFactor = min(1, 768 / longest)
    guard
      let coarse = Level(template: template, photo: photo, factor: coarseFactor, limit: 400, soft: false),
      let middle = Level(template: template, photo: photo, factor: middleFactor, limit: 1200, soft: false),
      let full = Level(template: template, photo: photo, factor: 1, limit: 3000, soft: true),
      coarse.points.count >= 24, full.points.count >= 100
    else { return nil }
    let xs = full.points.map(\.x)
    let ys = full.points.map(\.y)
    let minX = CGFloat(xs.min()!)
    let maxX = CGFloat(xs.max()!)
    let minY = CGFloat(ys.min()!)
    let maxY = CGFloat(ys.max()!)
    let garment = max(maxX - minX, maxY - minY)
    let coarseRatio = 1 + 1 / max(8, garment * coarseFactor)
    var candidates: [CGFloat] = [scales.upperBound]
    while let last = candidates.last, last / coarseRatio >= scales.lowerBound {
      candidates.append(last / coarseRatio)
    }
    if candidates.last! > scales.lowerBound { candidates.append(scales.lowerBound) }

    let width = CGFloat(photo.width)
    let height = CGFloat(photo.height)
    let pixel = 1 / coarse.photoRatio
    var found: [Candidate] = []
    for scale in candidates {
      let fromX = Int(((-minX / scale) / pixel - 2).rounded(.down))
      let toX = Int(((width - maxX / scale) / pixel + 2).rounded(.up))
      let fromY = Int(((-minY / scale) / pixel - 2).rounded(.down))
      let toY = Int(((height - maxY / scale) / pixel + 2).rounded(.up))
      guard fromX <= toX, fromY <= toY else { continue }
      var best = Float.infinity
      var at = CGPoint.zero
      for y in fromY...toY {
        for x in fromX...toX {
          let origin = CGPoint(x: CGFloat(x) * pixel, y: CGFloat(y) * pixel)
          let value = coarse.score(origin: origin, scale: scale, limit: best)
          if value < best {
            best = value
            at = origin
          }
        }
      }
      found.append((best, scale, at))
    }
    let shortlist = distinct(found, count: 8, apart: 3 * pixel)
    let middleRatio = 1 + 1 / max(8, garment * middleFactor)
    let middlePixel = 1 / middle.photoRatio
    let middleBest = distinct(
      refine(
        shortlist, level: middle, scales: scales, ratio: coarseRatio,
        reach: Int((1.5 * pixel / middlePixel).rounded(.up)), spacing: middlePixel),
      count: 3, apart: 2 * middlePixel)
    let fullBest = refine(
      middleBest, level: full, scales: scales, ratio: middleRatio,
      reach: Int((1.5 * middlePixel).rounded(.up)), spacing: 1)
    guard let first = fullBest.first else { return nil }
    let polished = refine(
      [first], level: full, scales: scales, ratio: 1 + 1.5 / garment, reach: 4, spacing: 0.25)[0]
    let error = (polished.score / Float(full.points.count * 3)).squareRoot()
    guard error <= 16 else { return nil }
    return CutoutMatch(origin: polished.origin, scale: polished.scale, error: error)
  }
}

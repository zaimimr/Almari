import Foundation

enum GarmentMaskRefinement {
  static let searchShare = 0.06
  static let sampleInsetShare = 0.02
  static let detailWidthShare = 0.005
  static let colourMargin = 0.7
  static let backgroundMatchGap = 3.0
  static let minShadowChroma = 10.0
  static let holeShare = 0.1

  static func refine(_ alpha: [UInt8], pixels: [UInt8], width: Int, height: Int, seed: Int? = nil) -> [UInt8] {
    let total = width * height
    guard width > 2, height > 2, alpha.count == total, pixels.count == total * 4 else { return alpha }
    let mask = alpha.map { $0 > 128 }
    let area = mask.filter { $0 }.count
    guard area > 0, area < total else { return alpha }
    let side = Double(min(width, height))
    let search = max(4, side * searchShare)
    let inset = max(1, side * sampleInsetShare)
    let toMask = CutoutRepair.distances(to: mask, width: width, height: height)
    let toOutside = CutoutRepair.distances(to: mask.map { !$0 }, width: width, height: height)
    let colours = (0..<total).map { index -> SIMD3<Double> in
      let lab = GarmentEnhancer.lab(
        red: Double(pixels[index * 4]), green: Double(pixels[index * 4 + 1]), blue: Double(pixels[index * 4 + 2]))
      return SIMD3(lab.l, lab.a, lab.b)
    }
    let inside = mask.indices.filter { toOutside[$0] > inset * inset }
    let outside = mask.indices.filter { toMask[$0] > inset * inset && toMask[$0] <= search * search }
    let foreground = palette(inside.isEmpty ? mask.indices.filter { mask[$0] } : inside, colours: colours)
    let background = palette(outside, colours: colours)
    let repaired = repairedHoles(mask, colours: colours, foreground: foreground, background: background, width: width, height: height)
    let additions = mask.indices.map { index in
      !mask[index] && toMask[index] <= search * search && !background.isEmpty
        && distance(colours[index], to: foreground) < distance(colours[index], to: background) * colourMargin
    }
    let detail = attachedDetails(additions, to: mask, width: width, height: height)
    let core = GarmentRegions.spread(repaired, width: width, height: height, radius: 1, value: false)
    let narrow = narrowParts(repaired, width: width, height: height)
    let darkest = foreground.map(\.x).min() ?? 0
    return mask.indices.map { index in
      let shadow = mask[index] && hypot(colours[index].y, colours[index].z) >= minShadowChroma && colours[index].x < darkest
        && distance(colours[index], to: foreground) < distance(colours[index], to: background) * colourMargin
      return core[index] || detail[index] || narrow[index] || shadow || (seed == index && mask[index]) ? 255 : 0
    }
  }

  static func attaching(_ candidate: [UInt8], to alpha: [UInt8], width: Int, height: Int) -> [UInt8] {
    guard candidate.count == alpha.count, alpha.count == width * height, width > 0, height > 0 else { return alpha }
    let mask = alpha.map { $0 > 128 }
    let distance = CutoutRepair.distances(to: mask, width: width, height: height)
    let search = pow(Double(min(width, height)) * searchShare, 2)
    let additions = candidate.indices.map { candidate[$0] > 128 && !mask[$0] && distance[$0] <= search }
    let detail = attachedDetails(additions, to: mask, width: width, height: height)
    return mask.indices.map { mask[$0] || detail[$0] ? 255 : 0 }
  }

  private static func repairedHoles(
    _ mask: [Bool], colours: [SIMD3<Double>], foreground: [SIMD3<Double>], background: [SIMD3<Double>],
    width: Int, height: Int
  ) -> [Bool] {
    guard !background.isEmpty else { return mask }
    let radius = max(2, Int((Double(max(width, height)) * CutoutRepair.radiusShare).rounded()))
    let grown = GarmentRegions.spread(mask, width: width, height: height, radius: radius, value: true)
    var closed = GarmentRegions.spread(grown, width: width, height: height, radius: radius, value: false)
    let area = mask.filter { $0 }.count
    CutoutRepair.fillHoles(&closed, width: width, height: height, largest: Int(Double(area) * holeShare))
    return mask.indices.map { index in
      let backgroundDistance = distance(colours[index], to: background)
      let fabric = backgroundDistance > backgroundMatchGap * backgroundMatchGap
        || distance(colours[index], to: foreground) < backgroundDistance * colourMargin
      return mask[index] || closed[index] && fabric
    }
  }

  private static func distance(_ colour: SIMD3<Double>, to palette: [SIMD3<Double>]) -> Double {
    palette.reduce(Double.infinity) { closest, reference in
      let gap = colour - reference
      return min(closest, (gap * gap).sum())
    }
  }

  private static func palette(_ indices: [Int], colours: [SIMD3<Double>]) -> [SIMD3<Double>] {
    guard !indices.isEmpty else { return [] }
    let step = max(1, indices.count / 10000)
    let samples = stride(from: 0, to: indices.count, by: step).map { colours[indices[$0]] }
      .sorted { $0.x < $1.x }
    let count = min(5, samples.count)
    var centres = (0..<count).map { samples[(2 * $0 + 1) * samples.count / (2 * count)] }
    var sizes = [Int](repeating: 0, count: count)
    for _ in 0..<20 {
      var sums = [SIMD3<Double>](repeating: .zero, count: count)
      sizes = [Int](repeating: 0, count: count)
      for sample in samples {
        let closest = centres.indices.min { first, second in
          let a = sample - centres[first]
          let b = sample - centres[second]
          return (a * a).sum() < (b * b).sum()
        }!
        sums[closest] += sample
        sizes[closest] += 1
      }
      centres = centres.indices.map { sizes[$0] > 0 ? sums[$0] / Double(sizes[$0]) : centres[$0] }
    }
    return centres.indices.filter { Double(sizes[$0]) >= Double(samples.count) * 0.1 }.map { centres[$0] }
  }

  private static func neighbours(_ index: Int, width: Int, total: Int) -> [Int] {
    let x = index % width
    let y = index / width
    return (max(0, y - 1)...min(total / width - 1, y + 1)).flatMap { row in
      (max(0, x - 1)...min(width - 1, x + 1)).compactMap { column in
        let next = row * width + column
        return next == index ? nil : next
      }
    }
  }

  private static func components(_ mask: [Bool], width: Int) -> [[Int]] {
    var seen = mask.map { !$0 }
    var parts: [[Int]] = []
    for start in mask.indices where !seen[start] {
      var stack = [start]
      var part: [Int] = []
      seen[start] = true
      while let index = stack.popLast() {
        part.append(index)
        for next in neighbours(index, width: width, total: mask.count) where !seen[next] {
          seen[next] = true
          stack.append(next)
        }
      }
      parts.append(part)
    }
    return parts
  }

  private static func attachedDetails(_ additions: [Bool], to mask: [Bool], width: Int, height: Int) -> [Bool] {
    let thickness = CutoutRepair.distances(to: additions.map { !$0 }, width: width, height: height)
    let radius = max(2, Double(min(width, height)) * detailWidthShare)
    var result = [Bool](repeating: false, count: mask.count)
    let broad = additions.indices.map { additions[$0] && thickness[$0] > radius * radius }
    let wide = GarmentRegions.spread(broad, width: width, height: height, radius: Int(radius), value: true)
    let thin = additions.indices.map { additions[$0] && !wide[$0] }
    let reach = min(3, Int(radius.rounded(.up))) * 2
    let nearby = GarmentRegions.spread(mask, width: width, height: height, radius: reach, value: true)
    for part in components(thin, width: width) {
      let xs = part.map { $0 % width }
      let ys = part.map { $0 / width }
      let span = max(xs.max()! - xs.min()! + 1, ys.max()! - ys.min()! + 1)
      guard Double(part.count) <= Double(span) * radius * 2, part.contains(where: { nearby[$0] })
      else { continue }
      for index in part { result[index] = true }
    }
    return result
  }

  private static func narrowParts(_ mask: [Bool], width: Int, height: Int) -> [Bool] {
    let radius = max(2, Int((Double(min(width, height)) * detailWidthShare).rounded()))
    let eroded = GarmentRegions.spread(mask, width: width, height: height, radius: radius, value: false)
    let opened = GarmentRegions.spread(eroded, width: width, height: height, radius: radius, value: true)
    var result = [Bool](repeating: false, count: mask.count)
    for part in components(mask.indices.map { mask[$0] && !opened[$0] }, width: width) {
      let xs = part.map { $0 % width }
      let ys = part.map { $0 / width }
      let span = max(xs.max()! - xs.min()! + 1, ys.max()! - ys.min()! + 1)
      guard span >= radius * 4 else { continue }
      for index in part { result[index] = true }
    }
    return result
  }
}

import Foundation

enum ClothesClass: Int, CaseIterable {
  case background, hat, hair, sunglasses, upper, skirt, pants, dress, belt, leftShoe, rightShoe, face
  case leftLeg, rightLeg, leftArm, rightArm, bag, scarf

  var garment: String? {
    switch self {
    case .hat, .scarf: return "head"
    case .upper: return "upper"
    case .skirt: return "skirt"
    case .pants: return "pants"
    case .dress: return "dress"
    case .belt: return "belt"
    case .leftShoe, .rightShoe: return "shoes"
    case .bag: return "bag"
    case .sunglasses: return "sunglasses"
    case .background, .hair, .face, .leftLeg, .rightLeg, .leftArm, .rightArm: return nil
    }
  }
}

let garmentOrder = ["head", "upper", "dress", "skirt", "pants", "belt", "shoes", "bag", "sunglasses"]

struct LabelGrid {
  let width: Int
  let height: Int
  var labels: [UInt8]
}

struct FoundRegion {
  let kind: String
  let pixels: [Int]
  let minX: Int
  let minY: Int
  let maxX: Int
  let maxY: Int
  let share: Double
  let partial: Bool
}

enum GarmentRegions {
  static let minComponentShare = 0.002
  static let minRegionShare = 0.01
  static let coveredPartial = 0.35
  static let covering: Set<String> = ["upper", "dress", "skirt", "pants"]
  static let similarSize = 0.75
  static let heldGap = 4
  static let clothing: Set<UInt8> = Set(
    [ClothesClass.upper, .skirt, .pants, .dress, .scarf, .bag].map { UInt8($0.rawValue) })

  static let colourGap = 18.0
  static let colourKept = 0.85

  static func held(_ grid: LabelGrid, chroma: [SIMD2<Double>]? = nil) -> FoundRegion? {
    guard var found = largest(grid, kind: "held", wanted: clothing) else { return nil }
    if let chroma, chroma.count == grid.labels.count, let even = consistent(found, grid: grid, chroma: chroma) {
      found = even
    }
    let region = solid(found, width: grid.width, height: grid.height, gap: heldGap)
    return region.share >= minRegionShare ? region : nil
  }

  static func consistent(_ region: FoundRegion, grid: LabelGrid, chroma: [SIMD2<Double>]) -> FoundRegion? {
    let a = region.pixels.map { chroma[$0].x }.sorted()
    let b = region.pixels.map { chroma[$0].y }.sorted()
    guard !a.isEmpty else { return nil }
    let reference = SIMD2(a[a.count / 2], b[b.count / 2])
    var labels = [UInt8](repeating: 0, count: grid.labels.count)
    for index in region.pixels {
      let gap = chroma[index] - reference
      if (gap * gap).sum() < colourGap * colourGap { labels[index] = 1 }
    }
    guard
      let kept = largest(
        LabelGrid(width: grid.width, height: grid.height, labels: labels), kind: region.kind, wanted: [1]),
      Double(kept.pixels.count) >= Double(region.pixels.count) * colourKept
    else { return nil }
    return kept
  }

  static func largest(_ grid: LabelGrid, kind: String, wanted: Set<UInt8>) -> FoundRegion? {
    let width = grid.width
    let height = grid.height
    let total = grid.labels.count
    var seen = [Bool](repeating: false, count: total)
    var parts: [(pixels: [Int], distance: Double)] = []
    for start in 0..<total where !seen[start] && wanted.contains(grid.labels[start]) {
      var stack = [start]
      var pixels: [Int] = []
      var sumX = 0
      var sumY = 0
      seen[start] = true
      while let index = stack.popLast() {
        pixels.append(index)
        let x = index % width
        sumX += x
        sumY += index / width
        for next in [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1, index - width, index + width]
        where next >= 0 && next < total && !seen[next] && wanted.contains(grid.labels[next]) {
          seen[next] = true
          stack.append(next)
        }
      }
      let count = Double(pixels.count)
      let dx = (Double(sumX) / count + 0.5) / Double(width) - 0.5
      let dy = (Double(sumY) / count + 0.5) / Double(height) - 0.5
      parts.append((pixels, (dx * dx + dy * dy).squareRoot()))
    }
    guard let size = parts.map(\.pixels.count).max(),
      let best = parts.filter({ Double($0.pixels.count) >= Double(size) * similarSize })
        .min(by: { $0.distance < $1.distance })?.pixels
    else { return nil }
    return bounded(kind: kind, pixels: best, width: width, total: total)
  }

  static func solid(_ region: FoundRegion, width: Int, height: Int, gap: Int) -> FoundRegion {
    let total = width * height
    var member = [Bool](repeating: false, count: total)
    for index in region.pixels { member[index] = true }
    member = spread(member, width: width, height: height, radius: gap, value: true)
    member = spread(member, width: width, height: height, radius: gap, value: false)
    var outside = [Bool](repeating: false, count: total)
    var stack: [Int] = []
    for index in 0..<total where !member[index] {
      let x = index % width
      let y = index / width
      if x == 0 || y == 0 || x == width - 1 || y == height - 1 {
        outside[index] = true
        stack.append(index)
      }
    }
    while let index = stack.popLast() {
      let x = index % width
      for next in [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1, index - width, index + width]
      where next >= 0 && next < total && !member[next] && !outside[next] {
        outside[next] = true
        stack.append(next)
      }
    }
    let pixels = (0..<total).filter { !outside[$0] }
    return bounded(kind: region.kind, pixels: pixels, width: width, total: total)
  }

  private static func spread(_ mask: [Bool], width: Int, height: Int, radius: Int, value: Bool) -> [Bool] {
    var rows = mask
    for y in 0..<height {
      for x in 0..<width where mask[y * width + x] == value {
        for nx in max(0, x - radius)...min(width - 1, x + radius) { rows[y * width + nx] = value }
      }
    }
    var result = rows
    for y in 0..<height {
      for x in 0..<width where rows[y * width + x] == value {
        for ny in max(0, y - radius)...min(height - 1, y + radius) { result[ny * width + x] = value }
      }
    }
    return result
  }

  private static func bounded(kind: String, pixels: [Int], width: Int, total: Int) -> FoundRegion {
    var minX = width
    var minY = total
    var maxX = -1
    var maxY = -1
    for index in pixels {
      minX = min(minX, index % width)
      maxX = max(maxX, index % width)
      minY = min(minY, index / width)
      maxY = max(maxY, index / width)
    }
    return FoundRegion(
      kind: kind, pixels: pixels, minX: minX, minY: minY, maxX: maxX, maxY: maxY,
      share: Double(pixels.count) / Double(total), partial: false)
  }

  static func find(_ grid: LabelGrid, person: Bool) -> [FoundRegion] {
    let width = grid.width
    let height = grid.height
    let total = width * height
    var kinds = [Int](repeating: -1, count: total)
    for index in 0..<total {
      if let garment = ClothesClass(rawValue: Int(grid.labels[index]))?.garment,
        let kind = garmentOrder.firstIndex(of: garment)
      {
        kinds[index] = kind
      }
    }

    func neighbours(_ index: Int) -> [Int?] {
      let x = index % width
      let y = index / width
      return [
        x > 0 ? index - 1 : nil,
        x < width - 1 ? index + 1 : nil,
        y > 0 ? index - width : nil,
        y < height - 1 ? index + width : nil,
      ]
    }

    var seen = [Bool](repeating: false, count: total)
    var parts: [(kind: Int, pixels: [Int])] = []
    for start in 0..<total where kinds[start] >= 0 && !seen[start] {
      let first = kinds[start]
      var stack = [start]
      var pixels: [Int] = []
      var tally = [Int](repeating: 0, count: garmentOrder.count)
      seen[start] = true
      while let index = stack.popLast() {
        pixels.append(index)
        tally[kinds[index]] += 1
        for case let next? in neighbours(index) where !seen[next] && (person ? kinds[next] == first : kinds[next] >= 0) {
          seen[next] = true
          stack.append(next)
        }
      }
      if Double(pixels.count) / Double(total) >= minComponentShare {
        let kind = tally.indices.max { tally[$0] == tally[$1] ? $0 > $1 : tally[$0] < tally[$1] } ?? first
        parts.append((kind, pixels))
      }
    }

    var groups: [(kind: Int, pixels: [Int])] = []
    for part in parts {
      let merge = person || garmentOrder[part.kind] == "shoes"
      if merge, let index = groups.firstIndex(where: { $0.kind == part.kind }) {
        groups[index].pixels += part.pixels
      } else {
        groups.append(part)
      }
    }

    let regions: [FoundRegion] = groups.compactMap { group in
      let share = Double(group.pixels.count) / Double(total)
      guard share >= minRegionShare else { return nil }
      let kind = garmentOrder[group.kind]
      var member = [Bool](repeating: false, count: total)
      for index in group.pixels { member[index] = true }
      var minX = width
      var minY = height
      var maxX = -1
      var maxY = -1
      var boundary = 0
      var covered = 0
      for index in group.pixels {
        minX = min(minX, index % width)
        maxX = max(maxX, index % width)
        minY = min(minY, index / width)
        maxY = max(maxY, index / width)
        var onEdge = false
        var hidden = false
        for next in neighbours(index) {
          guard let next else {
            onEdge = true
            continue
          }
          if member[next] { continue }
          onEdge = true
          let other = kinds[next]
          if other >= 0 && other != group.kind && covering.contains(garmentOrder[other]) { hidden = true }
        }
        if onEdge { boundary += 1 }
        if hidden { covered += 1 }
      }
      let cut = minX == 0 || minY == 0 || maxX == width - 1 || maxY == height - 1
      let hiddenShare = boundary > 0 ? Double(covered) / Double(boundary) : 0
      let partial = cut || (covering.contains(kind) && hiddenShare > coveredPartial)
      return FoundRegion(
        kind: kind, pixels: group.pixels, minX: minX, minY: minY, maxX: maxX, maxY: maxY,
        share: share, partial: partial)
    }

    return regions.sorted { first, second in
      let a = garmentOrder.firstIndex(of: first.kind)!
      let b = garmentOrder.firstIndex(of: second.kind)!
      return a == b ? first.share > second.share : a < b
    }
  }
}

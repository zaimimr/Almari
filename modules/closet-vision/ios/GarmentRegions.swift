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
      let kind = kinds[start]
      var stack = [start]
      var pixels: [Int] = []
      seen[start] = true
      while let index = stack.popLast() {
        pixels.append(index)
        for case let next? in neighbours(index) where !seen[next] && kinds[next] == kind {
          seen[next] = true
          stack.append(next)
        }
      }
      if Double(pixels.count) / Double(total) >= minComponentShare {
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

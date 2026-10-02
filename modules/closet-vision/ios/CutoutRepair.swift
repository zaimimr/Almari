import CoreGraphics
import CoreImage
import Foundation

enum CutoutRepair {
  static let radiusShare = 0.015
  static let holeShare = 0.02
  static let solid: UInt8 = 128

  static func repaired(_ image: CIImage, context: CIContext) -> CIImage {
    let width = Int(image.extent.width.rounded(.down))
    let height = Int(image.extent.height.rounded(.down))
    guard width > 8, height > 8, let space = CGColorSpace(name: CGColorSpace.sRGB) else { return image }
    var pixels = [UInt8](repeating: 0, count: width * height * 4)
    context.render(
      image, toBitmap: &pixels, rowBytes: width * 4,
      bounds: CGRect(x: image.extent.minX, y: image.extent.minY, width: CGFloat(width), height: CGFloat(height)),
      format: .RGBA8, colorSpace: space)
    guard repair(&pixels, width: width, height: height) else { return image }
    return CIImage(
      bitmapData: Data(pixels), bytesPerRow: width * 4, size: CGSize(width: width, height: height),
      format: .RGBA8, colorSpace: space)
  }

  static func repair(_ pixels: inout [UInt8], width: Int, height: Int) -> Bool {
    let count = width * height
    let garment = (0..<count).map { pixels[$0 * 4 + 3] >= solid }
    let area = garment.reduce(0) { $0 + ($1 ? 1 : 0) }
    guard area > 0, area < count else { return false }
    let radius = Double(max(width, height)) * radiusShare
    let limit = radius * radius
    let grown = distances(to: garment, width: width, height: height).map { $0 <= limit }
    let outside = grown.map { !$0 }
    let closed = distances(to: outside, width: width, height: height).map { $0 > limit }
    var filled = zip(garment, closed).map { $0 || $1 }
    fillHoles(&filled, width: width, height: height, largest: Int(Double(area) * holeShare))
    let restored = (0..<count).filter { filled[$0] && !garment[$0] }
    guard !restored.isEmpty else { return false }
    inpaint(&pixels, known: garment, missing: restored, width: width, height: height)
    return true
  }

  static func distances(to target: [Bool], width: Int, height: Int) -> [Double] {
    let far = Double(width * width + height * height)
    var grid = target.map { $0 ? 0 : far }
    var line = [Double](repeating: 0, count: max(width, height))
    for x in 0..<width {
      for y in 0..<height { line[y] = grid[y * width + x] }
      let column = transform(Array(line[0..<height]))
      for y in 0..<height { grid[y * width + x] = column[y] }
    }
    for y in 0..<height {
      let row = transform(Array(grid[(y * width)..<(y * width + width)]))
      for x in 0..<width { grid[y * width + x] = row[x] }
    }
    return grid
  }

  static func transform(_ values: [Double]) -> [Double] {
    let n = values.count
    var result = [Double](repeating: 0, count: n)
    var vertices = [Int](repeating: 0, count: n)
    var bounds = [Double](repeating: 0, count: n + 1)
    var k = 0
    bounds[0] = -.infinity
    bounds[1] = .infinity
    for q in 1..<max(n, 1) {
      var s: Double
      repeat {
        let p = vertices[k]
        s = ((values[q] + Double(q * q)) - (values[p] + Double(p * p))) / Double(2 * q - 2 * p)
        if s <= bounds[k] { k -= 1 } else { break }
      } while k >= 0
      k += 1
      vertices[k] = q
      bounds[k] = s
      bounds[k + 1] = .infinity
    }
    k = 0
    for q in 0..<n {
      while bounds[k + 1] < Double(q) { k += 1 }
      let gap = Double(q - vertices[k])
      result[q] = gap * gap + values[vertices[k]]
    }
    return result
  }

  static func fillHoles(_ mask: inout [Bool], width: Int, height: Int, largest: Int) {
    var seen = mask
    var stack: [Int] = []
    func spread(from start: Int) -> [Int] {
      var region: [Int] = []
      seen[start] = true
      stack.append(start)
      while let index = stack.popLast() {
        region.append(index)
        let x = index % width
        let y = index / width
        for (dx, dy) in [(1, 0), (-1, 0), (0, 1), (0, -1)] {
          let nx = x + dx
          let ny = y + dy
          guard nx >= 0, ny >= 0, nx < width, ny < height else { continue }
          let next = ny * width + nx
          if !seen[next] {
            seen[next] = true
            stack.append(next)
          }
        }
      }
      return region
    }
    for x in 0..<width {
      for y in [0, height - 1] where !seen[y * width + x] { _ = spread(from: y * width + x) }
    }
    for y in 0..<height {
      for x in [0, width - 1] where !seen[y * width + x] { _ = spread(from: y * width + x) }
    }
    for index in 0..<(width * height) where !seen[index] {
      let hole = spread(from: index)
      if hole.count <= largest { for pixel in hole { mask[pixel] = true } }
    }
  }

  static func inpaint(_ pixels: inout [UInt8], known: [Bool], missing: [Int], width: Int, height: Int) {
    let count = width * height
    var colour = [SIMD3<Float>](repeating: .zero, count: count)
    var ready = known
    for index in 0..<count where known[index] {
      let alpha = Float(pixels[index * 4 + 3])
      colour[index] =
        SIMD3(Float(pixels[index * 4]), Float(pixels[index * 4 + 1]), Float(pixels[index * 4 + 2])) * 255 / alpha
    }
    func neighbours(_ index: Int) -> [Int] {
      let x = index % width
      let y = index / width
      var result: [Int] = []
      for dy in -1...1 {
        for dx in -1...1 where dx != 0 || dy != 0 {
          let nx = x + dx
          let ny = y + dy
          if nx >= 0, ny >= 0, nx < width, ny < height { result.append(ny * width + nx) }
        }
      }
      return result
    }
    var waiting = missing
    while !waiting.isEmpty {
      var layer: [(Int, SIMD3<Float>)] = []
      var later: [Int] = []
      for index in waiting {
        let around = neighbours(index).filter { ready[$0] }
        if around.isEmpty {
          later.append(index)
        } else {
          layer.append((index, around.reduce(SIMD3<Float>.zero) { $0 + colour[$1] } / Float(around.count)))
        }
      }
      if layer.isEmpty { break }
      for (index, value) in layer {
        colour[index] = value
        ready[index] = true
      }
      waiting = later
    }
    for _ in 0..<3 {
      let previous = colour
      for index in missing where ready[index] {
        let around = neighbours(index).filter { ready[$0] } + [index]
        colour[index] = around.reduce(SIMD3<Float>.zero) { $0 + previous[$1] } / Float(around.count)
      }
    }
    for index in missing where ready[index] {
      let value = colour[index].clamped(lowerBound: .zero, upperBound: SIMD3(repeating: 255))
      pixels[index * 4] = UInt8(value.x.rounded())
      pixels[index * 4 + 1] = UInt8(value.y.rounded())
      pixels[index * 4 + 2] = UInt8(value.z.rounded())
      pixels[index * 4 + 3] = 255
    }
  }
}

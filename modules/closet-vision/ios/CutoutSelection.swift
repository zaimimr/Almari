import CoreGraphics
import CoreImage
import Vision

final class CutoutSelector {
  static let body: Set<UInt8> = Set(
    [ClothesClass.hair, .face, .leftArm, .rightArm, .leftLeg, .rightLeg].map { UInt8($0.rawValue) })

  private struct Instances {
    let handler: VNImageRequestHandler
    let observation: VNInstanceMaskObservation
    let labels: [UInt8]
    let width: Int
    let height: Int

    func label(at point: CGPoint) -> Int {
      let x = min(width - 1, max(0, Int(point.x * CGFloat(width))))
      let y = min(height - 1, max(0, Int(point.y * CGFloat(height))))
      return Int(labels[y * width + x])
    }
  }

  private let photo: CIImage
  private let picture: CGImage
  private var instances: Instances??
  private var held: (parse: ClothesParse, chroma: [SIMD2<Double>])??

  init(photo: CIImage, picture: CGImage) {
    self.photo = photo
    self.picture = picture
  }

  func select(at point: CGPoint) -> [UInt8]? {
    if let found = foreground(), case let label = found.label(at: point), label > 0, !person(label, in: found),
      let buffer = try? found.observation.generateScaledMaskForImage(
        forInstances: IndexSet(integer: label), from: found.handler),
      let alpha = Self.alpha(buffer, width: picture.width, height: picture.height)
    {
      return alpha
    }
    return garment(at: point)
  }

  func garmentBox(at point: CGPoint) -> CGRect? {
    if let found = foreground(), case let label = found.label(at: point), label > 0, !person(label, in: found),
      let box = Self.box(of: label, in: found)
    {
      return box
    }
    guard let parse = parsed()?.parse else { return nil }
    let grid = parse.grid
    let area = parse.area
    let extent = parse.extent
    let x = Int((point.x * extent.width - area.minX) / area.width * CGFloat(grid.width))
    let y = Int((point.y * extent.height - (extent.height - area.maxY)) / area.height * CGFloat(grid.height))
    let reach = max(2, grid.width / 40)
    var kind: String?
    var nearest = Int.max
    for row in max(0, y - reach)...min(grid.height - 1, max(0, y + reach)) {
      for column in max(0, x - reach)...min(grid.width - 1, max(0, x + reach)) {
        guard let found = ClothesClass(rawValue: Int(grid.labels[row * grid.width + column]))?.garment else { continue }
        let distance = (column - x) * (column - x) + (row - y) * (row - y)
        if distance < nearest {
          nearest = distance
          kind = found
        }
      }
    }
    guard let kind else { return nil }
    var minX = grid.width
    var minY = grid.height
    var maxX = -1
    var maxY = -1
    for row in 0..<grid.height {
      for column in 0..<grid.width
      where ClothesClass(rawValue: Int(grid.labels[row * grid.width + column]))?.garment == kind {
        minX = min(minX, column)
        maxX = max(maxX, column)
        minY = min(minY, row)
        maxY = max(maxY, row)
      }
    }
    guard maxX >= minX else { return nil }
    let start = normalized(parse, x: minX, y: minY)
    let end = normalized(parse, x: maxX, y: maxY)
    let cellWidth = area.width / CGFloat(grid.width) / extent.width
    let cellHeight = area.height / CGFloat(grid.height) / extent.height
    return CGRect(
      x: start.x - cellWidth / 2, y: start.y - cellHeight / 2, width: end.x - start.x + cellWidth,
      height: end.y - start.y + cellHeight)
  }

  private static let lone = 0.5

  private static func box(of label: Int, in found: Instances) -> CGRect? {
    var minX = found.width
    var minY = found.height
    var maxX = -1
    var maxY = -1
    var size = 0
    for y in 0..<found.height {
      for x in 0..<found.width where Int(found.labels[y * found.width + x]) == label {
        size += 1
        minX = min(minX, x)
        maxX = max(maxX, x)
        minY = min(minY, y)
        maxY = max(maxY, y)
      }
    }
    guard maxX >= minX, Double(size) < Self.lone * Double(found.width * found.height) else { return nil }
    let width = CGFloat(found.width)
    let height = CGFloat(found.height)
    return CGRect(
      x: CGFloat(minX) / width, y: CGFloat(minY) / height, width: CGFloat(maxX - minX + 1) / width,
      height: CGFloat(maxY - minY + 1) / height)
  }

  private func foreground() -> Instances? {
    if let instances { return instances }
    let request = GarmentPipeline.foregroundRequest()
    let handler = VNImageRequestHandler(cgImage: picture)
    var found: Instances?
    if (try? handler.perform([request])) != nil, let observation = request.results?.first,
      !observation.allInstances.isEmpty
    {
      let buffer = observation.instanceMask
      CVPixelBufferLockBaseAddress(buffer, .readOnly)
      if let base = CVPixelBufferGetBaseAddress(buffer) {
        let width = CVPixelBufferGetWidth(buffer)
        let height = CVPixelBufferGetHeight(buffer)
        let row = CVPixelBufferGetBytesPerRow(buffer)
        let pointer = base.assumingMemoryBound(to: UInt8.self)
        var labels = [UInt8](repeating: 0, count: width * height)
        for y in 0..<height {
          for x in 0..<width { labels[y * width + x] = pointer[y * row + x] }
        }
        found = Instances(handler: handler, observation: observation, labels: labels, width: width, height: height)
      }
      CVPixelBufferUnlockBaseAddress(buffer, .readOnly)
    }
    instances = .some(found)
    return found
  }

  private func parsed() -> (parse: ClothesParse, chroma: [SIMD2<Double>])? {
    if let held { return held }
    let found = GarmentPipeline.shared.parseHeld(photo)
    held = .some(found)
    return found
  }

  private func person(_ label: Int, in found: Instances) -> Bool {
    guard let parse = parsed()?.parse else { return false }
    let grid = parse.grid
    var inside = 0
    var skin = 0
    for y in 0..<grid.height {
      for x in 0..<grid.width {
        guard found.label(at: normalized(parse, x: x, y: y)) == label else { continue }
        inside += 1
        if Self.body.contains(grid.labels[y * grid.width + x]) { skin += 1 }
      }
    }
    return ClothesParser.showsPerson(skin: skin, mask: inside)
  }

  private func normalized(_ parse: ClothesParse, x: Int, y: Int) -> CGPoint {
    let area = parse.area
    let extent = parse.extent
    return CGPoint(
      x: (area.minX + (CGFloat(x) + 0.5) / CGFloat(parse.grid.width) * area.width) / extent.width,
      y: (extent.height - area.maxY + (CGFloat(y) + 0.5) / CGFloat(parse.grid.height) * area.height)
        / extent.height)
  }

  private func garment(at point: CGPoint) -> [UInt8]? {
    guard let (parse, chroma) = parsed() else { return nil }
    let grid = parse.grid
    let area = parse.area
    let extent = parse.extent
    let x = Int((point.x * extent.width - area.minX) / area.width * CGFloat(grid.width))
    let y = Int((point.y * extent.height - (extent.height - area.maxY)) / area.height * CGFloat(grid.height))
    let index = min(grid.height - 1, max(0, y)) * grid.width + min(grid.width - 1, max(0, x))
    guard let region = GarmentRegions.picked(grid, at: index, chroma: chroma),
      let mask = GarmentPipeline.shared.render(parse.mask(of: region).cropped(to: extent))
    else { return nil }
    return Self.gray(mask, width: picture.width, height: picture.height)
  }

  private static func alpha(_ buffer: CVPixelBuffer, width: Int, height: Int) -> [UInt8]? {
    guard CVPixelBufferGetWidth(buffer) == width, CVPixelBufferGetHeight(buffer) == height else { return nil }
    CVPixelBufferLockBaseAddress(buffer, .readOnly)
    defer { CVPixelBufferUnlockBaseAddress(buffer, .readOnly) }
    guard let base = CVPixelBufferGetBaseAddress(buffer) else { return nil }
    let row = CVPixelBufferGetBytesPerRow(buffer)
    var alpha = [UInt8](repeating: 0, count: width * height)
    for y in 0..<height {
      let line = (base + y * row).assumingMemoryBound(to: Float32.self)
      for x in 0..<width { alpha[y * width + x] = UInt8(min(255, max(0, line[x] * 255))) }
    }
    return alpha
  }

  private static func gray(_ image: CGImage, width: Int, height: Int) -> [UInt8]? {
    var alpha = [UInt8](repeating: 0, count: width * height)
    let drawn = alpha.withUnsafeMutableBytes { bytes -> Bool in
      guard
        let context = CGContext(
          data: bytes.baseAddress, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width,
          space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue)
      else { return false }
      context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
      return true
    }
    return drawn ? alpha : nil
  }
}

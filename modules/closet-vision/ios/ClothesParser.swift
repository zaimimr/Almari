import CoreImage
import CoreML
import Foundation
import Vision

enum ParseError: Error {
  case unreadable
  case model
}

struct ClothesParse {
  let grid: LabelGrid
  let area: CGRect
  let extent: CGRect
  let people: Int

  func mask(of classes: Set<ClothesClass>) -> CIImage {
    image(grid.labels.map { classes.contains(ClothesClass(rawValue: Int($0)) ?? .background) ? 255 : 0 })
  }

  func mask(of region: FoundRegion, grow: Int = 0) -> CIImage {
    var inside = [Bool](repeating: false, count: grid.labels.count)
    for index in region.pixels { inside[index] = true }
    if grow > 0 {
      inside = GarmentRegions.spread(inside, width: grid.width, height: grid.height, radius: grow, value: true)
    }
    return image(inside.map { $0 ? 255 : 0 })
  }

  func normalizedFrame(of region: FoundRegion) -> CGRect {
    let scaleX = area.width / CGFloat(grid.width)
    let scaleY = area.height / CGFloat(grid.height)
    let top = extent.height - area.maxY
    return CGRect(
      x: (area.minX + CGFloat(region.minX) * scaleX) / extent.width,
      y: (top + CGFloat(region.minY) * scaleY) / extent.height,
      width: CGFloat(region.maxX - region.minX + 1) * scaleX / extent.width,
      height: CGFloat(region.maxY - region.minY + 1) * scaleY / extent.height)
  }

  func frame(of region: FoundRegion) -> [String: Double] {
    let frame = normalizedFrame(of: region)
    return [
      "x": Double(frame.minX), "y": Double(frame.minY),
      "width": Double(frame.width), "height": Double(frame.height),
    ]
  }

  static let padding: CGFloat = 0.1

  func cutoutFrame(of region: FoundRegion) -> CGRect {
    let frame = normalizedFrame(of: region)
    return frame.insetBy(dx: -frame.width * Self.padding, dy: -frame.height * Self.padding)
      .intersection(CGRect(x: 0, y: 0, width: 1, height: 1))
  }

  func cutoutRect(of region: FoundRegion) -> CGRect {
    let frame = cutoutFrame(of: region)
    return CGRect(
      x: frame.minX * extent.width, y: (1 - frame.maxY) * extent.height,
      width: frame.width * extent.width, height: frame.height * extent.height
    ).integral.intersection(extent)
  }

  func cutout(_ photo: CIImage, region: FoundRegion) -> CIImage {
    let rect = cutoutRect(of: region)
    return photo.applyingFilter(
      "CIBlendWithMask",
      parameters: [
        kCIInputBackgroundImageKey: CIImage(color: .clear).cropped(to: extent),
        kCIInputMaskImageKey: mask(of: region),
      ]
    )
    .cropped(to: rect)
    .transformed(by: CGAffineTransform(translationX: -rect.minX, y: -rect.minY))
  }

  private func image(_ bytes: [UInt8]) -> CIImage {
    let provider = CGDataProvider(data: Data(bytes) as CFData)!
    let small = CGImage(
      width: grid.width, height: grid.height, bitsPerComponent: 8, bitsPerPixel: 8, bytesPerRow: grid.width,
      space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue),
      provider: provider, decode: nil, shouldInterpolate: true, intent: .defaultIntent)!
    return CIImage(cgImage: small)
      .transformed(
        by: CGAffineTransform(scaleX: area.width / CGFloat(grid.width), y: area.height / CGFloat(grid.height)))
      .transformed(by: CGAffineTransform(translationX: area.minX, y: area.minY))
      .clampedToExtent()
      .applyingGaussianBlur(sigma: 1.5)
      .cropped(to: area)
      .composited(over: CIImage(color: .black).cropped(to: extent))
  }
}

final class ClothesParser {
  static let side = 512

  struct Person {
    let count: Int
    let area: CGRect
    let mask: [UInt8]
    let width: Int
    let height: Int
    let label: UInt8
  }

  let model: MLModel
  let context: CIContext

  init(model: MLModel, context: CIContext) {
    self.model = model
    self.context = context
  }

  static let skinShare = 0.01
  static let personGrowth: CGFloat = 0.06

  static func showsPerson(skin: Int, mask: Int) -> Bool {
    mask > 0 && Double(skin) / Double(mask) >= skinShare
  }

  func parse(_ image: CIImage) throws -> ClothesParse {
    let extent = image.extent
    guard let picture = context.createCGImage(image, from: extent) else { throw ParseError.unreadable }
    let found = person(in: picture, extent: extent)
    let result = try parse(image, found: found)
    guard let found, found.count == 1, !Self.showsPerson(skin: result.skin, mask: result.mask) else {
      return result.parse
    }
    return try parse(image, found: nil).parse
  }

  func parseWhole(_ image: CIImage) throws -> ClothesParse {
    try parse(image, found: nil).parse
  }

  private func parse(_ image: CIImage, found: Person?) throws -> (parse: ClothesParse, skin: Int, mask: Int) {
    let extent = image.extent
    let area = found?.area ?? extent
    let side = CGFloat(Self.side)
    let input = image.cropped(to: area)
      .transformed(by: CGAffineTransform(translationX: -area.minX, y: -area.minY))
      .transformed(by: CGAffineTransform(scaleX: side / area.width, y: side / area.height))
    guard let small = context.createCGImage(input, from: CGRect(x: 0, y: 0, width: side, height: side)),
      let constraint = model.modelDescription.inputDescriptionsByName["image"]?.imageConstraint
    else { throw ParseError.unreadable }
    let value = try MLFeatureValue(cgImage: small, constraint: constraint)
    let output = try model.prediction(from: MLDictionaryFeatureProvider(dictionary: ["image": value]))
    let classes = ClothesClass.allCases.count
    guard let logits = output.featureValue(for: "logits")?.multiArrayValue, logits.dataType == .float32,
      logits.shape.map(\.intValue) == [1, classes, Self.side, Self.side]
    else { throw ParseError.model }
    let strides = logits.strides.map(\.intValue)
    var labels = [UInt8](repeating: 0, count: Self.side * Self.side)
    logits.withUnsafeBufferPointer(ofType: Float.self) { values in
      for y in 0..<Self.side {
        for x in 0..<Self.side {
          var best = 0
          var top = -Float.infinity
          for label in 0..<classes {
            let score = values[label * strides[1] + y * strides[2] + x * strides[3]]
            if score > top {
              top = score
              best = label
            }
          }
          labels[y * Self.side + x] = UInt8(best)
        }
      }
    }
    var skin = 0
    var inside = 0
    let body: Set<UInt8> = Set([ClothesClass.hair, .face, .leftLeg, .rightLeg, .leftArm, .rightArm].map { UInt8($0.rawValue) })
    if let found {
      let near = GarmentRegions.spread(
        found.mask.map { $0 == found.label }, width: found.width, height: found.height,
        radius: max(1, Int((CGFloat(max(found.width, found.height)) * Self.personGrowth).rounded())), value: true)
      for y in 0..<Self.side {
        for x in 0..<Self.side {
          let px = (area.minX + (CGFloat(x) + 0.5) / side * area.width) / extent.width
          let py = (extent.height - area.maxY + (CGFloat(y) + 0.5) / side * area.height) / extent.height
          let mx = min(found.width - 1, Int(px * CGFloat(found.width)))
          let my = min(found.height - 1, Int(py * CGFloat(found.height)))
          if found.mask[my * found.width + mx] == found.label {
            inside += 1
            if body.contains(labels[y * Self.side + x]) { skin += 1 }
          } else if !near[my * found.width + mx] {
            labels[y * Self.side + x] = 0
          }
        }
      }
    }
    let parse = ClothesParse(
      grid: LabelGrid(width: Self.side, height: Self.side, labels: labels), area: area, extent: extent,
      people: found?.count ?? 0)
    return (parse, skin, inside)
  }

  private func person(in picture: CGImage, extent: CGRect) -> Person? {
    let request = VNGeneratePersonInstanceMaskRequest()
    #if targetEnvironment(simulator)
      if let devices = try? request.supportedComputeStageDevices {
        for (stage, options) in devices {
          if let cpu = options.first(where: { $0.description.localizedCaseInsensitiveContains("cpu") }) {
            request.setComputeDevice(cpu, for: stage)
          }
        }
      }
    #endif
    let handler = VNImageRequestHandler(cgImage: picture)
    guard (try? handler.perform([request])) != nil, let observation = request.results?.first,
      !observation.allInstances.isEmpty
    else { return nil }
    let buffer = observation.instanceMask
    CVPixelBufferLockBaseAddress(buffer, .readOnly)
    defer { CVPixelBufferUnlockBaseAddress(buffer, .readOnly) }
    guard let base = CVPixelBufferGetBaseAddress(buffer) else { return nil }
    let width = CVPixelBufferGetWidth(buffer)
    let height = CVPixelBufferGetHeight(buffer)
    let row = CVPixelBufferGetBytesPerRow(buffer)
    let pointer = base.assumingMemoryBound(to: UInt8.self)
    var mask = [UInt8](repeating: 0, count: width * height)
    var counts: [UInt8: Int] = [:]
    for y in 0..<height {
      for x in 0..<width {
        let value = pointer[y * row + x]
        mask[y * width + x] = value
        if value > 0 { counts[value, default: 0] += 1 }
      }
    }
    guard let label = counts.max(by: { $0.value < $1.value })?.key else { return nil }
    var minX = width
    var minY = height
    var maxX = -1
    var maxY = -1
    for y in 0..<height {
      for x in 0..<width where mask[y * width + x] == label {
        minX = min(minX, x)
        maxX = max(maxX, x)
        minY = min(minY, y)
        maxY = max(maxY, y)
      }
    }
    let margin: CGFloat = 0.05
    let left = max(0, CGFloat(minX) / CGFloat(width) - margin)
    let right = min(1, CGFloat(maxX + 1) / CGFloat(width) + margin)
    let top = max(0, CGFloat(minY) / CGFloat(height) - margin)
    let bottom = min(1, CGFloat(maxY + 1) / CGFloat(height) + margin)
    let area = CGRect(
      x: left * extent.width, y: (1 - bottom) * extent.height,
      width: (right - left) * extent.width, height: (bottom - top) * extent.height
    ).integral.intersection(extent)
    guard !area.isEmpty else { return nil }
    return Person(
      count: observation.allInstances.count, area: area, mask: mask, width: width, height: height, label: label)
  }
}

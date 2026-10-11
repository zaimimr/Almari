import CoreImage
import CoreML
import Foundation

enum GarmentSegmentationError: Error {
  case resources
  case image
  case output
}

final class GarmentSegmenter {
  struct Models {
    let image: MLModel
    let prompt: MLModel
    let mask: MLModel

    init(folder: URL, configuration: MLModelConfiguration) throws {
      image = try MLModel(
        contentsOf: folder.appendingPathComponent("SAM2_1SmallImageEncoderFLOAT16.mlmodelc"), configuration: configuration)
      prompt = try MLModel(
        contentsOf: folder.appendingPathComponent("SAM2_1SmallPromptEncoderFLOAT16.mlmodelc"), configuration: configuration)
      mask = try MLModel(
        contentsOf: folder.appendingPathComponent("SAM2_1SmallMaskDecoderFLOAT16.mlmodelc"), configuration: configuration)
    }
  }

  private let models: Models
  private let photo: CIImage
  private let picture: CGImage
  private let context: CIContext
  private var encoding: MLFeatureProvider?
  private var confidence = 0.0
  private var whole: [UInt8]?

  init(models: Models, photo: CIImage, picture: CGImage, context: CIContext) {
    self.models = models
    self.photo = photo
    self.picture = picture
    self.context = context
  }

  func select(at point: CGPoint, orient: Bool = true, recover: Bool = true, focus: Bool = true) throws -> [UInt8]? {
    guard point.x.isFinite, point.y.isFinite, point.x >= 0, point.x < 1, point.y >= 0, point.y < 1 else { return nil }
    let initial = try predicted(at: point)
    let oriented = orient ? try oriented(initial, at: point) : initial
    let predicted = try expanded(oriented, at: point)
    let seed = Int(point.y * CGFloat(picture.height)) * picture.width + Int(point.x * CGFloat(picture.width))
    guard let anchor = Self.anchor(predicted, width: picture.width, height: picture.height, at: seed) else { return nil }
    let alpha = Self.connected(predicted, width: picture.width, height: picture.height, at: anchor)
    let share = Double(alpha.filter { $0 > 128 }.count) / Double(alpha.count)
    if recover, share < GarmentRegions.minComponentShare {
      if let complete = try recoveredMotif(alpha, seed: seed) { return complete }
      if let complete = try recoveredCord(alpha, seed: seed) { return complete }
    }
    guard share >= GarmentRegions.minComponentShare, share < 0.97 else { return nil }
    if focus, confidence >= 0.8, let focused = try focused(alpha, at: point) { return focused }
    let refined = try refined(alpha, seed: seed)
    return refined[seed] > 128 ? refined : nil
  }

  private func oriented(_ alpha: [UInt8], at point: CGPoint) throws -> [UInt8] {
    let share = Double(alpha.filter { $0 > 128 }.count) / Double(alpha.count)
    guard confidence < 0.8, share >= GarmentRegions.minComponentShare else { return alpha }
    var chosen = alpha
    for orientation in [CGImagePropertyOrientation.right, .left, .down] {
      let rotated = photo.oriented(orientation)
      let image = rotated.transformed(by: CGAffineTransform(translationX: -rotated.extent.minX, y: -rotated.extent.minY))
      guard let picture = context.createCGImage(image, from: image.extent) else { continue }
      let next = GarmentSegmenter(models: models, photo: image, picture: picture, context: context)
      let location: CGPoint
      switch orientation {
      case .right: location = CGPoint(x: 1 - point.y, y: point.x)
      case .left: location = CGPoint(x: point.y, y: 1 - point.x)
      default: location = CGPoint(x: 1 - point.x, y: 1 - point.y)
      }
      guard let found = try next.select(at: location, orient: false), next.confidence > confidence else { continue }
      chosen = Self.unrotated(found, width: self.picture.width, height: self.picture.height, orientation: orientation)
      confidence = next.confidence
    }
    return chosen
  }

  private func expanded(_ alpha: [UInt8], at point: CGPoint) throws -> [UInt8] {
    guard confidence < 0.95 else { return alpha }
    let distance = CutoutRepair.distances(to: alpha.map { $0 <= 128 }, width: picture.width, height: picture.height)
    guard let inner = distance.indices.max(by: { distance[$0] < distance[$1] }) else { return alpha }
    let previous = confidence
    let expanded = try predicted(at: point, interior: location(of: inner))
    if confidence >= previous + 0.05 { return expanded }
    confidence = previous
    return alpha
  }

  private func recoveredMotif(_ alpha: [UInt8], seed: Int) throws -> [UInt8]? {
    let inside = alpha.indices.filter { alpha[$0] > 128 }
    let xs = inside.map { $0 % picture.width }
    let ys = inside.map { $0 / picture.width }
    let span = max((xs.max() ?? 0) - (xs.min() ?? 0) + 1, (ys.max() ?? 0) - (ys.min() ?? 0) + 1)
    guard let whole, Double(span * span) <= Double(inside.count) * 9 else { return nil }
    let distance = CutoutRepair.distances(to: whole.map { $0 <= 128 }, width: picture.width, height: picture.height)
    guard let body = distance.indices.max(by: { distance[$0] < distance[$1] }),
      let expanded = try select(at: location(of: body), orient: false, recover: false)
    else { return nil }
    let share = Double(expanded.filter { $0 > 128 }.count) / Double(alpha.count)
    guard confidence >= 0.8, share >= GarmentRegions.minComponentShare, share < 0.5 else { return nil }
    return try refined(expanded, seed: seed)
  }

  private func recoveredCord(_ alpha: [UInt8], seed: Int) throws -> [UInt8]? {
    let pixels = try pixels()
    let reference = GarmentEnhancer.lab(red: Double(pixels[seed * 4]), green: Double(pixels[seed * 4 + 1]), blue: Double(pixels[seed * 4 + 2]))
    let similar = alpha.indices.map { index -> UInt8 in
      let colour = GarmentEnhancer.lab(red: Double(pixels[index * 4]), green: Double(pixels[index * 4 + 1]), blue: Double(pixels[index * 4 + 2]))
      let gap = SIMD3((colour.l - reference.l) * GarmentRegions.lightnessWeight, colour.a - reference.a, colour.b - reference.b)
      return (gap * gap).sum() < GarmentRegions.colourGap * GarmentRegions.colourGap ? 255 : 0
    }
    let attached = Self.connected(similar, width: picture.width, height: picture.height, at: seed)
    let share = Double(attached.filter { $0 > 128 }.count) / Double(alpha.count)
    guard share >= GarmentRegions.minComponentShare, share < 0.5 else { return nil }
    let inner = CutoutRepair.distances(to: attached.map { $0 <= 128 }, width: picture.width, height: picture.height)
    let thickness = pow(Double(min(picture.width, picture.height)) * 0.01, 2)
    func gap(_ index: Int) -> Int {
      let dx = index % picture.width - seed % picture.width
      let dy = index / picture.width - seed / picture.width
      return dx * dx + dy * dy
    }
    guard let body = inner.indices.filter({ inner[$0] >= thickness }).min(by: { gap($0) < gap($1) }),
      let garment = try select(at: location(of: body), orient: false, recover: false)
    else { return nil }
    let joined = GarmentMaskRefinement.attaching(alpha, to: garment, width: picture.width, height: picture.height)
    return joined[seed] > 128 ? joined : nil
  }

  private func location(of index: Int) -> CGPoint {
    CGPoint(x: (Double(index % picture.width) + 0.5) / Double(picture.width), y: (Double(index / picture.width) + 0.5) / Double(picture.height))
  }

  private func refined(_ alpha: [UInt8], seed: Int) throws -> [UInt8] {
    GarmentMaskRefinement.refine(alpha, pixels: try pixels(), width: picture.width, height: picture.height, seed: seed)
  }

  private func focused(_ alpha: [UInt8], at point: CGPoint) throws -> [UInt8]? {
    let inside = alpha.indices.filter { alpha[$0] > 128 }
    guard let left = inside.map({ $0 % picture.width }).min(), let right = inside.map({ $0 % picture.width }).max(),
      let top = inside.map({ $0 / picture.width }).min(), let bottom = inside.map({ $0 / picture.width }).max()
    else { return nil }
    let width = right - left + 1
    let height = bottom - top + 1
    guard width < picture.width / 4 || height < picture.height / 4 else { return nil }
    let x = max(0, left - width / 2)
    let y = max(0, top - height / 2)
    let box = CGRect(x: x, y: y, width: min(picture.width, right + width / 2 + 1) - x, height: min(picture.height, bottom + height / 2 + 1) - y)
    let rect = CGRect(x: box.minX, y: CGFloat(picture.height) - box.maxY, width: box.width, height: box.height)
    let cropped = photo.cropped(to: rect).transformed(by: CGAffineTransform(translationX: -rect.minX, y: -rect.minY))
    let horizontal = width > height
    let oriented = horizontal ? cropped.oriented(.left) : cropped
    let image = oriented.transformed(by: CGAffineTransform(translationX: -oriented.extent.minX, y: -oriented.extent.minY))
    guard let rendered = context.createCGImage(image, from: image.extent) else { return nil }
    let next = GarmentSegmenter(models: models, photo: image, picture: rendered, context: context)
    let original = CGPoint(x: (point.x * CGFloat(picture.width) - box.minX) / box.width, y: (point.y * CGFloat(picture.height) - box.minY) / box.height)
    let location = horizontal ? CGPoint(x: original.y, y: 1 - original.x) : original
    guard let found = try next.select(at: location, orient: false, recover: false, focus: false), next.confidence >= 0.8 else { return nil }
    let mask = horizontal ? Self.unrotated(found, width: Int(box.width), height: Int(box.height), orientation: .left) : found
    var result = [UInt8](repeating: 0, count: alpha.count)
    for row in 0..<Int(box.height) {
      for column in 0..<Int(box.width) {
        result[(y + row) * picture.width + x + column] = mask[row * Int(box.width) + column]
      }
    }
    return result
  }

  private static func unrotated(_ alpha: [UInt8], width: Int, height: Int, orientation: CGImagePropertyOrientation) -> [UInt8] {
    (0..<width * height).map { index in
      let x = index % width
      let y = index / width
      switch orientation {
      case .right: return alpha[x * height + height - 1 - y]
      case .left: return alpha[(width - 1 - x) * height + y]
      default: return alpha[(height - 1 - y) * width + width - 1 - x]
      }
    }
  }

  static func anchor(_ alpha: [UInt8], width: Int, height: Int, at seed: Int) -> Int? {
    guard width > 0, height > 0, alpha.count == width * height, alpha.indices.contains(seed) else { return nil }
    if alpha[seed] > 128 { return seed }
    let radius = Double(min(width, height)) * GarmentMaskRefinement.searchShare
    var nearest: Int?
    var distance = radius * radius
    for index in alpha.indices where alpha[index] > 128 {
      let dx = Double(index % width - seed % width)
      let dy = Double(index / width - seed / width)
      let gap = dx * dx + dy * dy
      if gap <= distance {
        distance = gap
        nearest = index
      }
    }
    return nearest
  }

  private func predicted(at point: CGPoint, interior: CGPoint? = nil) throws -> [UInt8] {
    let image = try encoded()
    let prompt = try prompted(at: [point] + (interior.map { [$0] } ?? []))
    var features: [String: MLFeatureValue] = [:]
    for name in ["image_embedding", "feats_s0", "feats_s1"] { features[name] = image.featureValue(for: name) }
    features["sparse_embedding"] = prompt.featureValue(for: "sparse_embeddings")
    features["dense_embedding"] = prompt.featureValue(for: "dense_embeddings")
    let output = try models.mask.prediction(from: MLDictionaryFeatureProvider(dictionary: features))
    return try selectedMask(output, at: point)
  }

  static func connected(_ alpha: [UInt8], width: Int, height: Int, at seed: Int) -> [UInt8] {
    guard width > 0, height > 0, alpha.count == width * height, alpha.indices.contains(seed), alpha[seed] > 128 else {
      return [UInt8](repeating: 0, count: alpha.count)
    }
    var seen = [Bool](repeating: false, count: alpha.count)
    var stack = [seed]
    seen[seed] = true
    while let index = stack.popLast() {
      let x = index % width
      let y = index / width
      for ny in max(0, y - 1)...min(height - 1, y + 1) {
        for nx in max(0, x - 1)...min(width - 1, x + 1) {
          let next = ny * width + nx
          if !seen[next] && alpha[next] > 128 {
            seen[next] = true
            stack.append(next)
          }
        }
      }
    }
    return alpha.indices.map { seen[$0] ? alpha[$0] : 0 }
  }

  private func encoded() throws -> MLFeatureProvider {
    if let encoding { return encoding }
    guard let constraint = models.image.modelDescription.inputDescriptionsByName["image"]?.imageConstraint else {
      throw GarmentSegmentationError.resources
    }
    let image = photo.transformed(
      by: CGAffineTransform(
        scaleX: CGFloat(constraint.pixelsWide) / photo.extent.width,
        y: CGFloat(constraint.pixelsHigh) / photo.extent.height))
    guard let small = context.createCGImage(image, from: image.extent) else { throw GarmentSegmentationError.image }
    let feature = try MLFeatureValue(cgImage: small, constraint: constraint)
    let found = try models.image.prediction(from: MLDictionaryFeatureProvider(dictionary: ["image": feature]))
    encoding = found
    return found
  }

  private func prompted(at points: [CGPoint]) throws -> MLFeatureProvider {
    guard let constraint = models.image.modelDescription.inputDescriptionsByName["image"]?.imageConstraint else {
      throw GarmentSegmentationError.resources
    }
    let coordinates = try MLMultiArray(shape: [1, NSNumber(value: points.count), 2], dataType: .float32)
    let labels = try MLMultiArray(shape: [1, NSNumber(value: points.count)], dataType: .int32)
    for (index, point) in points.enumerated() {
      coordinates[index * 2] = NSNumber(value: Double(point.x) * Double(constraint.pixelsWide))
      coordinates[index * 2 + 1] = NSNumber(value: Double(point.y) * Double(constraint.pixelsHigh))
      labels[index] = 1
    }
    return try models.prompt.prediction(from: MLDictionaryFeatureProvider(dictionary: ["points": coordinates, "labels": labels]))
  }

  private func selectedMask(_ output: MLFeatureProvider, at point: CGPoint) throws -> [UInt8] {
    guard let masks = output.featureValue(for: "low_res_masks")?.multiArrayValue,
      let scores = output.featureValue(for: "scores")?.multiArrayValue, masks.shape.count == 4,
      masks.shape[0].intValue == 1, masks.shape[1].intValue == scores.count, scores.count > 0,
      masks.shape[2].intValue > 0, masks.shape[3].intValue > 0
    else { throw GarmentSegmentationError.output }
    let width = masks.shape[3].intValue
    let height = masks.shape[2].intValue
    let strides = masks.strides.map(\.intValue)
    let candidates = (0..<scores.count).filter { scores[$0].doubleValue.isFinite }
    guard let confidence = candidates.map({ scores[$0].doubleValue }).max() else {
      throw GarmentSegmentationError.output
    }
    let seed = Int(point.y * CGFloat(picture.height)) * picture.width + Int(point.x * CGFloat(picture.width))
    var selected: [UInt8]?
    var selectedArea = 0
    var wholeArea = 0
    whole = nil
    for candidate in candidates {
      let values = (0..<width * height).map { index in
        masks[candidate * strides[1] + (index / width) * strides[2] + (index % width) * strides[3]].doubleValue
      }
      guard values.allSatisfy(\.isFinite) else { continue }
      let alpha = Self.upsampled(values, width: width, height: height, to: picture.width, outputHeight: picture.height)
      guard let anchor = Self.anchor(alpha, width: picture.width, height: picture.height, at: seed) else { continue }
      let connected = Self.connected(alpha, width: picture.width, height: picture.height, at: anchor)
      let area = connected.filter { $0 > 128 }.count
      if Double(area) >= Double(alpha.count) * GarmentRegions.minComponentShare, Double(area) < Double(alpha.count) * 0.5, area > wholeArea {
        whole = connected
        wholeArea = area
      }
      if scores[candidate].doubleValue >= confidence - 0.1, Double(area) < Double(alpha.count) * 0.97, area > selectedArea {
        selected = connected
        selectedArea = area
        self.confidence = scores[candidate].doubleValue
      }
    }
    guard let selected else { throw GarmentSegmentationError.output }
    return selected
  }

  static func upsampled(_ values: [Double], width: Int, height: Int, to outputWidth: Int, outputHeight: Int) -> [UInt8] {
    guard width > 0, height > 0, outputWidth > 0, outputHeight > 0, values.count == width * height else { return [] }
    var alpha = [UInt8](repeating: 0, count: outputWidth * outputHeight)
    for y in 0..<outputHeight {
      let sy = max(0, min(Double(height - 1), (Double(y) + 0.5) * Double(height) / Double(outputHeight) - 0.5))
      let y0 = Int(sy)
      let y1 = min(height - 1, y0 + 1)
      let dy = sy - Double(y0)
      for x in 0..<outputWidth {
        let sx = max(0, min(Double(width - 1), (Double(x) + 0.5) * Double(width) / Double(outputWidth) - 0.5))
        let x0 = Int(sx)
        let x1 = min(width - 1, x0 + 1)
        let dx = sx - Double(x0)
        let top = values[y0 * width + x0] * (1 - dx) + values[y0 * width + x1] * dx
        let bottom = values[y1 * width + x0] * (1 - dx) + values[y1 * width + x1] * dx
        alpha[y * outputWidth + x] = top * (1 - dy) + bottom * dy > 0 ? 255 : 0
      }
    }
    return alpha
  }

  private func pixels() throws -> [UInt8] {
    var pixels = [UInt8](repeating: 0, count: picture.width * picture.height * 4)
    let rendered = pixels.withUnsafeMutableBytes { bytes -> Bool in
      guard let drawing = CGContext(
        data: bytes.baseAddress, width: picture.width, height: picture.height, bitsPerComponent: 8,
        bytesPerRow: picture.width * 4, space: CGColorSpace(name: CGColorSpace.sRGB)!,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
      else { return false }
      drawing.draw(picture, in: CGRect(x: 0, y: 0, width: picture.width, height: picture.height))
      return true
    }
    guard rendered else { throw GarmentSegmentationError.image }
    return pixels
  }
}

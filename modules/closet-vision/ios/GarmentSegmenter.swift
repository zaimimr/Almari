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

  init(models: Models, photo: CIImage, picture: CGImage, context: CIContext) {
    self.models = models
    self.photo = photo
    self.picture = picture
    self.context = context
  }

  func select(at point: CGPoint) throws -> [UInt8]? {
    guard point.x.isFinite, point.y.isFinite, point.x >= 0, point.x < 1, point.y >= 0, point.y < 1 else { return nil }
    let predicted = try predicted(at: point)
    let x = Int(point.x * CGFloat(picture.width))
    let y = Int(point.y * CGFloat(picture.height))
    let seed = y * picture.width + x
    guard let anchor = Self.anchor(predicted, width: picture.width, height: picture.height, at: seed) else { return nil }
    let alpha = Self.connected(predicted, width: picture.width, height: picture.height, at: anchor)
    let area = alpha.filter { $0 > 128 }.count
    guard Double(area) / Double(alpha.count) >= GarmentRegions.minComponentShare,
      Double(area) / Double(alpha.count) < 0.97
    else { return nil }
    let refined = GarmentMaskRefinement.refine(
      alpha, pixels: try pixels(), width: picture.width, height: picture.height, seed: seed)
    return refined[seed] > 128 ? refined : nil
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

  private func predicted(at point: CGPoint) throws -> [UInt8] {
    let image = try encoded()
    let prompt = try prompted(at: point)
    var features: [String: MLFeatureValue] = [:]
    for name in ["image_embedding", "feats_s0", "feats_s1"] { features[name] = image.featureValue(for: name) }
    features["sparse_embedding"] = prompt.featureValue(for: "sparse_embeddings")
    features["dense_embedding"] = prompt.featureValue(for: "dense_embeddings")
    let output = try models.mask.prediction(from: MLDictionaryFeatureProvider(dictionary: features))
    return try selectedMask(output)
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

  private func prompted(at point: CGPoint) throws -> MLFeatureProvider {
    guard let constraint = models.image.modelDescription.inputDescriptionsByName["image"]?.imageConstraint else {
      throw GarmentSegmentationError.resources
    }
    let points = try MLMultiArray(shape: [1, 1, 2], dataType: .float32)
    let labels = try MLMultiArray(shape: [1, 1], dataType: .int32)
    points[0] = NSNumber(value: Double(point.x) * Double(constraint.pixelsWide))
    points[1] = NSNumber(value: Double(point.y) * Double(constraint.pixelsHigh))
    labels[0] = 1
    return try models.prompt.prediction(from: MLDictionaryFeatureProvider(dictionary: ["points": points, "labels": labels]))
  }

  private func selectedMask(_ output: MLFeatureProvider) throws -> [UInt8] {
    guard let masks = output.featureValue(for: "low_res_masks")?.multiArrayValue,
      let scores = output.featureValue(for: "scores")?.multiArrayValue, masks.shape.count == 4,
      masks.shape[0].intValue == 1, masks.shape[1].intValue == scores.count, scores.count > 0,
      masks.shape[2].intValue > 0, masks.shape[3].intValue > 0
    else { throw GarmentSegmentationError.output }
    let candidates = (0..<scores.count).filter { scores[$0].doubleValue.isFinite }
    guard let best = candidates.max(by: { scores[$0].doubleValue < scores[$1].doubleValue }) else {
      throw GarmentSegmentationError.output
    }
    let width = masks.shape[3].intValue
    let height = masks.shape[2].intValue
    let strides = masks.strides.map(\.intValue)
    let values = (0..<width * height).map { index in
      masks[best * strides[1] + (index / width) * strides[2] + (index % width) * strides[3]].doubleValue
    }
    guard values.allSatisfy(\.isFinite) else { throw GarmentSegmentationError.output }
    return Self.upsampled(values, width: width, height: height, to: picture.width, outputHeight: picture.height)
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

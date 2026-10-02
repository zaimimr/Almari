import CoreGraphics
import CoreImage
import Foundation
import MLX
import MLXNN
import MLXRandom

enum StudioError: Error, CustomStringConvertible, LocalizedError {
  case missing
  case weights
  case unreadable
  case memory
  case thermal
  case cancelled
  case storage

  var description: String {
    switch self {
    case .missing: return "missing"
    case .weights: return "weights"
    case .unreadable: return "unreadable"
    case .memory: return "memory"
    case .thermal: return "thermal"
    case .cancelled: return "cancelled"
    case .storage: return "storage"
    }
  }

  var errorDescription: String? { description }
}

final class StudioEngine {
  let transformer: StudioTransformer
  let autoencoder: StudioAutoencoder
  let prompt: MLXArray
  let context = CIContext(options: [.workingColorSpace: CGColorSpace(name: CGColorSpace.sRGB)!])

  init(transformer files: [URL], autoencoder: URL, prompt: URL) throws {
    var weights: [String: MLXArray] = [:]
    for file in files { weights.merge(try MLX.loadArrays(url: file)) { _, new in new } }
    let model = StudioTransformer()
    quantize(model: model) { path, module in
      module is Linear && weights["\(path).scales"] != nil ? (64, 4, .affine) : nil
    }
    try model.update(parameters: ModuleParameters.unflattened(weights), verify: [.all])
    eval(model)
    transformer = model
    self.autoencoder = try StudioAutoencoder.load(autoencoder)
    guard let embeds = try MLX.loadArrays(url: prompt)["prompt"] else { throw StudioError.weights }
    self.prompt = embeds.asType(.bfloat16)[.newAxis, 0..., 0...]
    eval(self.prompt)
  }

  static func ids(grid: Int, time: Int32) -> [Int32] {
    var ids: [Int32] = []
    ids.reserveCapacity(grid * grid * 4)
    for row in 0..<grid { for column in 0..<grid { ids += [time, Int32(row), Int32(column), 0] } }
    return ids
  }

  static func schedule(tokens: Int, steps: Int) -> [Float] {
    let mu = 0.5 + Double(tokens - 256) * (1.15 - 0.5) / Double(4096 - 256)
    var sigmas = (0..<steps).map { index -> Float in
      let base = steps == 1 ? 1 : 1 - Double(index) * (1 - 0.001) / Double(steps - 1)
      return Float(exp(mu) / (exp(mu) + (1 / base - 1)))
    }
    sigmas.append(0)
    return sigmas
  }

  func reference(_ url: URL, side: Int) throws -> MLXArray {
    guard let loaded = CIImage(contentsOf: url) else { throw StudioError.unreadable }
    let image = loaded.transformed(
      by: CGAffineTransform(translationX: -loaded.extent.minX, y: -loaded.extent.minY))
    let scale = CGFloat(side) / max(image.extent.width, image.extent.height)
    let fitted = image.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
    let placed = fitted.transformed(
      by: CGAffineTransform(
        translationX: (CGFloat(side) - fitted.extent.width) / 2,
        y: (CGFloat(side) - fitted.extent.height) / 2))
    let square = CGRect(x: 0, y: 0, width: side, height: side)
    let onWhite = placed.composited(over: CIImage(color: .white).cropped(to: square))
    var pixels = [UInt8](repeating: 0, count: side * side * 4)
    context.render(
      onWhite, toBitmap: &pixels, rowBytes: side * 4, bounds: square, format: .RGBA8,
      colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
    let rgba = MLXArray(pixels, [1, side, side, 4]).asType(.float32)
    return rgba[0..., 0..., 0..., ..<3] / 127.5 - 1
  }

  func render(
    _ cutout: URL, to output: URL, side: Int = 512, steps: Int = 4, seed: UInt64 = 7,
    cancelled: () -> Bool = { false }
  ) throws {
    let grid = side / 16
    let tokens = grid * grid
    let referenceTokens = autoencoder.encode(try reference(cutout, side: side)).reshaped(1, -1, 128)
    eval(referenceTokens)
    Memory.clearCache()
    let imageIds = MLXArray(Self.ids(grid: grid, time: 0) + Self.ids(grid: grid, time: 10), [tokens * 2, 4])
    var textIds: [Int32] = []
    for index in 0..<prompt.dim(1) { textIds += [0, 0, 0, Int32(index)] }
    let textPositions = MLXArray(textIds, [prompt.dim(1), 4])
    MLXRandom.seed(seed)
    var latents = MLXRandom.normal([1, tokens, 128], dtype: .float32)
    let sigmas = Self.schedule(tokens: tokens, steps: steps)
    for step in 0..<steps {
      if cancelled() { throw StudioError.cancelled }
      let velocity = transformer(
        concatenated([latents, referenceTokens], axis: 1).asType(.bfloat16), text: prompt,
        timestep: sigmas[step] * 1000, imageIds: imageIds, textIds: textPositions
      ).asType(.float32)[0..., ..<tokens, 0...]
      latents = latents + (sigmas[step + 1] - sigmas[step]) * velocity
      eval(latents)
      Memory.clearCache()
    }
    if cancelled() { throw StudioError.cancelled }
    let decoded = autoencoder.decode(latents.reshaped(1, grid, grid, 128))
    let bytes = (clip(decoded[0] / 2 + 0.5, min: 0, max: 1) * 255).round().asType(.uint8)
    eval(bytes)
    Memory.clearCache()
    try write(bytes.asArray(UInt8.self), side: side, to: output)
  }

  func write(_ rgb: [UInt8], side: Int, to url: URL) throws {
    guard let provider = CGDataProvider(data: Data(rgb) as CFData),
      let image = CGImage(
        width: side, height: side, bitsPerComponent: 8, bitsPerPixel: 24, bytesPerRow: side * 3,
        space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGBitmapInfo(rawValue: 0),
        provider: provider, decode: nil, shouldInterpolate: true, intent: .defaultIntent)
    else { throw StudioError.storage }
    do {
      try context.writePNGRepresentation(
        of: CIImage(cgImage: image), to: url, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
    } catch { throw StudioError.storage }
  }
}

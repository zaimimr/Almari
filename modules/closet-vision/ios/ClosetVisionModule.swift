import CoreImage
import CoreML
import ExpoModulesCore
import ImageIO
import UniformTypeIdentifiers
import Vision

struct LabelScore: Record {
  @Field var group: String = ""
  @Field var value: String = ""
  @Field var score: Double = 0
}

struct PreparedGarment: Record {
  @Field var original: String = ""
  @Field var cutout: String? = nil
  @Field var thumbnail: String? = nil
  @Field var frame: [String: Double]? = nil
  @Field var instances: Int = 0
  @Field var labels: [LabelScore] = []
  @Field var color: [Double]? = nil
  @Field var width: Int = 0
  @Field var height: Int = 0
  @Field var milliseconds: [String: Int] = [:]
}

enum PrepareError: Error, CustomStringConvertible {
  case unreadable
  case resources
  case storage

  var description: String {
    switch self {
    case .unreadable: return "unreadable"
    case .resources: return "resources"
    case .storage: return "storage"
    }
  }
}

final class GarmentPipeline {
  static let shared = GarmentPipeline()

  private let queue = DispatchQueue(label: "closet.vision.prepare")
  private let context = CIContext(options: [.workingColorSpace: CGColorSpace(name: CGColorSpace.sRGB)!])
  private var model: MLModel?
  private var labels: [(group: String, value: String, embeddings: [[Float]])] = []

  private var bundle: Bundle? {
    let host = Bundle(for: GarmentPipeline.self)
    guard let url = host.url(forResource: "ClosetVisionResources", withExtension: "bundle") else { return nil }
    return Bundle(url: url)
  }

  private var photos: URL {
    FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("closet-photos", isDirectory: true)
  }

  func prepare(sourceUri: String, id: String) throws -> PreparedGarment {
    try queue.sync { try run(sourceUri: sourceUri, id: id) }
  }

  private func loadResources() throws {
    if model != nil { return }
    guard let bundle, let modelUrl = bundle.url(forResource: "GarmentEncoder", withExtension: "mlmodelc"),
      let labelsUrl = bundle.url(forResource: "garment-labels", withExtension: "json")
    else { throw PrepareError.resources }
    let data = try Data(contentsOf: labelsUrl)
    guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
      json["version"] as? Int == 2,
      let entries = json["labels"] as? [[String: Any]]
    else { throw PrepareError.resources }
    labels = entries.compactMap { entry in
      guard let group = entry["group"] as? String, let value = entry["value"] as? String,
        let embeddings = entry["embeddings"] as? [[Double]]
      else { return nil }
      return (group, value, embeddings.map { $0.map(Float.init) })
    }
    let configuration = MLModelConfiguration()
    #if targetEnvironment(simulator)
      configuration.computeUnits = .cpuOnly
    #else
      configuration.computeUnits = .all
    #endif
    model = try MLModel(contentsOf: modelUrl, configuration: configuration)
  }

  private func elapsed(_ start: Date) -> Int { Int(Date().timeIntervalSince(start) * 1000) }

  private func run(sourceUri: String, id: String) throws -> PreparedGarment {
    var result = PreparedGarment()
    var timings: [String: Int] = [:]
    let started = Date()
    let source = sourceUri.hasPrefix("file://") ? URL(string: sourceUri)! : URL(fileURLWithPath: sourceUri)
    guard var image = CIImage(contentsOf: source, options: [.applyOrientationProperty: true]) else {
      throw PrepareError.unreadable
    }
    try FileManager.default.createDirectory(at: photos, withIntermediateDirectories: true)
    let ext = source.pathExtension.isEmpty ? "jpg" : source.pathExtension.lowercased()
    let original = "\(id)-original.\(ext)"
    let originalUrl = photos.appendingPathComponent(original)
    if !FileManager.default.fileExists(atPath: originalUrl.path) {
      do { try FileManager.default.copyItem(at: source, to: originalUrl) } catch { throw PrepareError.storage }
    }
    result.original = original
    image = image.transformed(by: CGAffineTransform(translationX: -image.extent.minX, y: -image.extent.minY))
    image = scaled(image, longEdge: 2048)
    result.width = Int(image.extent.width)
    result.height = Int(image.extent.height)
    timings["load"] = elapsed(started)

    let maskStart = Date()
    var garment = image
    guard let working = context.createCGImage(image, from: image.extent) else { throw PrepareError.unreadable }
    let request = VNGenerateForegroundInstanceMaskRequest()
    #if targetEnvironment(simulator)
      if let devices = try? request.supportedComputeStageDevices {
        for (stage, options) in devices {
          if let cpu = options.first(where: { $0.description.localizedCaseInsensitiveContains("cpu") }) {
            request.setComputeDevice(cpu, for: stage)
          }
        }
      }
    #endif
    let handler = VNImageRequestHandler(cgImage: working)
    if (try? handler.perform([request])) != nil, let observation = request.results?.first,
      !observation.allInstances.isEmpty,
      let buffer = try? observation.generateMaskedImage(
        ofInstances: observation.allInstances, from: handler, croppedToInstancesExtent: true)
    {
      result.instances = observation.allInstances.count
      garment = scaled(CIImage(cvPixelBuffer: buffer), longEdge: 1536)
      let side = max(garment.extent.width, garment.extent.height)
      let square = CGRect(x: 0, y: 0, width: side, height: side)
      let offsetX = (side - garment.extent.width) / 2
      let offsetY = (side - garment.extent.height) / 2
      let centered = garment.transformed(by: CGAffineTransform(translationX: offsetX, y: offsetY))
        .composited(over: CIImage(color: .clear).cropped(to: square))
      let cutout = "\(id).png"
      try write(centered, to: cutout, extent: square)
      result.cutout = cutout
      let thumbnail = "\(id)-thumb.png"
      try write(scaled(centered, longEdge: 512), to: thumbnail, extent: nil)
      result.thumbnail = thumbnail
      result.frame = [
        "x": Double(offsetX / side),
        "y": Double(offsetY / side),
        "width": Double(garment.extent.width / side),
        "height": Double(garment.extent.height / side),
      ]
    }
    timings["cutout"] = elapsed(maskStart)

    let classifyStart = Date()
    try loadResources()
    result.labels = try classify(garment)
    timings["classify"] = elapsed(classifyStart)
    result.color = dominantColor(garment, masked: result.cutout != nil)
    timings["total"] = elapsed(started)
    result.milliseconds = timings
    return result
  }

  private func scaled(_ image: CIImage, longEdge: CGFloat) -> CIImage {
    let edge = max(image.extent.width, image.extent.height)
    guard edge > longEdge else { return image }
    let scale = longEdge / edge
    let filter = CIFilter(name: "CILanczosScaleTransform")!
    filter.setValue(image, forKey: kCIInputImageKey)
    filter.setValue(scale, forKey: kCIInputScaleKey)
    filter.setValue(1.0, forKey: kCIInputAspectRatioKey)
    let output = filter.outputImage!
    return output.transformed(by: CGAffineTransform(translationX: -output.extent.minX, y: -output.extent.minY))
  }

  private func write(_ image: CIImage, to name: String, extent: CGRect?) throws {
    let url = photos.appendingPathComponent(name)
    let rect = extent ?? image.extent
    do {
      try context.writePNGRepresentation(
        of: image.cropped(to: rect), to: url, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
    } catch { throw PrepareError.storage }
  }

  private func classify(_ garment: CIImage) throws -> [LabelScore] {
    guard let model else { throw PrepareError.resources }
    let side = max(garment.extent.width, garment.extent.height)
    let square = CGRect(x: 0, y: 0, width: side, height: side)
    let centered = garment.transformed(
      by: CGAffineTransform(
        translationX: (side - garment.extent.width) / 2, y: (side - garment.extent.height) / 2))
    let onWhite = centered.composited(over: CIImage(color: .white).cropped(to: square))
    let small = onWhite.transformed(by: CGAffineTransform(scaleX: 224 / side, y: 224 / side))
    guard let cgImage = context.createCGImage(small, from: CGRect(x: 0, y: 0, width: 224, height: 224)),
      let constraint = model.modelDescription.inputDescriptionsByName["image"]?.imageConstraint
    else { throw PrepareError.unreadable }
    let input = try MLFeatureValue(cgImage: cgImage, constraint: constraint)
    let output = try model.prediction(from: MLDictionaryFeatureProvider(dictionary: ["image": input]))
    guard let array = output.featureValue(for: "embedding")?.multiArrayValue else { throw PrepareError.resources }
    let embedding = (0..<array.count).map { Float(truncating: array[$0]) }
    return labels.map { label in
      let best = label.embeddings.map { zip($0, embedding).reduce(0) { $0 + $1.0 * $1.1 } }.max() ?? -1
      var score = LabelScore()
      score.group = label.group
      score.value = label.value
      score.score = Double(best)
      return score
    }
    .sorted { $0.score > $1.score }
  }

  private func dominantColor(_ garment: CIImage, masked: Bool) -> [Double]? {
    guard masked else { return nil }
    let side: CGFloat = 96
    let scale = side / max(garment.extent.width, garment.extent.height)
    let small = garment.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
    let width = Int(small.extent.width.rounded(.down))
    let height = Int(small.extent.height.rounded(.down))
    guard width > 0, height > 0 else { return nil }
    var pixels = [UInt8](repeating: 0, count: width * height * 4)
    context.render(
      small, toBitmap: &pixels, rowBytes: width * 4, bounds: CGRect(x: 0, y: 0, width: width, height: height),
      format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
    var buckets: [Int: (count: Int, r: Double, g: Double, b: Double)] = [:]
    for index in stride(from: 0, to: pixels.count, by: 4) {
      let alpha = Double(pixels[index + 3])
      if alpha < 200 { continue }
      let a = max(alpha, 1) / 255
      let r = Double(pixels[index]) / a
      let g = Double(pixels[index + 1]) / a
      let b = Double(pixels[index + 2]) / a
      let key = (Int(r) >> 5) << 6 | (Int(g) >> 5) << 3 | (Int(b) >> 5)
      let current = buckets[key] ?? (0, 0, 0, 0)
      buckets[key] = (current.count + 1, current.r + r, current.g + g, current.b + b)
    }
    guard let top = buckets.values.max(by: { $0.count < $1.count }), top.count > 0 else { return nil }
    let count = Double(top.count)
    return [top.r / count, top.g / count, top.b / count].map { min(255, max(0, $0)) }
  }
}

public class ClosetVisionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ClosetVision")

    Function("isAvailable") { () -> Bool in
      true
    }

    AsyncFunction("prepare") { (sourceUri: String, id: String) throws -> PreparedGarment in
      try GarmentPipeline.shared.prepare(sourceUri: sourceUri, id: id)
    }
  }
}

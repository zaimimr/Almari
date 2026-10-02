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

struct Swatch: Record {
  @Field var rgb: [Double] = []
  @Field var share: Double = 0
}

struct GarmentRegionRecord: Record {
  @Field var kind: String = ""
  @Field var cutout: String = ""
  @Field var frame: [String: Double] = [:]
  @Field var share: Double = 0
  @Field var partial: Bool = false
}

struct GarmentParse: Record {
  @Field var regions: [GarmentRegionRecord] = []
  @Field var people: Int = 0
}

struct PrepareOptions: Record {
  @Field var cutout: String? = nil
  @Field var crop: [String: Double]? = nil
}

struct QualityRecord: Record {
  @Field var sharpness: Double = 0
  @Field var brightness: Double = 0
  @Field var clipped: [String] = []
  @Field var coverage: Double? = nil
  @Field var lightSpread: Double? = nil
}

struct PreparedGarment: Record {
  @Field var original: String = ""
  @Field var cutout: String? = nil
  @Field var enhanced: String? = nil
  @Field var quality: QualityRecord? = nil
  @Field var thumbnail: String? = nil
  @Field var frame: [String: Double]? = nil
  @Field var instances: Int = 0
  @Field var labels: [LabelScore] = []
  @Field var palette: [Swatch] = []
  @Field var embedding: String? = nil
  @Field var width: Int = 0
  @Field var height: Int = 0
  @Field var milliseconds: [String: Int] = [:]
}

enum PrepareError: Error, CustomStringConvertible, LocalizedError {
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

  var errorDescription: String? { description }
}

func paletteClusters(_ points: [SIMD3<Double>]) -> [(rgb: SIMD3<Double>, share: Double)] {
  guard points.count >= 16 else { return [] }
  let weights = SIMD3<Double>(0.2126, 0.7152, 0.0722)
  let sorted = points.sorted { ($0 * weights).sum() < ($1 * weights).sum() }
  var centers = (0..<4).map { sorted[(2 * $0 + 1) * sorted.count / 8] }
  var counts = [Int](repeating: 0, count: 4)
  for _ in 0..<12 {
    var sums = [SIMD3<Double>](repeating: .zero, count: 4)
    counts = [Int](repeating: 0, count: 4)
    for point in points {
      var best = 0
      var distance = Double.infinity
      for (cluster, center) in centers.enumerated() {
        let gap = point - center
        let squared = (gap * gap).sum()
        if squared < distance {
          distance = squared
          best = cluster
        }
      }
      sums[best] += point
      counts[best] += 1
    }
    for cluster in 0..<4 where counts[cluster] > 0 {
      centers[cluster] = sums[cluster] / Double(counts[cluster])
    }
  }
  var merged: [(rgb: SIMD3<Double>, count: Int)] = []
  for cluster in (0..<4).sorted(by: { counts[$0] > counts[$1] }) where counts[cluster] > 0 {
    if let near = merged.firstIndex(where: {
      let gap = $0.rgb - centers[cluster]
      return (gap * gap).sum() < 900
    }) {
      let count = merged[near].count + counts[cluster]
      merged[near].rgb = (merged[near].rgb * Double(merged[near].count) + centers[cluster] * Double(counts[cluster])) / Double(count)
      merged[near].count = count
    } else {
      merged.append((rgb: centers[cluster], count: counts[cluster]))
    }
  }
  let total = Double(points.count)
  return merged
    .filter { Double($0.count) / total >= 0.15 }
    .sorted { $0.count > $1.count }
    .prefix(3)
    .map { (rgb: $0.rgb, share: Double($0.count) / total) }
}

func encodeEmbedding(_ embedding: [Float]) -> String? {
  let peak = embedding.reduce(Float(0)) { max($0, abs($1)) }
  guard peak > 0 else { return nil }
  let bytes = embedding.map { UInt8(bitPattern: Int8(max(-127, min(127, ($0 / peak * 127).rounded())))) }
  return Data(bytes).base64EncodedString()
}

final class GarmentPipeline {
  static let shared = GarmentPipeline()

  private let queue = DispatchQueue(label: "closet.vision.prepare")
  private let context = CIContext(options: [.workingColorSpace: CGColorSpace(name: CGColorSpace.sRGB)!])
  private var model: MLModel?
  private var labels: [(group: String, value: String, embeddings: [[Float]])] = []
  private var parser: ClothesParser?

  private var bundle: Bundle? {
    let host = Bundle(for: GarmentPipeline.self)
    guard let url = host.url(forResource: "ClosetVisionResources", withExtension: "bundle") else { return nil }
    return Bundle(url: url)
  }

  private var photos: URL {
    FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("closet-photos", isDirectory: true)
  }

  func prepare(sourceUri: String, id: String, options: PrepareOptions?) throws -> PreparedGarment {
    try queue.sync { try run(sourceUri: sourceUri, id: id, options: options) }
  }

  func parseGarments(sourceUri: String, id: String) throws -> GarmentParse {
    try queue.sync {
      let source = sourceUri.hasPrefix("file://") ? URL(string: sourceUri)! : URL(fileURLWithPath: sourceUri)
      guard let loaded = CIImage(contentsOf: source, options: [.applyOrientationProperty: true]) else {
        throw PrepareError.unreadable
      }
      let image = scaled(
        loaded.transformed(by: CGAffineTransform(translationX: -loaded.extent.minX, y: -loaded.extent.minY)),
        longEdge: 2048)
      try FileManager.default.createDirectory(at: photos, withIntermediateDirectories: true)
      let parse = try loadParser().parse(image)
      var result = GarmentParse()
      result.people = parse.people
      for (index, region) in GarmentRegions.find(parse.grid, person: parse.people > 0).enumerated() {
        let name = "\(id)-region-\(index + 1).png"
        try write(parse.cutout(image, region: region), to: name, extent: nil)
        var record = GarmentRegionRecord()
        record.kind = region.kind
        record.cutout = name
        record.frame = parse.frame(of: region)
        record.share = region.share
        record.partial = region.partial
        result.regions.append(record)
      }
      return result
    }
  }

  func parseSelfie(_ image: CIImage) -> ClothesParse? {
    queue.sync { try? loadParser().parse(image) }
  }

  private func loadParser() throws -> ClothesParser {
    if let parser { return parser }
    guard let bundle, let url = bundle.url(forResource: "ClothesParser", withExtension: "mlmodelc") else {
      throw PrepareError.resources
    }
    let configuration = MLModelConfiguration()
    #if targetEnvironment(simulator)
      configuration.computeUnits = .cpuOnly
    #else
      configuration.computeUnits = .all
    #endif
    let loaded = ClothesParser(model: try MLModel(contentsOf: url, configuration: configuration), context: context)
    parser = loaded
    return loaded
  }

  private func cropped(_ image: CIImage, to frame: [String: Double]) -> CIImage {
    let x = CGFloat(frame["x"] ?? 0)
    let y = CGFloat(frame["y"] ?? 0)
    let width = CGFloat(frame["width"] ?? 1)
    let height = CGFloat(frame["height"] ?? 1)
    let rect = CGRect(
      x: x * image.extent.width, y: (1 - y - height) * image.extent.height,
      width: width * image.extent.width, height: height * image.extent.height
    ).integral.intersection(image.extent)
    guard rect.width >= 16, rect.height >= 16 else { return image }
    return image.cropped(to: rect).transformed(by: CGAffineTransform(translationX: -rect.minX, y: -rect.minY))
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

  private func run(sourceUri: String, id: String, options: PrepareOptions?) throws -> PreparedGarment {
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
    if let crop = options?.crop { image = cropped(image, to: crop) }
    result.width = Int(image.extent.width)
    result.height = Int(image.extent.height)
    timings["load"] = elapsed(started)

    let maskStart = Date()
    var garment = image
    var found = false
    var mask: CIImage? = nil
    let enhancer = GarmentEnhancer(context: context)
    if let cutout = options?.cutout {
      guard let loaded = CIImage(contentsOf: photos.appendingPathComponent(cutout)) else {
        throw PrepareError.unreadable
      }
      garment = scaled(
        loaded.transformed(by: CGAffineTransform(translationX: -loaded.extent.minX, y: -loaded.extent.minY)),
        longEdge: 1536)
      result.instances = 1
      found = true
    } else {
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
        if let scaledMask = try? observation.generateScaledMaskForImage(
          forInstances: observation.allInstances, from: handler)
        {
          mask = CIImage(cvPixelBuffer: scaledMask)
        }
        garment = scaled(CIImage(cvPixelBuffer: buffer), longEdge: 1536)
        found = true
      }
    }
    if found {
      let side = (max(garment.extent.width, garment.extent.height) * 1.06).rounded(.up)
      let square = CGRect(x: 0, y: 0, width: side, height: side)
      let offsetX = ((side - garment.extent.width) / 2).rounded()
      let offsetY = ((side - garment.extent.height) / 2).rounded()
      let place = CGAffineTransform(translationX: offsetX, y: offsetY)
      let canvas = CIImage(color: .clear).cropped(to: square)
      let cutout = "\(id).png"
      try write(garment.transformed(by: place).composited(over: canvas), to: cutout, extent: square)
      result.cutout = cutout
      let correction = mask.map { enhancer.correction(photo: image, mask: $0) } ?? LightCorrection()
      let improved = enhancer.withShadow(
        enhancer.enhance(garment, correction: correction).transformed(by: place).composited(over: canvas))
      let enhanced = "\(id)-enhanced.png"
      try write(improved, to: enhanced, extent: square)
      result.enhanced = enhanced
      let thumbnail = "\(id)-thumb.png"
      try write(scaled(improved, longEdge: 512), to: thumbnail, extent: nil)
      result.thumbnail = thumbnail
      let margin = side * 0.03
      let left = max(0, offsetX - margin)
      let top = max(0, offsetY - margin)
      result.frame = [
        "x": Double(left / side),
        "y": Double(top / side),
        "width": Double(min(side - left, garment.extent.width + margin * 2) / side),
        "height": Double(min(side - top, garment.extent.height + margin * 2) / side),
      ]
    }
    timings["cutout"] = elapsed(maskStart)
    let qualityStart = Date()
    let measure = PhotoQuality(enhancer: enhancer).measure(photo: image, mask: mask)
    var quality = QualityRecord()
    quality.sharpness = measure.sharpness
    quality.brightness = measure.brightness
    quality.clipped = measure.clipped
    quality.coverage = measure.coverage
    quality.lightSpread = measure.lightSpread
    result.quality = quality
    timings["quality"] = elapsed(qualityStart)

    let classifyStart = Date()
    try loadResources()
    let vector = try embed(garment)
    result.labels = score(vector)
    result.embedding = encodeEmbedding(vector)
    timings["classify"] = elapsed(classifyStart)
    let paletteStart = Date()
    result.palette = palette(garment, masked: result.cutout != nil)
    timings["palette"] = elapsed(paletteStart)
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

  private func embed(_ garment: CIImage) throws -> [Float] {
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
    return (0..<array.count).map { Float(truncating: array[$0]) }
  }

  private func score(_ embedding: [Float]) -> [LabelScore] {
    labels.map { label in
      let best = label.embeddings.map { zip($0, embedding).reduce(0) { $0 + $1.0 * $1.1 } }.max() ?? -1
      var score = LabelScore()
      score.group = label.group
      score.value = label.value
      score.score = Double(best)
      return score
    }
    .sorted { $0.score > $1.score }
  }

  private func palette(_ garment: CIImage, masked: Bool) -> [Swatch] {
    guard masked else { return [] }
    let side: CGFloat = 96
    let scale = side / max(garment.extent.width, garment.extent.height)
    let small = garment.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
    let width = Int(small.extent.width.rounded(.down))
    let height = Int(small.extent.height.rounded(.down))
    guard width > 0, height > 0 else { return [] }
    var pixels = [UInt8](repeating: 0, count: width * height * 4)
    context.render(
      small, toBitmap: &pixels, rowBytes: width * 4, bounds: CGRect(x: 0, y: 0, width: width, height: height),
      format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
    var points: [SIMD3<Double>] = []
    for index in stride(from: 0, to: pixels.count, by: 4) {
      let alpha = Double(pixels[index + 3])
      if alpha < 200 { continue }
      let a = alpha / 255
      let point = SIMD3(Double(pixels[index]), Double(pixels[index + 1]), Double(pixels[index + 2])) / a
      points.append(point.clamped(lowerBound: SIMD3(repeating: 0), upperBound: SIMD3(repeating: 255)))
    }
    return paletteClusters(points).map { cluster in
      var swatch = Swatch()
      swatch.rgb = [cluster.rgb.x, cluster.rgb.y, cluster.rgb.z].map { $0.rounded() }
      swatch.share = cluster.share
      return swatch
    }
  }
}

public class ClosetVisionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ClosetVision")

    Function("isAvailable") { () -> Bool in
      true
    }

    AsyncFunction("prepare") { (sourceUri: String, id: String, options: PrepareOptions?) throws -> PreparedGarment in
      try GarmentPipeline.shared.prepare(sourceUri: sourceUri, id: id, options: options)
    }

    AsyncFunction("analyzeSelfie") { (uri: String) throws -> SelfieResult in
      try SelfieColours.shared.analyze(uri: uri)
    }

    AsyncFunction("geocodeCity") { (name: String) async -> CityResult? in
      await WeatherLookup.city(name)
    }

    AsyncFunction("forecast") { (latitude: Double, longitude: Double) async -> ForecastRecord? in
      await WeatherLookup.forecast(latitude: latitude, longitude: longitude)
    }

    AsyncFunction("parseGarments") { (sourceUri: String, id: String) throws -> GarmentParse in
      try GarmentPipeline.shared.parseGarments(sourceUri: sourceUri, id: id)
    }

    AsyncFunction("readLabel") { (sourceUri: String, id: String) throws -> ReadLabelResult in
      try CareLabelReader.shared.read(sourceUri: sourceUri, id: id)
    }

    AsyncFunction("labelModelAvailable") { () -> Bool in
      CareLabelModel.isAvailable()
    }

    AsyncFunction("extractLabel") { (text: String) async -> LabelExtraction in
      var result = LabelExtraction()
      result.json = await CareLabelModel.extract(text)
      return result
    }
  }
}

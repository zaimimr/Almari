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
  @Field var area: [String: Double]? = nil
  @Field var width: Int = 0
  @Field var height: Int = 0
  @Field var milliseconds: [String: Int] = [:]
}

struct CutoutEditRecord: Record {
  @Field var cutout: String = ""
  @Field var enhanced: String = ""
  @Field var thumbnail: String = ""
  @Field var frame: [String: Double] = [:]
  @Field var area: [String: Double] = [:]
}

struct PlacedGarment {
  let cutout: String
  let enhanced: String
  let thumbnail: String
  let frame: [String: Double]
  let side: CGFloat
  let offset: CGPoint
}

enum PrepareError: Error, CustomStringConvertible, LocalizedError {
  case unreadable
  case resources
  case storage
  case empty

  var description: String {
    switch self {
    case .unreadable: return "unreadable"
    case .resources: return "resources"
    case .storage: return "storage"
    case .empty: return "empty"
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

  var photos: URL {
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
        try write(regionCutout(image, parse: parse, region: region), to: name, extent: nil)
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

  func studioInput(sourceUri: String, id: String) throws -> String {
    try queue.sync {
      let source = sourceUri.hasPrefix("file://") ? URL(string: sourceUri)! : URL(fileURLWithPath: sourceUri)
      guard let loaded = CIImage(contentsOf: source, options: [.applyOrientationProperty: true]) else {
        throw PrepareError.unreadable
      }
      let image = scaled(
        loaded.transformed(by: CGAffineTransform(translationX: -loaded.extent.minX, y: -loaded.extent.minY)),
        longEdge: 500)
      let extent = CGRect(
        x: 0, y: 0, width: min(500, image.extent.width.rounded(.down)),
        height: min(500, image.extent.height.rounded(.down)))
      guard extent.width > 0, extent.height > 0 else { throw PrepareError.unreadable }
      let flat = CutoutRepair.repaired(image, context: context).composited(over: CIImage(color: .white))
        .cropped(to: extent)
      try FileManager.default.createDirectory(at: photos, withIntermediateDirectories: true)
      let name = "\(id)-studio-input.jpg"
      do {
        try context.writeJPEGRepresentation(
          of: flat, to: photos.appendingPathComponent(name), colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!,
          options: [kCGImageDestinationLossyCompressionQuality as CIImageRepresentationOption: 0.9])
      } catch { throw PrepareError.storage }
      return name
    }
  }

  func whitenBackground(sourceUri: String, id: String) throws -> String {
    let source = sourceUri.hasPrefix("file://") ? URL(string: sourceUri)! : URL(fileURLWithPath: sourceUri)
    try FileManager.default.createDirectory(at: photos, withIntermediateDirectories: true)
    let name = "\(id)-studio.jpg"
    guard StudioBackground.whiten(source: source, target: photos.appendingPathComponent(name)) else {
      throw PrepareError.unreadable
    }
    return name
  }

  func workingPhoto(sourceUri: String) throws -> (image: CIImage, picture: CGImage) {
    let source = sourceUri.hasPrefix("file://") ? URL(string: sourceUri)! : URL(fileURLWithPath: sourceUri)
    guard let loaded = CIImage(contentsOf: source, options: [.applyOrientationProperty: true]) else {
      throw PrepareError.unreadable
    }
    let image = scaled(
      loaded.transformed(by: CGAffineTransform(translationX: -loaded.extent.minX, y: -loaded.extent.minY)),
      longEdge: 2048)
    guard let picture = render(image) else { throw PrepareError.unreadable }
    return (image, picture)
  }

  func saveEdit(photo: CIImage, mask: CGImage, bounds: CGRect, id: String) throws -> CutoutEditRecord {
    try queue.sync {
      let height = photo.extent.height
      let rect = CGRect(x: bounds.minX, y: height - bounds.maxY, width: bounds.width, height: bounds.height)
      let cover = CIImage(cgImage: mask)
      let cut = photo.applyingFilter(
        "CIBlendWithMask",
        parameters: [
          kCIInputBackgroundImageKey: CIImage(color: .clear).cropped(to: photo.extent),
          kCIInputMaskImageKey: cover,
        ]
      )
      .cropped(to: rect)
      .transformed(by: CGAffineTransform(translationX: -rect.minX, y: -rect.minY))
      let garment = scaled(cut, longEdge: 1536)
      let enhancer = GarmentEnhancer(context: context)
      try FileManager.default.createDirectory(at: photos, withIntermediateDirectories: true)
      let placed = try place(
        garment, correction: enhancer.correction(photo: photo, mask: cover), id: id, enhancer: enhancer)
      var record = CutoutEditRecord()
      record.cutout = placed.cutout
      record.enhanced = placed.enhanced
      record.thumbnail = placed.thumbnail
      record.frame = placed.frame
      record.area = CutoutMapping.record(
        CutoutMapping.area(
          garmentOrigin: bounds.origin, scale: garment.extent.width / rect.width, side: placed.side,
          offset: placed.offset, garment: garment.extent.size, photo: photo.extent.size))
      return record
    }
  }

  func render(_ image: CIImage) -> CGImage? {
    context.createCGImage(
      image, from: image.extent, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
  }

  private func eroded(_ garment: CIImage) -> CIImage {
    let extent = garment.extent
    let alpha = garment.applyingFilter(
      "CIColorMatrix",
      parameters: [
        "inputRVector": CIVector(x: 0, y: 0, z: 0, w: 1),
        "inputGVector": CIVector(x: 0, y: 0, z: 0, w: 1),
        "inputBVector": CIVector(x: 0, y: 0, z: 0, w: 1),
        "inputAVector": CIVector(x: 0, y: 0, z: 0, w: 0),
        "inputBiasVector": CIVector(x: 0, y: 0, z: 0, w: 1),
      ]
    ).cropped(to: extent)
    let shrunk = alpha.applyingFilter("CIMorphologyMinimum", parameters: [kCIInputRadiusKey: 2.0])
      .cropped(to: extent)
    return garment.applyingFilter(
      "CIBlendWithMask",
      parameters: [
        kCIInputBackgroundImageKey: CIImage(color: .clear).cropped(to: extent),
        kCIInputMaskImageKey: shrunk,
      ]
    ).cropped(to: extent)
  }

  private func place(
    _ garment: CIImage, correction: LightCorrection, id: String, enhancer: GarmentEnhancer
  ) throws -> PlacedGarment {
    let side = (max(garment.extent.width, garment.extent.height) * 1.2).rounded(.up)
    let square = CGRect(x: 0, y: 0, width: side, height: side)
    let offsetX = ((side - garment.extent.width) / 2).rounded()
    let offsetY = ((side - garment.extent.height) / 2).rounded()
    let place = CGAffineTransform(translationX: offsetX, y: offsetY)
    let canvas = CIImage(color: .clear).cropped(to: square)
    let cutout = "\(id).png"
    try write(garment.transformed(by: place).composited(over: canvas), to: cutout, extent: square)
    let improved = enhancer.withShadow(
      enhancer.enhance(garment, correction: correction).transformed(by: place).composited(over: canvas))
    let enhanced = "\(id)-enhanced.png"
    try write(improved, to: enhanced, extent: square)
    let thumbnail = "\(id)-thumb.png"
    try write(scaled(improved, longEdge: 512), to: thumbnail, extent: nil)
    let margin = side * 0.03
    let left = max(0, offsetX - margin)
    let top = max(0, offsetY - margin)
    return PlacedGarment(
      cutout: cutout, enhanced: enhanced, thumbnail: thumbnail,
      frame: [
        "x": Double(left / side),
        "y": Double(top / side),
        "width": Double(min(side - left, garment.extent.width + margin * 2) / side),
        "height": Double(min(side - top, garment.extent.height + margin * 2) / side),
      ], side: side, offset: CGPoint(x: offsetX, y: offsetY))
  }

  static func foregroundRequest() -> VNGenerateForegroundInstanceMaskRequest {
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
    return request
  }

  func parseHeld(_ image: CIImage) -> (parse: ClothesParse, chroma: [SIMD2<Double>])? {
    queue.sync {
      guard let parse = try? loadParser().parse(image) else { return nil }
      return (parse, chroma(image, parse: parse))
    }
  }

  func parseSelfie(_ image: CIImage) -> ClothesParse? {
    queue.sync { try? loadParser().parse(image) }
  }

  func makeParser() throws -> ClothesParser {
    guard let bundle, let url = bundle.url(forResource: "ClothesParser", withExtension: "mlmodelc") else {
      throw PrepareError.resources
    }
    let configuration = MLModelConfiguration()
    #if targetEnvironment(simulator)
      configuration.computeUnits = .cpuOnly
    #else
      configuration.computeUnits = .all
    #endif
    return ClothesParser(model: try MLModel(contentsOf: url, configuration: configuration), context: context)
  }

  private func loadParser() throws -> ClothesParser {
    if let parser { return parser }
    let loaded = try makeParser()
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

  private static let wholeFrame = 0.97

  private func coverage(_ mask: CIImage, enhancer: GarmentEnhancer) -> Double {
    let cover = enhancer.bitmap(mask, longEdge: 128)
    let total = cover.width * cover.height
    return Double((0..<total).filter { cover.value($0) > 0.5 }.count) / Double(max(total, 1))
  }

  private func heldCutout(_ image: CIImage) -> (garment: CIImage, mask: CIImage)? {
    guard let parse = try? loadParser().parse(image),
      let region = GarmentRegions.held(parse.grid)
    else { return nil }
    return (parse.cutout(image, region: region), parse.mask(of: region))
  }

  private static let guideGrowth = 6
  private static let spanShare = 0.2

  private func regionCutout(_ image: CIImage, parse: ClothesParse, region: FoundRegion) -> CIImage {
    let fallback = parse.cutout(image, region: region)
    let rect = parse.cutoutRect(of: region)
    let origin = CGAffineTransform(translationX: -rect.minX, y: -rect.minY)
    let crop = image.cropped(to: rect).transformed(by: origin)
    guard rect.width >= 16, rect.height >= 16, let working = context.createCGImage(crop, from: crop.extent) else {
      return fallback
    }
    let request = Self.foregroundRequest()
    let handler = VNImageRequestHandler(cgImage: working)
    guard (try? handler.perform([request])) != nil, let observation = request.results?.first else {
      return fallback
    }
    let enhancer = GarmentEnhancer(context: context)
    let guide = parse.mask(of: region, grow: Self.guideGrowth).cropped(to: rect).transformed(by: origin)
    let guideMap = enhancer.bitmap(guide, longEdge: 128)
    var best: (mask: CIImage, overlap: Int, size: Int)? = nil
    for instance in observation.allInstances {
      guard
        let buffer = try? observation.generateScaledMaskForImage(forInstances: IndexSet(integer: instance), from: handler)
      else { continue }
      let mask = CIImage(cvPixelBuffer: buffer)
      let map = enhancer.bitmap(mask, longEdge: 128)
      guard map.width == guideMap.width, map.height == guideMap.height else { continue }
      var overlap = 0
      var size = 0
      for index in 0..<(map.width * map.height) where map.value(index) > 0.5 {
        size += 1
        if guideMap.value(index) > 0.5 { overlap += 1 }
      }
      if overlap > (best?.overlap ?? 0) { best = (mask, overlap, size) }
    }
    guard let best else { return fallback }
    let spans = Double(best.size - best.overlap) / Double(max(best.size, 1)) > Self.spanShare
    let mask =
      spans
      ? best.mask.applyingFilter("CIMultiplyCompositing", parameters: [kCIInputBackgroundImageKey: guide])
        .cropped(to: crop.extent)
      : best.mask
    let cut = crop.applyingFilter(
      "CIBlendWithMask",
      parameters: [
        kCIInputBackgroundImageKey: CIImage(color: .clear).cropped(to: crop.extent),
        kCIInputMaskImageKey: mask,
      ]
    )
    .cropped(to: crop.extent)
    guard let bounds = maskBounds(mask, extent: crop.extent, enhancer: enhancer) else { return fallback }
    return cut.cropped(to: bounds).transformed(by: CGAffineTransform(translationX: -bounds.minX, y: -bounds.minY))
  }

  private func maskBounds(_ mask: CIImage, extent: CGRect, enhancer: GarmentEnhancer) -> CGRect? {
    let map = enhancer.bitmap(mask, longEdge: 256)
    var minX = map.width
    var minY = map.height
    var maxX = -1
    var maxY = -1
    for y in 0..<map.height {
      for x in 0..<map.width where map.value(y * map.width + x) > 0.1 {
        minX = min(minX, x)
        maxX = max(maxX, x)
        minY = min(minY, y)
        maxY = max(maxY, y)
      }
    }
    guard maxX >= minX, maxY >= minY else { return nil }
    let scaleX = extent.width / CGFloat(map.width)
    let scaleY = extent.height / CGFloat(map.height)
    let bounds = CGRect(
      x: CGFloat(minX - 1) * scaleX, y: extent.height - CGFloat(maxY + 2) * scaleY,
      width: CGFloat(maxX - minX + 3) * scaleX, height: CGFloat(maxY - minY + 3) * scaleY
    ).integral.intersection(extent)
    return bounds.width >= 16 && bounds.height >= 16 ? bounds : nil
  }

  private func chroma(_ image: CIImage, parse: ClothesParse) -> [SIMD2<Double>] {
    let width = parse.grid.width
    let height = parse.grid.height
    let area = parse.area
    let small = image.cropped(to: area)
      .transformed(by: CGAffineTransform(translationX: -area.minX, y: -area.minY))
      .transformed(by: CGAffineTransform(scaleX: CGFloat(width) / area.width, y: CGFloat(height) / area.height))
    var pixels = [UInt8](repeating: 0, count: width * height * 4)
    context.render(
      small, toBitmap: &pixels, rowBytes: width * 4, bounds: CGRect(x: 0, y: 0, width: width, height: height),
      format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
    return (0..<width * height).map { index in
      let lab = GarmentEnhancer.lab(
        red: Double(pixels[index * 4]), green: Double(pixels[index * 4 + 1]), blue: Double(pixels[index * 4 + 2]))
      return SIMD2(lab.a, lab.b)
    }
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
      let region = loaded.transformed(
        by: CGAffineTransform(translationX: -loaded.extent.minX, y: -loaded.extent.minY))
      garment = scaled(region, longEdge: 1536)
      result.instances = 1
      found = true
    } else {
      guard let working = context.createCGImage(image, from: image.extent) else { throw PrepareError.unreadable }
      let request = Self.foregroundRequest()
      let handler = VNImageRequestHandler(cgImage: working)
      if (try? handler.perform([request])) != nil, let observation = request.results?.first,
        !observation.allInstances.isEmpty,
        let buffer = try? observation.generateMaskedImage(
          ofInstances: observation.allInstances, from: handler, croppedToInstancesExtent: true)
      {
        let scaledMask = (try? observation.generateScaledMaskForImage(
          forInstances: observation.allInstances, from: handler)).map { CIImage(cvPixelBuffer: $0) }
        if scaledMask.map({ coverage($0, enhancer: enhancer) < Self.wholeFrame }) ?? true {
          result.instances = observation.allInstances.count
          mask = scaledMask
          garment = scaled(CIImage(cvPixelBuffer: buffer), longEdge: 1536)
          found = true
        }
      }
      if !found, let held = heldCutout(image) {
        result.instances = 1
        mask = held.mask
        garment = scaled(held.garment, longEdge: 1536)
        found = true
      }
    }
    if found {
      let correction = mask.map { enhancer.correction(photo: image, mask: $0) } ?? LightCorrection()
      let placed = try place(eroded(garment), correction: correction, id: id, enhancer: enhancer)
      result.cutout = placed.cutout
      result.enhanced = placed.enhanced
      result.thumbnail = placed.thumbnail
      result.frame = placed.frame
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

  func scaled(_ image: CIImage, longEdge: CGFloat) -> CIImage {
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

    AsyncFunction("sampleSelfie") { (uri: String, point: SelfiePoint, gains: [Double]) throws -> [Double]? in
      try SelfieColours.shared.sample(
        uri: uri, part: point.part, x: point.x, y: point.y, radius: point.radius, gains: gains)
    }

    AsyncFunction("palettePixels") { (uri: String) throws -> [[Double]] in
      try SelfieColours.shared.palettePixels(uri: uri)
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

    AsyncFunction("studioInput") { (sourceUri: String, id: String) throws -> String in
      try GarmentPipeline.shared.studioInput(sourceUri: sourceUri, id: id)
    }

    AsyncFunction("whitenBackground") { (sourceUri: String, id: String) throws -> String in
      try GarmentPipeline.shared.whitenBackground(sourceUri: sourceUri, id: id)
    }

    View(SelfieCameraView.self) {
      Events("onReading", "onState")

      AsyncFunction("capture") { (view: SelfieCameraView, promise: Promise) in
        view.capture(promise)
      }
    }

    View(LiveScanView.self) {
      Events("onFrame", "onCamera")

      Prop("facing") { (view: LiveScanView, facing: String?) in
        view.facing = facing ?? "back"
      }

      Prop("active") { (view: LiveScanView, active: Bool?) in
        view.active = active ?? false
      }

      Prop("fps") { (view: LiveScanView, fps: Double?) in
        view.fps = fps ?? 4
      }

      Prop("frozen") { (view: LiveScanView, frozen: Bool?) in
        view.frozen = frozen ?? false
      }

      AsyncFunction("capture") { (view: LiveScanView, id: String, box: [String: Double], kind: String, promise: Promise) in
        view.capture(id: id, box: box, kind: kind, promise: promise)
      }.runOnQueue(.main)
    }

    View(CutoutEditorView.self) {
      Events("onReady", "onEdit", "onSelect", "onSelecting")

      Prop("labels") { (view: CutoutEditorView, labels: [String: String]?) in
        view.labels = labels ?? [:]
      }

      Prop("original") { (view: CutoutEditorView, original: String?) in
        view.original = original
      }

      Prop("cutout") { (view: CutoutEditorView, cutout: String?) in
        view.cutout = cutout
      }

      Prop("area") { (view: CutoutEditorView, area: [String: Double]?) in
        view.area = area
      }

      Prop("mode") { (view: CutoutEditorView, mode: String?) in
        view.mode = mode ?? "erase"
      }

      Prop("brushSize") { (view: CutoutEditorView, size: Double?) in
        view.brush = CGFloat(size ?? 24)
      }

      OnViewDidUpdateProps { (view: CutoutEditorView) in
        view.load()
      }

      AsyncFunction("undo") { (view: CutoutEditorView) in
        view.undo()
      }.runOnQueue(.main)

      AsyncFunction("reset") { (view: CutoutEditorView) in
        view.reset()
      }.runOnQueue(.main)

      AsyncFunction("zoom") { (view: CutoutEditorView, closer: Bool) in
        view.zoom(in: closer)
      }.runOnQueue(.main)

      AsyncFunction("save") { (view: CutoutEditorView, id: String, promise: Promise) in
        view.save(id: id, promise: promise)
      }.runOnQueue(.main)
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

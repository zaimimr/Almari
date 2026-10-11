import CoreImage
import CoreML
import Foundation
import Vision

enum InspirationTestError: Error { case failed(String) }

func require(_ condition: Bool, _ message: String) throws {
  if !condition { throw InspirationTestError.failed(message) }
}

@main
struct InspirationTests {
  static func main() throws {
    let folder = URL(fileURLWithPath: CommandLine.arguments[1])
    let source = URL(fileURLWithPath: CommandLine.arguments[2])
    let output = URL(fileURLWithPath: CommandLine.arguments[3], isDirectory: true)
    let context = CIContext(options: [.workingColorSpace: CGColorSpace(name: CGColorSpace.sRGB)!])
    let configuration = MLModelConfiguration()
    configuration.computeUnits = .cpuOnly
    let parser = ClothesParser(model: try MLModel(contentsOf: folder.appendingPathComponent("ClothesParser.mlmodelc"), configuration: configuration), context: context)
    let encoder = try MLModel(contentsOf: folder.appendingPathComponent("GarmentEncoder.mlmodelc"), configuration: configuration)
    let data = try Data(contentsOf: folder.appendingPathComponent("garment-labels.json"))
    let labels = (try JSONSerialization.jsonObject(with: data) as! [String: Any])["labels"] as! [[String: Any]]
    guard let loaded = CIImage(contentsOf: source, options: [.applyOrientationProperty: true]) else { throw InspirationTestError.failed("Unreadable fixture") }
    let photo = PhotoPreparation.scaled(loaded.transformed(by: CGAffineTransform(translationX: -loaded.extent.minX, y: -loaded.extent.minY)), longEdge: 2048)
    let parse = try parser.parse(photo)
    let sourceBefore = try Data(contentsOf: source)
    let regions = InspirationRegions.extract(photo: photo, parse: parse, context: context, cutout: { region in
      let mask = parse.mask(of: region)
      return photo.applyingFilter("CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: CIImage(color: .clear).cropped(to: photo.extent), kCIInputMaskImageKey: mask])
        .cropped(to: CGRect(x: CGFloat(region.minX) / CGFloat(parse.grid.width) * photo.extent.width, y: CGFloat(parse.grid.height - region.maxY - 1) / CGFloat(parse.grid.height) * photo.extent.height, width: CGFloat(region.maxX - region.minX + 1) / CGFloat(parse.grid.width) * photo.extent.width, height: CGFloat(region.maxY - region.minY + 1) / CGFloat(parse.grid.height) * photo.extent.height))
    }, foregroundRequest: { VNGenerateForegroundInstanceMaskRequest() })
    try require(regions.count >= 2, "Outfit fixture must have independently extracted garments")
    try require(regions.contains { $0.kind == "upper" || $0.kind == "dress" }, "Outfit needs main clothing region")
    try require(regions.contains { $0.kind == "pants" || $0.kind == "skirt" || $0.kind == "dress" }, "Outfit needs lower clothing region")
    try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
    var signatures: [[String: Any]] = []
    for (index, region) in regions.enumerated() {
      let garment = region.garment.transformed(by: CGAffineTransform(translationX: -region.garment.extent.minX, y: -region.garment.extent.minY))
      let side = max(garment.extent.width, garment.extent.height)
      let square = CGRect(x: 0, y: 0, width: side, height: side)
      let centered = garment.transformed(by: CGAffineTransform(translationX: (side - garment.extent.width) / 2, y: (side - garment.extent.height) / 2)).composited(over: CIImage(color: .white).cropped(to: square))
      let small = centered.transformed(by: CGAffineTransform(scaleX: 224 / side, y: 224 / side))
      guard let image = context.createCGImage(small, from: CGRect(x: 0, y: 0, width: 224, height: 224)), let constraint = encoder.modelDescription.inputDescriptionsByName["image"]?.imageConstraint else { throw InspirationTestError.failed("No garment image") }
      let prediction = try encoder.prediction(from: MLDictionaryFeatureProvider(dictionary: ["image": try MLFeatureValue(cgImage: image, constraint: constraint)]))
      guard let array = prediction.featureValue(for: "embedding")?.multiArrayValue else { throw InspirationTestError.failed("No garment embedding") }
      let embedding = (0..<array.count).map { Double(truncating: array[$0]) }
      try require(embedding.allSatisfy { $0.isFinite } && embedding.count > 64, "Invalid per-garment embedding")
      let ranked = labels.filter { $0["group"] as? String == "kind" }.map { label -> (String, Double) in
        let vectors = label["embeddings"] as! [[Double]]
        let score = vectors.map { zip($0, embedding).reduce(0) { $0 + $1.0 * $1.1 } }.max() ?? -1
        return (label["value"] as! String, score)
      }.sorted { $0.1 > $1.1 }
      try require((ranked.first?.1 ?? -1) > 0.095, "No clothing classification for region \(region.kind)")
      try context.writePNGRepresentation(of: garment, to: output.appendingPathComponent("\(index)-\(region.kind).png"), format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
      signatures.append(["region": region.kind, "kind": ranked.first!.0, "score": ranked.first!.1, "embeddingDimensions": embedding.count, "partial": region.partial])
    }
    try require(try Data(contentsOf: source) == sourceBefore, "Analysis modified the source photo")
    try JSONSerialization.data(withJSONObject: ["people": parse.people, "garments": signatures], options: [.prettyPrinted, .sortedKeys]).write(to: output.appendingPathComponent("analysis.json"))
    print("PASS: independently parsed and embedded \(regions.count) garments from \(source.lastPathComponent), source unchanged")
  }
}

import CoreImage
import CoreML
import CryptoKit
import Foundation
import Vision

struct PhotoCase: Decodable {
  let file: String
  let sha256: String
  let people: Int
  let kind: String
  let pick: [Double]
  let keep: [[Double]]
  let exclude: [[Double]]
}

enum PhotoTestError: Error {
  case failed(String)
}

func require(_ condition: Bool, _ message: String) throws {
  if !condition { throw PhotoTestError.failed(message) }
}

func readPhoto(_ item: PhotoCase, folder: URL) throws -> CIImage {
  let url = folder.appendingPathComponent(item.file)
  let bytes = try Data(contentsOf: url)
  let hash = SHA256.hash(data: bytes).map { String(format: "%02x", $0) }.joined()
  try require(hash == item.sha256, "Fixture changed: \(item.file)")
  guard let loaded = CIImage(data: bytes, options: [.applyOrientationProperty: true]) else {
    throw PhotoTestError.failed("Unreadable photograph: \(item.file)")
  }
  let normalized = loaded.transformed(by: CGAffineTransform(translationX: -loaded.extent.minX, y: -loaded.extent.minY))
  return PhotoPreparation.scaled(normalized, longEdge: 2048)
}

func selection(_ item: PhotoCase, photo: CIImage, parse: ClothesParse, context: CIContext) throws -> (alpha: [UInt8], width: Int, height: Int) {
  try require(item.pick.count == 2 && item.pick.allSatisfy { $0 >= 0 && $0 < 1 }, "Invalid selection point")
  let space = CGColorSpace(name: CGColorSpace.sRGB)!
  guard let picture = context.createCGImage(photo, from: photo.extent, format: .RGBA8, colorSpace: space) else {
    throw PhotoTestError.failed("Could not render photograph")
  }
  let selector = CutoutSelector(
    photo: photo, picture: picture,
    foregroundRequest: { VNGenerateForegroundInstanceMaskRequest() },
    parsePhoto: { image in (parse, parse.colours(image, context: context)) },
    renderMask: { context.createCGImage($0, from: $0.extent, format: .RGBA8, colorSpace: space) })
  guard let alpha = selector.select(at: CGPoint(x: item.pick[0], y: item.pick[1])) else {
    throw PhotoTestError.failed("No garment selection")
  }
  return (alpha, picture.width, picture.height)
}

func writeReview(_ item: PhotoCase, photo: CIImage, alpha: [UInt8], context: CIContext, output: URL) throws {
  let width = Int(photo.extent.width)
  let height = Int(photo.extent.height)
  guard let provider = CGDataProvider(data: Data(alpha) as CFData),
    let mask = CGImage(
      width: width, height: height, bitsPerComponent: 8, bitsPerPixel: 8, bytesPerRow: width,
      space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue),
      provider: provider, decode: nil, shouldInterpolate: false, intent: .defaultIntent)
  else { throw PhotoTestError.failed("Could not render selection mask") }
  let inside = alpha.indices.filter { alpha[$0] > 0 }
  guard let minX = inside.map({ $0 % width }).min(), let maxX = inside.map({ $0 % width }).max(),
    let minY = inside.map({ $0 / width }).min(), let maxY = inside.map({ $0 / width }).max()
  else { throw PhotoTestError.failed("Empty selection mask") }
  let bounds = CGRect(x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1)
  let cutout = PhotoPreparation.cutout(photo, mask: mask, bounds: bounds)
  guard let input = PhotoPreparation.studioInput(cutout, context: context) else {
    throw PhotoTestError.failed("Could not prepare real-photo Studio input")
  }
  try require(input.extent.width <= 500 && input.extent.height <= 500, "Studio input exceeds provider limit")
  let stem = URL(fileURLWithPath: item.file).deletingPathExtension().lastPathComponent + "-" + item.kind
  let space = CGColorSpace(name: CGColorSpace.sRGB)!
  for (suffix, image) in [("mask", CIImage(cgImage: mask)), ("cutout", cutout), ("input", input)] {
    try context.writePNGRepresentation(
      of: image, to: output.appendingPathComponent(stem + "-" + suffix + ".png"),
      format: .RGBA8, colorSpace: space)
  }
  let metadata: [String: Any] = [
    "sourceSha256": item.sha256, "kind": item.kind, "pick": item.pick,
    "keep": item.keep, "exclude": item.exclude,
    "maskSha256": SHA256.hash(data: Data(alpha)).map { String(format: "%02x", $0) }.joined(),
    "inputWidth": Int(input.extent.width), "inputHeight": Int(input.extent.height),
    "bounds": [minX, minY, maxX - minX + 1, maxY - minY + 1],
    "inputSha256": SHA256.hash(data: try Data(contentsOf: output.appendingPathComponent(stem + "-input.png")))
      .map { String(format: "%02x", $0) }.joined(),
    "inference": false,
  ]
  try JSONSerialization.data(withJSONObject: metadata, options: [.prettyPrinted, .sortedKeys])
    .write(to: output.appendingPathComponent(stem + ".json"))
}

func testPhoto(_ item: PhotoCase, folder: URL, parser: ClothesParser, context: CIContext, output: URL) throws {
  let photo = try readPhoto(item, folder: folder)
  let parse = try parser.parse(photo)
  try require(parse.people == item.people, "Person detection: expected \(item.people), found \(parse.people)")
  print("PASS \(item.file): expected person count \(item.people)")
  let automatic = GarmentRegions.find(parse.grid, person: parse.people > 0)
  let kinds = automatic.map(\.kind)
  print("DIAGNOSTIC \(item.file): owner garment \(item.kind), found \(kinds)")
  let stem = URL(fileURLWithPath: item.file).deletingPathExtension().lastPathComponent + "-" + item.kind
  let classes: Set<ClothesClass> = item.kind == "pants" ? [.pants] : item.kind == "head" ? [.hat, .scarf] : [.upper]
  try context.writePNGRepresentation(
    of: parse.mask(of: classes), to: output.appendingPathComponent(stem + "-parser.png"),
    format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
  let selected = try selection(item, photo: photo, parse: parse, context: context)
  try writeReview(item, photo: photo, alpha: selected.alpha, context: context, output: output)
  func alpha(at point: [Double]) throws -> UInt8 {
    try require(point.count == 2 && point.allSatisfy { $0 >= 0 && $0 < 1 }, "Invalid landmark")
    let x = Int(point[0] * Double(selected.width))
    let y = Int(point[1] * Double(selected.height))
    return selected.alpha[y * selected.width + x]
  }
  for point in item.keep {
    try require(try alpha(at: point) > 128, "Visible fabric missing at \(point)")
  }
  for point in item.exclude {
    try require(try alpha(at: point) < 128, "Face, hand or background included at \(point)")
  }
}

@main
struct PhotoTests {
  static func main() throws {
    let arguments = CommandLine.arguments
    try require(arguments.count == 4, "Expected photo manifest, model and review paths")
    let manifest = URL(fileURLWithPath: arguments[1])
    let output = URL(fileURLWithPath: arguments[3])
    try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
    let cases = try JSONDecoder().decode([PhotoCase].self, from: Data(contentsOf: manifest))
    try require(!cases.isEmpty, "No photographs tested")
    let config = MLModelConfiguration()
    config.computeUnits = .cpuOnly
    let model = try MLModel(contentsOf: URL(fileURLWithPath: arguments[2]), configuration: config)
    let context = CIContext(options: [.workingColorSpace: CGColorSpace(name: CGColorSpace.sRGB)!])
    let parser = ClothesParser(model: model, context: context)
    var failures = 0
    for item in cases {
      do {
        try testPhoto(item, folder: manifest.deletingLastPathComponent(), parser: parser, context: context, output: output)
        print("PASS \(item.file) (\(item.kind)): reviewed fabric, exclusion and Studio input")
      } catch {
        failures += 1
        print("FAIL \(item.file): \(error)")
      }
    }
    fflush(stdout)
    if failures > 0 { exit(1) }
    print("\(cases.count) real-photo selection tests passed; local models only")
  }
}

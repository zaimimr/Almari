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
  return loaded.transformed(by: CGAffineTransform(translationX: -loaded.extent.minX, y: -loaded.extent.minY))
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
    parsePhoto: { image in (parse, parse.chroma(image, context: context)) },
    renderMask: { context.createCGImage($0, from: $0.extent, format: .RGBA8, colorSpace: space) })
  guard let alpha = selector.select(at: CGPoint(x: item.pick[0], y: item.pick[1])) else {
    throw PhotoTestError.failed("No garment selection")
  }
  return (alpha, picture.width, picture.height)
}

func testPhoto(_ item: PhotoCase, folder: URL, parser: ClothesParser, context: CIContext) throws {
  let photo = try readPhoto(item, folder: folder)
  let flattened = photo.composited(over: CIImage(color: .white).cropped(to: photo.extent))
  let parse = try parser.parse(flattened)
  try require(parse.people == item.people, "Person detection: expected \(item.people), found \(parse.people)")
  let automatic = GarmentRegions.find(parse.grid, person: parse.people > 0)
  let kinds = automatic.map(\.kind)
  print("DIAGNOSTIC \(item.file): expected parser role \(item.kind), found \(kinds)")
  let selected = try selection(item, photo: flattened, parse: parse, context: context)
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
    try require(arguments.count == 3, "Expected photo manifest and model paths")
    let manifest = URL(fileURLWithPath: arguments[1])
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
        try testPhoto(item, folder: manifest.deletingLastPathComponent(), parser: parser, context: context)
        print("PASS \(item.file): reviewed fabric and exclusion landmarks")
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

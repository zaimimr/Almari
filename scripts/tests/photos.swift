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

  func selecting(_ point: [Double]) -> PhotoCase {
    PhotoCase(file: file, sha256: sha256, people: people, kind: kind, pick: point, keep: keep, exclude: exclude)
  }

  func mapping(_ point: ([Double]) -> [Double]) -> PhotoCase {
    PhotoCase(file: file, sha256: sha256, people: people, kind: kind, pick: point(pick), keep: keep.map(point), exclude: exclude.map(point))
  }
}

struct PhotoVariant {
  let name: String
  let photo: CIImage
  let item: PhotoCase
}

func variants(_ item: PhotoCase, photo: CIImage) -> [PhotoVariant] {
  func normalized(_ image: CIImage) -> CIImage {
    image.transformed(by: CGAffineTransform(translationX: -image.extent.minX, y: -image.extent.minY))
  }
  var result = [
    PhotoVariant(name: "mirror", photo: normalized(photo.transformed(by: CGAffineTransform(scaleX: -1, y: 1))),
      item: item.mapping { [1 - $0[0], $0[1]] }),
    PhotoVariant(name: "clockwise", photo: normalized(photo.transformed(by: CGAffineTransform(a: 0, b: -1, c: 1, d: 0, tx: 0, ty: 0))),
      item: item.mapping { [1 - $0[1], $0[0]] }),
    PhotoVariant(name: "smaller", photo: PhotoPreparation.scaled(photo, longEdge: 600), item: item),
  ]
  result += item.keep.enumerated().filter { $0.element != item.pick }.map { index, point in
    PhotoVariant(name: "tap-\(index + 1)", photo: photo, item: item.selecting(point))
  }
  return result
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

func selection(_ item: PhotoCase, photo: CIImage, parse: ClothesParse, context: CIContext, models: GarmentSegmenter.Models) throws -> (alpha: [UInt8], width: Int, height: Int) {
  try require(item.pick.count == 2 && item.pick.allSatisfy { $0 >= 0 && $0 < 1 }, "Invalid selection point")
  let space = CGColorSpace(name: CGColorSpace.sRGB)!
  guard let picture = context.createCGImage(photo, from: photo.extent, format: .RGBA8, colorSpace: space) else {
    throw PhotoTestError.failed("Could not render photograph")
  }
  let segmenter = GarmentSegmenter(models: models, photo: photo, picture: picture, context: context)
  let selector = CutoutSelector(
    photo: photo, picture: picture,
    foregroundRequest: { VNGenerateForegroundInstanceMaskRequest() },
    parsePhoto: { image in (parse, parse.colours(image, context: context)) },
    renderMask: { context.createCGImage($0, from: $0.extent, format: .RGBA8, colorSpace: space) },
    segmentPhoto: { try segmenter.select(at: $0) })
  guard let alpha = selector.select(at: CGPoint(x: item.pick[0], y: item.pick[1])) else {
    throw PhotoTestError.failed("No garment selection")
  }
  if parse.people == 0 {
    guard let box = selector.garmentBox(at: CGPoint(x: item.pick[0], y: item.pick[1])) else {
      throw PhotoTestError.failed("Selected garment has no crop bounds")
    }
    for point in item.keep {
      try require(box.contains(CGPoint(x: point[0], y: point[1])), "Crop bounds omit visible fabric at \(point)")
    }
  }
  return (alpha, picture.width, picture.height)
}

func writeReview(_ item: PhotoCase, photo: CIImage, alpha: [UInt8], width: Int, height: Int, context: CIContext, output: URL) throws {
  try require(alpha.count == width * height, "Mask dimensions do not match the selected photograph")
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
  guard let reference = PhotoPreparation.studioInput(photo, context: context) else {
    throw PhotoTestError.failed("Could not prepare original Studio reference")
  }
  try require(input.extent.width <= 500 && input.extent.height <= 500, "Studio input exceeds provider limit")
  let stem = URL(fileURLWithPath: item.file).deletingPathExtension().lastPathComponent + "-" + item.kind
  let space = CGColorSpace(name: CGColorSpace.sRGB)!
  for (suffix, image) in [("mask", CIImage(cgImage: mask)), ("cutout", cutout), ("input", input), ("original-input", reference)] {
    try context.writePNGRepresentation(
      of: image, to: output.appendingPathComponent(stem + "-" + suffix + ".png"),
      format: .RGBA8, colorSpace: space)
  }
  let metadata: [String: Any] = [
    "sourceSha256": item.sha256, "kind": item.kind, "pick": item.pick,
    "sourceWidth": width, "sourceHeight": height,
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

func testPhoto(_ item: PhotoCase, photo: CIImage, parser: ClothesParser, context: CIContext, models: GarmentSegmenter.Models, output: URL) throws {
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
  let selected = try selection(item, photo: photo, parse: parse, context: context, models: models)
  try writeReview(item, photo: photo, alpha: selected.alpha, width: selected.width, height: selected.height, context: context, output: output)
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

func testPersonFrames() throws {
  let extent = CGRect(x: 0, y: 0, width: 1000, height: 1000)
  var mask = [UInt8](repeating: 0, count: 10000)
  for y in 10..<90 {
    for x in 5..<35 { mask[y * 100 + x] = 1 }
    for x in 65..<95 { mask[y * 100 + x] = 2 }
  }
  let first = ClothesParser.person(label: 1, count: 2, mask: mask, width: 100, height: 100, extent: extent)
  let second = ClothesParser.person(label: 2, count: 2, mask: mask, width: 100, height: 100, extent: extent)
  try require(first != nil && second != nil, "Both person instances need their own crop")
  try require(first!.area.maxX < second!.area.minX, "Person crops combine two people")
  try require(first!.count == 2 && second!.count == 2, "Person count lost")
  try require(ClothesParser.person(label: 3, count: 2, mask: mask, width: 100, height: 100, extent: extent) == nil,
    "Missing instance became a full-image crop")
  var labels = [UInt8](repeating: 0, count: 10000)
  for y in 20..<60 {
    for x in 20..<80 { labels[y * 100 + x] = UInt8(ClothesClass.upper.rawValue) }
  }
  let parse = ClothesParse(grid: LabelGrid(width: 100, height: 100, labels: labels), area: second!.area, extent: extent, people: 2)
  let at = CGPoint(x: second!.area.midX / extent.width, y: 1 - second!.area.midY / extent.height)
  let frame = parse.garmentFrame(at: at)
  try require(frame != nil && frame!["x"]! > 0.6, "Tap on second person uses the first person's bounds")
  try require(parse.garmentFrame(at: CGPoint(x: 0.2, y: 0.5)) == nil, "Tap outside a person selects their clothing")
  try require(parse.garmentFrame(at: CGPoint(x: .nan, y: 0.5)) == nil, "Non-finite tap accepted")
  print("PASS separate person crops and tap coordinate mapping")
}

func testGroupPhoto(_ item: PhotoCase, folder: URL, parser: ClothesParser, context: CIContext, output: URL) throws {
  let original = try readPhoto(item, folder: folder)
  let photo = PhotoPreparation.scaled(original, longEdge: 900)
  let smaller = photo.transformed(by: CGAffineTransform(scaleX: 0.75, y: 0.75))
    .transformed(by: CGAffineTransform(translationX: photo.extent.width + 80, y: 0))
  let extent = CGRect(x: 0, y: 0, width: photo.extent.width + 80 + smaller.extent.width, height: photo.extent.height)
  let group = photo.composited(over: smaller).composited(over: CIImage(color: .white).cropped(to: extent))
  let parses = try parser.parsePeople(group)
  try require(parses.count == 2 && parses.allSatisfy { $0.people == 2 }, "Group capture did not analyse both people")
  let frames = parses.map { parse in GarmentRegions.find(parse.grid, person: true).map { parse.normalizedFrame(of: $0) } }
  try require(frames.allSatisfy { !$0.isEmpty }, "One person's visible clothes were ignored")
  let left = photo.extent.width / extent.width
  let right = (photo.extent.width + 80) / extent.width
  try require(frames.contains { $0.allSatisfy { $0.maxX <= left } }, "Left person's garments were not isolated")
  try require(frames.contains { $0.allSatisfy { $0.minX >= right } }, "Right person's garments were not isolated")
  for (index, parse) in parses.enumerated() {
    for region in GarmentRegions.find(parse.grid, person: true) {
      try context.writePNGRepresentation(of: parse.cutout(group, region: region),
        to: output.appendingPathComponent("group-\(index + 1)-\(region.kind).png"),
        format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
    }
  }
  print("PASS group photo: separate clothes for both people, including the smaller person")
}

@main
struct PhotoTests {
  static func main() throws {
    try testPersonFrames()
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
    let segmentationConfig = MLModelConfiguration()
    segmentationConfig.computeUnits = ProcessInfo.processInfo.environment["PHOTO_CPU_ONLY"] == "1" ? .cpuOnly : .cpuAndGPU
    let models = try GarmentSegmenter.Models(
      folder: URL(fileURLWithPath: arguments[2]).deletingLastPathComponent(), configuration: segmentationConfig)
    let context = CIContext(options: [.workingColorSpace: CGColorSpace(name: CGColorSpace.sRGB)!])
    let parser = ClothesParser(model: model, context: context)
    if let outfit = cases.first(where: { $0.file == "outfit-body.jpg" }) {
      try testGroupPhoto(outfit, folder: manifest.deletingLastPathComponent(), parser: parser, context: context, output: output)
    }
    var failures = 0
    var tested = 0
    let extended = ProcessInfo.processInfo.environment["PHOTO_VARIANTS"] == "1"
    for item in cases {
      do {
        let photo = try readPhoto(item, folder: manifest.deletingLastPathComponent())
        let checks = extended ? variants(item, photo: photo).filter { variant in
          let selected = ProcessInfo.processInfo.environment["PHOTO_VARIANT"]
          return selected == nil || selected == variant.name
        } : [PhotoVariant(name: "original", photo: photo, item: item)]
        for variant in checks {
          tested += 1
          do {
            let folder = extended ? output.appendingPathComponent("variants/" + variant.name) : output
            try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            try testPhoto(variant.item, photo: variant.photo, parser: parser, context: context, models: models, output: folder)
            print("PASS \(item.file) (\(item.kind), \(variant.name)): reviewed fabric, exclusion and Studio input")
          } catch {
            failures += 1
            print("FAIL \(item.file) (\(variant.name)): \(error)")
          }
          fflush(stdout)
        }
      } catch {
        failures += 1
        print("FAIL \(item.file): \(error)")
      }
    }
    fflush(stdout)
    try require(tested > 0, "No matching photo variants tested")
    if failures > 0 { exit(1) }
    print("\(tested) real-photo selection tests passed; local models only")
  }
}

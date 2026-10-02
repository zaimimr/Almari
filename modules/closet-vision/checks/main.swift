import CoreImage
import Foundation

let sRGB = CGColorSpace(name: CGColorSpace.sRGB)!
let context = CIContext(options: [.workingColorSpace: sRGB])
let enhancer = GarmentEnhancer(context: context)
let hueTolerance = 3.0
let castTolerance = 4.0
var failures: [String] = []
var largestShift = 0.0
var largestCastShift = 0.0

func check(_ passed: Bool, _ message: String) {
  if !passed { failures.append(message) }
}

func hueDistance(_ first: Double, _ second: Double) -> Double {
  let difference = abs(first - second).truncatingRemainder(dividingBy: 360)
  return min(difference, 360 - difference)
}

func tinted(_ image: CIImage, _ red: CGFloat, _ green: CGFloat, _ blue: CGFloat) -> CIImage {
  image.applyingFilter(
    "CIColorMatrix",
    parameters: [
      "inputRVector": CIVector(x: red, y: 0, z: 0, w: 0),
      "inputGVector": CIVector(x: 0, y: green, z: 0, w: 0),
      "inputBVector": CIVector(x: 0, y: 0, z: blue, w: 0),
    ])
}

func scene(_ garment: CIImage, sheet: CIImage, canvas: CGRect) -> (photo: CIImage, mask: CIImage) {
  let photo = garment.composited(over: sheet).cropped(to: canvas)
  let silhouette = garment.applyingFilter(
    "CIColorMatrix",
    parameters: [
      "inputRVector": CIVector(x: 0, y: 0, z: 0, w: 1),
      "inputGVector": CIVector(x: 0, y: 0, z: 0, w: 1),
      "inputBVector": CIVector(x: 0, y: 0, z: 0, w: 1),
      "inputAVector": CIVector(x: 0, y: 0, z: 0, w: 0),
      "inputBiasVector": CIVector(x: 0, y: 0, z: 0, w: 1),
    ])
  let mask = silhouette.composited(over: CIImage(color: .black)).cropped(to: canvas)
  return (photo, mask)
}

func checkEnhancement(_ name: String, _ garment: CIImage, canvas: CGRect, grey: CIImage) -> CIImage? {
  guard let before = enhancer.meanHue(garment) else {
    check(false, "\(name) has no opaque pixels")
    return nil
  }
  let neutral = scene(garment, sheet: grey, canvas: canvas)
  let plain = enhancer.correction(photo: neutral.photo, mask: neutral.mask)
  check(
    plain.gains.allSatisfy { abs($0 - 1) < 0.02 } && plain.exposure == 0,
    "\(name) changed white balance or exposure in neutral light: \(plain)")
  let enhanced = enhancer.enhance(garment, correction: plain)
  if let after = enhancer.meanHue(enhanced) {
    if before.chroma >= 6 {
      let shift = hueDistance(before.hue, after.hue)
      largestShift = max(largestShift, shift)
      check(shift <= hueTolerance, "\(name) hue moved \(shift) degrees in neutral light")
    } else {
      check(after.chroma - before.chroma < 3, "\(name) gained color in neutral light")
    }
  }
  let warmGarment = tinted(garment, 1.08, 1, 0.9)
  let warm = scene(warmGarment, sheet: tinted(grey, 1.08, 1, 0.9), canvas: canvas)
  let cast = enhancer.correction(photo: warm.photo, mask: warm.mask)
  check(cast.gains[0] < 1 && cast.gains[2] > 1, "\(name) warm light was not corrected: \(cast)")
  if before.chroma >= 6, let corrected = enhancer.meanHue(enhancer.enhance(warmGarment, correction: cast)) {
    let shift = hueDistance(before.hue, corrected.hue)
    largestCastShift = max(largestCastShift, shift)
    check(shift <= castTolerance, "\(name) hue after correcting warm light is \(shift) degrees from the original")
  }
  let dim = enhancer.correction(photo: tinted(neutral.photo, 0.5, 0.5, 0.5), mask: neutral.mask)
  check(dim.exposure > 0 && dim.exposure <= 0.4, "\(name) dim light exposure \(dim.exposure)")
  return enhanced
}

let arguments = CommandLine.arguments
guard arguments.count > 1 else {
  print("Usage: closet-checks <folder of transparent garment PNGs> [output folder]")
  exit(2)
}
let folder = URL(fileURLWithPath: arguments[1], isDirectory: true)
let output = arguments.count > 2 ? URL(fileURLWithPath: arguments[2], isDirectory: true) : nil
if let output { try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true) }
let files = try FileManager.default.contentsOfDirectory(at: folder, includingPropertiesForKeys: nil)
  .filter { $0.pathExtension.lowercased() == "png" }
  .sorted { $0.lastPathComponent < $1.lastPathComponent }
check(!files.isEmpty, "no PNG files in \(folder.path)")

for file in files {
  let name = file.deletingPathExtension().lastPathComponent
  guard let loaded = CIImage(contentsOf: file) else {
    check(false, "\(name) could not be read")
    continue
  }
  let garment = loaded.transformed(
    by: CGAffineTransform(translationX: -loaded.extent.minX, y: -loaded.extent.minY))
  let size = garment.extent.size
  let canvas = garment.extent.insetBy(dx: -size.width * 0.25, dy: -size.height * 0.25)
  let grey = CIImage(color: CIColor(red: 0.62, green: 0.62, blue: 0.62))
  guard let enhanced = checkEnhancement(name, garment, canvas: canvas, grey: grey) else { continue }
  if let output {
    let side = (max(size.width, size.height) * 1.06).rounded(.up)
    let square = CGRect(x: 0, y: 0, width: side, height: side)
    let clear = CIImage(color: .clear).cropped(to: square)
    let offset = CGAffineTransform(
      translationX: ((side - size.width) / 2).rounded(), y: ((side - size.height) / 2).rounded())
    try context.writePNGRepresentation(
      of: garment.transformed(by: offset).composited(over: clear),
      to: output.appendingPathComponent("\(name).png"), format: .RGBA8, colorSpace: sRGB)
    try context.writePNGRepresentation(
      of: enhancer.withShadow(enhanced.transformed(by: offset).composited(over: clear)),
      to: output.appendingPathComponent("\(name)-enhanced.png"), format: .RGBA8, colorSpace: sRGB)
  }
}

print(
  String(
    format: "hue shift max %.1f degrees in neutral light, %.1f degrees after warm light correction, %d garments",
    largestShift, largestCastShift, files.count))
if failures.isEmpty {
  print("PASS")
} else {
  failures.forEach { print("FAIL \($0)") }
  exit(1)
}

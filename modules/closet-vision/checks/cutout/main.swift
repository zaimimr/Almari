import CoreImage
import Foundation
import ImageIO

let sRGB = CGColorSpace(name: CGColorSpace.sRGB)!
let context = CIContext(options: [.workingColorSpace: sRGB])
let folder = FileManager.default.temporaryDirectory.appendingPathComponent("cutout-check-\(getpid())")
try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
var failures: [String] = []

func scaled(_ image: CIImage, longEdge: CGFloat) -> CIImage {
  let edge = max(image.extent.width, image.extent.height)
  guard edge > longEdge else { return image }
  let output = image.applyingFilter(
    "CILanczosScaleTransform", parameters: [kCIInputScaleKey: longEdge / edge, kCIInputAspectRatioKey: 1.0])
  return output.transformed(by: CGAffineTransform(translationX: -output.extent.minX, y: -output.extent.minY))
}

func photo(width: CGFloat, height: CGFloat, texture: CGFloat, seed: CGFloat) -> CIImage {
  let drawing = CGContext(
    data: nil, width: Int(width), height: Int(height), bitsPerComponent: 8, bytesPerRow: Int(width) * 4,
    space: sRGB, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  var state = UInt64(seed * 7919 + 17)
  func next() -> CGFloat {
    state = state &* 6364136223846793005 &+ 1442695040888963407
    return CGFloat(state >> 33) / CGFloat(1 << 31)
  }
  drawing.setFillColor(red: 0.62, green: 0.6, blue: 0.57, alpha: 1)
  drawing.fill(CGRect(x: 0, y: 0, width: width, height: height))
  for _ in 0..<Int(texture * 2400) {
    let size = 4 + pow(next(), 3) * width * 0.25
    drawing.setFillColor(red: next(), green: next(), blue: next(), alpha: 0.08 + next() * 0.3)
    drawing.fillEllipse(in: CGRect(x: next() * width - size / 2, y: next() * height - size / 2, width: size, height: size))
  }
  return CIImage(cgImage: drawing.makeImage()!)
}

func garmentMask(_ rect: CGRect, extent: CGRect) -> CIImage {
  let width = Int(extent.width)
  let height = Int(extent.height)
  let drawing = CGContext(
    data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width,
    space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue)!
  drawing.setFillColor(gray: 1, alpha: 1)
  let path = CGMutablePath()
  path.move(to: CGPoint(x: rect.minX + rect.width * 0.2, y: rect.minY))
  path.addLine(to: CGPoint(x: rect.maxX - rect.width * 0.1, y: rect.minY + rect.height * 0.05))
  path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - rect.height * 0.3))
  path.addLine(to: CGPoint(x: rect.minX + rect.width * 0.6, y: rect.maxY))
  path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + rect.height * 0.5))
  path.closeSubpath()
  drawing.addPath(path)
  drawing.fillPath()
  return CIImage(cgImage: drawing.makeImage()!).applyingGaussianBlur(sigma: 1).cropped(to: extent)
}

func cgImage(_ image: CIImage) -> CGImage {
  context.createCGImage(image, from: image.extent, format: .RGBA8, colorSpace: sRGB)!
}

func roundTrip(_ image: CIImage, name: String) -> CGImage {
  let url = folder.appendingPathComponent(name)
  try! context.writePNGRepresentation(of: image, to: url, format: .RGBA8, colorSpace: sRGB)
  let source = CGImageSourceCreateWithURL(url as CFURL, nil)!
  return CGImageSourceCreateImageAtIndex(source, 0, nil)!
}

func run(_ name: String, width: CGFloat, height: CGFloat, garment rect: CGRect, texture: CGFloat, fill: CIColor?) {
  let extent = CGRect(x: 0, y: 0, width: width, height: height)
  var picture = photo(width: width, height: height, texture: texture, seed: CGFloat(name.count))
  let source = CGRect(x: rect.minX, y: height - rect.maxY, width: rect.width, height: rect.height)
  let mask = garmentMask(source, extent: extent)
  if let fill {
    let solid = CIFilter(
      name: "CILinearGradient",
      parameters: [
        "inputPoint0": CIVector(x: 0, y: 0), "inputPoint1": CIVector(x: width, y: height * 0.3),
        "inputColor0": fill,
        "inputColor1": CIColor(red: fill.red * 0.9, green: fill.green * 0.9, blue: fill.blue * 0.9),
      ])!.outputImage!.cropped(to: extent)
    picture = solid.applyingFilter(
      "CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: picture, kCIInputMaskImageKey: mask])
  }
  let photoImage = cgImage(picture)
  let cut = picture.applyingFilter(
    "CIBlendWithMask",
    parameters: [
      kCIInputBackgroundImageKey: CIImage(color: .clear).cropped(to: extent), kCIInputMaskImageKey: mask,
    ]
  ).cropped(to: source).transformed(by: CGAffineTransform(translationX: -source.minX, y: -source.minY))
  let garment = scaled(cut, longEdge: 1536)
  let side = (max(garment.extent.width, garment.extent.height) * 1.06).rounded(.up)
  let square = CGRect(x: 0, y: 0, width: side, height: side)
  let offset = CGPoint(
    x: ((side - garment.extent.width) / 2).rounded(), y: ((side - garment.extent.height) / 2).rounded())
  let placed = garment.transformed(by: CGAffineTransform(translationX: offset.x, y: offset.y))
    .composited(over: CIImage(color: .clear).cropped(to: square)).cropped(to: square)
  let scale = garment.extent.width / rect.width
  let truth = CutoutMapping.area(
    garmentOrigin: rect.origin, scale: scale, side: side, offset: offset, garment: garment.extent.size,
    photo: extent.size)

  let started = Date()
  let template = roundTrip(cut, name: "\(name)-region.png")
  if let match = CutoutMapping.locate(template: template, photo: photoImage, scales: 1...1) {
    let gap = max(abs(match.origin.x - rect.minX), abs(match.origin.y - rect.minY))
    if gap > 0.5 || match.scale != 1 {
      failures.append("\(name): region found at \(match.origin) instead of \(rect.origin)")
    }
    let area = CutoutMapping.area(
      garmentOrigin: match.origin, scale: scale, side: side, offset: offset, garment: garment.extent.size,
      photo: extent.size)
    if abs(area.minX - truth.minX) * width > 0.5 || abs(area.minY - truth.minY) * height > 0.5 {
      failures.append("\(name): prepare area \(area) instead of \(truth)")
    }
  } else {
    failures.append("\(name): region not found")
  }
  let regionTime = Date().timeIntervalSince(started)

  let legacyStart = Date()
  let cutout = roundTrip(placed, name: "\(name).png")
  let scales = CutoutMapping.scales(forCutoutSide: cutout.width, photo: extent.size)
  if let match = CutoutMapping.locate(template: cutout, photo: photoImage, scales: scales) {
    let area = CutoutMapping.area(of: match, side: cutout.width, photo: extent.size)
    let worst = max(
      abs(area.minX - truth.minX) * width, abs(area.minY - truth.minY) * height,
      abs(area.maxX - truth.maxX) * width, abs(area.maxY - truth.maxY) * height)
    if worst > 2 { failures.append("\(name): legacy area off by \(worst) px") }
    print(
      String(
        format: "%@: scale %.4f found %.4f, legacy worst %.2f px, error %.1f, %.2fs region, %.2fs legacy", name,
        scale, match.scale, worst, match.error, regionTime, Date().timeIntervalSince(legacyStart)))
  } else {
    failures.append("\(name): legacy cutout not found")
  }

  let w = Int(width)
  let h = Int(height)
  guard let alpha = CutoutMapping.alpha(of: cutout, area: truth, width: w, height: h) else {
    failures.append("\(name): mask not drawn")
    return
  }
  var expected = [UInt8](repeating: 0, count: w * h)
  context.render(
    mask, toBitmap: &expected, rowBytes: w, bounds: extent, format: .L8, colorSpace: nil)
  var gap = 0.0
  for index in 0..<(w * h) { gap += abs(Double(alpha[index]) - Double(expected[index])) }
  let mean = gap / Double(w * h)
  if mean > 1 { failures.append("\(name): mask back on the photo differs by \(mean)") }
  if let found = CutoutMapping.bounds(alpha, width: w, height: h) {
    let worst = max(
      abs(found.minX - rect.minX), abs(found.minY - rect.minY), abs(found.maxX - rect.maxX),
      abs(found.maxY - rect.maxY))
    if worst > 3 { failures.append("\(name): mask bounds \(found) instead of \(rect)") }
    print(String(format: "%@: mask mean gap %.3f, bounds off %.1f px", name, mean, worst))
  } else {
    failures.append("\(name): mask bounds missing")
  }
}

run(
  "small", width: 2048, height: 1536, garment: CGRect(x: 300, y: 200, width: 700, height: 900), texture: 0.5,
  fill: nil)
run(
  "large", width: 2048, height: 1536, garment: CGRect(x: 90, y: 40, width: 1850, height: 1420), texture: 0.5,
  fill: nil)
run(
  "portrait", width: 1536, height: 2048, garment: CGRect(x: 200, y: 260, width: 1100, height: 1700), texture: 0.5,
  fill: nil)
run(
  "dark", width: 2048, height: 1536, garment: CGRect(x: 600, y: 300, width: 900, height: 1000), texture: 0.08,
  fill: CIColor(red: 0.08, green: 0.08, blue: 0.1))
run(
  "flat", width: 2048, height: 1536, garment: CGRect(x: 120, y: 60, width: 1700, height: 1400), texture: 0.05,
  fill: CIColor(red: 0.85, green: 0.84, blue: 0.82))

try? FileManager.default.removeItem(at: folder)
if failures.isEmpty {
  print("PASS")
} else {
  failures.forEach { print("FAIL \($0)") }
  exit(1)
}

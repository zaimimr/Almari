import CoreGraphics
import CoreImage
import Foundation

struct TestFailure: Error {
  let message: String
}

func expect(_ passed: Bool, _ message: String) throws {
  if !passed { throw TestFailure(message: message) }
}

func grid(_ regions: [(ClothesClass, Range<Int>, Range<Int>)]) -> LabelGrid {
  var labels = [UInt8](repeating: 0, count: 10000)
  for (kind, xs, ys) in regions {
    for y in ys {
      for x in xs { labels[y * 100 + x] = UInt8(kind.rawValue) }
    }
  }
  return LabelGrid(width: 100, height: 100, labels: labels)
}

func rgba(_ colour: [UInt8], garment: (Int, Int) -> Bool) -> [UInt8] {
  (0..<10000).flatMap { index in
    garment(index % 100, index / 100) ? colour : [0, 0, 0, 0]
  }
}

func cgImage(_ pixels: [UInt8]) -> CGImage {
  CGImage(
    width: 100, height: 100, bitsPerComponent: 8, bitsPerPixel: 32,
    bytesPerRow: 400, space: CGColorSpace(name: CGColorSpace.sRGB)!,
    bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue),
    provider: CGDataProvider(data: Data(pixels) as CFData)!, decode: nil,
    shouldInterpolate: false, intent: .defaultIntent)!
}

func pixelsOf(_ image: CGImage) -> [UInt8] {
  let space = CGColorSpace(name: CGColorSpace.sRGB)!
  var pixels = [UInt8](repeating: 0, count: 40000)
  pixels.withUnsafeMutableBytes { buffer in
    let context = CGContext(
      data: buffer.baseAddress, width: 100, height: 100, bitsPerComponent: 8,
      bytesPerRow: 400, space: space,
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    context.draw(image, in: CGRect(x: 0, y: 0, width: 100, height: 100))
  }
  return pixels
}

@main
struct VisionTests {
  static func main() throws {
    let tests: [(String, () throws -> Void)] = [
      ("loose hijab retains the complete scarf regardless of parser clothing label", {
        for label in [ClothesClass.scarf, .upper, .dress] {
          let source = grid([(label, 20..<80, 20..<80)])
          let found = GarmentRegions.held(source)
          try expect(found != nil, "Missing loose scarf")
          try expect(found!.pixels.count >= 3600, "Scarf lost fabric")
          try expect(found!.minX == 20 && found!.maxX == 79, "Scarf outline changed")
        }
      }),
      ("head hijab remains distinct from face and outfit regions", {
        let source = grid([
          (.scarf, 20..<80, 10..<25), (.face, 30..<70, 25..<40),
          (.upper, 20..<80, 40..<60), (.pants, 30..<70, 60..<90),
        ])
        let found = GarmentRegions.find(source, person: true)
        try expect(found.map(\.kind).contains("head"), "Hijab was not found")
        let hijab = found.first { $0.kind == "head" }!
        try expect(hijab.pixels.allSatisfy { source.labels[$0] == UInt8(ClothesClass.scarf.rawValue) }, "Face or outfit included")
        try expect(!found.contains { $0.kind == "face" }, "Face became a wardrobe item")
      }),
      ("manual selection targets the scarf beside another loose garment", {
        let source = grid([(.scarf, 10..<35, 20..<80), (.upper, 60..<90, 20..<80)])
        let picked = GarmentRegions.picked(source, at: 50 * 100 + 20)
        try expect(picked != nil && picked!.maxX < 40, "Wrong garment selected")
      }),
      ("manual head scarf selection keeps cap labels and excludes the face", {
        let source = grid([
          (.hat, 20..<80, 10..<25), (.scarf, 20..<30, 25..<40),
          (.face, 30..<70, 25..<40), (.upper, 20..<80, 40..<80),
        ])
        let picked = GarmentRegions.picked(source, at: 15 * 100 + 30)
        let pixels = Set(picked?.pixels ?? [])
        try expect(pixels.contains(15 * 100 + 30), "Scarf cap lost")
        try expect(pixels.contains(60 * 100 + 50), "Scarf over chest lost")
        try expect(!pixels.contains(30 * 100 + 50), "Face included")
      }),
      ("hanging trousers survive disconnected leg labels", {
        let source = grid([(.pants, 20..<40, 20..<80), (.pants, 60..<80, 20..<80)])
        let found = GarmentRegions.find(source, person: false).filter { $0.kind == "pants" }
        let pixels = Set(found.flatMap(\.pixels))
        try expect(pixels.contains(50 * 100 + 30), "Left leg lost")
        try expect(pixels.contains(50 * 100 + 70), "Right leg lost")
      }),
      ("jacket selection preserves attached sleeves", {
        let source = grid([(.upper, 35..<65, 20..<80), (.upper, 15..<85, 25..<40)])
        let found = GarmentRegions.held(source)!
        try expect(found.pixels.contains(30 * 100 + 15), "Left sleeve lost")
        try expect(found.pixels.contains(30 * 100 + 84), "Right sleeve lost")
        try expect(found.pixels.contains(79 * 100 + 50), "Hem lost")
      }),
      ("garments crossing an image edge are marked partial", {
        let source = grid([(.pants, 20..<80, 20..<100)])
        let found = GarmentRegions.find(source, person: true)
        try expect(found.first { $0.kind == "pants" }?.partial == true, "Partial crop presented as complete")
      }),
      ("empty and skin-only scans produce no clothing", {
        for source in [grid([]), grid([(.face, 20..<80, 20..<80)])] {
          try expect(GarmentRegions.held(source) == nil, "Skin became a garment")
          try expect(GarmentRegions.find(source, person: true).isEmpty, "Unexpected scan region")
        }
      }),
      ("small accidental holes are repaired without changing fabric colour", {
        var pixels = rgba([40, 60, 80, 255]) { x, y in (20..<80).contains(x) && (20..<80).contains(y) }
        for y in 49...50 {
          for x in 49...50 {
            for channel in 0..<4 { pixels[(y * 100 + x) * 4 + channel] = 0 }
          }
        }
        try expect(CutoutRepair.repair(&pixels, width: 100, height: 100), "Hole not repaired")
        try expect(Array(pixels[(50 * 100 + 50) * 4..<(50 * 100 + 50) * 4 + 4]) == [40, 60, 80, 255], "Repair changed fabric")
        try expect(pixels[3] == 0, "Outside background filled")
      }),
      ("trouser leg separation is preserved by cutout repair", {
        var pixels = rgba([40, 60, 80, 255]) { x, y in
          (20..<80).contains(y) && ((20..<40).contains(x) || (60..<80).contains(x) || y < 30 && (20..<80).contains(x))
        }
        _ = CutoutRepair.repair(&pixels, width: 100, height: 100)
        try expect(pixels[(70 * 100 + 50) * 4 + 3] == 0, "Leg gap filled")
        try expect(pixels[(70 * 100 + 30) * 4 + 3] == 255, "Real leg erased")
      }),
      ("large scarf opening remains transparent", {
        var pixels = rgba([150, 100, 80, 255]) { x, y in
          (10..<90).contains(x) && (10..<90).contains(y) && !((35..<65).contains(x) && (35..<65).contains(y))
        }
        _ = CutoutRepair.repair(&pixels, width: 100, height: 100)
        try expect(pixels[(50 * 100 + 50) * 4 + 3] == 0, "Scarf loop filled")
      }),
      ("Studio background removal preserves dark fabric and interior white print", {
        let pixels = (0..<10000).flatMap { index -> [UInt8] in
          let x = index % 100
          let y = index / 100
          if (45..<55).contains(x) && (45..<55).contains(y) { return [255, 255, 255, 255] }
          return (20..<80).contains(x) && (20..<80).contains(y) ? [40, 60, 80, 255] : [255, 255, 255, 255]
        }
        let cleared = StudioBackground.clear(cgImage(pixels))
        try expect(cleared != nil, "No transparent result")
        let result = pixelsOf(cleared!)
        try expect(result[3] == 0, "White backdrop remains")
        try expect(result[(30 * 100 + 30) * 4 + 3] == 255, "Dark fabric erased")
        try expect(result[(50 * 100 + 50) * 4 + 3] == 255, "White print erased")
      }),
      ("indistinguishable white-on-white image returns no mask for raw fallback", {
        let image = cgImage([UInt8](repeating: 255, count: 40000))
        try expect(StudioBackground.clear(image) == nil, "Unsafe mask accepted")
      }),
      ("Studio input preserves opaque reference colours and does not enlarge small photos", {
        let source = CIImage(cgImage: cgImage(rgba([40, 60, 80, 255], garment: { _, _ in true })))
        let context = CIContext()
        let input = PhotoPreparation.studioInput(source, context: context)
        try expect(input?.extent == source.extent, "Small reference dimensions changed")
        let rendered = context.createCGImage(input!, from: input!.extent)!
        let pixels = pixelsOf(rendered)
        for channel in 0..<3 {
          try expect(abs(Int(pixels[channel]) - [40, 60, 80][channel]) <= 2, "Opaque reference colour changed")
        }
        try expect(pixels[3] == 255, "Reference became transparent")
      }),
      ("Studio input whitens cutout background while retaining fabric and large openings", {
        let pixels = rgba([40, 60, 80, 255], garment: { x, y in
          (10..<90).contains(x) && (10..<90).contains(y)
            && !((35..<65).contains(x) && (35..<65).contains(y))
        })
        let context = CIContext()
        let input = PhotoPreparation.studioInput(CIImage(cgImage: cgImage(pixels)), context: context)!
        let result = pixelsOf(context.createCGImage(input, from: input.extent)!)
        for index in [0, 50 * 100 + 50] {
          try expect(Array(result[(index * 4)..<(index * 4 + 4)]) == [255, 255, 255, 255], "Background or intentional opening was not white")
        }
        let fabric = (20 * 100 + 20) * 4
        try expect(result[fabric] < 50 && result[fabric + 2] < 90 && result[fabric + 3] == 255, "Fabric lost")
      }),
      ("Studio input normalizes rotated and shifted references at the 500 pixel limit", {
        let context = CIContext()
        let original = CIImage(color: CIColor(red: 0.2, green: 0.3, blue: 0.4))
          .cropped(to: CGRect(x: 0, y: 0, width: 1200, height: 800))
        let portrait = original.oriented(forExifOrientation: 6)
          .transformed(by: CGAffineTransform(translationX: 42, y: -37))
        for source in [original, portrait] {
          let input = PhotoPreparation.studioInput(source, context: context)!
          try expect(input.extent.origin == .zero, "Input origin was not normalized")
          try expect(max(input.extent.width, input.extent.height) == 500, "Long edge is not 500")
          try expect(abs(input.extent.width / input.extent.height - source.extent.width / source.extent.height) < 0.005, "Aspect ratio changed")
        }
        let input = PhotoPreparation.studioInput(portrait, context: context)!
        let data = context.jpegRepresentation(
          of: input, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!,
          options: [kCGImageDestinationLossyCompressionQuality as CIImageRepresentationOption: 0.9])!
        let decoded = CIImage(data: data)!
        try expect(decoded.extent == input.extent, "JPEG upload dimensions changed")
      }),
      ("Studio input refuses an empty image", {
        try expect(PhotoPreparation.studioInput(CIImage.empty(), context: CIContext()) == nil, "Empty input accepted")
      }),
    ]
    for (name, run) in tests {
      do {
        try run()
        print("PASS \(name)")
      } catch {
        print("FAIL \(name): \(error)")
        throw error
      }
    }
    print("\(tests.count) native vision tests passed, no inference")
  }
}

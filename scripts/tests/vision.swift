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
      ("mask refinement recovers thin diagonal details across sizes and colours", {
        for width in [100, 200, 400] {
          for colour: [UInt8] in [[12, 18, 25, 255], [175, 35, 55, 255], [245, 242, 230, 255]] {
            var alpha = [UInt8](repeating: 0, count: width * width)
            var photo = [UInt8](repeating: 0, count: width * width * 4)
            for y in 0..<width {
              for x in 0..<width {
                let px = Double(x) / Double(width)
                let py = Double(y) / Double(width)
                let body = px >= 0.2 && px < 0.8 && py >= 0.2 && py < 0.7
                let cord = py >= 0.7 && py < 0.755 && abs(px - (0.6 + (py - 0.7) * 0.5)) <= 1 / Double(width)
                let index = y * width + x
                alpha[index] = body ? 255 : 0
                photo.replaceSubrange((index * 4)..<(index * 4 + 4), with: body || cord ? colour : [90, 160, 115, 255])
              }
            }
            let result = GarmentMaskRefinement.refine(alpha, pixels: photo, width: width, height: width)
            let tip = Int(0.74 * Double(width)) * width + Int(0.62 * Double(width))
            try expect(result[tip] > 128, "Diagonal detail was lost at size \(width), colour \(colour)")
            try expect(result[width / 10 * width + width / 10] == 0, "Background was restored")
          }
        }
      }),
      ("mask refinement excludes a broad touching garment of the same colour", {
        let alpha = (0..<10000).map { index -> UInt8 in
          let x = index % 100
          let y = index / 100
          return x >= 20 && x < 80 && y >= 20 && y < 70 ? 255 : 0
        }
        let photo = rgba([20, 30, 40, 255]) { x, y in x >= 20 && x < 95 && y >= 20 && y < 70 }
        var opaque = photo
        for index in 0..<10000 where opaque[index * 4 + 3] == 0 {
          opaque.replaceSubrange((index * 4)..<(index * 4 + 4), with: [190, 155, 120, 255])
        }
        let result = GarmentMaskRefinement.refine(alpha, pixels: opaque, width: 100, height: 100)
        try expect(result[40 * 100 + 90] == 0, "Touching garment was included")
        try expect(result[40 * 100 + 50] == 255, "Selected fabric was removed")
      }),
      ("mask refinement preserves existing one pixel cords and large openings", {
        let member = (0..<10000).map { index in
          let x = index % 100
          let y = index / 100
          let body = x >= 20 && x < 80 && y >= 20 && y < 70
          let opening = x >= 40 && x < 60 && y >= 35 && y < 55
          return body && !opening || x == 60 && y >= 70 && y < 88
        }
        let photo: [UInt8] = member.flatMap { $0 ? [15, 25, 35, 255] : [235, 225, 215, 255] }
        let result = GarmentMaskRefinement.refine(member.map { $0 ? 255 : 0 }, pixels: photo, width: 100, height: 100)
        try expect(result[86 * 100 + 60] == 255, "Existing narrow cord was eroded")
        try expect(result[45 * 100 + 50] == 0, "Real opening was filled")
      }),
      ("mask refinement restores patterned fabric from the source pixels", {
        var alpha = [UInt8](repeating: 0, count: 10000)
        var photo: [UInt8] = []
        for y in 0..<100 {
          for x in 0..<100 {
            let body = x >= 20 && x < 80 && y >= 20 && y < 70
            let print = x % 10 < 4
            photo += body ? (print ? [235, 235, 225, 255] : [180, 25, 55, 255]) : [25, 55, 95, 255]
            let hole = x >= 60 && x < 63 && y >= 40 && y < 43
            alpha[y * 100 + x] = body && !hole ? 255 : 0
          }
        }
        let result = GarmentMaskRefinement.refine(alpha, pixels: photo, width: 100, height: 100)
        try expect(result[41 * 100 + 61] == 255, "Printed fabric was discarded")
        try expect(result[10 * 100 + 61] == 0, "Background was filled")
      }),
      ("point segmentation retains diagonal connections and rejects detached objects", {
        var alpha = [UInt8](repeating: 0, count: 100)
        for index in [11, 22, 33, 44, 55, 87, 88] { alpha[index] = 255 }
        let result = GarmentSegmenter.connected(alpha, width: 10, height: 10, at: 11)
        try expect(result[55] == 255, "Diagonal connection was removed")
        try expect(result[88] == 0, "Detached neighbour was included")
        try expect(GarmentSegmenter.connected(alpha, width: 10, height: 10, at: -1).allSatisfy { $0 == 0 }, "Invalid seed accepted")
        var body = [UInt8](repeating: 0, count: 10000)
        body[70 * 100 + 60] = 255
        try expect(GarmentSegmenter.anchor(body, width: 100, height: 100, at: 74 * 100 + 60) == 70 * 100 + 60, "Nearby detail has no anchor")
        try expect(GarmentSegmenter.anchor(body, width: 100, height: 100, at: 90 * 100 + 60) == nil, "Distant background has an anchor")
      }),
      ("point mask interpolation retains orientation on rectangular photographs", {
        let result = GarmentSegmenter.upsampled([10, -10, -10, 10], width: 2, height: 2, to: 80, outputHeight: 40)
        try expect(result.count == 3200, "Wrong output dimensions")
        try expect(result[0] == 255 && result[79] == 0 && result[39 * 80] == 0 && result[3199] == 255, "Mask orientation changed")
        try expect(GarmentSegmenter.upsampled([], width: 0, height: 2, to: 80, outputHeight: 40).isEmpty, "Empty mask accepted")
        try expect(GarmentMaskRefinement.refine([255], pixels: [], width: 1, height: 1) == [255], "Invalid refinement changed its input")
      }),
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
      ("manual selection preserves enclosed face and skin openings", {
        let body: [ClothesClass] = [.face, .hair, .leftArm, .rightArm, .leftLeg, .rightLeg]
        for label in body {
          let source = grid([
            (.scarf, 20..<80, 10..<80), (.hat, 20..<80, 10..<25),
            (label, 30..<70, 25..<45),
          ])
          let picked = Set(GarmentRegions.picked(source, at: 15 * 100 + 40, person: true)?.pixels ?? [])
          try expect(picked.contains(15 * 100 + 40), "Scarf cap lost")
          try expect(picked.contains(60 * 100 + 50), "Scarf over chest lost")
          try expect(!picked.contains(35 * 100 + 50), "Enclosed body region filled")
        }
      }),
      ("manual selection keeps a loose garment across conflicting clothing labels", {
        let source = grid([(.upper, 20..<80, 20..<60), (.pants, 20..<80, 60..<90)])
        let selected = Set(GarmentRegions.picked(source, at: 40 * 100 + 40)?.pixels ?? [])
        try expect(selected.contains(40 * 100 + 40), "Upper fabric lost")
        try expect(selected.contains(80 * 100 + 40), "Loose garment fabric lost to parser label")
      }),
      ("worn manual selection separates touching trousers from an upper garment", {
        let source = grid([(.upper, 20..<80, 20..<60), (.pants, 20..<80, 60..<90)])
        let upper = Set(GarmentRegions.picked(source, at: 40 * 100 + 40, person: true)?.pixels ?? [])
        let pants = Set(GarmentRegions.picked(source, at: 80 * 100 + 40, person: true)?.pixels ?? [])
        try expect(upper.contains(40 * 100 + 40), "Upper garment lost")
        try expect(!upper.contains(80 * 100 + 40), "Trousers included in upper garment")
        try expect(pants.contains(80 * 100 + 40), "Trousers lost")
        try expect(!pants.contains(40 * 100 + 40), "Upper garment included in trousers")
      }),
      ("manual selection separates neutral garments while retaining shaded fabric", {
        let source = grid([(.upper, 20..<80, 20..<80)])
        var colours = [SIMD3<Double>](repeating: SIMD3(5, 0, 0), count: 10000)
        for y in 20..<80 {
          for x in 20..<50 { colours[y * 100 + x] = SIMD3(x < 30 ? 30 : 45, 0, 0) }
        }
        let selected = Set(GarmentRegions.picked(source, at: 40 * 100 + 40, colours: colours)?.pixels ?? [])
        try expect(selected.contains(40 * 100 + 40), "White garment lost")
        try expect(selected.contains(40 * 100 + 25), "Shaded fabric lost")
        try expect(!selected.contains(40 * 100 + 70), "Black garment included")
      }),
      ("worn selection joins occluded fabric while loose selection keeps separate items", {
        let source = grid([(.upper, 10..<30, 20..<80), (.upper, 70..<90, 20..<80)])
        let colours = [SIMD3<Double>](repeating: SIMD3(45, 0, 0), count: 10000)
        let worn = Set(GarmentRegions.picked(source, at: 40 * 100 + 20, colours: colours, person: true)?.pixels ?? [])
        let loose = Set(GarmentRegions.picked(source, at: 40 * 100 + 20, colours: colours)?.pixels ?? [])
        try expect(worn.contains(40 * 100 + 20) && worn.contains(40 * 100 + 80), "Occluded garment part lost")
        try expect(!worn.contains(40 * 100 + 50), "Gap between garment parts filled")
        try expect(loose.contains(40 * 100 + 20), "Chosen loose garment lost")
        try expect(!loose.contains(40 * 100 + 80), "Second loose garment included")
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
      ("saved cutout uses top-left photo bounds and retains source orientation", {
        let source = (0..<10000).flatMap { index -> [UInt8] in [UInt8(index / 100), UInt8(index % 100), 0, 255] }
        let photo = CIImage(cgImage: cgImage(source))
        let mask = cgImage(rgba([255, 255, 255, 255]) { _, _ in true })
        let cut = PhotoPreparation.cutout(photo, mask: mask, bounds: CGRect(x: 20, y: 10, width: 60, height: 40))
        try expect(cut.extent == CGRect(x: 0, y: 0, width: 60, height: 40), "Cutout dimensions or origin changed")
        let context = CIContext()
        var top = [UInt8](repeating: 0, count: 4)
        var bottom = top
        let space = CGColorSpace(name: CGColorSpace.sRGB)!
        context.render(cut, toBitmap: &top, rowBytes: 4, bounds: CGRect(x: 0, y: 39, width: 1, height: 1), format: .RGBA8, colorSpace: space)
        context.render(cut, toBitmap: &bottom, rowBytes: 4, bounds: CGRect(x: 59, y: 0, width: 1, height: 1), format: .RGBA8, colorSpace: space)
        try expect(top == [10, 20, 0, 255], "Wrong top-left source pixel")
        try expect(bottom == [49, 79, 0, 255], "Wrong bottom-right source pixel")
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

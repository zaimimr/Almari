import CoreImage
import Vision

struct InspirationRegion {
  let kind: String
  let garment: CIImage
  let partial: Bool
  let share: Double
}

enum InspirationRegions {
  static func extract(
    photo: CIImage, parse: ClothesParse, context: CIContext,
    cutout: (FoundRegion) -> CIImage,
    foregroundRequest: () -> VNGenerateForegroundInstanceMaskRequest
  ) -> [InspirationRegion] {
    let parsed = GarmentRegions.find(parse.grid, person: parse.people > 0)
      .filter { !$0.partial || $0.share >= 0.08 }
      .map { InspirationRegion(kind: $0.kind, garment: cutout($0), partial: $0.partial, share: $0.share) }
    if parse.people > 0 || parsed.count > 1 { return parsed }
    guard let picture = context.createCGImage(photo, from: photo.extent) else { return parsed }
    let request = foregroundRequest()
    let handler = VNImageRequestHandler(cgImage: picture)
    guard (try? handler.perform([request])) != nil, let observation = request.results?.first else { return parsed }
    let enhancer = GarmentEnhancer(context: context)
    let extent = photo.extent
    let items = observation.allInstances.compactMap { instance -> InspirationRegion? in
      guard let buffer = try? observation.generateScaledMaskForImage(forInstances: IndexSet(integer: instance), from: handler) else { return nil }
      let mask = CIImage(cvPixelBuffer: buffer)
      let map = enhancer.bitmap(mask, longEdge: 128)
      let pixels = (0..<(map.width * map.height)).filter { map.value($0) > 0.5 }
      let share = Double(pixels.count) / Double(max(1, map.width * map.height))
      guard share >= 0.01, share < 0.92 else { return nil }
      guard let minX = pixels.map({ $0 % map.width }).min(),
        let maxX = pixels.map({ $0 % map.width }).max(),
        let minY = pixels.map({ $0 / map.width }).min(),
        let maxY = pixels.map({ $0 / map.width }).max() else { return nil }
      let bounds = CGRect(
        x: CGFloat(minX) / CGFloat(map.width) * extent.width,
        y: CGFloat(minY) / CGFloat(map.height) * extent.height,
        width: CGFloat(maxX - minX + 1) / CGFloat(map.width) * extent.width,
        height: CGFloat(maxY - minY + 1) / CGFloat(map.height) * extent.height)
      let garment = photo.applyingFilter(
        "CIBlendWithMask", parameters: [
          kCIInputBackgroundImageKey: CIImage(color: .clear).cropped(to: extent),
          kCIInputMaskImageKey: mask,
        ]).cropped(to: bounds).transformed(by: CGAffineTransform(translationX: -bounds.minX, y: -bounds.minY))
      return InspirationRegion(kind: "item", garment: garment, partial: false, share: share)
    }
    return items.isEmpty ? parsed : items
  }
}

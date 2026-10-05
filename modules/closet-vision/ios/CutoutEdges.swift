import CoreImage
import CoreVideo
import Foundation

enum CutoutEdges {
  static let low: Float = 0.3
  static let high: Float = 0.8
  static let holeShare = 0.005
  static let bleed = 3.0
  static let smooth = 0.8

  static func values(_ buffer: CVPixelBuffer, box: CGRect) -> [Float]? {
    CVPixelBufferLockBaseAddress(buffer, .readOnly)
    defer { CVPixelBufferUnlockBaseAddress(buffer, .readOnly) }
    guard let base = CVPixelBufferGetBaseAddress(buffer) else { return nil }
    let row = CVPixelBufferGetBytesPerRow(buffer)
    let float = CVPixelBufferGetPixelFormatType(buffer) == kCVPixelFormatType_OneComponent32Float
    let left = Int(box.minX)
    let top = Int(box.minY)
    let width = Int(box.width)
    let height = Int(box.height)
    var result = [Float](repeating: 0, count: width * height)
    for y in 0..<height {
      let line = base.advanced(by: (top + y) * row)
      for x in 0..<width {
        result[y * width + x] =
          float
          ? line.assumingMemoryBound(to: Float32.self)[left + x]
          : Float(line.assumingMemoryBound(to: UInt8.self)[left + x]) / 255
      }
    }
    return result
  }

  static func alpha(_ soft: [Float], width: Int, height: Int) -> [UInt8] {
    let solid = soft.map { $0 >= 0.5 }
    let area = solid.reduce(0) { $0 + ($1 ? 1 : 0) }
    var small = solid
    CutoutRepair.fillHoles(&small, width: width, height: height, largest: Int(Double(area) * holeShare))
    var enclosed = solid
    CutoutRepair.fillHoles(&enclosed, width: width, height: height, largest: Int.max)
    return (0..<soft.count).map { index in
      if !solid[index] && small[index] { return 255 }
      if !solid[index] && enclosed[index] { return UInt8((min(max(soft[index], 0), 1) * 255).rounded()) }
      let t = min(max((soft[index] - low) / (high - low), 0), 1)
      return UInt8((t * t * (3 - 2 * t) * 255).rounded())
    }
  }

  static func garment(photo: CIImage, mask buffer: CVPixelBuffer, box: CGRect) -> CIImage? {
    let width = Int(box.width)
    let height = Int(box.height)
    guard width > 0, height > 0, let soft = values(buffer, box: box) else { return nil }
    let alpha = alpha(soft, width: width, height: height)
    let sharp = CIImage(
      bitmapData: Data(alpha), bytesPerRow: width, size: CGSize(width: width, height: height), format: .L8,
      colorSpace: nil)
    let extent = sharp.extent
    let mask = sharp.clampedToExtent().applyingGaussianBlur(sigma: smooth).cropped(to: extent)
    let region = CGRect(
      x: box.minX, y: photo.extent.height - box.maxY, width: box.width, height: box.height)
    let picture = photo.cropped(to: region)
      .transformed(by: CGAffineTransform(translationX: -region.minX, y: -region.minY))
    let clear = CIImage(color: .clear).cropped(to: extent)
    let solid = picture.applyingFilter(
      "CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: clear, kCIInputMaskImageKey: mask]
    ).cropped(to: extent)
    let inner = solid.clampedToExtent().applyingGaussianBlur(sigma: bleed).cropped(to: extent)
      .applyingFilter("CIUnpremultiply")
    let edge = mask.applyingFilter("CIGammaAdjust", parameters: ["inputPower": 2.0])
    let colour = picture.applyingFilter(
      "CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: inner, kCIInputMaskImageKey: edge]
    ).cropped(to: extent)
    return colour.applyingFilter(
      "CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: clear, kCIInputMaskImageKey: mask]
    ).cropped(to: extent)
  }
}

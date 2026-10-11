import CoreImage
import Foundation

enum PhotoPreparation {
  static func cutout(_ photo: CIImage, mask: CGImage, bounds: CGRect) -> CIImage {
    let rect = CGRect(
      x: bounds.minX, y: photo.extent.height - bounds.maxY, width: bounds.width, height: bounds.height)
    return photo.applyingFilter(
      "CIBlendWithMask",
      parameters: [
        kCIInputBackgroundImageKey: CIImage(color: .clear).cropped(to: photo.extent),
        kCIInputMaskImageKey: CIImage(cgImage: mask),
      ]
    )
    .cropped(to: rect)
    .transformed(by: CGAffineTransform(translationX: -rect.minX, y: -rect.minY))
  }

  static func studioInput(_ source: CIImage, context: CIContext) -> CIImage? {
    let normalized = source.transformed(
      by: CGAffineTransform(translationX: -source.extent.minX, y: -source.extent.minY))
    let image = scaled(normalized, longEdge: 500)
    let extent = CGRect(
      x: 0, y: 0, width: min(500, image.extent.width.rounded(.down)),
      height: min(500, image.extent.height.rounded(.down)))
    guard extent.width > 0, extent.height > 0 else { return nil }
    let canvas = CGRect(x: 0, y: 0, width: max(64, extent.width), height: max(64, extent.height))
    let centred = CutoutRepair.repaired(image, context: context).cropped(to: extent)
      .transformed(by: CGAffineTransform(
        translationX: ((canvas.width - extent.width) / 2).rounded(.down),
        y: ((canvas.height - extent.height) / 2).rounded(.down)))
    return centred.composited(over: CIImage(color: .white)).cropped(to: canvas)
  }

  static func scaled(_ image: CIImage, longEdge: CGFloat) -> CIImage {
    let edge = max(image.extent.width, image.extent.height)
    guard edge > longEdge else { return image }
    let ratio = longEdge / edge
    let width = max(1, (image.extent.width * ratio).rounded())
    let height = max(1, (image.extent.height * ratio).rounded())
    let scale = height / image.extent.height
    let filter = CIFilter(name: "CILanczosScaleTransform")!
    filter.setValue(image, forKey: kCIInputImageKey)
    filter.setValue(scale, forKey: kCIInputScaleKey)
    filter.setValue(width / image.extent.width / scale, forKey: kCIInputAspectRatioKey)
    let output = filter.outputImage!
    return output.transformed(by: CGAffineTransform(translationX: -output.extent.minX, y: -output.extent.minY))
      .cropped(to: CGRect(x: 0, y: 0, width: width, height: height))
  }
}

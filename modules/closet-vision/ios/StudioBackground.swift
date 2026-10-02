import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

enum StudioBackground {
  static let borderShare = 0.04
  static let shadowShare = 0.03
  static let shadowKeep: Float = 0.7
  static let near: Float = 12
  static let far: Float = 34

  static func whiten(source: URL, target: URL) -> Bool {
    guard let input = CGImageSourceCreateWithURL(source as CFURL, nil),
      let image = CGImageSourceCreateImageAtIndex(input, 0, nil),
      let whitened = whiten(image),
      let output = CGImageDestinationCreateWithURL(target as CFURL, UTType.jpeg.identifier as CFString, 1, nil)
    else { return false }
    CGImageDestinationAddImage(
      output, whitened, [kCGImageDestinationLossyCompressionQuality: 0.92] as CFDictionary)
    return CGImageDestinationFinalize(output)
  }

  static func whiten(_ image: CGImage) -> CGImage? {
    let width = image.width
    let height = image.height
    guard width > 8, height > 8, let space = CGColorSpace(name: CGColorSpace.sRGB),
      let context = CGContext(
        data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
        space: space, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue),
      let data = context.data
    else { return nil }
    context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
    let pixels = data.bindMemory(to: UInt8.self, capacity: width * height * 4)
    let count = width * height
    let background = median(pixels, width: width, height: height)
    let backgroundOpponent = opponent(background.0, background.1, background.2)

    var weight = [Float](repeating: 0, count: count)
    for index in 0..<count {
      let red = Float(pixels[index * 4])
      let green = Float(pixels[index * 4 + 1])
      let blue = Float(pixels[index * 4 + 2])
      let colour = opponent(red, green, blue)
      let chroma = hypot(colour.1 - backgroundOpponent.1, colour.2 - backgroundOpponent.2)
      let light = colour.0 - backgroundOpponent.0
      let score = chroma * 1.5 + (light < 0 ? -light : light * 0.5)
      weight[index] = min(1, max(0, (far - score) / (far - near)))
    }

    var backdrop = [Bool](repeating: false, count: count)
    var stack: [Int] = []
    stack.reserveCapacity(count / 4)
    func seed(_ index: Int) {
      if !backdrop[index] && weight[index] > 0 {
        backdrop[index] = true
        stack.append(index)
      }
    }
    for x in 0..<width {
      seed(x)
      seed((height - 1) * width + x)
    }
    for y in 0..<height {
      seed(y * width)
      seed(y * width + width - 1)
    }
    while let index = stack.popLast() {
      let x = index % width
      let y = index / width
      if x > 0 { seed(index - 1) }
      if x < width - 1 { seed(index + 1) }
      if y > 0 { seed(index - width) }
      if y < height - 1 { seed(index + width) }
    }

    let reach = max(1, Int(Double(min(width, height)) * shadowShare))
    var below = [Int](repeating: Int.max / 2, count: count)
    for x in 0..<width {
      var since = Int.max / 2
      for y in 0..<height {
        let index = y * width + x
        since = backdrop[index] ? since + 1 : 0
        below[index] = since
      }
    }
    for y in 0..<height {
      let row = y * width
      for x in 1..<width { below[row + x] = min(below[row + x], below[row + x - 1] + 1) }
      for x in stride(from: width - 2, through: 0, by: -1) {
        below[row + x] = min(below[row + x], below[row + x + 1] + 1)
      }
    }

    for index in 0..<count where backdrop[index] {
      let distance = below[index]
      let shadow = distance < reach ? 1 - Float(distance) / Float(reach) : 0
      let strength = weight[index] * (1 - shadowKeep * shadow * shadow)
      for channel in 0..<3 {
        let value = Float(pixels[index * 4 + channel])
        pixels[index * 4 + channel] = UInt8(min(255, (value + (255 - value) * strength).rounded()))
      }
    }
    return context.makeImage()
  }

  private static func opponent(_ red: Float, _ green: Float, _ blue: Float) -> (Float, Float, Float) {
    (0.299 * red + 0.587 * green + 0.114 * blue, red - green, (red + green) / 2 - blue)
  }

  private static func median(_ pixels: UnsafeMutablePointer<UInt8>, width: Int, height: Int) -> (
    Float, Float, Float
  ) {
    let band = max(1, Int(Double(min(width, height)) * borderShare))
    var histograms = [[Int]](repeating: [Int](repeating: 0, count: 256), count: 3)
    var total = 0
    for y in 0..<height {
      let edgeRow = y < band || y >= height - band
      for x in 0..<width where edgeRow || x < band || x >= width - band {
        let index = (y * width + x) * 4
        for channel in 0..<3 { histograms[channel][Int(pixels[index + channel])] += 1 }
        total += 1
      }
    }
    let middle = total / 2
    let values = histograms.map { histogram -> Float in
      var running = 0
      for (value, amount) in histogram.enumerated() {
        running += amount
        if running > middle { return Float(value) }
      }
      return 255
    }
    return (values[0], values[1], values[2])
  }
}

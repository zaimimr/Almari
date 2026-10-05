import CoreImage
import Foundation

struct QualityMeasure {
  var sharpness: Double = 0
  var brightness: Double = 0
  var clipped: [String] = []
  var coverage: Double? = nil
  var lightSpread: Double? = nil
}

struct PhotoQuality {
  let enhancer: GarmentEnhancer

  func measure(photo: CIImage, mask: CIImage?) -> QualityMeasure {
    var result = QualityMeasure()
    let flat = photo.composited(over: CIImage(color: .white).cropped(to: photo.extent))
    let picture = enhancer.bitmap(flat, longEdge: 512)
    let width = picture.width
    let height = picture.height
    let cover = mask.map { enhancer.bitmap($0, longEdge: 512) }
      .flatMap { $0.width == width && $0.height == height ? $0 : nil }
    var luma = [Double](repeating: 0, count: width * height)
    for index in 0..<luma.count {
      let pixel = picture.rgb(index)
      luma[index] = 0.2126 * pixel.red + 0.7152 * pixel.green + 0.0722 * pixel.blue
    }
    result.brightness = luma.reduce(0, +) / Double(max(luma.count, 1)) / 255
    var sum = 0.0
    var squares = 0.0
    var count = 0.0
    if width > 2 && height > 2 {
      for y in 1..<(height - 1) {
        for x in 1..<(width - 1) {
          let index = y * width + x
          if let cover, cover.value(index) <= 0.5 { continue }
          let value =
            luma[index - 1] + luma[index + 1] + luma[index - width] + luma[index + width] - 4 * luma[index]
          sum += value
          squares += value * value
          count += 1
        }
      }
    }
    if count > 0 {
      let mean = sum / count
      result.sharpness = squares / count - mean * mean
    }
    guard let mask, let cover else { return result }
    var minX = width
    var maxX = -1
    var minY = height
    var maxY = -1
    var area = 0
    for y in 0..<height {
      for x in 0..<width where cover.value(y * width + x) > 0.5 {
        minX = min(minX, x)
        maxX = max(maxX, x)
        minY = min(minY, y)
        maxY = max(maxY, y)
        area += 1
      }
    }
    result.coverage = Double(area) / Double(width * height)
    if area > 0 {
      if minY <= 1 { result.clipped.append("top") }
      if maxY >= height - 2 { result.clipped.append("bottom") }
      if minX <= 1 { result.clipped.append("left") }
      if maxX >= width - 2 { result.clipped.append("right") }
    }
    let neutral = enhancer.neutralPixels(photo: photo, mask: mask)
    if neutral.count >= 200 {
      let total = Double(neutral.count)
      let mean = neutral.reduce(0) { $0 + $1.lab.b } / total
      let variance = neutral.reduce(0) { $0 + ($1.lab.b - mean) * ($1.lab.b - mean) } / total
      result.lightSpread = variance.squareRoot()
    }
    return result
  }
}

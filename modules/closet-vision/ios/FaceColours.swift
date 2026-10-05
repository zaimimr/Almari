import CoreImage
import Foundation
import Vision

struct Colour {
  var r: Double
  var g: Double
  var b: Double

  var luma: Double { 0.2126 * r + 0.7152 * g + 0.0722 * b }

  var saturation: Double {
    let high = max(r, g, b)
    return high > 0 ? (high - min(r, g, b)) / high : 0
  }

  func balanced(_ gains: Colour) -> Colour {
    Colour(r: min(1, r * gains.r), g: min(1, g * gains.g), b: min(1, b * gains.b))
  }

  var lab: [Double] {
    func linear(_ value: Double) -> Double {
      value <= 0.04045 ? value / 12.92 : pow((value + 0.055) / 1.055, 2.4)
    }
    let (lr, lg, lb) = (linear(r), linear(g), linear(b))
    let x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047
    let y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722
    let z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883
    func f(_ t: Double) -> Double { t > 0.008856 ? cbrt(t) : 7.787 * t + 16 / 116 }
    return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))]
  }

  static func mean(_ colours: [Colour]) -> Colour? {
    guard !colours.isEmpty else { return nil }
    let count = Double(colours.count)
    return Colour(
      r: colours.reduce(0) { $0 + $1.r } / count,
      g: colours.reduce(0) { $0 + $1.g } / count,
      b: colours.reduce(0) { $0 + $1.b } / count)
  }

  static func trimmed(_ colours: [Colour], from low: Double, to high: Double) -> [Colour] {
    let sorted = colours.sorted { $0.luma < $1.luma }
    let start = Int(Double(sorted.count) * low)
    let end = Int(Double(sorted.count) * high)
    return start < end ? Array(sorted[start..<end]) : sorted
  }

  static func meanLab(_ colours: [Colour]) -> [Double]? {
    guard !colours.isEmpty else { return nil }
    let labs = colours.map(\.lab)
    let count = Double(labs.count)
    return (0..<3).map { channel in labs.reduce(0) { $0 + $1[channel] } / count }
  }
}

struct Bitmap {
  let width: Int
  let height: Int
  let pixels: [UInt8]

  func colour(_ x: Int, _ y: Int) -> Colour {
    let index = (y * width + x) * 4
    return Colour(
      r: Double(pixels[index]) / 255, g: Double(pixels[index + 1]) / 255, b: Double(pixels[index + 2]) / 255)
  }

  func disc(_ centre: CGPoint, radius: CGFloat, where keep: (Int, Int) -> Bool = { _, _ in true }) -> [Colour] {
    let r = max(1, Int(radius.rounded(.up)))
    let cx = Int(centre.x)
    let cy = Int(centre.y)
    var found: [Colour] = []
    for y in stride(from: max(0, cy - r), through: min(height - 1, cy + r), by: 1) {
      for x in stride(from: max(0, cx - r), through: min(width - 1, cx + r), by: 1) {
        let dx = x - cx
        let dy = y - cy
        guard dx * dx + dy * dy <= r * r, keep(x, y) else { continue }
        found.append(colour(x, y))
      }
    }
    return found
  }
}

struct Eye {
  let outline: [CGPoint]
  let pupil: CGPoint

  var width: CGFloat { (outline.map(\.x).max() ?? 0) - (outline.map(\.x).min() ?? 0) }

  var centre: CGPoint {
    CGPoint(
      x: outline.map(\.x).reduce(0, +) / CGFloat(outline.count),
      y: outline.map(\.y).reduce(0, +) / CGFloat(outline.count))
  }

  var corners: [CGPoint] {
    [outline.min { $0.x < $1.x }, outline.max { $0.x < $1.x }].compactMap { $0 }
  }
}

struct FaceReading {
  var light = "ok"
  var skin: [Double]? = nil
  var eyes: [Double]? = nil
  var face = CGRect.zero
  var gains = Colour(r: 1, g: 1, b: 1)
  var regions: [(CGPoint, CGFloat)] = []
  var cheek = CGPoint.zero
  var cheekRadius: CGFloat = 0
  var pupil = CGPoint.zero
  var pupilRadius: CGFloat = 0
  var paper = false
}

enum FaceColours {
  static let context = CIContext(options: [.workingColorSpace: CGColorSpace(name: CGColorSpace.sRGB)!])
  static let maxGain = 1.3
  static let castLimit = 0.14
  static let paperWhite = 0.85

  static func image(_ url: URL) -> CIImage? {
    guard var image = CIImage(contentsOf: url, options: [.applyOrientationProperty: true]) else { return nil }
    image = image.transformed(by: CGAffineTransform(translationX: -image.extent.minX, y: -image.extent.minY))
    let scale = min(1, 1024 / max(image.extent.width, image.extent.height))
    return image.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
  }

  static func bitmap(_ image: CIImage) -> (Bitmap, CGImage)? {
    let width = Int(image.extent.width.rounded(.down))
    let height = Int(image.extent.height.rounded(.down))
    let bounds = CGRect(x: 0, y: 0, width: width, height: height)
    guard width > 0, height > 0, let cgImage = context.createCGImage(image, from: bounds) else { return nil }
    var pixels = [UInt8](repeating: 0, count: width * height * 4)
    context.render(
      image, toBitmap: &pixels, rowBytes: width * 4, bounds: bounds, format: .RGBA8,
      colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
    return (Bitmap(width: width, height: height, pixels: pixels), cgImage)
  }

  static func landmarks(_ cgImage: CGImage) throws -> VNFaceObservation? {
    let request = VNDetectFaceLandmarksRequest()
    #if targetEnvironment(simulator)
      if let devices = try? request.supportedComputeStageDevices {
        for (stage, options) in devices {
          if let cpu = options.first(where: { $0.description.localizedCaseInsensitiveContains("cpu") }) {
            request.setComputeDevice(cpu, for: stage)
          }
        }
      }
    #endif
    try VNImageRequestHandler(cgImage: cgImage).perform([request])
    return request.results?.max(by: {
      $0.boundingBox.width * $0.boundingBox.height < $1.boundingBox.width * $1.boundingBox.height
    })
  }

  static func isSkin(_ colour: Colour) -> Bool {
    let lab = colour.lab
    let chroma = hypot(lab[1], lab[2])
    let hue = atan2(lab[2], lab[1]) * 180 / .pi
    return lab[0] > 8 && lab[0] < 97 && chroma > 5 && hue > 10 && hue < 95 && colour.r >= colour.b
  }

  static func gains(_ reference: Colour) -> Colour {
    let grey = (reference.r + reference.g + reference.b) / 3
    return Colour(r: grey / max(reference.r, 0.01), g: grey / max(reference.g, 0.01), b: grey / max(reference.b, 0.01))
  }

  static func read(_ bitmap: Bitmap, face: VNFaceObservation, paper: Bool = false) -> FaceReading? {
    guard
      let landmarks = face.landmarks,
      let leftEye = landmarks.leftEye, let rightEye = landmarks.rightEye,
      let leftPupil = landmarks.leftPupil, let rightPupil = landmarks.rightPupil,
      let nose = landmarks.nose
    else { return nil }
    let size = CGSize(width: bitmap.width, height: bitmap.height)
    let flip = { (points: [CGPoint]) in points.map { CGPoint(x: $0.x, y: size.height - $0.y) } }
    let eyes = [(leftEye, leftPupil), (rightEye, rightPupil)].compactMap { pair -> Eye? in
      let outline = flip(pair.0.pointsInImage(imageSize: size))
      guard outline.count > 1, let pupil = flip(pair.1.pointsInImage(imageSize: size)).first else { return nil }
      return Eye(outline: outline, pupil: pupil)
    }.sorted { $0.centre.x < $1.centre.x }
    let nosePoints = flip(nose.pointsInImage(imageSize: size))
    guard eyes.count == 2, !nosePoints.isEmpty else { return nil }
    let lips = landmarks.outerLips.map { flip($0.pointsInImage(imageSize: size)) } ?? []
    let brows = [landmarks.leftEyebrow, landmarks.rightEyebrow].compactMap { $0 }
      .flatMap { flip($0.pointsInImage(imageSize: size)) }

    var reading = FaceReading()
    reading.face = CGRect(
      x: face.boundingBox.minX, y: 1 - face.boundingBox.maxY, width: face.boundingBox.width,
      height: face.boundingBox.height)
    let span = hypot(eyes[1].centre.x - eyes[0].centre.x, eyes[1].centre.y - eyes[0].centre.y)
    let noseBottom = nosePoints.map(\.y).max() ?? eyes[0].centre.y + span * 0.7
    let noseLeft = (nosePoints.map(\.x).min() ?? 0) - span * 0.06
    let noseRight = (nosePoints.map(\.x).max() ?? 0) + span * 0.06
    let lipsBox =
      lips.isEmpty
      ? CGRect(x: noseLeft, y: noseBottom + span * 0.1, width: noseRight - noseLeft, height: span * 0.3)
      : CGRect(
        x: lips.map(\.x).min()!, y: lips.map(\.y).min()!, width: lips.map(\.x).max()! - lips.map(\.x).min()!,
        height: lips.map(\.y).max()! - lips.map(\.y).min()!)
    let mouth = lipsBox.insetBy(dx: -span * 0.06, dy: -span * 0.06)
    let eyeBottom = { (eye: Eye) in (eye.outline.map(\.y).max() ?? eye.centre.y) + span * 0.1 }
    let middle = (eyes[0].centre.x + eyes[1].centre.x) / 2
    let cheekRadius = span * 0.22
    let cheekCentres = eyes.map { eye in
      CGPoint(
        x: eye.centre.x + (eye.centre.x < middle ? -1 : 1) * span * 0.08,
        y: eye.centre.y + 0.8 * max(span * 0.3, noseBottom - eye.centre.y))
    }
    let rawCheeks = zip(eyes, cheekCentres).map { eye, centre in
      bitmap.disc(centre, radius: cheekRadius) { x, y in
        let point = CGPoint(x: x, y: y)
        return (point.x < noseLeft || point.x > noseRight) && point.y > eyeBottom(eye) && !mouth.contains(point)
      }
    }
    let chinCentre = CGPoint(x: lipsBox.midX, y: lipsBox.maxY + span * 0.3)
    let chin = bitmap.disc(chinCentre, radius: span * 0.16) { x, y in !mouth.contains(CGPoint(x: x, y: y)) }
    let browTop = brows.map(\.y).min() ?? (min(eyes[0].centre.y, eyes[1].centre.y) - span * 0.3)
    let foreheadCentre = CGPoint(x: middle, y: browTop - span * 0.3)
    let forehead = bitmap.disc(foreheadCentre, radius: span * 0.2)
    reading.regions = [
      (cheekCentres[0], cheekRadius), (cheekCentres[1], cheekRadius), (chinCentre, span * 0.16),
      (foreheadCentre, span * 0.2),
    ]
    reading.cheek = cheekCentres[0]
    reading.cheekRadius = cheekRadius
    reading.pupil = eyes[0].pupil
    reading.pupilRadius = max(1, 0.22 * eyes[0].width)

    let allCheeks = rawCheeks.flatMap { $0 }
    guard rawCheeks.allSatisfy({ $0.count >= 12 }) else { return reading }

    let scleraPixels = eyes.flatMap { eye in
      eye.corners.flatMap { corner in
        bitmap.disc(
          CGPoint(
            x: eye.pupil.x + 0.6 * (corner.x - eye.pupil.x), y: eye.pupil.y + 0.6 * (corner.y - eye.pupil.y)),
          radius: max(1, 0.07 * eye.width))
      }
    }
    let skinLuma = Colour.mean(Colour.trimmed(allCheeks, from: 0.25, to: 0.75))?.luma ?? 0
    let sclera = Colour.mean(Colour.trimmed(scleraPixels, from: 0.5, to: 0.95)).flatMap {
      $0.saturation < 0.3 && $0.luma > skinLuma * 0.9 ? $0 : nil
    }
    let faceBox = CGRect(
      x: reading.face.minX * size.width, y: reading.face.minY * size.height,
      width: reading.face.width * size.width, height: reading.face.height * size.height
    ).insetBy(dx: -reading.face.width * size.width * 0.35, dy: -reading.face.height * size.height * 0.35)
    var neutralPixels: [Colour] = []
    var counted = 0
    for y in stride(from: 0, to: bitmap.height, by: 3) {
      for x in stride(from: 0, to: bitmap.width, by: 3) where !faceBox.contains(CGPoint(x: x, y: y)) {
        counted += 1
        let colour = bitmap.colour(x, y)
        if colour.saturation < 0.15, colour.luma > 0.25, colour.luma < 0.95 { neutralPixels.append(colour) }
      }
    }
    let neutral = neutralPixels.count >= max(200, counted / 20) ? Colour.mean(neutralPixels) : nil
    let sheet = paper ? whiteSheet(bitmap, face: faceBox.insetBy(dx: faceBox.width * 0.2, dy: faceBox.height * 0.2)) : nil

    if (sclera?.luma ?? max(skinLuma * 2, neutral?.luma ?? 0)) < 0.22 || skinLuma < 0.05 {
      reading.light = "dark"
      return reading
    }
    let clipped = Double(allCheeks.filter { max($0.r, $0.g, $0.b) >= 0.98 }.count) / Double(allCheeks.count)
    if clipped > 0.25 {
      reading.light = "mixed"
      return reading
    }
    if let sheet {
      let gain = gains(sheet)
      let exposure = pow(paperWhite / max(0.05, linearLuma(sheet)), 1 / 2.2)
      let scale = min(2.5, max(0.5, exposure))
      reading.paper = true
      reading.gains = Colour(r: gain.r * scale, g: gain.g * scale, b: gain.b * scale)
      return measure(reading, bitmap, rawCheeks: rawCheeks, chin: chin, forehead: forehead, eyes: eyes)
    }
    let references = [sclera, neutral].compactMap { $0 }
    let measured = Colour.mean(references.map(gains)) ?? Colour(r: 1, g: 1, b: 1)
    let normalise = (measured.r + measured.g + measured.b) / 3
    let gain = Colour(r: measured.r / normalise, g: measured.g / normalise, b: measured.b / normalise)
    if let a = sclera, let b = neutral, a.g > 0, b.g > 0,
      abs(a.r / a.g - b.r / b.g) > castLimit * 1.5 || abs(a.b / a.g - b.b / b.g) > castLimit * 1.5
    {
      reading.light = "mixed"
      return reading
    }
    if [gain.r, gain.g, gain.b].contains(where: { $0 < 1 / maxGain || $0 > maxGain }) {
      reading.light = "mixed"
      return reading
    }
    reading.gains = gain
    return measure(reading, bitmap, rawCheeks: rawCheeks, chin: chin, forehead: forehead, eyes: eyes)
  }

  static func linearLuma(_ colour: Colour) -> Double {
    func linear(_ value: Double) -> Double {
      value <= 0.04045 ? value / 12.92 : pow((value + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * linear(colour.r) + 0.7152 * linear(colour.g) + 0.0722 * linear(colour.b)
  }

  static func whiteSheet(_ bitmap: Bitmap, face: CGRect) -> Colour? {
    let search = face.insetBy(dx: -face.width * 1.2, dy: -face.height * 0.4)
    var found: [Colour] = []
    var clipped = 0
    for y in stride(from: max(0, Int(search.minY)), to: min(bitmap.height, Int(search.maxY)), by: 2) {
      for x in stride(from: max(0, Int(search.minX)), to: min(bitmap.width, Int(search.maxX)), by: 2)
      where !face.contains(CGPoint(x: x, y: y)) {
        let colour = bitmap.colour(x, y)
        guard colour.saturation < 0.25, colour.luma > 0.3 else { continue }
        if max(colour.r, colour.g, colour.b) >= 0.98 { clipped += 1 } else { found.append(colour) }
      }
    }
    let bright = found.sorted { $0.luma > $1.luma }
    guard let top = bright.first else { return nil }
    let sheet = bright.prefix { $0.luma >= top.luma * 0.85 }
    let needed = Int(face.width * face.height * 0.12 / 4)
    guard sheet.count >= needed, clipped < sheet.count / 2 else { return nil }
    return Colour.mean(Array(sheet))
  }

  static func measure(
    _ start: FaceReading, _ bitmap: Bitmap, rawCheeks: [[Colour]], chin: [Colour], forehead: [Colour], eyes: [Eye]
  ) -> FaceReading {
    var reading = start
    let gain = reading.gains
    let balance = { (colours: [Colour]) in colours.map { $0.balanced(gain) }.filter(isSkin) }

    let cheeks = rawCheeks.map(balance)
    guard cheeks.allSatisfy({ $0.count >= 8 }) else { return reading }
    let cheekLabs = cheeks.compactMap { Colour.meanLab(Colour.trimmed($0, from: 0.2, to: 0.6)) }
    let cheekGap = abs(cheekLabs[0][0] - cheekLabs[1][0])
    if cheekGap > 25 {
      reading.light = "mixed"
      return reading
    }
    var skinPixels = cheekGap > 10 ? cheeks[cheekLabs[0][0] > cheekLabs[1][0] ? 0 : 1] : cheeks.flatMap { $0 }
    let cheekLab = Colour.meanLab(Colour.trimmed(skinPixels, from: 0.2, to: 0.6))!
    for region in [balance(chin), balance(forehead)] {
      guard region.count >= 8, let lab = Colour.meanLab(Colour.trimmed(region, from: 0.2, to: 0.6)),
        zip(lab, cheekLab).map({ pow($0 - $1, 2) }).reduce(0, +) < 144
      else { continue }
      skinPixels += region
    }
    let skin = Colour.trimmed(skinPixels, from: 0.2, to: 0.6)
    reading.skin = Colour.meanLab(skin)
    let irises = eyes.flatMap { eye in
      Colour.trimmed(
        bitmap.disc(eye.pupil, radius: max(1, 0.22 * eye.width)).map { $0.balanced(gain) }, from: 0.2, to: 0.7)
    }
    reading.eyes = Colour.mean(irises)?.lab
    return reading
  }
}

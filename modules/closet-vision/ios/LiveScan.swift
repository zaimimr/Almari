import AVFoundation
import AudioToolbox
import CoreImage
import ExpoModulesCore
import UIKit
import Vision

struct ScanStickerRecord: Record {
  @Field var name: String = ""
  @Field var frame: [String: Double] = [:]
}

struct ScanCaptureRecord: Record {
  @Field var photo: String = ""
  @Field var region: GarmentRegionRecord? = nil
  @Field var sticker: ScanStickerRecord? = nil
  @Field var box: [String: Double] = [:]
  @Field var milliseconds: [String: Int] = [:]
}

private func milliseconds(_ start: Date, _ end: Date = Date()) -> Int {
  Int(end.timeIntervalSince(start) * 1000)
}

final class FrameReader {
  static let cols = 36
  static let rows = 48
  static let held: [String: Set<ClothesClass>] = [
    "head": [.hat, .scarf], "upper": [.upper], "skirt": [.skirt], "pants": [.pants], "dress": [.dress],
    "bag": [.bag],
  ]

  private let parser: ClothesParser
  private let hands = VNDetectHumanHandPoseRequest()
  private let humans = VNDetectHumanRectanglesRequest()
  private let foreground = GarmentPipeline.foregroundRequest()

  init(parser: ClothesParser) {
    self.parser = parser
    hands.maximumHandCount = 2
  }

  func read(_ buffer: CVPixelBuffer) throws -> [String: Any] {
    let started = Date()
    let image = CIImage(cvPixelBuffer: buffer)
    let grid = try parser.parseWhole(image).grid
    let parsed = Date()
    let cols = Self.cols
    let rows = Self.rows
    var labels = [UInt8](repeating: 0, count: cols * rows)
    for row in 0..<rows {
      for col in 0..<cols {
        let x = min(grid.width - 1, Int((Double(col) + 0.5) / Double(cols) * Double(grid.width)))
        let y = min(grid.height - 1, Int((Double(row) + 0.5) / Double(rows) * Double(grid.height)))
        labels[row * cols + col] = grid.labels[y * grid.width + x]
      }
    }
    let colours = averages(image)
    let handStart = Date()
    let seen = look(buffer)
    return [
      "at": Date().timeIntervalSince1970 * 1000,
      "cols": cols,
      "rows": rows,
      "labels": Data(labels).base64EncodedString(),
      "colours": Data(colours).base64EncodedString(),
      "hands": seen.hands,
      "people": seen.people,
      "items": Data(seen.items).base64EncodedString(),
      "milliseconds": [
        "parse": milliseconds(started, parsed), "hands": milliseconds(handStart),
        "total": milliseconds(started),
      ],
    ]
  }

  private func averages(_ image: CIImage) -> [UInt8] {
    let cols = Self.cols
    let rows = Self.rows
    let scale = CGFloat(rows) / image.extent.height
    let aspect = (CGFloat(cols) / image.extent.width) / scale
    let small = image.applyingFilter(
      "CILanczosScaleTransform", parameters: [kCIInputScaleKey: scale, kCIInputAspectRatioKey: aspect])
    var rgba = [UInt8](repeating: 0, count: cols * rows * 4)
    guard
      let picture = parser.context.createCGImage(
        small, from: CGRect(x: small.extent.minX, y: small.extent.minY, width: CGFloat(cols), height: CGFloat(rows))),
      let drawing = CGContext(
        data: &rgba, width: cols, height: rows, bitsPerComponent: 8, bytesPerRow: cols * 4,
        space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)
    else { return [UInt8](repeating: 0, count: cols * rows * 3) }
    drawing.draw(picture, in: CGRect(x: 0, y: 0, width: cols, height: rows))
    var rgb = [UInt8]()
    rgb.reserveCapacity(cols * rows * 3)
    for index in 0..<(cols * rows) {
      rgb.append(contentsOf: rgba[(index * 4)..<(index * 4 + 3)])
    }
    return rgb
  }

  private func look(_ buffer: CVPixelBuffer) -> (hands: [[Double]], people: Int, items: [UInt8]) {
    let handler = VNImageRequestHandler(cvPixelBuffer: buffer, orientation: .up)
    try? handler.perform([hands, humans, foreground])
    let points: [[Double]] = (hands.results ?? []).compactMap { hand in
      guard let points = try? hand.recognizedPoints(.all) else { return nil }
      let sure = points.values.filter { $0.confidence > 0.3 }
      guard !sure.isEmpty else { return nil }
      let x = sure.reduce(0.0) { $0 + Double($1.location.x) } / Double(sure.count)
      let y = sure.reduce(0.0) { $0 + Double($1.location.y) } / Double(sure.count)
      return [x, 1 - y]
    }
    let people = humans.results?.filter { $0.confidence > 0.5 }.count ?? 0
    var items = [UInt8](repeating: 0, count: Self.cols * Self.rows)
    if let mask = foreground.results?.first?.instanceMask {
      CVPixelBufferLockBaseAddress(mask, .readOnly)
      if let base = CVPixelBufferGetBaseAddress(mask) {
        let width = CVPixelBufferGetWidth(mask)
        let height = CVPixelBufferGetHeight(mask)
        let row = CVPixelBufferGetBytesPerRow(mask)
        let pointer = base.assumingMemoryBound(to: UInt8.self)
        for y in 0..<Self.rows {
          for x in 0..<Self.cols {
            let column = min(width - 1, Int((Double(x) + 0.5) / Double(Self.cols) * Double(width)))
            let line = min(height - 1, Int((Double(y) + 0.5) / Double(Self.rows) * Double(height)))
            items[y * Self.cols + x] = pointer[line * row + column]
          }
        }
      }
      CVPixelBufferUnlockBaseAddress(mask, .readOnly)
    }
    return (points, people, items)
  }

  func cutHeld(data: Data, id: String, box: CGRect, kind: String, folder: URL) throws
    -> (region: GarmentRegionRecord, sticker: ScanStickerRecord?)?
  {
    guard let loaded = CIImage(data: data, options: [.applyOrientationProperty: true]) else { return nil }
    var image = loaded.transformed(by: CGAffineTransform(translationX: -loaded.extent.minX, y: -loaded.extent.minY))
    let edge = max(image.extent.width, image.extent.height)
    if edge > 2048 {
      image = image.applyingFilter(
        "CILanczosScaleTransform", parameters: [kCIInputScaleKey: 2048 / edge, kCIInputAspectRatioKey: 1.0])
      image = image.transformed(by: CGAffineTransform(translationX: -image.extent.minX, y: -image.extent.minY))
    }
    let area = box.insetBy(dx: -0.2, dy: -0.2).intersection(CGRect(x: 0, y: 0, width: 1, height: 1))
    let width = image.extent.width
    let height = image.extent.height
    let rect = CGRect(
      x: area.minX * width, y: (1 - area.maxY) * height, width: area.width * width, height: area.height * height
    ).integral.intersection(image.extent)
    guard rect.width >= 32, rect.height >= 32 else { return nil }
    let crop = image.cropped(to: rect).transformed(by: CGAffineTransform(translationX: -rect.minX, y: -rect.minY))
    let parse = try parser.parseWhole(crop)
    let wanted = Set((Self.held[kind] ?? []).map { UInt8($0.rawValue) })
    let found = GarmentRegions.largest(parse.grid, kind: kind, wanted: wanted).flatMap { $0.share >= 0.02 ? $0 : nil }
    let local = CGRect(
      x: (box.minX - area.minX) / area.width, y: (box.minY - area.minY) / area.height,
      width: box.width / area.width, height: box.height / area.height)
    guard
      let piece = found.map({ held(crop, parse: parse, region: $0, kind: kind) })
        ?? cutItem(crop, parse: parse, inside: local)
    else { return nil }
    let name = "\(id)-region-1.png"
    let cut = piece.cut
    try parser.context.writePNGRepresentation(
      of: cut, to: folder.appendingPathComponent(name), format: .RGBA8,
      colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
    let photoArea = CGRect(
      x: rect.minX / width, y: 1 - rect.maxY / height, width: rect.width / width, height: rect.height / height)
    let place = { (local: CGRect) -> [String: Double] in
      [
        "x": Double(photoArea.minX + local.minX * photoArea.width),
        "y": Double(photoArea.minY + local.minY * photoArea.height),
        "width": Double(local.width * photoArea.width),
        "height": Double(local.height * photoArea.height),
      ]
    }
    var record = GarmentRegionRecord()
    record.kind = piece.kind
    record.cutout = name
    record.frame = place(piece.frame)
    record.share = piece.share * Double(photoArea.width * photoArea.height)
    record.partial = false
    let stickerName = "\(id)-sticker.png"
    guard let pad = try? writeSticker(cut, to: folder.appendingPathComponent(stickerName)) else {
      return (record, nil)
    }
    var outlined = ScanStickerRecord()
    outlined.name = stickerName
    outlined.frame = place(piece.outline.insetBy(dx: -pad / rect.width, dy: -pad / rect.height))
    return (record, outlined)
  }

  private func held(_ crop: CIImage, parse: ClothesParse, region: FoundRegion, kind: String)
    -> (cut: CIImage, frame: CGRect, outline: CGRect, share: Double, kind: String)
  {
    guard let subject = GarmentPipeline.subjectCut(crop, parse: parse, region: region, context: parser.context) else {
      return (
        parse.cutout(crop, region: region), parse.normalizedFrame(of: region), parse.cutoutFrame(of: region),
        region.share, kind
      )
    }
    let extent = crop.extent
    let frame = CGRect(
      x: subject.bounds.minX / extent.width, y: 1 - subject.bounds.maxY / extent.height,
      width: subject.bounds.width / extent.width, height: subject.bounds.height / extent.height)
    return (subject.cut, frame, frame, region.share, kind)
  }

  private static let body: Set<ClothesClass> = [.hair, .face, .leftArm, .rightArm, .leftLeg, .rightLeg]

  private func cutItem(_ crop: CIImage, parse: ClothesParse, inside: CGRect)
    -> (cut: CIImage, frame: CGRect, outline: CGRect, share: Double, kind: String)?
  {
    let extent = crop.extent
    guard let picture = parser.context.createCGImage(crop, from: extent) else { return nil }
    let request = GarmentPipeline.foregroundRequest()
    let handler = VNImageRequestHandler(cgImage: picture)
    guard (try? handler.perform([request])) != nil, let observation = request.results?.first,
      let instance = Self.central(observation.instanceMask, inside: inside),
      let buffer = try? observation.generateScaledMaskForImage(forInstances: IndexSet(integer: instance), from: handler)
    else { return nil }
    let skin = parse.mask(of: Self.body).applyingFilter("CIColorInvert")
    let mask = CIImage(cvPixelBuffer: buffer).applyingFilter(
      "CIMultiplyCompositing", parameters: [kCIInputBackgroundImageKey: skin]
    ).cropped(to: extent)
    guard let bounds = bounds(mask, extent: extent) else { return nil }
    let cut = crop.applyingFilter(
      "CIBlendWithMask",
      parameters: [
        kCIInputBackgroundImageKey: CIImage(color: .clear).cropped(to: extent), kCIInputMaskImageKey: mask,
      ]
    )
    .cropped(to: bounds.rect)
    .transformed(by: CGAffineTransform(translationX: -bounds.rect.minX, y: -bounds.rect.minY))
    let frame = CGRect(
      x: bounds.rect.minX / extent.width, y: 1 - bounds.rect.maxY / extent.height,
      width: bounds.rect.width / extent.width, height: bounds.rect.height / extent.height)
    return (cut, frame, frame, bounds.share, "item")
  }

  private static func central(_ mask: CVPixelBuffer, inside: CGRect) -> Int? {
    CVPixelBufferLockBaseAddress(mask, .readOnly)
    defer { CVPixelBufferUnlockBaseAddress(mask, .readOnly) }
    guard let base = CVPixelBufferGetBaseAddress(mask) else { return nil }
    let width = CVPixelBufferGetWidth(mask)
    let height = CVPixelBufferGetHeight(mask)
    let row = CVPixelBufferGetBytesPerRow(mask)
    let pointer = base.assumingMemoryBound(to: UInt8.self)
    let minX = max(0, Int(inside.minX * CGFloat(width)))
    let maxX = min(width, Int(inside.maxX * CGFloat(width)))
    let minY = max(0, Int(inside.minY * CGFloat(height)))
    let maxY = min(height, Int(inside.maxY * CGFloat(height)))
    var counts: [Int: Int] = [:]
    for y in minY..<max(minY, maxY) {
      for x in minX..<max(minX, maxX) where pointer[y * row + x] > 0 {
        counts[Int(pointer[y * row + x]), default: 0] += 1
      }
    }
    return counts.max { $0.value < $1.value }?.key
  }

  private func bounds(_ mask: CIImage, extent: CGRect) -> (rect: CGRect, share: Double)? {
    let side = 128
    let scale = CGFloat(side) / max(extent.width, extent.height)
    let width = max(1, Int(extent.width * scale))
    let height = max(1, Int(extent.height * scale))
    let small = mask.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
    var gray = [UInt8](repeating: 0, count: width * height)
    guard let picture = parser.context.createCGImage(small, from: CGRect(x: 0, y: 0, width: width, height: height)),
      let drawing = CGContext(
        data: &gray, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width,
        space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue)
    else { return nil }
    drawing.draw(picture, in: CGRect(x: 0, y: 0, width: width, height: height))
    var minX = width
    var minY = height
    var maxX = -1
    var maxY = -1
    var count = 0
    for y in 0..<height {
      for x in 0..<width where gray[y * width + x] > 127 {
        count += 1
        minX = min(minX, x)
        maxX = max(maxX, x)
        minY = min(minY, y)
        maxY = max(maxY, y)
      }
    }
    guard maxX >= minX, Double(count) >= 0.02 * Double(width * height) else { return nil }
    let rect = CGRect(
      x: CGFloat(minX) / scale, y: extent.height - CGFloat(maxY + 1) / scale,
      width: CGFloat(maxX - minX + 1) / scale, height: CGFloat(maxY - minY + 1) / scale
    ).integral.intersection(extent)
    return (rect, Double(count) / Double(width * height))
  }

  private func writeSticker(_ cut: CIImage, to url: URL) throws -> CGFloat {
    let scale = min(1, 720 / max(cut.extent.width, cut.extent.height))
    let small = cut.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
    let pad = (max(small.extent.width, small.extent.height) * 0.03).rounded(.up)
    let zero = CIVector(x: 0, y: 0, z: 0, w: 0)
    let outline = small.applyingFilter(
      "CIColorMatrix",
      parameters: [
        "inputRVector": zero, "inputGVector": zero, "inputBVector": zero,
        "inputAVector": CIVector(x: 0, y: 0, z: 0, w: 1), "inputBiasVector": CIVector(x: 1, y: 1, z: 1, w: 0),
      ]
    ).applyingFilter("CIMorphologyMaximum", parameters: [kCIInputRadiusKey: pad * 0.8])
    let canvas = small.extent.insetBy(dx: -pad, dy: -pad)
    let image = small.composited(over: outline).composited(over: CIImage(color: .clear)).cropped(to: canvas)
      .transformed(by: CGAffineTransform(translationX: -canvas.minX, y: -canvas.minY))
    try parser.context.writePNGRepresentation(
      of: image, to: url, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
    return pad / scale
  }
}

final class PhotoTaker: NSObject, AVCapturePhotoCaptureDelegate {
  var done: ((Data?) -> Void)?

  func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
    done?(error == nil ? photo.fileDataRepresentation() : nil)
    done = nil
  }
}

final class LiveScanView: ExpoView, AVCaptureVideoDataOutputSampleBufferDelegate {
  let onFrame = EventDispatcher()
  let onCamera = EventDispatcher()

  var facing = "back" {
    didSet { if facing != oldValue { configure() } }
  }
  var active = false {
    didSet { if active != oldValue { configure() } }
  }
  var fps: Double = 4
  var frozen = false {
    didSet { preview.connection?.isEnabled = !frozen }
  }

  private let session = AVCaptureSession()
  private let video = AVCaptureVideoDataOutput()
  private let photos = AVCapturePhotoOutput()
  private let preview = AVCaptureVideoPreviewLayer()
  private let sessionQueue = DispatchQueue(label: "closet.scan.session")
  private let frameQueue = DispatchQueue(label: "closet.scan.frames")
  private var reader: FrameReader?
  private var lastFrame = Date.distantPast
  private var mirrored = false
  private var takers: [PhotoTaker] = []

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    backgroundColor = .black
    preview.session = session
    preview.videoGravity = .resizeAspect
    layer.addSublayer(preview)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    preview.frame = bounds
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    configure()
  }

  private func configure() {
    let running = active && window != nil
    let position: AVCaptureDevice.Position = facing == "front" ? .front : .back
    sessionQueue.async { [weak self] in self?.apply(running: running, position: position) }
  }

  private func report(_ state: String) {
    DispatchQueue.main.async { [weak self] in self?.onCamera(["state": state]) }
  }

  private func apply(running: Bool, position: AVCaptureDevice.Position) {
    DispatchQueue.main.async { UIApplication.shared.isIdleTimerDisabled = running }
    guard running else {
      if session.isRunning { session.stopRunning() }
      return
    }
    guard AVCaptureDevice.authorizationStatus(for: .video) == .authorized else {
      report("denied")
      return
    }
    guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position),
      let input = try? AVCaptureDeviceInput(device: device)
    else {
      report("unavailable")
      return
    }
    if reader == nil {
      guard let parser = try? GarmentPipeline.shared.makeParser() else {
        report("unavailable")
        return
      }
      reader = FrameReader(parser: parser)
    }
    session.beginConfiguration()
    session.sessionPreset = .photo
    for old in session.inputs { session.removeInput(old) }
    if session.canAddInput(input) { session.addInput(input) }
    if session.outputs.isEmpty {
      video.alwaysDiscardsLateVideoFrames = true
      video.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
      video.setSampleBufferDelegate(self, queue: frameQueue)
      if session.canAddOutput(video) { session.addOutput(video) }
      if session.canAddOutput(photos) { session.addOutput(photos) }
    }
    let front = position == .front
    for connection in [video.connection(with: .video), photos.connection(with: .video)].compactMap({ $0 }) {
      if connection.isVideoRotationAngleSupported(90) { connection.videoRotationAngle = 90 }
      if connection.isVideoMirroringSupported {
        connection.automaticallyAdjustsVideoMirroring = false
        connection.isVideoMirrored = front && connection.output === video
      }
    }
    session.commitConfiguration()
    mirrored = front
    if !session.isRunning { session.startRunning() }
    DispatchQueue.main.async { [weak self] in
      if let connection = self?.preview.connection, connection.isVideoRotationAngleSupported(90) {
        connection.videoRotationAngle = 90
      }
    }
    report("ready")
  }

  func captureOutput(
    _ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection
  ) {
    let now = Date()
    guard now.timeIntervalSince(lastFrame) >= 1 / max(fps, 0.5), let reader,
      let buffer = CMSampleBufferGetImageBuffer(sampleBuffer)
    else { return }
    lastFrame = now
    guard let reading = try? reader.read(buffer) else { return }
    DispatchQueue.main.async { [weak self] in self?.onFrame(reading) }
  }

  func capture(id: String, box: [String: Double], kind: String, promise: Promise) {
    guard session.isRunning, let reader else {
      promise.reject("E_SCAN_CAMERA", "unavailable")
      return
    }
    let started = Date()
    let seen = CGRect(x: box["x"] ?? 0, y: box["y"] ?? 0, width: box["width"] ?? 1, height: box["height"] ?? 1)
    let held = mirrored ? CGRect(x: 1 - seen.maxX, y: seen.minY, width: seen.width, height: seen.height) : seen
    let folder = GarmentPipeline.shared.photos
    let settings =
      photos.availablePhotoCodecTypes.contains(.jpeg)
      ? AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.jpeg]) : AVCapturePhotoSettings()
    let taker = PhotoTaker()
    taker.done = { [weak self, weak taker] data in
      DispatchQueue.main.async { self?.takers.removeAll { $0 === taker } }
      guard let self, let data else {
        promise.reject("E_SCAN_PHOTO", "unreadable")
        return
      }
      AudioServicesPlaySystemSound(1057)
      DispatchQueue.main.async { UINotificationFeedbackGenerator().notificationOccurred(.success) }
      let taken = Date()
      self.frameQueue.async {
        do {
          try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
          let name = "\(id)-original.jpg"
          try data.write(to: folder.appendingPathComponent(name))
          var record = ScanCaptureRecord()
          record.photo = name
          let cut = (try? reader.cutHeld(data: data, id: id, box: held, kind: kind, folder: folder)) ?? nil
          record.region = cut?.region
          record.sticker = cut?.sticker
          record.box = [
            "x": Double(held.minX), "y": Double(held.minY), "width": Double(held.width), "height": Double(held.height),
          ]
          record.milliseconds = ["photo": milliseconds(started, taken), "cutout": milliseconds(taken)]
          promise.resolve(record)
        } catch {
          promise.reject("E_SCAN_STORAGE", "storage")
        }
      }
    }
    takers.append(taker)
    photos.capturePhoto(with: settings, delegate: taker)
  }
}

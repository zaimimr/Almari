import AVFoundation
import AudioToolbox
import CoreImage
import ExpoModulesCore
import UIKit
import Vision

struct ScanCaptureRecord: Record {
  @Field var photo: String = ""
  @Field var region: GarmentRegionRecord? = nil
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
    let points = handPoints(buffer)
    return [
      "at": Date().timeIntervalSince1970 * 1000,
      "cols": cols,
      "rows": rows,
      "labels": Data(labels).base64EncodedString(),
      "colours": Data(colours).base64EncodedString(),
      "hands": points,
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

  private func handPoints(_ buffer: CVPixelBuffer) -> [[Double]] {
    let handler = VNImageRequestHandler(cvPixelBuffer: buffer, orientation: .up)
    guard (try? handler.perform([hands])) != nil, let results = hands.results else { return [] }
    return results.compactMap { hand in
      guard let points = try? hand.recognizedPoints(.all) else { return nil }
      let sure = points.values.filter { $0.confidence > 0.3 }
      guard !sure.isEmpty else { return nil }
      let x = sure.reduce(0.0) { $0 + Double($1.location.x) } / Double(sure.count)
      let y = sure.reduce(0.0) { $0 + Double($1.location.y) } / Double(sure.count)
      return [x, 1 - y]
    }
  }

  func cutHeld(data: Data, id: String, box: CGRect, kind: String, folder: URL) throws
    -> GarmentRegionRecord?
  {
    guard let classes = Self.held[kind], let loaded = CIImage(data: data, options: [.applyOrientationProperty: true])
    else { return nil }
    var image = loaded.transformed(by: CGAffineTransform(translationX: -loaded.extent.minX, y: -loaded.extent.minY))
    let edge = max(image.extent.width, image.extent.height)
    if edge > 2048 {
      image = image.applyingFilter(
        "CILanczosScaleTransform", parameters: [kCIInputScaleKey: 2048 / edge, kCIInputAspectRatioKey: 1.0])
      image = image.transformed(by: CGAffineTransform(translationX: -image.extent.minX, y: -image.extent.minY))
    }
    let area = box.insetBy(dx: -0.06, dy: -0.06).intersection(CGRect(x: 0, y: 0, width: 1, height: 1))
    let width = image.extent.width
    let height = image.extent.height
    let rect = CGRect(
      x: area.minX * width, y: (1 - area.maxY) * height, width: area.width * width, height: area.height * height
    ).integral.intersection(image.extent)
    guard rect.width >= 32, rect.height >= 32 else { return nil }
    let crop = image.cropped(to: rect).transformed(by: CGAffineTransform(translationX: -rect.minX, y: -rect.minY))
    let parse = try parser.parseWhole(crop)
    let wanted = Set(classes.map { UInt8($0.rawValue) })
    guard let region = largest(parse.grid, kind: kind, wanted: wanted), region.share >= 0.02 else { return nil }
    let name = "\(id)-region-1.png"
    try parser.context.writePNGRepresentation(
      of: parse.cutout(crop, region: region), to: folder.appendingPathComponent(name), format: .RGBA8,
      colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
    let local = parse.normalizedFrame(of: region)
    let photoArea = CGRect(
      x: rect.minX / width, y: 1 - rect.maxY / height, width: rect.width / width, height: rect.height / height)
    var record = GarmentRegionRecord()
    record.kind = kind
    record.cutout = name
    record.frame = [
      "x": Double(photoArea.minX + local.minX * photoArea.width),
      "y": Double(photoArea.minY + local.minY * photoArea.height),
      "width": Double(local.width * photoArea.width),
      "height": Double(local.height * photoArea.height),
    ]
    record.share = region.share * Double(photoArea.width * photoArea.height)
    record.partial = false
    return record
  }

  private func largest(_ grid: LabelGrid, kind: String, wanted: Set<UInt8>) -> FoundRegion? {
    let width = grid.width
    let total = grid.labels.count
    var seen = [Bool](repeating: false, count: total)
    var best: [Int] = []
    for start in 0..<total where !seen[start] && wanted.contains(grid.labels[start]) {
      var stack = [start]
      var pixels: [Int] = []
      seen[start] = true
      while let index = stack.popLast() {
        pixels.append(index)
        let x = index % width
        for next in [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1, index - width, index + width]
        where next >= 0 && next < total && !seen[next] && wanted.contains(grid.labels[next]) {
          seen[next] = true
          stack.append(next)
        }
      }
      if pixels.count > best.count { best = pixels }
    }
    guard !best.isEmpty else { return nil }
    let xs = best.map { $0 % width }
    let ys = best.map { $0 / width }
    return FoundRegion(
      kind: kind, pixels: best, minX: xs.min()!, minY: ys.min()!, maxX: xs.max()!, maxY: ys.max()!,
      share: Double(best.count) / Double(total), partial: false)
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
          record.region = (try? reader.cutHeld(data: data, id: id, box: held, kind: kind, folder: folder)) ?? nil
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

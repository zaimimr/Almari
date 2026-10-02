import AVFoundation
import ExpoModulesCore
import UIKit

final class SelfieCameraView: ExpoView, AVCaptureMetadataOutputObjectsDelegate,
  AVCaptureVideoDataOutputSampleBufferDelegate, AVCapturePhotoCaptureDelegate
{
  let onReading = EventDispatcher()
  let onState = EventDispatcher()

  private let session = AVCaptureSession()
  private let photoOutput = AVCapturePhotoOutput()
  private let preview = AVCaptureVideoPreviewLayer()
  private let queue = DispatchQueue(label: "almari.selfie.camera")
  private var configured = false
  private var face: (rect: CGRect, metadata: CGRect, yaw: Double?, roll: Double?, at: Date)?
  private var lastSent = Date.distantPast
  private var lastCentre: CGPoint?
  private var pending: Promise?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    backgroundColor = .black
    preview.videoGravity = .resizeAspectFill
    preview.session = session
    layer.addSublayer(preview)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    preview.frame = bounds
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      queue.async { [session] in
        if session.isRunning { session.stopRunning() }
      }
    } else {
      queue.async { [weak self] in self?.start() }
    }
  }

  private func start() {
    if !configured {
      guard configure() else {
        DispatchQueue.main.async { self.onState(["state": "unavailable"]) }
        return
      }
      configured = true
    }
    if !session.isRunning { session.startRunning() }
    DispatchQueue.main.async { self.onState(["state": "ready"]) }
  }

  private func configure() -> Bool {
    guard
      AVCaptureDevice.authorizationStatus(for: .video) == .authorized,
      let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front),
      let input = try? AVCaptureDeviceInput(device: device)
    else { return false }
    session.beginConfiguration()
    session.sessionPreset = .photo
    let metadata = AVCaptureMetadataOutput()
    let video = AVCaptureVideoDataOutput()
    guard session.canAddInput(input), session.canAddOutput(photoOutput), session.canAddOutput(metadata),
      session.canAddOutput(video)
    else {
      session.commitConfiguration()
      return false
    }
    session.addInput(input)
    session.addOutput(photoOutput)
    session.addOutput(metadata)
    if metadata.availableMetadataObjectTypes.contains(.face) {
      metadata.metadataObjectTypes = [.face]
      metadata.setMetadataObjectsDelegate(self, queue: queue)
    }
    video.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarFullRange]
    video.alwaysDiscardsLateVideoFrames = true
    video.setSampleBufferDelegate(self, queue: queue)
    session.addOutput(video)
    if let connection = photoOutput.connection(with: .video) {
      if connection.isVideoRotationAngleSupported(90) { connection.videoRotationAngle = 90 }
      if connection.isVideoMirroringSupported {
        connection.automaticallyAdjustsVideoMirroring = false
        connection.isVideoMirrored = true
      }
    }
    session.commitConfiguration()
    DispatchQueue.main.async {
      if let connection = self.preview.connection, connection.isVideoRotationAngleSupported(90) {
        connection.videoRotationAngle = 90
      }
    }
    return true
  }

  func metadataOutput(
    _ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection
  ) {
    guard
      let found = metadataObjects.compactMap({ $0 as? AVMetadataFaceObject }).max(by: {
        $0.bounds.width * $0.bounds.height < $1.bounds.width * $1.bounds.height
      })
    else { return }
    let signed = { (angle: CGFloat) -> Double in
      let degrees = Double(angle).truncatingRemainder(dividingBy: 360)
      return degrees > 180 ? degrees - 360 : degrees
    }
    let metadataRect = found.bounds
    let yaw = found.hasYawAngle ? signed(found.yawAngle) : nil
    let roll = found.hasRollAngle ? signed(found.rollAngle) : nil
    DispatchQueue.main.async {
      guard let converted = self.preview.transformedMetadataObject(for: found) else { return }
      let size = self.bounds.size
      guard size.width > 0, size.height > 0 else { return }
      let rect = CGRect(
        x: converted.bounds.minX / size.width, y: converted.bounds.minY / size.height,
        width: converted.bounds.width / size.width, height: converted.bounds.height / size.height)
      self.queue.async {
        self.face = (rect, metadataRect, yaw, roll, Date())
      }
    }
  }

  func captureOutput(
    _ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection
  ) {
    let now = Date()
    guard now.timeIntervalSince(lastSent) >= 0.15, let buffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
      return
    }
    lastSent = now
    let current = face.flatMap { now.timeIntervalSince($0.at) < 0.4 ? $0 : nil }
    let brightness = luma(buffer, in: current?.metadata ?? CGRect(x: 0.3, y: 0.3, width: 0.4, height: 0.4))
    var reading: [String: Any] = ["brightness": brightness ?? NSNull(), "motion": 0]
    if let current {
      let centre = CGPoint(x: current.rect.midX, y: current.rect.midY)
      if let last = lastCentre {
        reading["motion"] = hypot(centre.x - last.x, centre.y - last.y)
      }
      lastCentre = centre
      reading["face"] = [
        "x": current.rect.minX, "y": current.rect.minY, "width": current.rect.width, "height": current.rect.height,
      ]
      reading["yaw"] = current.yaw ?? NSNull()
      reading["roll"] = current.roll ?? NSNull()
    } else {
      lastCentre = nil
      reading["face"] = NSNull()
      reading["yaw"] = NSNull()
      reading["roll"] = NSNull()
    }
    DispatchQueue.main.async { self.onReading(reading) }
  }

  private func luma(_ buffer: CVPixelBuffer, in rect: CGRect) -> Double? {
    CVPixelBufferLockBaseAddress(buffer, .readOnly)
    defer { CVPixelBufferUnlockBaseAddress(buffer, .readOnly) }
    guard let base = CVPixelBufferGetBaseAddressOfPlane(buffer, 0) else { return nil }
    let width = CVPixelBufferGetWidthOfPlane(buffer, 0)
    let height = CVPixelBufferGetHeightOfPlane(buffer, 0)
    let row = CVPixelBufferGetBytesPerRowOfPlane(buffer, 0)
    let pixels = base.assumingMemoryBound(to: UInt8.self)
    let x0 = max(0, Int(rect.minX * CGFloat(width)))
    let x1 = min(width, Int(rect.maxX * CGFloat(width)))
    let y0 = max(0, Int(rect.minY * CGFloat(height)))
    let y1 = min(height, Int(rect.maxY * CGFloat(height)))
    guard x1 > x0, y1 > y0 else { return nil }
    var total = 0
    var count = 0
    for y in stride(from: y0, to: y1, by: 4) {
      for x in stride(from: x0, to: x1, by: 4) {
        total += Int(pixels[y * row + x])
        count += 1
      }
    }
    return count > 0 ? Double(total) / Double(count) / 255 : nil
  }

  func capture(_ promise: Promise) {
    queue.async {
      guard self.session.isRunning, self.pending == nil else {
        promise.reject("E_CAMERA", "The camera is not ready")
        return
      }
      self.pending = promise
      self.photoOutput.capturePhoto(with: AVCapturePhotoSettings(), delegate: self)
    }
  }

  func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
    queue.async {
      guard let promise = self.pending else { return }
      self.pending = nil
      guard error == nil, let data = photo.fileDataRepresentation() else {
        promise.reject("E_CAMERA", "The photo could not be taken")
        return
      }
      let url = FileManager.default.temporaryDirectory.appendingPathComponent("selfie-\(UUID().uuidString).jpg")
      do {
        try data.write(to: url)
        promise.resolve(url.absoluteString)
      } catch {
        promise.reject("E_CAMERA", "The photo could not be saved")
      }
    }
  }
}

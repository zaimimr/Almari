import CoreImage
import ExpoModulesCore
import ImageIO
import UIKit

final class CutoutCanvas: UIView {
  var began: ((CGPoint) -> Void)?
  var moved: (([CGPoint]) -> Void)?
  var ended: (() -> Void)?
  var cancelled: (() -> Void)?
  private var tracked: UITouch?

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    guard tracked == nil, let touch = touches.first else { return }
    tracked = touch
    began?(touch.location(in: self))
  }

  override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent?) {
    guard let touch = tracked, touches.contains(touch) else { return }
    let points = (event?.coalescedTouches(for: touch) ?? [touch]).map { $0.location(in: self) }
    moved?(points)
  }

  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    guard let touch = tracked, touches.contains(touch) else { return }
    tracked = nil
    ended?()
  }

  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
    guard let touch = tracked, touches.contains(touch) else { return }
    tracked = nil
    cancelled?()
  }
}

final class CutoutEditorView: ExpoView, UIScrollViewDelegate {
  let onReady = EventDispatcher()
  let onEdit = EventDispatcher()

  var original: String?
  var cutout: String?
  var area: [String: Double]?
  var mode = "erase"
  var brush: CGFloat = 24

  private let scroll = UIScrollView()
  private let canvas = CutoutCanvas()
  private let faded = UIImageView()
  private let kept = UIImageView()
  private let cover = CALayer()
  private let queue = DispatchQueue(label: "almari.cutout.editor")
  private var requested: String?
  private var photo: CIImage?
  private var stencil: CGContext?
  private var pixels = (width: 0, height: 0)
  private var initial: [UInt8] = []
  private var history: [[UInt8]] = []
  private var last: CGPoint?
  private var fitted = CGSize.zero
  private var saving = false

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    backgroundColor = UIColor(white: 0.1, alpha: 1)
    scroll.delegate = self
    scroll.minimumZoomScale = 1
    scroll.maximumZoomScale = 8
    scroll.bouncesZoom = true
    scroll.showsHorizontalScrollIndicator = false
    scroll.showsVerticalScrollIndicator = false
    scroll.delaysContentTouches = false
    scroll.contentInsetAdjustmentBehavior = .never
    scroll.panGestureRecognizer.minimumNumberOfTouches = 2
    addSubview(scroll)
    scroll.addSubview(canvas)
    faded.alpha = 0.3
    faded.contentMode = .scaleToFill
    kept.contentMode = .scaleToFill
    kept.layer.mask = cover
    canvas.addSubview(faded)
    canvas.addSubview(kept)
    canvas.began = { [weak self] point in self?.begin(at: point) }
    canvas.moved = { [weak self] points in self?.move(through: points) }
    canvas.ended = { [weak self] in self?.finish() }
    canvas.cancelled = { [weak self] in self?.cancel() }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    scroll.frame = bounds
    fit()
  }

  func viewForZooming(in scrollView: UIScrollView) -> UIView? { canvas }

  func scrollViewDidZoom(_ scrollView: UIScrollView) { center() }

  func load() {
    guard let original else { return }
    let cutout = self.cutout
    let key = "\(original)|\(cutout ?? "")"
    guard key != requested else { return }
    requested = key
    let known = CutoutMapping.rect(area)
    queue.async { [weak self] in
      let prepared = try? Self.prepare(original: original, cutout: cutout, area: known)
      DispatchQueue.main.async {
        guard let self, self.requested == key else { return }
        guard let prepared else {
          self.onReady(["state": "failed"])
          return
        }
        self.show(prepared)
      }
    }
  }

  func undo() {
    guard !saving, let previous = history.popLast() else { return }
    apply(previous)
    edited()
  }

  func reset() {
    guard !saving, stencil != nil else { return }
    remember()
    apply(initial)
    edited()
  }

  func save(id: String, promise: Promise) {
    guard !saving, let photo, stencil != nil else {
      promise.reject("E_CUTOUT_EDIT", "unavailable")
      return
    }
    let alpha = current()
    let width = pixels.width
    let height = pixels.height
    saving = true
    queue.async { [weak self] in
      let outcome = Result { () throws -> CutoutEditRecord in
        guard let bounds = CutoutMapping.bounds(alpha, width: width, height: height),
          let image = Self.grayImage(alpha, width: width, height: height)
        else { throw PrepareError.empty }
        return try GarmentPipeline.shared.saveEdit(photo: photo, mask: image, bounds: bounds, id: id)
      }
      DispatchQueue.main.async {
        self?.saving = false
        switch outcome {
        case .success(let record): promise.resolve(record)
        case .failure(let error): promise.reject("E_CUTOUT_EDIT", "\(error)")
        }
      }
    }
  }

  private struct Prepared {
    let photo: CIImage
    let picture: CGImage
    let alpha: [UInt8]
  }

  private static func url(_ uri: String) -> URL {
    uri.hasPrefix("file://") ? URL(string: uri)! : URL(fileURLWithPath: uri)
  }

  private static func prepare(original: String, cutout: String?, area: CGRect?) throws -> Prepared {
    let working = try GarmentPipeline.shared.workingPhoto(sourceUri: original)
    guard let cutout else {
      return Prepared(
        photo: working.image, picture: working.picture,
        alpha: [UInt8](repeating: 0, count: working.picture.width * working.picture.height))
    }
    guard let source = CGImageSourceCreateWithURL(url(cutout) as CFURL, nil),
      let cut = CGImageSourceCreateImageAtIndex(source, 0, nil)
    else { throw PrepareError.unreadable }
    let width = working.picture.width
    let height = working.picture.height
    let size = CGSize(width: width, height: height)
    let placed: CGRect
    if let area {
      placed = area
    } else {
      guard
        let match = CutoutMapping.locate(
          template: cut, photo: working.picture, scales: CutoutMapping.scales(forCutoutSide: cut.width, photo: size))
      else { throw PrepareError.unreadable }
      placed = CutoutMapping.area(of: match, side: cut.width, photo: size)
    }
    guard let alpha = CutoutMapping.alpha(of: cut, area: placed, width: width, height: height) else {
      throw PrepareError.storage
    }
    return Prepared(photo: working.image, picture: working.picture, alpha: alpha)
  }

  private static func grayImage(_ alpha: [UInt8], width: Int, height: Int) -> CGImage? {
    guard let provider = CGDataProvider(data: Data(alpha) as CFData) else { return nil }
    return CGImage(
      width: width, height: height, bitsPerComponent: 8, bitsPerPixel: 8, bytesPerRow: width,
      space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue),
      provider: provider, decode: nil, shouldInterpolate: false, intent: .defaultIntent)
  }

  private func show(_ prepared: Prepared) {
    let width = prepared.picture.width
    let height = prepared.picture.height
    guard
      let drawing = CGContext(
        data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
        space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
    else {
      onReady(["state": "failed"])
      return
    }
    drawing.setLineCap(.round)
    drawing.setLineJoin(.round)
    photo = prepared.photo
    stencil = drawing
    pixels = (width, height)
    initial = prepared.alpha
    history = []
    let image = UIImage(cgImage: prepared.picture)
    faded.image = image
    kept.image = image
    apply(initial)
    fitted = .zero
    setNeedsLayout()
    layoutIfNeeded()
    onReady(["state": "ready"])
    edited()
  }

  private func fit() {
    guard pixels.width > 0, bounds.width > 0, bounds.height > 0 else { return }
    let ratio = min(bounds.width / CGFloat(pixels.width), bounds.height / CGFloat(pixels.height))
    let size = CGSize(width: CGFloat(pixels.width) * ratio, height: CGFloat(pixels.height) * ratio)
    guard size != fitted else {
      center()
      return
    }
    fitted = size
    scroll.zoomScale = 1
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    canvas.frame = CGRect(origin: .zero, size: size)
    faded.frame = canvas.bounds
    kept.frame = canvas.bounds
    cover.frame = kept.bounds
    CATransaction.commit()
    scroll.contentSize = size
    center()
  }

  private func center() {
    let content = scroll.contentSize
    let x = max(0, (scroll.bounds.width - content.width) / 2)
    let y = max(0, (scroll.bounds.height - content.height) / 2)
    scroll.contentInset = UIEdgeInsets(top: y, left: x, bottom: y, right: x)
  }

  private func current() -> [UInt8] {
    guard let data = stencil?.data else { return [] }
    let bytes = data.assumingMemoryBound(to: UInt8.self)
    var alpha = [UInt8](repeating: 0, count: pixels.width * pixels.height)
    for index in 0..<alpha.count { alpha[index] = bytes[index * 4 + 3] }
    return alpha
  }

  private func apply(_ alpha: [UInt8]) {
    guard let data = stencil?.data, alpha.count == pixels.width * pixels.height else { return }
    let bytes = data.assumingMemoryBound(to: UInt8.self)
    for index in 0..<alpha.count {
      let value = alpha[index]
      bytes[index * 4] = value
      bytes[index * 4 + 1] = value
      bytes[index * 4 + 2] = value
      bytes[index * 4 + 3] = value
    }
    refresh()
  }

  private func refresh() {
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    cover.contents = stencil?.makeImage()
    CATransaction.commit()
  }

  private func remember() {
    history.append(current())
    if history.count > 20 { history.removeFirst() }
  }

  private func edited() {
    onEdit(["canUndo": !history.isEmpty])
  }

  private func point(_ location: CGPoint) -> CGPoint {
    CGPoint(
      x: location.x / canvas.bounds.width * CGFloat(pixels.width),
      y: CGFloat(pixels.height) - location.y / canvas.bounds.height * CGFloat(pixels.height))
  }

  private func prepareStroke() -> CGFloat {
    guard let stencil else { return 1 }
    let width = max(1, brush / scroll.zoomScale * CGFloat(pixels.width) / max(1, canvas.bounds.width))
    if mode == "restore" {
      stencil.setBlendMode(.normal)
      stencil.setFillColor(UIColor.white.cgColor)
      stencil.setStrokeColor(UIColor.white.cgColor)
    } else {
      stencil.setBlendMode(.clear)
    }
    stencil.setLineWidth(width)
    return width
  }

  private func begin(at location: CGPoint) {
    guard !saving, let stencil, canvas.bounds.width > 0 else { return }
    remember()
    let width = prepareStroke()
    let spot = point(location)
    stencil.fillEllipse(in: CGRect(x: spot.x - width / 2, y: spot.y - width / 2, width: width, height: width))
    last = location
    refresh()
  }

  private func move(through locations: [CGPoint]) {
    guard let stencil, var from = last else { return }
    _ = prepareStroke()
    stencil.beginPath()
    stencil.move(to: point(from))
    for location in locations {
      stencil.addLine(to: point(location))
      from = location
    }
    stencil.strokePath()
    last = from
    refresh()
  }

  private func finish() {
    guard last != nil else { return }
    last = nil
    edited()
  }

  private func cancel() {
    guard last != nil else { return }
    last = nil
    if let previous = history.popLast() { apply(previous) }
    edited()
  }
}

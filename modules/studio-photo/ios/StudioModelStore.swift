import Foundation

final class StudioModelStore: NSObject, URLSessionDownloadDelegate {
  struct Part {
    let name: String
    let url: String
    let bytes: Int64
  }

  static let shared = StudioModelStore()

  static let parts = [
    Part(
      name: "transformer-0.safetensors",
      url:
        "https://huggingface.co/mlx-community/flux2-klein-4b-4bit/resolve/860e87183ceb29e39627c0612ebd66d8ea66e68c/transformer/0.safetensors",
      bytes: 2_145_323_732),
    Part(
      name: "transformer-1.safetensors",
      url:
        "https://huggingface.co/mlx-community/flux2-klein-4b-4bit/resolve/860e87183ceb29e39627c0612ebd66d8ea66e68c/transformer/1.safetensors",
      bytes: 34_727_761),
    Part(
      name: "vae.safetensors",
      url:
        "https://huggingface.co/black-forest-labs/FLUX.2-klein-4B/resolve/e7b7dc27f91deacad38e78976d1f2b499d76a294/vae/diffusion_pytorch_model.safetensors",
      bytes: 168_120_878),
  ]

  static let size = parts.reduce(0) { $0 + $1.bytes }

  var directory: URL {
    FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("studio-model", isDirectory: true)
  }

  private lazy var session = URLSession(configuration: .default, delegate: self, delegateQueue: nil)
  private let lock = NSLock()
  private var task: URLSessionDownloadTask?
  private var continuation: CheckedContinuation<Void, Error>?
  private var current: Part?
  private var progress: ((Int64) -> Void)?

  func url(_ part: Part) -> URL { directory.appendingPathComponent(part.name) }

  func stored(_ part: Part) -> Int64 {
    let size = (try? FileManager.default.attributesOfItem(atPath: url(part).path)[.size] as? NSNumber)?.int64Value
    return size == part.bytes ? part.bytes : 0
  }

  var storedBytes: Int64 { Self.parts.reduce(0) { $0 + stored($1) } }

  var ready: Bool { storedBytes == Self.size }

  func download(progress: @escaping (Int64) -> Void) async throws {
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    var folder = directory
    var values = URLResourceValues()
    values.isExcludedFromBackup = true
    try folder.setResourceValues(values)
    for part in Self.parts where stored(part) == 0 {
      let done = storedBytes
      try await fetch(part) { progress(done + $0) }
    }
    progress(storedBytes)
  }

  private func fetch(_ part: Part, progress: @escaping (Int64) -> Void) async throws {
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      lock.lock()
      self.continuation = continuation
      self.current = part
      self.progress = progress
      let task = session.downloadTask(with: URL(string: part.url)!)
      self.task = task
      lock.unlock()
      task.resume()
    }
  }

  func cancel() {
    lock.lock()
    let task = self.task
    lock.unlock()
    task?.cancel()
  }

  func remove() throws {
    cancel()
    if FileManager.default.fileExists(atPath: directory.path) {
      try FileManager.default.removeItem(at: directory)
    }
  }

  private func finish(_ error: Error?) {
    lock.lock()
    let continuation = self.continuation
    self.continuation = nil
    self.task = nil
    self.current = nil
    self.progress = nil
    lock.unlock()
    if let error { continuation?.resume(throwing: error) } else { continuation?.resume() }
  }

  func urlSession(
    _ session: URLSession, downloadTask: URLSessionDownloadTask, didWriteData bytesWritten: Int64,
    totalBytesWritten: Int64, totalBytesExpectedToWrite: Int64
  ) {
    lock.lock()
    let progress = self.progress
    lock.unlock()
    progress?(totalBytesWritten)
  }

  func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
    lock.lock()
    let part = current
    lock.unlock()
    guard let part,
      (downloadTask.response as? HTTPURLResponse)?.statusCode == 200,
      let size = (try? FileManager.default.attributesOfItem(atPath: location.path)[.size] as? NSNumber)?.int64Value,
      size == part.bytes
    else {
      finish(StudioError.weights)
      return
    }
    do {
      let target = url(part)
      if FileManager.default.fileExists(atPath: target.path) { try FileManager.default.removeItem(at: target) }
      try FileManager.default.moveItem(at: location, to: target)
      finish(nil)
    } catch {
      finish(StudioError.storage)
    }
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    guard let error else { return }
    finish((error as? URLError)?.code == .cancelled ? StudioError.cancelled : error)
  }
}

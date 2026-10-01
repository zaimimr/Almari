import ExpoModulesCore
import Foundation
import ImageIO
import Vision

struct ReadLabelResult: Record {
  @Field var photo: String = ""
  @Field var lines: [String] = []
}

struct LabelExtraction: Record {
  @Field var json: String? = nil
}

enum CareLabelError: Error, CustomStringConvertible {
  case unreadable
  case storage

  var description: String {
    switch self {
    case .unreadable: return "unreadable"
    case .storage: return "storage"
    }
  }
}

final class CareLabelReader {
  static let shared = CareLabelReader()

  private let queue = DispatchQueue(label: "closet.vision.label")
  private let languages = ["en", "nb", "de", "fr", "tr", "ur"]

  private var photos: URL {
    FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("closet-photos", isDirectory: true)
  }

  func read(sourceUri: String, id: String) throws -> ReadLabelResult {
    try queue.sync { try run(sourceUri: sourceUri, id: id) }
  }

  private func run(sourceUri: String, id: String) throws -> ReadLabelResult {
    let source = sourceUri.hasPrefix("file://") ? URL(string: sourceUri)! : URL(fileURLWithPath: sourceUri)
    try FileManager.default.createDirectory(at: photos, withIntermediateDirectories: true)
    let ext = source.pathExtension.isEmpty ? "jpg" : source.pathExtension.lowercased()
    let name = "\(id)-label.\(ext)"
    let target = photos.appendingPathComponent(name)
    if !FileManager.default.fileExists(atPath: target.path) {
      do { try FileManager.default.copyItem(at: source, to: target) } catch { throw CareLabelError.storage }
    }
    do {
      var result = ReadLabelResult()
      result.photo = name
      result.lines = try recognize(target)
      return result
    } catch {
      try? FileManager.default.removeItem(at: target)
      throw CareLabelError.unreadable
    }
  }

  private func recognize(_ url: URL) throws -> [String] {
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
      let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
    else { throw CareLabelError.unreadable }
    let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any]
    let orientation =
      (properties?[kCGImagePropertyOrientation] as? UInt32).flatMap(CGImagePropertyOrientation.init(rawValue:)) ?? .up
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    let supported = (try? request.supportedRecognitionLanguages()) ?? []
    request.recognitionLanguages = languages.compactMap { code in
      supported.first { $0 == code || $0.hasPrefix("\(code)-") }
    }
    try VNImageRequestHandler(cgImage: image, orientation: orientation).perform([request])
    return (request.results ?? []).compactMap {
      $0.topCandidates(1).first?.string.trimmingCharacters(in: .whitespaces)
    }
    .filter { !$0.isEmpty }
  }
}

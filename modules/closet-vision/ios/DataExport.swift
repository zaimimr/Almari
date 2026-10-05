import Foundation

enum DataExportError: Error {
  case unreadable
}

enum DataExport {
  static func zip(folderUri: String) throws -> String {
    guard let folder = URL(string: folderUri) else { throw DataExportError.unreadable }
    let target = folder.deletingLastPathComponent().appendingPathComponent("\(folder.lastPathComponent).zip")
    var coordination: NSError?
    var copied: Error?
    NSFileCoordinator().coordinate(readingItemAt: folder, options: .forUploading, error: &coordination) { zipped in
      do {
        try? FileManager.default.removeItem(at: target)
        try FileManager.default.copyItem(at: zipped, to: target)
      } catch {
        copied = error
      }
    }
    if coordination != nil || copied != nil { throw DataExportError.unreadable }
    return target.absoluteString
  }
}

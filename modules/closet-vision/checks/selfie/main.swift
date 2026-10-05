import CoreImage
import Foundation
import Vision

let arguments = CommandLine.arguments
guard arguments.count > 1 else {
  print("Usage: selfie-check <folder of face photos>")
  exit(2)
}
let folder = URL(fileURLWithPath: arguments[1], isDirectory: true)
let files = try FileManager.default.contentsOfDirectory(at: folder, includingPropertiesForKeys: nil)
  .filter { ["jpg", "jpeg", "png"].contains($0.pathExtension.lowercased()) }
  .sorted { $0.lastPathComponent < $1.lastPathComponent }

var readings: [String: Any] = [:]
for file in files {
  let name = file.deletingPathExtension().lastPathComponent
  guard let image = FaceColours.image(file), let (bitmap, cgImage) = FaceColours.bitmap(image) else {
    readings[name] = ["error": "unreadable"]
    continue
  }
  guard let face = try FaceColours.landmarks(cgImage), let reading = FaceColours.read(bitmap, face: face) else {
    readings[name] = ["light": "no-face"]
    continue
  }
  var entry: [String: Any] = [
    "light": reading.light,
    "face": [reading.face.minX, reading.face.minY, reading.face.width, reading.face.height],
    "yaw": face.yaw?.doubleValue ?? 0,
    "gains": [reading.gains.r, reading.gains.g, reading.gains.b],
    "regions": reading.regions.map { [$0.0.x / CGFloat(bitmap.width), $0.0.y / CGFloat(bitmap.height), $0.1 / CGFloat(bitmap.width)] },
  ]
  if let skin = reading.skin { entry["skin"] = skin }
  if let eyes = reading.eyes { entry["eyes"] = eyes }
  readings[name] = entry
}
let data = try JSONSerialization.data(withJSONObject: readings, options: [.prettyPrinted, .sortedKeys])
FileHandle.standardOutput.write(data)
print()

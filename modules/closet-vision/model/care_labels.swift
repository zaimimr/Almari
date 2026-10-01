import Foundation

@main
struct RecordCareLabels {
  static func main() async throws {
    let arguments = CommandLine.arguments
    let input = URL(fileURLWithPath: arguments[1])
    let output = URL(fileURLWithPath: arguments[2])
    let fixtures = try JSONSerialization.jsonObject(with: Data(contentsOf: input)) as? [[String: Any]] ?? []
    print("available", CareLabelModel.isAvailable())
    var recorded: [String: Any] = [:]
    for fixture in fixtures {
      guard let id = fixture["id"] as? String, let text = fixture["text"] as? String else { continue }
      let started = Date()
      let json = await CareLabelModel.extract(text)
      print(id, Int(Date().timeIntervalSince(started) * 1000), "ms", json ?? "null")
      recorded[id] = json ?? NSNull()
    }
    let data = try JSONSerialization.data(withJSONObject: recorded, options: [.prettyPrinted, .sortedKeys])
    try data.write(to: output)
  }
}

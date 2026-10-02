import Foundation
import MLX

let args = CommandLine.arguments
let weights = URL(fileURLWithPath: args[1])
let side = Int(ProcessInfo.processInfo.environment["SIDE"] ?? "512")!
let started = Date()
let engine = try StudioEngine(
  transformer: [
    weights.appendingPathComponent("transformer-0.safetensors"),
    weights.appendingPathComponent("transformer-1.safetensors"),
  ],
  autoencoder: weights.appendingPathComponent("vae.safetensors"),
  prompt: URL(fileURLWithPath: args[2]))
print("load", Date().timeIntervalSince(started), "active", Double(Memory.activeMemory) / 1e9)
func gb(_ value: Int) -> String { String(format: "%.2f", Double(value) / 1e9) }
if ProcessInfo.processInfo.environment["PROBE"] != nil {
  Memory.peakMemory = 0
  let reference = try engine.reference(URL(fileURLWithPath: args[4]), side: side)
  let encoded = engine.autoencoder.encode(reference)
  eval(encoded)
  print("encode peak", gb(Memory.peakMemory))
  Memory.clearCache()
  Memory.peakMemory = 0
  let grid = side / 16
  let tokens = grid * grid
  let imageIds = MLXArray(
    StudioEngine.ids(grid: grid, time: 0) + StudioEngine.ids(grid: grid, time: 10), [tokens * 2, 4])
  var textIds: [Int32] = []
  for index in 0..<512 { textIds += [0, 0, 0, Int32(index)] }
  let out = engine.transformer(
    concatenated([encoded.reshaped(1, -1, 128), encoded.reshaped(1, -1, 128)], axis: 1).asType(.bfloat16),
    text: engine.prompt, timestep: 900, imageIds: imageIds, textIds: MLXArray(textIds, [512, 4]))
  eval(out)
  print("transformer peak", gb(Memory.peakMemory), out.dtype)
  Memory.clearCache()
  Memory.peakMemory = 0
  let decoded = engine.autoencoder.decode(encoded)
  eval(decoded)
  print("decode peak", gb(Memory.peakMemory))
  exit(0)
}
for (index, input) in args[4...].enumerated() {
  let start = Date()
  Memory.peakMemory = 0
  try engine.render(
    URL(fileURLWithPath: input), to: URL(fileURLWithPath: "\(args[3])/studio-\(index)-\(side).png"), side: side)
  print(input, "seconds", Date().timeIntervalSince(start), "peak", gb(Memory.peakMemory))
}

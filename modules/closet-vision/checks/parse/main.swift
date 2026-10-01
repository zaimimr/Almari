import CoreImage
import CoreML
import Foundation

var failures: [String] = []

func check(_ passed: Bool, _ message: String) {
  if !passed { failures.append(message) }
}

func grid(_ blocks: [(ClothesClass, Int, Int, Int, Int)]) -> LabelGrid {
  var labels = [UInt8](repeating: 0, count: 100 * 100)
  for (label, left, top, right, bottom) in blocks {
    for y in top...bottom {
      for x in left...right {
        labels[y * 100 + x] = UInt8(label.rawValue)
      }
    }
  }
  return LabelGrid(width: 100, height: 100, labels: labels)
}

func describe(_ regions: [FoundRegion]) -> String {
  regions.map { "\($0.kind)\($0.partial ? " partial" : "")" }.joined(separator: ", ")
}

let outfit = GarmentRegions.find(
  grid([
    (.hair, 40, 0, 60, 4), (.face, 42, 5, 58, 9), (.upper, 30, 10, 70, 40),
    (.leftArm, 20, 12, 29, 40), (.pants, 35, 41, 65, 90),
    (.leftShoe, 35, 91, 45, 95), (.rightShoe, 55, 91, 65, 95),
  ]), person: true)
check(outfit.map(\.kind) == ["upper", "pants", "shoes"], "outfit gave \(describe(outfit))")
check(outfit.allSatisfy { !$0.partial }, "outfit marked partial: \(describe(outfit))")
check(abs((outfit.first?.share ?? 0) - 0.1271) < 0.0001, "top share \(outfit.first?.share ?? 0)")

let abaya = GarmentRegions.find(
  grid([(.scarf, 35, 1, 65, 9), (.dress, 20, 10, 80, 95), (.upper, 45, 15, 55, 60)]), person: true)
check(abaya.map(\.kind) == ["head", "upper", "dress"], "abaya gave \(describe(abaya))")
check(abaya.first { $0.kind == "upper" }?.partial == true, "top under an abaya not partial")
check(abaya.first { $0.kind == "dress" }?.partial == false, "abaya marked partial")
check(abaya.first { $0.kind == "head" }?.partial == false, "hijab over an abaya marked partial")

let cut = GarmentRegions.find(grid([(.skirt, 30, 60, 70, 99)]), person: true)
check(cut.first?.partial == true, "skirt cut by the photo edge not partial")

let small = GarmentRegions.find(
  grid([(.upper, 30, 10, 70, 40), (.bag, 5, 5, 7, 7), (.belt, 30, 45, 44, 49)]), person: true)
check(small.map(\.kind) == ["upper"], "small regions kept: \(describe(small))")

let flatBlocks: [(ClothesClass, Int, Int, Int, Int)] = [
  (.upper, 10, 10, 40, 40), (.upper, 60, 10, 90, 40),
  (.leftShoe, 10, 70, 20, 80), (.rightShoe, 40, 70, 50, 80),
]
let flat = GarmentRegions.find(grid(flatBlocks), person: false)
check(flat.map(\.kind) == ["upper", "upper", "shoes"], "flat lay gave \(describe(flat))")
let worn = GarmentRegions.find(grid(flatBlocks), person: true)
check(worn.map(\.kind) == ["upper", "shoes"], "same blocks on a person gave \(describe(worn))")

let touching = GarmentRegions.find(grid([(.hat, 40, 1, 60, 5), (.scarf, 35, 6, 65, 20)]), person: false)
check(touching.map(\.kind) == ["head"], "hat and scarf gave \(describe(touching))")
let apart = GarmentRegions.find(grid([(.hat, 40, 1, 60, 5), (.scarf, 35, 10, 65, 20)]), person: true)
check(apart.map(\.kind) == ["head"], "hat and scarf on one person gave \(describe(apart))")

let blob = GarmentRegions.find(
  grid([(.upper, 30, 10, 70, 30), (.pants, 30, 31, 70, 50), (.dress, 30, 51, 70, 55)]), person: false)
check(blob.count == 1 && blob.first?.kind == "upper", "mixed blob gave \(describe(blob))")
let personBlob = GarmentRegions.find(
  grid([(.upper, 30, 10, 70, 30), (.pants, 30, 31, 70, 50)]), person: true)
check(personBlob.map(\.kind) == ["upper", "pants"], "person blob gave \(describe(personBlob))")

check(!ClothesParser.showsPerson(skin: 99, mask: 10000), "skin just below the threshold counted as a person")
check(ClothesParser.showsPerson(skin: 100, mask: 10000), "skin at the threshold not counted as a person")

check(GarmentRegions.find(grid([(.hair, 0, 0, 99, 99)]), person: true).isEmpty, "hair became a garment")

let arguments = CommandLine.arguments
if arguments.count > 2 {
  let modelUrl = URL(fileURLWithPath: arguments[1])
  let folder = URL(fileURLWithPath: arguments[2], isDirectory: true)
  let output = arguments.count > 3 ? URL(fileURLWithPath: arguments[3], isDirectory: true) : nil
  if let output { try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true) }
  let sRGB = CGColorSpace(name: CGColorSpace.sRGB)!
  let context = CIContext(options: [.workingColorSpace: sRGB])
  let parser = ClothesParser(model: try MLModel(contentsOf: modelUrl), context: context)
  let samples = folder.path.hasSuffix("assets/wardrobe")
  let files = try FileManager.default.contentsOfDirectory(at: folder, includingPropertiesForKeys: nil)
    .filter { ["png", "jpg", "jpeg", "heic"].contains($0.pathExtension.lowercased()) }
    .sorted { $0.lastPathComponent < $1.lastPathComponent }
  check(!files.isEmpty, "no photos in \(folder.path)")
  for file in files {
    let name = file.deletingPathExtension().lastPathComponent
    guard let loaded = CIImage(contentsOf: file, options: [.applyOrientationProperty: true]) else {
      check(false, "\(name) could not be read")
      continue
    }
    let origin = loaded.transformed(
      by: CGAffineTransform(translationX: -loaded.extent.minX, y: -loaded.extent.minY))
    let photo = origin.composited(over: CIImage(color: .white).cropped(to: origin.extent))
    let started = Date()
    let parse = try parser.parse(photo)
    let regions = GarmentRegions.find(parse.grid, person: parse.people > 0)
    let milliseconds = Int(Date().timeIntervalSince(started) * 1000)
    check(parse.grid.width == 512 && parse.grid.height == 512, "\(name) grid \(parse.grid.width)")
    check(parse.grid.labels.allSatisfy { Int($0) < ClothesClass.allCases.count }, "\(name) label out of range")
    if samples { check(parse.people == 0, "\(name) is a garment alone but \(parse.people) people were found") }
    print("\(name): people \(parse.people), \(regions.count) garments: \(describe(regions)), \(milliseconds) ms")
    if let output {
      for (index, region) in regions.enumerated() {
        try context.writePNGRepresentation(
          of: parse.cutout(photo, region: region),
          to: output.appendingPathComponent("\(name)-\(index + 1)-\(region.kind).png"),
          format: .RGBA8, colorSpace: sRGB)
      }
    }
  }
}

if failures.isEmpty {
  print("PASS")
} else {
  failures.forEach { print("FAIL \($0)") }
  exit(1)
}

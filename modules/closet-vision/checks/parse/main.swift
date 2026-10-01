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

check(GarmentRegions.find(grid([(.hair, 0, 0, 99, 99)]), person: true).isEmpty, "hair became a garment")

if failures.isEmpty {
  print("PASS")
} else {
  failures.forEach { print("FAIL \($0)") }
  exit(1)
}

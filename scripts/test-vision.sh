set -eu
vision_output=$(mktemp -d)
trap 'rm -rf "$vision_output"' EXIT
xcrun swiftc \
  modules/closet-vision/ios/GarmentRegions.swift \
  modules/closet-vision/ios/GarmentEnhancer.swift \
  modules/closet-vision/ios/GarmentMaskRefinement.swift \
  modules/closet-vision/ios/GarmentSegmenter.swift \
  modules/closet-vision/ios/CutoutRepair.swift \
  modules/closet-vision/ios/StudioBackground.swift \
  modules/closet-vision/ios/PhotoPreparation.swift \
  scripts/tests/vision.swift \
  -o "$vision_output/vision-tests"
"$vision_output/vision-tests"

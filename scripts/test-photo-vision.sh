set -eu
photo_test_output=$(mktemp -d)
trap 'rm -rf "$photo_test_output"' EXIT
xcrun swiftc -O \
  modules/closet-vision/ios/GarmentRegions.swift \
  modules/closet-vision/ios/GarmentEnhancer.swift \
  modules/closet-vision/ios/ClothesParser.swift \
  modules/closet-vision/ios/CutoutSelection.swift \
  modules/closet-vision/ios/GarmentMaskRefinement.swift \
  modules/closet-vision/ios/GarmentSegmenter.swift \
  modules/closet-vision/ios/CutoutRepair.swift \
  modules/closet-vision/ios/PhotoPreparation.swift \
  scripts/tests/photos.swift \
  -o "$photo_test_output/photo-tests"
"$photo_test_output/photo-tests" "${1:-tests/fixtures/vision/sources.json}" \
  modules/closet-vision/ios/Resources/ClothesParser.mlmodelc \
  planning/build/studio/crop-eval/native-photos

set -eu
photo_test_output=$(mktemp -d)
trap 'rm -rf "$photo_test_output"' EXIT
xcrun swiftc -O \
  modules/closet-vision/ios/GarmentRegions.swift \
  modules/closet-vision/ios/GarmentEnhancer.swift \
  modules/closet-vision/ios/ClothesParser.swift \
  modules/closet-vision/ios/CutoutSelection.swift \
  scripts/tests/photos.swift \
  -o "$photo_test_output/photo-tests"
"$photo_test_output/photo-tests" tests/fixtures/vision/sources.json \
  modules/closet-vision/ios/Resources/ClothesParser.mlmodelc

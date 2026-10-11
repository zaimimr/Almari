set -eu
inspiration_test_output=$(mktemp -d)
trap 'rm -rf "$inspiration_test_output"' EXIT
xcrun swiftc -O \
  modules/closet-vision/ios/GarmentRegions.swift \
  modules/closet-vision/ios/GarmentEnhancer.swift \
  modules/closet-vision/ios/ClothesParser.swift \
  modules/closet-vision/ios/GarmentMaskRefinement.swift \
  modules/closet-vision/ios/GarmentSegmenter.swift \
  modules/closet-vision/ios/CutoutRepair.swift \
  modules/closet-vision/ios/PhotoPreparation.swift \
  modules/closet-vision/ios/InspirationRegions.swift \
  scripts/tests/inspiration.swift \
  -o "$inspiration_test_output/inspiration-tests"
"$inspiration_test_output/inspiration-tests" \
  modules/closet-vision/ios/Resources \
  tests/fixtures/vision/outfit-body.jpg \
  "${INSPIRATION_REVIEW_DIR:-planning/build/inspiration/native}"

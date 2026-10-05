#!/bin/sh
set -e
cd "$(dirname "$0")/../.."
mkdir -p dist
xcrun swiftc -O -target arm64-apple-macos26.0 -o dist/selfie-check \
  modules/closet-vision/ios/FaceColours.swift modules/closet-vision/checks/selfie/main.swift
dist/selfie-check scripts/colour-eval/faces 2>/dev/null > dist/selfie-readings.json
npx tsx scripts/colour-eval/evaluate.ts dist/selfie-readings.json "$@"

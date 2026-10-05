#!/bin/sh
set -eu

cd "$CI_PRIMARY_REPOSITORY_PATH"

export HOMEBREW_NO_AUTO_UPDATE=1
brew install node@22 cocoapods
export PATH="$(brew --prefix node@22)/bin:$PATH"

{
  echo "EXPO_PUBLIC_STUDIO_URL=$EXPO_PUBLIC_STUDIO_URL"
  echo "EXPO_PUBLIC_STUDIO_TOKEN=$EXPO_PUBLIC_STUDIO_TOKEN"
} > .env

npm ci
npx expo prebuild --platform ios
git checkout -- ios/ci_scripts
echo "export NODE_BINARY=$(command -v node)" > ios/.xcode.env.local

xcodebuild -downloadComponent MetalToolchain

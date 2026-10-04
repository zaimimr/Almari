#!/bin/sh
xcrun simctl spawn "${DEVICE:-Closet Development}" defaults write com.apple.Accessibility EnhancedTextLegibilityEnabled -bool "${1:-true}"

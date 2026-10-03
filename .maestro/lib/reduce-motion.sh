#!/bin/sh
xcrun simctl spawn "${DEVICE:-Closet Development}" defaults write com.apple.Accessibility ReduceMotionEnabled -bool true

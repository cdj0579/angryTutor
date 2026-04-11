#!/usr/bin/env bash
# Copy Moonshine model files into native app asset locations
# Usage: ./copy-models.sh /path/to/downloaded/moonshine-model

set -euo pipefail

SRC_DIR="$1"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ -z "$SRC_DIR" ] || [ ! -d "$SRC_DIR" ]; then
  echo "Usage: $0 /path/to/moonshine-model-directory"
  exit 2
fi

echo "Source model dir: $SRC_DIR"

# Android: copy to android app assets
ANDROID_ASSETS_DIR="$ROOT_DIR/../android/app/src/main/assets/moonshine-model"
mkdir -p "$ANDROID_ASSETS_DIR"
echo "Copying models to Android assets: $ANDROID_ASSETS_DIR"
cp -r "$SRC_DIR"/* "$ANDROID_ASSETS_DIR/"

# iOS: copy to ios app bundle resources (xcassets or public folder)
IOS_TARGET_DIR="$ROOT_DIR/../../ios/App/App/public/assets/moonshine-model"
mkdir -p "$IOS_TARGET_DIR"
echo "Copying models to iOS public assets: $IOS_TARGET_DIR"
cp -r "$SRC_DIR"/* "$IOS_TARGET_DIR/"

echo "Model files copied. For iOS you should add the model folder to your Xcode project resources if needed."

echo "Done."

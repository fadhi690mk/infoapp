#!/usr/bin/env bash
# Run Expo Android with SDK from /data. Sources ANDROID_HOME then starts the app.
# Usage: ./scripts/run-android.sh   (from repo root)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SDK_DIR="${ANDROID_HOME:-/data/android-sdk}"
ENV_FILE="$SDK_DIR/android-env.sh"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Android SDK env not found at $ENV_FILE"
  echo "Run the setup first: ./scripts/setup-android-vm.sh"
  exit 1
fi

source "$ENV_FILE"
cd "$REPO_ROOT"
# exec npx tsc --noEmit
exec npx expo start --android

#!/usr/bin/env bash
# Install Android SDK + Emulator on /data (so main disk is not used).
# Run from project root or any dir; uses /data/android-sdk by default.
# Usage: ./scripts/setup-android-vm.sh [sdk_dir]
#   sdk_dir defaults to /data/android-sdk

set -e

SDK_DIR="${1:-/data/android-sdk}"
CMDTOOLS_URL="https://dl.google.com/android/repository/commandlinetools-linux-14742923_latest.zip"
CMDTOOLS_ZIP="/tmp/android-commandlinetools-linux.zip"

echo "Android SDK will be installed to: $SDK_DIR"

if [[ ! -d /data ]]; then
  echo "Error: /data not found. Create it or pass a different path: $0 /path/to/sdk"
  exit 1
fi

mkdir -p "$SDK_DIR"
cd "$SDK_DIR"

# Install deps if missing (Android SDK tools require JDK 17+)
install_java_17() {
  if command -v apt-get &>/dev/null; then
    sudo apt-get update -qq
    if sudo apt-get install -y openjdk-17-jdk 2>/dev/null; then
      return 0
    fi
    # Ubuntu 22.04+ often has 17; fallback to 21 or 11 with override
    if sudo apt-get install -y openjdk-21-jdk 2>/dev/null; then
      return 0
    fi
    sudo apt-get install -y unzip wget default-jdk
  fi
}

for c in unzip wget; do
  if ! command -v "$c" &>/dev/null; then
    echo "Installing $c (may need sudo)..."
    install_java_17 || { echo "Please install unzip and wget."; exit 1; }
    break
  fi
done

# Ensure JDK 17+ for sdkmanager/avdmanager (bytecode is Java 17; Java 11 cannot run it)
set_java_17() {
  local v j
  v=$(java -version 2>&1 | head -1)
  if [[ "$v" =~ "17" ]] || [[ "$v" =~ "21" ]] || [[ "$v" =~ "23" ]]; then
    return 0
  fi
  for j in /usr/lib/jvm/java-17-openjdk-amd64 /usr/lib/jvm/java-21-openjdk-amd64; do
    if [[ -d "$j" ]] && [[ -x "$j/bin/java" ]]; then
      export JAVA_HOME="$j"
      export PATH="$JAVA_HOME/bin:$PATH"
      return 0
    fi
  done
  # Also check any java-17-openjdk-* (e.g. aarch64)
  for j in /usr/lib/jvm/java-17-openjdk-* /usr/lib/jvm/java-21-openjdk-*; do
    if [[ -d "$j" ]] && [[ -x "$j/bin/java" ]]; then
      export JAVA_HOME="$j"
      export PATH="$JAVA_HOME/bin:$PATH"
      return 0
    fi
  done
  echo ""
  echo "ERROR: Android SDK tools require JDK 17 or 21. Current Java is 11 (bytecode 55; tools need 61)."
  echo ""
  echo "Install JDK 17 and re-run this script:"
  echo "  sudo apt-get install -y openjdk-17-jdk"
  echo "  $0 $*"
  echo ""
  echo "If 'apt-get update' fails due to NodeSource repo, temporarily disable it:"
  echo "  sudo mv /etc/apt/sources.list.d/nodesource.list /etc/apt/sources.list.d/nodesource.list.bak"
  echo "  sudo apt-get update && sudo apt-get install -y openjdk-17-jdk"
  echo "  ./scripts/setup-android-vm.sh"
  echo ""
  exit 1
}
set_java_17 "$@"

# Download command-line tools
if [[ ! -d "$SDK_DIR/cmdline-tools/latest" ]]; then
  echo "Downloading Android command-line tools..."
  wget -q --show-progress -O "$CMDTOOLS_ZIP" "$CMDTOOLS_URL" || {
    echo "Download failed. Check URL: $CMDTOOLS_URL"
    exit 1
  }
  mkdir -p cmdline-tools
  unzip -q -o "$CMDTOOLS_ZIP" -d cmdline-tools
  mv cmdline-tools/cmdline-tools cmdline-tools/latest
  rm -f "$CMDTOOLS_ZIP"
  echo "Command-line tools installed."
else
  echo "Command-line tools already present."
fi

export ANDROID_HOME="$SDK_DIR"
export ANDROID_SDK_ROOT="$SDK_DIR"
export PATH="$SDK_DIR/cmdline-tools/latest/bin:$SDK_DIR/platform-tools:$SDK_DIR/emulator:$PATH"

# Accept licenses once
yes 2>/dev/null | sdkmanager --licenses 2>/dev/null || true

# Install packages needed for Expo / React Native
echo "Installing SDK packages (platform-tools, emulator, platform, system-image)..."
sdkmanager --install \
  "platform-tools" \
  "emulator" \
  "platforms;android-34" \
  "build-tools;34.0.0" \
  "system-images;android-34;google_apis;x86_64"

# AVD directory on /data so it doesn't use main disk
AVD_HOME="$SDK_DIR/avd"
mkdir -p "$AVD_HOME"
export ANDROID_AVD_HOME="$AVD_HOME"

# Create a default AVD if not present
AVD_NAME="Pixel_7_API_34"
if ! avdmanager list avd 2>/dev/null | grep -q "Name: $AVD_NAME"; then
  echo "Creating AVD: $AVD_NAME"
  echo "no" | avdmanager create avd -n "$AVD_NAME" -k "system-images;android-34;google_apis;x86_64" -d "pixel_7" --force
  echo "AVD created."
else
  echo "AVD $AVD_NAME already exists."
fi

# Write env file so you can source it
ENV_FILE="$SDK_DIR/android-env.sh"
cat > "$ENV_FILE" << EOF
# Android SDK on /data - source this before using emulator / Expo Android
# Usage: source /data/android-sdk/android-env.sh
export ANDROID_HOME="$SDK_DIR"
export ANDROID_SDK_ROOT="$SDK_DIR"
export ANDROID_AVD_HOME="$AVD_HOME"
export PATH="\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/emulator:\$PATH"
EOF
chmod +x "$ENV_FILE"
echo ""
echo "Done. Add to your shell (e.g. ~/.bashrc):"
echo "  source $ENV_FILE"
echo "Then start emulator: emulator -avd $AVD_NAME"
echo "Run your app from /data: cd /data/projects/infozerv/infozervmobileapp/frontend && npx expo start --android"
echo ""

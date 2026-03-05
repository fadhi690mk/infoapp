#!/usr/bin/env bash
# Fix broken NodeSource apt repo so you can run apt-get update and install openjdk-17-jdk.
# Run once: ./scripts/fix-apt-and-install-jdk17.sh
# Then run: ./scripts/setup-android-vm.sh

set -e

NODESOURCE_LIST="/etc/apt/sources.list.d/nodesource.list"
BACKUP="${NODESOURCE_LIST}.bak"

if [[ -f "$NODESOURCE_LIST" ]]; then
  echo "Temporarily disabling NodeSource repo (broken mirror) so apt-get update works..."
  sudo mv "$NODESOURCE_LIST" "$BACKUP"
  echo "  Moved to $BACKUP (re-enable later with: sudo mv $BACKUP $NODESOURCE_LIST)"
fi

echo "Running apt-get update..."
sudo apt-get update

echo "Installing OpenJDK 17..."
sudo apt-get install -y openjdk-17-jdk

echo ""
echo "Done. JDK 17 is installed. Run the Android VM setup:"
echo "  cd /data/projects/infozerv/infozervmobileapp"
echo "  ./scripts/setup-android-vm.sh"
echo ""
echo "For Node.js, use nvm or re-enable NodeSource after they fix the mirror:"
echo "  sudo mv $BACKUP $NODESOURCE_LIST"
echo ""

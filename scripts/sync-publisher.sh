#!/bin/sh
# Copie les paquets @publisher/astro et @publisher/client dans vendor/ pour que Vercel puisse les installer
# (ils ne sont pas publiés sur npm). À relancer après chaque mise à jour de Publisher, puis `npm install`.
# Usage : scripts/sync-publisher.sh [chemin du dépôt publisher, par défaut ../publisher]
set -eu
cd "$(dirname "$0")/.."
SRC="${1:-../publisher}/packages"
for pkg in astro client; do
  rm -rf "vendor/publisher/$pkg"
  mkdir -p "vendor/publisher/$pkg"
  cp -R "$SRC/$pkg/src" "$SRC/$pkg/package.json" "vendor/publisher/$pkg/"
done
# Dans le monorepo, @publisher/astro dépend du client en workspace:* : ici, on pointe vers la copie voisine.
sed -i.bak 's#"@publisher/client": "workspace:\*"#"@publisher/client": "file:../client"#' vendor/publisher/astro/package.json
rm vendor/publisher/astro/package.json.bak
echo "Paquets Publisher copiés depuis $SRC ($(cd "$SRC/.." && git rev-parse --short HEAD 2>/dev/null || echo 'sans git'))"

#!/usr/bin/env bash
# pemakaian: ./deploy/deploy.sh user@host [/var/www/yomi]
set -euo pipefail
TARGET="${1:?isi tujuan, mis. user@vps}"
DIR="${2:-/var/www/yomi}"
npm run build
rsync -avz --delete dist/ "$TARGET:$DIR/"
echo "Selesai: $TARGET:$DIR"

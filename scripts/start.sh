#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
exec node bin/reaw.js serve "${1:-4317}"

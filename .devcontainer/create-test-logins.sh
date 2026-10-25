#!/usr/bin/env bash
# CODESPACE ONLY: creates a test login for every portal role (password Test@1234).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/nnm-property-tax-api"
NODE_PATH="$PWD/node_modules" npx tsx "$ROOT/.devcontainer/create-test-logins.ts"

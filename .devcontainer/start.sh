#!/usr/bin/env bash
# Starts the API (port 4000) and the portal (port 3000).
# Runs each time you open the Codespace. Safe to run again by hand.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOGDIR="$ROOT/.devcontainer/logs"
mkdir -p "$LOGDIR"

port_open() { (echo > "/dev/tcp/localhost/$1") >/dev/null 2>&1; }

# Pick up any new migrations pulled from GitHub since last time
(cd "$ROOT/nnm-property-tax-api" && npm run migrate --silent) || echo "!! Migrations failed - see output above"

if port_open 4000; then
  echo "API already running on port 4000"
else
  echo "Starting API (log: .devcontainer/logs/api.log)"
  (cd "$ROOT/nnm-property-tax-api" && setsid nohup npm run dev > "$LOGDIR/api.log" 2>&1 < /dev/null &)
fi

if port_open 3000; then
  echo "Portal already running on port 3000"
else
  echo "Starting portal (log: .devcontainer/logs/web.log)"
  (cd "$ROOT/munger-portal" && setsid nohup npm run dev > "$LOGDIR/web.log" 2>&1 < /dev/null &)
fi

for i in $(seq 1 90); do port_open 3000 && break; sleep 1; done

echo
if [ -n "${CODESPACE_NAME:-}" ]; then
  echo "Portal: https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
else
  echo "Portal: http://localhost:3000"
fi
[ -f "$ROOT/.devcontainer/LOGINS.txt" ] && cat "$ROOT/.devcontainer/LOGINS.txt"
echo "First load of each page takes a few seconds while it compiles."

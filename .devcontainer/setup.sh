#!/usr/bin/env bash
# Runs once, when the Codespace is first created.
# Installs packages, writes dev-only .env files, creates the database
# schema (all migrations) and two test logins. No real data is loaded.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API="$ROOT/nnm-property-tax-api"
WEB="$ROOT/munger-portal"
LOGINS="$ROOT/.devcontainer/LOGINS.txt"

# Public address of this Codespace's port 3000 (falls back to localhost elsewhere)
if [ -n "${CODESPACE_NAME:-}" ]; then
  FRONTEND_URL="https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
else
  FRONTEND_URL="http://localhost:3000"
fi

echo "==> Waiting for PostgreSQL"
for i in $(seq 1 60); do
  (echo > /dev/tcp/localhost/5432) >/dev/null 2>&1 && break
  sleep 1
done

echo "==> Installing backend packages"
(cd "$API" && npm ci --no-audit --no-fund)

echo "==> Installing frontend packages"
(cd "$WEB" && npm ci --no-audit --no-fund)

if [ ! -f "$API/.env" ]; then
  echo "==> Writing nnm-property-tax-api/.env (development values only)"
  cat > "$API/.env" <<EOF
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://nnm_app:nnm_dev_pw@localhost:5432/nnm_property_tax
CORS_ORIGINS=${FRONTEND_URL},http://localhost:3000
FRONTEND_URL=${FRONTEND_URL}
JWT_SECRET=$(openssl rand -hex 48)
VERIFICATION_SECRET=$(openssl rand -hex 48)
# Codespace is a test copy: online payment and face attendance stay off,
# and SMTP is a placeholder (password-reset emails will not be delivered).
ONLINE_PAYMENT_ENABLED=false
FACE_ATTENDANCE_ENABLED=false
SMTP_USER=codespace@example.invalid
SMTP_PASSWORD=not-configured
EOF
fi

if [ ! -f "$WEB/.env.local" ]; then
  echo "==> Writing munger-portal/.env.local"
  cat > "$WEB/.env.local" <<EOF
# Browser calls /api/v1 on the same address; Next.js forwards it to the API on port 4000.
NEXT_PUBLIC_PROPERTY_TAX_API_URL=/api/v1
API_PROXY_TARGET=http://localhost:4000
NEXT_PUBLIC_PROPERTY_TAX_URL=https://script.google.com/macros/s/NOT_CONFIGURED/exec
NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED=false
EOF
fi

echo "==> Creating database schema"
(cd "$API" && npm run migrate)

if [ ! -f "$LOGINS" ]; then
  echo "==> Creating test logins"
  ADMIN_PW="Nnm-$(openssl rand -hex 4)"
  OPR_PW="Opr-$(openssl rand -hex 4)"
  (cd "$API" && npm run create-admin -- mmcadmin "$ADMIN_PW" "MMC (Codespace)" commissioner)
  (cd "$API" && npm run create-operator -- testoperator "$OPR_PW" "Test Operator")
  cat > "$LOGINS" <<EOF
Codespace test logins (this copy only - not the live portal)

Admin (Commissioner):  username mmcadmin       password $ADMIN_PW
Operator:              username testoperator   password $OPR_PW
EOF
fi

echo
cat "$LOGINS"
echo
echo "Setup complete. The portal starts automatically; or run: bash .devcontainer/start.sh"

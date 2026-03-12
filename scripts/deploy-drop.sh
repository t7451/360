#!/usr/bin/env bash
# deploy-drop.sh — Build the Forge3D Studio client portal and open the Netlify
# Drop page so you can drag-and-drop the dist/ folder for an instant deploy.
#
# Usage:
#   ./scripts/deploy-drop.sh [RAILWAY_API_URL]
#
# Arguments:
#   RAILWAY_API_URL  (optional) Full URL of your Railway backend, e.g.
#                    https://my-api.up.railway.app
#                    If omitted the placeholder in public/_redirects is used.
#
# Prerequisites:
#   • Node.js ≥ 20
#   • .env.local file in forge3d-studio/client-portal/ (copy from .env.example)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORTAL_DIR="$SCRIPT_DIR/../forge3d-studio/client-portal"
RAILWAY_API_URL="${1:-}"

echo "==> Forge3D Studio — client portal build"

# ── Step 1: resolve the portal directory ──────────────────────────────────────
if [[ ! -d "$PORTAL_DIR" ]]; then
  echo "ERROR: client-portal directory not found at $PORTAL_DIR" >&2
  exit 1
fi

cd "$PORTAL_DIR"

# ── Step 2: patch _redirects with the real API URL if provided ────────────────
REDIRECTS_FILE="public/_redirects"
PLACEHOLDER="https://YOUR-ACTUAL-API.up.railway.app"

if [[ -n "$RAILWAY_API_URL" ]]; then
  echo "==> Patching $REDIRECTS_FILE with $RAILWAY_API_URL"
  # Use a temp file to avoid in-place issues on macOS/Linux alike
  sed "s|$PLACEHOLDER|$RAILWAY_API_URL|g" "$REDIRECTS_FILE" > /tmp/_redirects.patched
  cp /tmp/_redirects.patched "$REDIRECTS_FILE"
fi

# ── Step 3: install dependencies ──────────────────────────────────────────────
echo "==> Installing dependencies"
npm install --prefer-offline --no-audit --no-fund

# ── Step 4: build ─────────────────────────────────────────────────────────────
echo "==> Building"
npm run build

DIST_DIR="$PORTAL_DIR/dist"
echo ""
echo "✅  Build complete — output in: $DIST_DIR"
echo ""
echo "Next steps:"
echo "  1. Open https://app.netlify.com/drop in your browser"
echo "  2. Drag the folder below onto the deploy area:"
echo "     $DIST_DIR"
echo ""

# ── Step 5: open Netlify Drop (best-effort) ───────────────────────────────────
NETLIFY_DROP_URL="https://app.netlify.com/drop"
if command -v open &>/dev/null; then          # macOS
  open "$NETLIFY_DROP_URL"
elif command -v xdg-open &>/dev/null; then    # Linux
  xdg-open "$NETLIFY_DROP_URL" &>/dev/null &
fi

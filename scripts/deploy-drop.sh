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
#!/bin/bash
# ============================================
# FORGE3D — Netlify Drop Deploy Script
# ============================================
# Builds the client portal and opens Netlify Drop
# for drag-and-drop deployment.
#
# Usage:
#   chmod +x scripts/deploy-drop.sh
#   ./scripts/deploy-drop.sh
# ============================================

set -e

echo "================================================"
echo "  FORGE3D — Building for Netlify Drop Deploy"
echo "================================================"
echo ""

# Check for .env.local
if [ ! -f "client-portal/.env.local" ]; then
  echo "⚠️  No client-portal/.env.local found."
  echo "   Copy .env.example → .env.local and fill in your keys."
  echo "   Continuing with defaults..."
  echo ""
fi

# Build
echo "📦 Installing dependencies..."
cd client-portal
npm install

echo ""
echo "🔨 Building production bundle..."
npm run build

echo ""
echo "✅ Build complete!"
echo ""

# Verify critical files in dist
if [ ! -f "dist/index.html" ]; then
  echo "❌ ERROR: dist/index.html not found. Build failed."
  exit 1
fi

if [ ! -f "dist/_redirects" ]; then
  echo "⚠️  WARNING: dist/_redirects not found. SPA routing will break."
  echo "   Make sure public/_redirects exists."
fi

if [ ! -f "dist/_headers" ]; then
  echo "⚠️  WARNING: dist/_headers not found. Security headers won't apply."
fi

echo "================================================"
echo "  📂 Your deploy folder: client-portal/dist/"
echo "================================================"
echo ""
echo "  Drop deploy steps:"
echo ""
echo "  1. Open https://app.netlify.com/drop"
echo "  2. Drag the 'dist' folder onto the page"
echo "  3. Done — your site is live!"
echo ""
echo "  Or use CLI:"
echo "    npx netlify-cli deploy --prod --dir=dist"
echo ""
echo "================================================"

# Try to open Netlify Drop in browser
if command -v xdg-open &> /dev/null; then
  xdg-open "https://app.netlify.com/drop" 2>/dev/null || true
elif command -v open &> /dev/null; then
  open "https://app.netlify.com/drop" 2>/dev/null || true
fi

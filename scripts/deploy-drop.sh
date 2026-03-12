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

# FORGE3D + InkVault — Setup Guide

## 1 · Firebase Setup (dforge-c8c59)

> Firebase Console: https://console.firebase.google.com/project/dforge-c8c59

### 1a · Register the web app
1. **Project Settings** (gear icon) → **Your apps** → click **`</>`** (Web)
2. App nickname: `FORGE3D Portal` → click **Register app**
3. Copy the `firebaseConfig` values — you'll need `apiKey` for Netlify env vars

### 1b · Enable Authentication
1. **Authentication** → **Get started**
2. **Sign-in method** → **Email/Password** → Enable → Save

### 1c · Generate Admin SDK key (for Railway)
1. **Project Settings** → **Service accounts** → **Firebase Admin SDK**
2. Click **Generate new private key** → download the JSON
3. Paste the full JSON content as `GOOGLE_APPLICATION_CREDENTIALS_JSON` in Railway

---

## 2 · Netlify Environment Variables (both sites)

Both the FORGE3D Portal and InkVault Netlify sites require these variables in **Site Settings → Environment variables**:

| Variable | Description |
|---|---|
| `RAILWAY_API_URL` | Your Railway API URL, e.g. `https://your-service.up.railway.app` |
| `VITE_API_URL` | Same URL — used by Vite to build API calls into the bundle |

> **Why two variables?**  
> `RAILWAY_API_URL` is used server-side by Netlify's redirect proxy (`:[VAR]` syntax in `netlify.toml`) — it rewrites `/api/*` requests before they leave Netlify's edge.  
> `VITE_API_URL` is inlined at build time into the JavaScript bundle for any client-side `fetch` calls that target the API directly.  
> Both can be set to the same Railway URL.

---

## 3 · Netlify — FORGE3D Portal

Site settings → **Environment variables** → add:

| Variable | Value |
|---|---|
| `RAILWAY_API_URL` | Your Railway API URL |
| `VITE_API_URL` | Same Railway URL |
| `VITE_FIREBASE_API_KEY` | *(from Firebase Console → Project Settings → Your apps → Web app)* |
| `VITE_FIREBASE_AUTH_DOMAIN` | `dforge-c8c59.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `dforge-c8c59` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `dforge-c8c59.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `406047297987` |
| `VITE_FIREBASE_APP_ID` | `1:406047297987:web:82cfd1d381ee457c896d76` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-1NEHJ9386B` |
| `VITE_INKVAULT_URL` | Your InkVault Netlify URL |

Build settings:
- **Base directory**: `client-portal`
- **Build command**: `npm run build`
- **Publish directory**: `dist`

---

## 4 · Netlify — InkVault

Create a **separate** Netlify site for InkVault:

1. **Add new site** → Connect to `t7451/360`
2. Build settings:
   - **Base directory**: `inkvault`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. **Environment variables** → add:
   - `RAILWAY_API_URL` — your Railway API URL
   - `VITE_API_URL` — same Railway URL

---

## 4 · Railway — API Server

Service variables → add:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `FIREBASE_PROJECT_ID` | `dforge-c8c59` |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Full JSON from step 1c |
| `STRIPE_SECRET_KEY` | From Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook endpoint |
| `REDIS_URL` | Your Redis URL |
| `CLIENT_URL` | Your Netlify portal URL |
| `ALLOWED_ORIGINS` | Comma-separated: portal URL, InkVault URL |
| `ANTHROPIC_API_KEY` | From Anthropic console |

Start command: `node dist/index.js`

### Stripe Webhook
1. Stripe Dashboard → **Webhooks** → **Add endpoint**
2. URL: `https://your-railway-url.up.railway.app/api/webhooks`
3. Events to listen for:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
4. Copy the signing secret → set as `STRIPE_WEBHOOK_SECRET`

---

## 5 · Local Development

```bash
# Clone and install
git clone https://github.com/t7451/360
cd 360
npm install

# Copy env files
cp .env.example src/server/.env          # fill in values
cp client-portal/.env.example client-portal/.env.local   # fill in values

# Run all services
npm run dev:server    # Express API on :3001
npm run dev:portal    # FORGE3D portal on :5173
npm run dev:inkvault  # InkVault on :5174
npm run dev:mcp       # Blender MCP bridge on :8765
```

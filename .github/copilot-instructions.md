# FORGE3D Studio — Copilot Instructions

## Architecture Overview

Monorepo with three services that must all run together:

```
Client Portal (React/Vite)  →  API Server (Express/TS)  →  Blender MCP Bridge (FastAPI/Python)
        ↓                              ↓                              ↓
  Firebase Auth              BullMQ/Redis job queue           Headless Blender 4.x
  Stripe Checkout            GCS asset storage                Cycles/EEVEE renderer
```

- **`client-portal/`** — React 18 + Vite + Tailwind. Firebase client-side auth. Routes: `/`, `/login`, `/dashboard`, `/orders/new`, `/orders/:id`. All protected routes require Firebase JWT.
- **`src/server/`** — Express.js TypeScript API. Listens on port 3001. `/api/orders` and `/api/assets` are auth-protected; `/api/health` and `/api/webhooks` are public.
- **`src/mcp/`** — FastAPI Python bridge. Receives Blender Python scripts, executes them in headless Blender, saves `.blend` scenes. Two-step flow: `POST /execute` → `scene_id` → `POST /export`.

## Commands

### API Server (`src/server/`)
```bash
cd src/server
npm run dev          # tsx watch (hot reload)
npm run build        # tsc compile to dist/
npm run start        # node dist/index.js (production)
npm run lint         # eslint
npm test             # vitest run (all tests)
npx vitest run <file>  # single test file
```

### Client Portal (`client-portal/`)
```bash
cd client-portal
npm run dev          # Vite dev server (port 5173)
npm run build        # production build → dist/
```

### Blender MCP Bridge (`src/mcp/`)
```bash
cd src/mcp
pip install -r requirements.txt
python forge3d_mcp_server.py   # runs on port 8765
```

### Root workspace
```bash
npm run dev:server   # alias for src/server dev
npm run dev:portal   # alias for client-portal dev
npm run dev:mcp      # alias for mcp server
npm run build        # builds server + portal
npm run lint         # lints all workspaces
npm test             # tests all workspaces
```

### Drop deploy (portal only)
```bash
./scripts/deploy-drop.sh https://<railway-api-url>
# Builds portal and opens Netlify Drop — drag dist/ folder
```

## Key Conventions

### API Response Shape
All responses must follow this shape — use `satisfies ApiResponse<T>`:
```typescript
{ success: boolean, data?: T, error?: string }
```

### TypeScript
- Strict mode — no `any` types. All data structures need explicit interfaces.
- Shared types live in `src/server/types/index.ts`: `Order`, `OrderRequest`, `RenderJob`, `AuthUser`, `ApiResponse`, `PRICING`.
- Pricing is defined in the `PRICING` constant — never hard-code prices in routes.

### Order Lifecycle
`pending_payment` → `paid` → `queued` → `processing` → `rendering` → `review` → `completed` | `failed` | `refunded`

Orders can only receive revisions when `status === 'completed'`.

### Job Queue Rules
- **Never process jobs synchronously in API handlers** — always call `addRenderJob()`.
- 3 retry attempts, exponential backoff (5s base). After 3 failures → Slack alert via `SLACK_WEBHOOK_URL`.
- Job priority: retainer clients > single orders > revisions (retries).
- Worker concurrency: 2 simultaneous jobs, max 10/minute.

### Middleware Order (critical)
`/api/webhooks` is registered **before** `express.json()` — Stripe signature verification requires the raw request body. Never move it after JSON middleware.

### Auth
Firebase Admin SDK verifies JWT `Bearer` tokens. User roles (`client | admin | partner`) come from Firebase custom claims — not the token payload directly. Accessed via `(req as any).user` after `authMiddleware`.

### Blender MCP Rules
- All dimensions in **METERS** (not centimeters).
- Always call `bpy.ops.wm.read_factory_settings()` to clear scene before starting a new job.
- Render output: PNG for previews, EXR for production renders, STL/3MF for print files.
- Use Cycles for final renders, EEVEE for quick previews. GPU preferred; CPU fallback.
- Each `/execute` call appends an auto-save to the script and returns a `scene_id`. Use that `scene_id` in `/export` calls.
- Blender operations must be idempotent and have a timeout (max 120s for execute, 300s for export).

### MCP Bridge Output Markers
Blender scripts emit these strings on stdout for tracking:
- `FORGE3D_SCENE_SAVED: <scene_id>`
- `FORGE3D_RENDER_COMPLETE: <format>`
- `FORGE3D_EXPORT_COMPLETE: <format>`

### Python
- Type hints required on all MCP code.
- Pydantic v2 models for all request/response schemas.

## Data Store Note
Orders currently use an in-memory `Map` in `src/server/routes/orders.ts`. This is intentional scaffolding — swap for Firestore or Postgres before production traffic.

## Deployment
- **API**: Railway — auto-deploys `main`. Entry: `node dist/index.js`.
- **Portal**: Netlify — base dir `client-portal`, build `npm run build`, publish `dist`. The Netlify MCP deploy via Claude sandbox fails due to multipart upload restrictions; use `netlify deploy --prod --dir=dist` or manual drag-and-drop.
- **Blender Worker**: Contabo VPS or GCE GPU instance running the MCP bridge.

## Protected Files
Never modify: `.env`, `firebase.json`, `.firebaserc`, migration files.  
Never commit: API keys, service account JSON, `.env` files.  
`GOOGLE_APPLICATION_CREDENTIALS` must point to a service account JSON file — never inline credentials.

# CLAUDE.md — FORGE3D Studio Agent Context

## Project Overview
FORGE3D Studio is an AI-powered 3D asset production service. The system receives client orders via a web portal, processes them through Blender MCP, and delivers finished 3D assets (renders, STL files, STEP exports) automatically.

## Architecture Rules
- **Stack**: Express.js (TypeScript) API, React/Vite client portal, Blender MCP (Python), BullMQ/Redis job queue
- **Cathedral Principle**: Sequential construction. Never skip infrastructure for features. Foundation → Revenue → Systems → Scale.
- **Monorepo**: All services live in this repo. No microservice sprawl until justified by traffic.

## Coding Standards
- TypeScript strict mode for all server code
- Python type hints for all MCP code
- ESLint + Prettier enforced on commit
- No `any` types — explicit interfaces for all data structures
- API responses follow `{ success: boolean, data?: T, error?: string }` shape
- All Blender operations must be idempotent and timeout-protected (max 120s per operation)

## Testing Directives
- Write unit tests BEFORE implementing core logic (TDD)
- Every Blender MCP command must have a corresponding test that validates output geometry
- API routes must have integration tests covering auth, validation, and error cases
- Never suppress build errors — fix root causes

## File Protection
- NEVER modify: `.env`, `firebase.json`, `.firebaserc`, migration files
- NEVER commit: API keys, service account JSON, `.env` files
- ALWAYS use environment variables for secrets

## Blender MCP Rules
- All dimensions in METERS (Blender default), not centimeters
- Always clear scene before starting new job (bpy.ops.wm.read_factory_settings)
- Render output: PNG for previews, EXR for production, STL/3MF for print files
- Use Cycles for final renders, EEVEE for quick previews
- GPU rendering preferred; fall back to CPU with reduced samples

## Job Processing
- All jobs go through BullMQ queue — never process synchronously in API handlers
- Jobs have 3 retry attempts with exponential backoff
- Failed jobs after 3 retries → dead letter queue → Slack alert
- Job priority: retainer clients > single orders > revision requests

## Deployment
- API: Railway (auto-deploy from main branch)
- Client Portal: Netlify (auto-deploy from main branch)
- Blender Worker: Contabo VPS or GCE with GPU
- Known constraint: Netlify MCP deploy from Claude sandbox fails due to multipart upload restrictions. Use `netlify-cli deploy` locally or manual drag-and-drop.

## Error Handling
- All API errors return proper HTTP status codes with descriptive messages
- Blender errors: capture full traceback, log to structured JSON, return sanitized message to client
- Payment errors: never fulfill without confirmed payment — check Stripe webhook signature
- MCP errors: reconnect with exponential backoff, max 5 attempts before marking job failed

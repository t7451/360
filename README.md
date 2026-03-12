# FORGE3D Studio

**AI-Powered 3D Asset Production Studio** — Instant 3D modeling, product renders, and custom file generation powered by Blender MCP + Claude Code.

> Built by [PNW Solutions](https://pnwenterprises.com) — A 1Commerce Ecosystem Product

---

## What This Is

FORGE3D is a production-ready 3D asset studio that uses AI agents to generate, modify, and deliver 3D models through natural language. Clients submit orders through a web portal, AI processes the job via Blender MCP, and finished assets are delivered automatically.

**Three Revenue Channels:**

| Channel | Price Range | Turnaround | Volume Target |
|---------|-------------|------------|---------------|
| E-Commerce Product Renders | $75–$150/product | Same day | 5–10/day |
| Custom 3D Print Files (STL/3MF) | $25–$75/file | 1–2 hours | 10–20/day |
| Rapid Prototyping Retainers | $500–$2,000/mo | Ongoing | 3–5 clients |

**Niche Wedge:** Glass art digitization for artists and collectors — 3D replication of glass pieces for portfolio/insurance documentation ($50–$150/piece).

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Client Portal   │────▶│   FORGE3D API    │────▶│  Blender MCP    │
│  (React/Vite)    │     │  (Express.js)    │     │  (Python)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                        │
        │                        ▼                        ▼
        │                ┌──────────────────┐     ┌─────────────────┐
        │                │  Job Queue       │     │  Blender        │
        │                │  (BullMQ/Redis)  │     │  (Headless)     │
        │                └──────────────────┘     └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Stripe Payments │     │  Asset Storage   │     │  Render Engine  │
│  (Checkout)      │     │  (GCS/S3)       │     │  (Cycles/EEVEE) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Client Portal | React + Vite + Tailwind | Order intake, asset preview, download |
| API Server | Express.js + TypeScript | Job routing, auth, webhook handling |
| Job Queue | BullMQ + Redis | Async job processing, retry logic |
| 3D Engine | Blender 4.x (headless) | Model generation, rendering |
| MCP Bridge | BlenderMCP (Python) | AI ↔ Blender communication |
| AI Agent | Claude Code / Anthropic API | Natural language → 3D commands |
| Payments | Stripe Checkout + Webhooks | Payment capture, order fulfillment |
| Storage | Google Cloud Storage | Asset delivery, CDN |
| Auth | Firebase Auth + JWT | Client accounts, RBAC |
| Deploy | Railway (API) + Netlify (Portal) | Hosting |

---

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.10+
- Blender 4.0+ (headless mode)
- Redis
- Claude Code CLI or Anthropic API key

### Install

```bash
# Clone
git clone https://github.com/pnw-solutions/forge3d-studio.git
cd forge3d-studio

# Install API dependencies
cd src/server && npm install

# Install MCP bridge
cd ../mcp && pip install -r requirements.txt

# Install client portal
cd ../../client-portal && npm install

# Copy environment config
cp .env.example .env
```

### Configure

```bash
# .env — fill in your keys
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
GCS_BUCKET=forge3d-assets
GCS_PROJECT_ID=your-project
REDIS_URL=redis://localhost:6379
BLENDER_PATH=/usr/bin/blender
FIREBASE_PROJECT_ID=your-firebase-project
```

### Run

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start API server
cd src/server && npm run dev

# Terminal 3: Start Blender MCP bridge
cd src/mcp && python forge3d_mcp_server.py

# Terminal 4: Start client portal
cd client-portal && npm run dev
```

---

## Project Structure

```
forge3d-studio/
├── src/
│   ├── server/              # Express.js API
│   │   ├── index.ts         # Server entry
│   │   ├── routes/          # API routes
│   │   ├── jobs/            # BullMQ job processors
│   │   ├── services/        # Business logic
│   │   └── middleware/       # Auth, validation, rate limiting
│   ├── mcp/                 # Blender MCP bridge
│   │   ├── forge3d_mcp_server.py  # MCP server
│   │   ├── blender_commands.py    # Blender operation library
│   │   └── render_pipeline.py     # Render automation
│   ├── workflows/           # Claude Code automation scripts
│   │   ├── product_render.md      # Product render workflow
│   │   ├── custom_stl.md         # Custom STL generation
│   │   └── glass_digitize.md     # Glass art replication
│   └── utils/               # Shared utilities
├── client-portal/           # React client app
├── scripts/                 # Deployment & setup scripts
├── templates/               # Blender scene templates
├── docs/                    # Documentation
├── .github/workflows/       # CI/CD
├── CLAUDE.md               # Agent context file
├── .env.example            # Environment template
└── package.json            # Root workspace
```

---

## Revenue Model

### Instant Profit Math

| Metric | Value |
|--------|-------|
| Infrastructure cost | ~$25/mo (Redis + Railway) |
| Blender | Free (open source) |
| MCP servers | Free (open source) |
| Claude Code | ~$100/mo (API usage) |
| **Total overhead** | **~$125/mo** |
| Revenue @ 5 renders/day × $100 | $15,000/mo |
| Revenue @ 10 STL files/day × $50 | $15,000/mo |
| Revenue @ 3 retainers × $1,000 | $3,000/mo |
| **Gross margin** | **>99%** |

### Pricing Tiers

- **Single Asset**: Pay-per-job via Stripe Checkout
- **Pack (10 assets)**: 15% discount, prepaid credits
- **Retainer**: Monthly subscription, unlimited revisions

---

## Deployment

### API → Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### Client Portal → Netlify

```bash
cd client-portal
npm run build
netlify deploy --prod --dir=dist
```

### Blender Worker → Contabo VPS / GCE

The Blender headless worker runs on a dedicated GPU instance. See `docs/BLENDER_WORKER_SETUP.md` for provisioning instructions.

---

## API Reference

### `POST /api/orders`
Create a new 3D asset order.

### `GET /api/orders/:id`
Check order status and download links.

### `POST /api/orders/:id/revisions`
Submit revision request on existing order.

### `POST /api/webhooks/stripe`
Stripe payment webhook handler.

### `GET /api/assets/:id/download`
Secure, time-limited asset download.

---

## License

MIT — Built by PNW Solutions / 1Commerce LLC

---

## Contributing

This is an active production system. PRs welcome for:
- New Blender MCP command modules
- Additional render templates
- Client portal improvements
- Documentation

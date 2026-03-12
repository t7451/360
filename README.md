# Forge3D Studio — 360

AI-powered 3D asset production studio offering e-commerce product renders, custom 3D print files, and rapid prototyping retainers.

## Repository structure

```
360/
├── forge3d-studio/
│   └── client-portal/      # React + Vite customer-facing portal
│       ├── netlify.toml    # Netlify git-based deploy config
│       ├── .env.example    # Environment variable template
│       └── public/
│           ├── _redirects  # SPA catch-all + Railway API proxy
│           └── _headers    # Security & cache headers
└── scripts/
    └── deploy-drop.sh      # One-command build → Netlify Drop helper
```

## Quick start — drop deploy

```bash
# 1. Configure environment
cd forge3d-studio/client-portal
cp .env.example .env.local
# Edit .env.local with your Firebase keys and API URL

# 2. Build and deploy (pass your Railway API URL)
cd ../../
./scripts/deploy-drop.sh https://my-api.up.railway.app
```

The script builds the portal and opens [app.netlify.com/drop](https://app.netlify.com/drop). Drag the `forge3d-studio/client-portal/dist/` folder onto the Netlify Drop area.

## Git-based deploys (Netlify CI)

Connect this repository to Netlify and set the following settings:

| Setting | Value |
|---|---|
| Base directory | `forge3d-studio/client-portal` |
| Build command | `npm run build` |
| Publish directory | `dist` |

Add environment variables from `.env.example` in the Netlify UI under **Site → Environment variables**.

## Service channels

| Channel | Price range | Turnaround |
|---|---|---|
| E-commerce product renders | $75–$150/product | Same day |
| Custom 3D print files (STL/3MF) | $25–$75/file | Same day |
| Rapid prototyping retainer | $500–$2,000/month | Ongoing |

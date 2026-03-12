import { useState, useEffect, useRef, createContext, useContext, ReactNode } from "react";

// ─── DESIGN SYSTEM ──────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

  :root {
    --bg-void: #0a0a0a;
    --bg-surface: #111111;
    --bg-elevated: #1a1a1a;
    --bg-hover: #222222;
    --border-subtle: #1e1e1e;
    --border-default: #2a2a2a;
    --border-strong: #3a3a3a;
    --text-primary: #f0ece4;
    --text-secondary: #8a8578;
    --text-tertiary: #5a564d;
    --text-inverse: #0a0a0a;
    --accent-copper: #d4845a;
    --accent-amber: #e8a84c;
    --accent-glow: #f0c060;
    --accent-molten: #ff6b35;
    --success: #5cb870;
    --error: #d45555;
    --warning: #d4a255;
    --gradient-forge: linear-gradient(135deg, #d4845a 0%, #e8a84c 50%, #f0c060 100%);
    --gradient-molten: linear-gradient(135deg, #ff6b35 0%, #d4845a 50%, #e8a84c 100%);
    --gradient-surface: linear-gradient(180deg, #131313 0%, #0a0a0a 100%);
    --font-display: 'Syne', sans-serif;
    --font-body: 'Outfit', sans-serif;
    --font-mono: 'IBM Plex Mono', monospace;
    --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: var(--bg-void);
    color: var(--text-primary);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  /* ── NOISE OVERLAY ── */
  .noise-overlay {
    position: fixed; inset: 0; z-index: 9999; pointer-events: none;
    opacity: 0.025;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-repeat: repeat;
  }

  /* ── GRID BACKGROUND ── */
  .grid-bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(212, 132, 90, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(212, 132, 90, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, black, transparent);
  }

  /* ── GLOW EFFECTS ── */
  .glow-orb {
    position: fixed; width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(212, 132, 90, 0.08) 0%, transparent 70%);
    filter: blur(80px); pointer-events: none; z-index: 0;
    animation: orbFloat 20s ease-in-out infinite;
  }
  @keyframes orbFloat {
    0%, 100% { transform: translate(-20%, -20%); }
    33% { transform: translate(10%, -10%); }
    66% { transform: translate(-10%, 10%); }
  }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideRight {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 20px rgba(212, 132, 90, 0.15); }
    50% { box-shadow: 0 0 40px rgba(212, 132, 90, 0.3); }
  }
  @keyframes progressPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  @keyframes rotateIn {
    from { opacity: 0; transform: rotate(-8deg) scale(0.9); }
    to { opacity: 1; transform: rotate(0deg) scale(1); }
  }
  @keyframes borderGlow {
    0%, 100% { border-color: rgba(212, 132, 90, 0.2); }
    50% { border-color: rgba(212, 132, 90, 0.5); }
  }

  .animate-fade-up { animation: fadeUp 0.7s var(--ease-out-expo) both; }
  .animate-fade-in { animation: fadeIn 0.5s ease both; }
  .animate-slide-right { animation: slideRight 0.6s var(--ease-out-expo) both; }
  .animate-scale-in { animation: scaleIn 0.5s var(--ease-spring) both; }
  .animate-rotate-in { animation: rotateIn 0.6s var(--ease-spring) both; }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.2s; }
  .delay-3 { animation-delay: 0.3s; }
  .delay-4 { animation-delay: 0.4s; }
  .delay-5 { animation-delay: 0.5s; }
  .delay-6 { animation-delay: 0.6s; }
  .delay-7 { animation-delay: 0.7s; }

  /* ── BUTTONS ── */
  .btn-forge {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 14px 28px; border-radius: 12px; border: none;
    background: var(--gradient-forge); color: var(--text-inverse);
    font-family: var(--font-display); font-weight: 600; font-size: 15px;
    letter-spacing: -0.01em; cursor: pointer;
    transition: all 0.4s var(--ease-out-expo);
    position: relative; overflow: hidden;
  }
  .btn-forge::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s var(--ease-out-expo);
  }
  .btn-forge:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(212, 132, 90, 0.3); }
  .btn-forge:hover::before { transform: translateX(100%); }
  .btn-forge:active { transform: translateY(0) scale(0.98); }

  .btn-ghost {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 14px 28px; border-radius: 12px;
    border: 1px solid var(--border-default); background: transparent;
    color: var(--text-primary); font-family: var(--font-display);
    font-weight: 500; font-size: 15px; cursor: pointer;
    transition: all 0.3s var(--ease-out-expo);
  }
  .btn-ghost:hover { border-color: var(--accent-copper); background: rgba(212, 132, 90, 0.05); }

  .btn-sm {
    padding: 10px 20px; font-size: 13px; border-radius: 10px;
  }

  /* ── INPUTS ── */
  .input-forge {
    width: 100%; padding: 14px 18px; border-radius: 12px;
    border: 1px solid var(--border-subtle); background: var(--bg-surface);
    color: var(--text-primary); font-family: var(--font-body);
    font-size: 15px; outline: none;
    transition: all 0.3s var(--ease-out-expo);
  }
  .input-forge::placeholder { color: var(--text-tertiary); }
  .input-forge:focus { border-color: var(--accent-copper); box-shadow: 0 0 0 3px rgba(212, 132, 90, 0.1); }

  textarea.input-forge { resize: vertical; min-height: 120px; line-height: 1.6; }

  /* ── CARDS ── */
  .card {
    border-radius: 16px; border: 1px solid var(--border-subtle);
    background: var(--bg-surface); overflow: hidden;
    transition: all 0.4s var(--ease-out-expo);
  }
  .card:hover { border-color: var(--border-default); }
  .card-interactive:hover {
    border-color: rgba(212, 132, 90, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  }

  /* ── CHIP / TAG ── */
  .chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 100px;
    font-family: var(--font-mono); font-size: 12px; font-weight: 500;
    letter-spacing: 0.02em;
  }
  .chip-copper { background: rgba(212, 132, 90, 0.1); color: var(--accent-copper); border: 1px solid rgba(212, 132, 90, 0.2); }
  .chip-success { background: rgba(92, 184, 112, 0.1); color: var(--success); border: 1px solid rgba(92, 184, 112, 0.2); }
  .chip-warning { background: rgba(212, 162, 85, 0.1); color: var(--warning); border: 1px solid rgba(212, 162, 85, 0.2); }
  .chip-error { background: rgba(212, 85, 85, 0.1); color: var(--error); border: 1px solid rgba(212, 85, 85, 0.2); }

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }

  /* ── LAYOUT UTILITY ── */
  .container { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
  .container-sm { max-width: 680px; margin: 0 auto; padding: 0 24px; }
`;

// ─── ICONS (inline SVG) ─────────────────────────────────────
const Icons = {
  cube: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  zap: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  arrow: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  arrowLeft: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  download: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  clock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  plus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  flame: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  ),
  printer: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  ),
  cog: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  diamond: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12l4 6-10 13L2 9z"/><path d="M2 9h20"/><path d="M10 3l-4 6 6 13 6-13-4-6"/>
    </svg>
  ),
  image: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

// ─── DATA ───────────────────────────────────────────────────
const ASSET_TYPES = [
  { value: "product_render", label: "Product Render", desc: "Photorealistic 3D product visualization with studio lighting", price: 100, rush: 175, icon: Icons.image, tag: "MOST POPULAR" },
  { value: "custom_stl", label: "3D Print File", desc: "Manifold-validated STL/3MF geometry ready for any printer", price: 50, rush: 85, icon: Icons.printer, tag: null },
  { value: "prototype_step", label: "Rapid Prototype", desc: "STEP/IGES files for CNC machining and injection mold quotes", price: 150, rush: 250, icon: Icons.cog, tag: "PRO" },
  { value: "glass_digitize", label: "Glass Art Replica", desc: "True 3D replication of glass artwork for portfolio & insurance", price: 100, rush: 175, icon: Icons.diamond, tag: "NICHE" },
  { value: "scene_render", label: "Scene Render", desc: "Custom environments, lifestyle shots, and architectural viz", price: 125, rush: 200, icon: Icons.flame, tag: null },
];

const OUTPUT_FORMATS = [
  { value: "png", label: "PNG", group: "Render" },
  { value: "jpg", label: "JPG", group: "Render" },
  { value: "exr", label: "EXR", group: "Render" },
  { value: "stl", label: "STL", group: "Print" },
  { value: "3mf", label: "3MF", group: "Print" },
  { value: "step", label: "STEP", group: "CAD" },
  { value: "obj", label: "OBJ", group: "3D" },
  { value: "fbx", label: "FBX", group: "3D" },
  { value: "glb", label: "GLB", group: "Web" },
];

const DEMO_ORDERS = [
  { id: "ord_001", assetType: "product_render", description: "Matte black ceramic coffee mug on marble surface with soft morning light", status: "completed", priceUsd: 100, priority: "standard", assets: [{ id: "a1", filename: "mug_render_final.png", format: "png" }, { id: "a2", filename: "mug_model.glb", format: "glb" }], createdAt: "2026-03-10T14:30:00Z" },
  { id: "ord_002", assetType: "custom_stl", description: "Replacement gear for KitchenAid mixer — 48 teeth, 32mm OD, 6mm bore", status: "processing", priceUsd: 50, priority: "rush", assets: [], createdAt: "2026-03-12T09:15:00Z" },
  { id: "ord_003", assetType: "glass_digitize", description: "Hand-blown borosilicate vase, ~30cm tall, swirl pattern in cobalt blue and amber", status: "queued", priceUsd: 100, priority: "standard", assets: [], createdAt: "2026-03-12T11:00:00Z" },
];

// ─── ROUTING CONTEXT ────────────────────────────────────────
const RouteCtx = createContext({ page: "landing" as string, go: (_p: string) => {} });
function useRoute() { return useContext(RouteCtx); }

// ─── MAIN APP ───────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  function go(p: string) {
    if (p.startsWith("order:")) {
      setActiveOrderId(p.split(":")[1]);
      setPage("order-detail");
    } else {
      setPage(p);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <RouteCtx.Provider value={{ page, go }}>
      <style>{STYLES}</style>
      <div className="noise-overlay" />
      <div className="grid-bg" />
      <div className="glow-orb" style={{ top: "-200px", left: "-200px" }} />
      <div className="glow-orb" style={{ top: "40%", right: "-300px", animationDelay: "-7s", background: "radial-gradient(circle, rgba(232,168,76,0.06) 0%, transparent 70%)" }} />

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
        {page === "landing" && <Landing />}
        {page === "login" && <Login />}
        {page === "dashboard" && <Dashboard />}
        {page === "new-order" && <NewOrder />}
        {page === "order-detail" && <OrderDetail orderId={activeOrderId} />}
      </div>
    </RouteCtx.Provider>
  );
}

// ─── NAV BAR ────────────────────────────────────────────────
function Nav({ showAuth = false }: { showAuth?: boolean }) {
  const { go } = useRoute();
  return (
    <nav style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(10,10,10,0.8)", backdropFilter: "blur(16px) saturate(1.4)", position: "sticky", top: 0, zIndex: 100 }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <button onClick={() => go(showAuth ? "dashboard" : "landing")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em" }}>
            <span style={{ background: "var(--gradient-forge)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FORGE</span>
            <span style={{ color: "var(--text-primary)" }}>3D</span>
          </span>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {showAuth ? (
            <>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-tertiary)" }}>studio@forge3d.io</span>
              <button onClick={() => go("landing")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-body)" }}>
                {Icons.logout} Exit
              </button>
            </>
          ) : (
            <>
              <button onClick={() => go("login")} className="btn-ghost btn-sm">Log in</button>
              <button onClick={() => go("new-order")} className="btn-forge btn-sm">Start Building {Icons.arrow}</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// ─── LANDING PAGE ───────────────────────────────────────────
function Landing() {
  const { go } = useRoute();
  return (
    <div>
      <Nav />
      {/* HERO */}
      <section style={{ padding: "100px 0 80px", position: "relative" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <div className="animate-fade-up" style={{ marginBottom: 24 }}>
            <span className="chip chip-copper">AI-Powered 3D Fabrication</span>
          </div>
          <h1 className="animate-fade-up delay-1" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(42px, 6vw, 72px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, maxWidth: 800, margin: "0 auto" }}>
            From description{" "}
            <span style={{ background: "var(--gradient-forge)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>to delivery</span>
            <br />in hours.
          </h1>
          <p className="animate-fade-up delay-2" style={{ fontFamily: "var(--font-body)", fontSize: 18, color: "var(--text-secondary)", maxWidth: 520, margin: "24px auto 0", lineHeight: 1.7, fontWeight: 300 }}>
            Product renders. Print files. Rapid prototypes. Tell us what you need in plain English — our AI forge builds it, Cycles renders it, you download it.
          </p>
          <div className="animate-fade-up delay-3" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 48 }}>
            <button onClick={() => go("new-order")} className="btn-forge" style={{ fontSize: 16, padding: "16px 36px" }}>
              Start an Order {Icons.arrow}
            </button>
            <button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })} className="btn-ghost" style={{ fontSize: 16, padding: "16px 36px" }}>
              View Pricing
            </button>
          </div>

          {/* STAT STRIP */}
          <div className="animate-fade-up delay-5" style={{ display: "flex", justifyContent: "center", gap: 48, marginTop: 72, paddingTop: 40, borderTop: "1px solid var(--border-subtle)" }}>
            {[
              { val: "<2hr", label: "Avg. delivery" },
              { val: "99%", label: "Gross margin" },
              { val: "$0", label: "Inventory cost" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, background: "var(--gradient-forge)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.val}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)", marginTop: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "80px 0" }}>
        <div className="container">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, color: "var(--accent-copper)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Process</h2>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 48 }}>Three steps. Zero friction.</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { num: "01", title: "Describe", text: "Tell us what you need — dimensions, materials, colors, style. Plain English works. Reference images help." },
              { num: "02", title: "Forge", text: "Our AI translates your description into Blender Python, executes in headless Cycles, and renders your asset." },
              { num: "03", title: "Deliver", text: "Download production-ready files — PNG, STL, STEP, GLB. Same day. Revisions included." },
            ].map((step, i) => (
              <div key={i} className="card" style={{ padding: 32, position: "relative" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 48, fontWeight: 500, color: "var(--border-default)", position: "absolute", top: 20, right: 24, lineHeight: 1 }}>{step.num}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, marginBottom: 12, marginTop: 8 }}>{step.title}</div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{step.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: "80px 0" }}>
        <div className="container">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, color: "var(--accent-copper)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Pricing</h2>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 48 }}>Pay per asset. No subscriptions required.</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {ASSET_TYPES.map((type, i) => (
              <button key={type.value} onClick={() => go("new-order")}
                className="card card-interactive"
                style={{ padding: 28, textAlign: "left", cursor: "pointer", position: "relative" }}>
                {type.tag && (
                  <span style={{ position: "absolute", top: 16, right: 16, fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", color: "var(--accent-copper)", background: "rgba(212,132,90,0.1)", padding: "3px 8px", borderRadius: 4 }}>{type.tag}</span>
                )}
                <div style={{ color: "var(--accent-copper)", marginBottom: 16 }}>{type.icon}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{type.label}</div>
                <div style={{ fontSize: 13, color: "var(--text-tertiary)", lineHeight: 1.6, marginBottom: 20, minHeight: 42 }}>{type.desc}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 500 }}>
                  <span style={{ background: "var(--gradient-forge)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>${type.price}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 0", textAlign: "center" }}>
        <div className="container-sm">
          <div className="card" style={{ padding: "64px 48px", background: "var(--gradient-surface)", border: "1px solid rgba(212,132,90,0.15)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 0%, rgba(212,132,90,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16, position: "relative" }}>Ready to build?</h3>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 32, position: "relative" }}>First order ships in under 2 hours. No account required to start.</p>
            <button onClick={() => go("new-order")} className="btn-forge" style={{ position: "relative", fontSize: 16, padding: "16px 40px" }}>
              Create Your First Asset {Icons.arrow}
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)", padding: "32px 0" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>© 2026 FORGE3D · PNW Solutions · 1Commerce</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)" }}>Portland, OR</span>
        </div>
      </footer>
    </div>
  );
}

// ─── LOGIN ──────────────────────────────────────────────────
function Login() {
  const { go } = useRoute();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="animate-scale-in" style={{ width: "100%", maxWidth: 400 }}>
        <button onClick={() => go("landing")} style={{ display: "flex", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", marginBottom: 48, margin: "0 auto 48px" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em" }}>
            <span style={{ background: "var(--gradient-forge)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FORGE</span>
            <span style={{ color: "var(--text-primary)" }}>3D</span>
          </span>
        </button>

        <div className="card" style={{ padding: 40 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-tertiary)", marginBottom: 32 }}>
            {mode === "login" ? "Enter your credentials to continue." : "Start building 3D assets in minutes."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "block" }}>Email</label>
              <input className="input-forge" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
            <div>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "block" }}>Password</label>
              <input className="input-forge" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" />
            </div>
            <button onClick={() => go("dashboard")} className="btn-forge" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
              {mode === "login" ? "Sign In" : "Create Account"} {Icons.arrow}
            </button>
          </div>

          <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "var(--text-tertiary)" }}>
            {mode === "login" ? "No account? " : "Already have one? "}
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")} style={{ background: "none", border: "none", color: "var(--accent-copper)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13 }}>
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ──────────────────────────────────────────────
function Dashboard() {
  const { go } = useRoute();
  const orders = DEMO_ORDERS;

  const statusConfig: Record<string, { label: string; chipClass: string }> = {
    pending_payment: { label: "Awaiting Payment", chipClass: "chip-warning" },
    queued: { label: "In Queue", chipClass: "chip-copper" },
    processing: { label: "Forging", chipClass: "chip-copper" },
    rendering: { label: "Rendering", chipClass: "chip-copper" },
    completed: { label: "Delivered", chipClass: "chip-success" },
    failed: { label: "Failed", chipClass: "chip-error" },
  };

  return (
    <div>
      <Nav showAuth />
      <div className="container" style={{ padding: "48px 24px" }}>
        {/* Header */}
        <div className="animate-fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 48 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em" }}>Your Orders</h1>
            <p style={{ fontSize: 14, color: "var(--text-tertiary)", marginTop: 6 }}>
              <span style={{ fontFamily: "var(--font-mono)" }}>{orders.length}</span> total · <span style={{ fontFamily: "var(--font-mono)" }}>{orders.filter(o => o.status === "completed").length}</span> delivered
            </p>
          </div>
          <button onClick={() => go("new-order")} className="btn-forge">
            {Icons.plus} New Order
          </button>
        </div>

        {/* Orders Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map((order, i) => {
            const sc = statusConfig[order.status] || statusConfig.processing;
            return (
              <button key={order.id}
                className={`card card-interactive animate-fade-up delay-${i + 1}`}
                onClick={() => go(`order:${order.id}`)}
                style={{ padding: 0, cursor: "pointer", display: "flex", textAlign: "left", width: "100%" }}>
                {/* Status accent bar */}
                <div style={{ width: 4, flexShrink: 0, borderRadius: "16px 0 0 16px", background: order.status === "completed" ? "var(--success)" : order.status === "failed" ? "var(--error)" : "var(--accent-copper)" }} />

                <div style={{ flex: 1, padding: "20px 24px", display: "flex", alignItems: "center", gap: 20 }}>
                  {/* Icon */}
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-copper)", flexShrink: 0 }}>
                    {ASSET_TYPES.find(t => t.value === order.assetType)?.icon || Icons.cube}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, textTransform: "capitalize" }}>
                        {order.assetType.replace(/_/g, " ")}
                      </span>
                      <span className={`chip ${sc.chipClass}`} style={{ fontSize: 10, padding: "3px 10px" }}>{sc.label}</span>
                      {order.priority === "rush" && <span className="chip chip-warning" style={{ fontSize: 10, padding: "3px 10px" }}>{Icons.zap} Rush</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {order.description}
                    </div>
                  </div>

                  {/* Price + date */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 500 }}>${order.priceUsd}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
                      {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>

                  {/* Download indicator */}
                  {order.assets.length > 0 && (
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(92,184,112,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--success)", flexShrink: 0 }}>
                      {Icons.download}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Empty CTA if no orders */}
        {orders.length === 0 && (
          <div className="card animate-fade-up" style={{ padding: "80px 32px", textAlign: "center" }}>
            <div style={{ color: "var(--text-tertiary)", marginBottom: 16 }}>{Icons.cube}</div>
            <p style={{ color: "var(--text-tertiary)", marginBottom: 24 }}>No orders yet.</p>
            <button onClick={() => go("new-order")} className="btn-forge">Create Your First Order {Icons.arrow}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── NEW ORDER (MULTI-STEP CONFIGURATOR) ────────────────────
function NewOrder() {
  const { go } = useRoute();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    assetType: "",
    description: "",
    formats: [] as string[],
    priority: "standard" as "standard" | "rush",
    notes: "",
    w: "", h: "", d: "", unit: "mm",
  });
  const [submitting, setSubmitting] = useState(false);

  const selectedAsset = ASSET_TYPES.find(t => t.value === form.assetType);
  const price = selectedAsset ? (form.priority === "rush" ? selectedAsset.rush : selectedAsset.price) : 0;

  const toggleFmt = (f: string) => setForm(prev => ({
    ...prev,
    formats: prev.formats.includes(f) ? prev.formats.filter(x => x !== f) : [...prev.formats, f]
  }));

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      go("dashboard");
    }, 2000);
  };

  const steps = ["Select", "Describe", "Configure", "Review"];

  return (
    <div>
      <Nav showAuth />
      <div className="container-sm" style={{ padding: "48px 24px 96px" }}>
        {/* Back */}
        <button onClick={() => step > 0 ? setStep(step - 1) : go("dashboard")}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-body)", marginBottom: 40 }}>
          {Icons.arrowLeft} {step > 0 ? "Previous step" : "Back to dashboard"}
        </button>

        {/* Progress */}
        <div className="animate-fade-up" style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? "var(--accent-copper)" : "var(--border-subtle)", transition: "all 0.5s var(--ease-out-expo)" }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {steps.map((s, i) => (
              <span key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: i <= step ? "var(--accent-copper)" : "var(--text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", transition: "color 0.3s" }}>{s}</span>
            ))}
          </div>
        </div>

        {/* STEP 0: Asset Type */}
        {step === 0 && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>What are you building?</h2>
            <p style={{ fontSize: 14, color: "var(--text-tertiary)", marginBottom: 32 }}>Choose the asset type that matches your need.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ASSET_TYPES.map((type) => (
                <button key={type.value}
                  onClick={() => { setForm(f => ({ ...f, assetType: type.value })); setStep(1); }}
                  className="card card-interactive"
                  style={{
                    padding: "20px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: 20, textAlign: "left", width: "100%",
                    borderColor: form.assetType === type.value ? "rgba(212,132,90,0.5)" : undefined,
                    background: form.assetType === type.value ? "rgba(212,132,90,0.03)" : undefined,
                  }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-copper)", flexShrink: 0, transition: "all 0.3s" }}>
                    {type.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600 }}>{type.label}</span>
                      {type.tag && <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent-copper)", background: "rgba(212,132,90,0.1)", padding: "2px 7px", borderRadius: 4, letterSpacing: "0.06em" }}>{type.tag}</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 3, lineHeight: 1.5 }}>{type.desc}</div>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 500, color: "var(--text-secondary)", flexShrink: 0 }}>${type.price}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: Description */}
        {step === 1 && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Describe your asset</h2>
            <p style={{ fontSize: 14, color: "var(--text-tertiary)", marginBottom: 32 }}>Be specific — dimensions, materials, colors, style. The more detail, the better the result.</p>
            <textarea className="input-forge" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder={"Example: A matte black ceramic coffee mug, 90mm tall, 80mm diameter,\nwith a rounded handle. Minimal aesthetic. Soft morning light\non a marble surface."}
              style={{ minHeight: 180, fontSize: 15, lineHeight: 1.7 }} />

            <div style={{ marginTop: 32 }}>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "block" }}>Dimensions (optional)</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {(["w", "h", "d"] as const).map(dim => (
                  <input key={dim} className="input-forge" type="number"
                    value={form[dim]} onChange={e => setForm(f => ({ ...f, [dim]: e.target.value }))}
                    placeholder={dim.toUpperCase()} style={{ width: 80, textAlign: "center" }} />
                ))}
                <span style={{ color: "var(--text-tertiary)", fontSize: 13 }}>×</span>
                <select className="input-forge" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  style={{ width: 80, textAlign: "center", appearance: "none", cursor: "pointer" }}>
                  <option value="mm">mm</option>
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
              <button onClick={() => setStep(0)} className="btn-ghost btn-sm">Back</button>
              <button onClick={() => setStep(2)} className="btn-forge" style={{ flex: 1, justifyContent: "center" }}
                disabled={!form.description.trim()}>
                Continue {Icons.arrow}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Formats + Priority */}
        {step === 2 && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Configure output</h2>
            <p style={{ fontSize: 14, color: "var(--text-tertiary)", marginBottom: 32 }}>Select your delivery formats and priority.</p>

            {/* Formats grouped */}
            <div style={{ marginBottom: 32 }}>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14, display: "block" }}>Output Formats</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {OUTPUT_FORMATS.map(fmt => {
                  const active = form.formats.includes(fmt.value);
                  return (
                    <button key={fmt.value} onClick={() => toggleFmt(fmt.value)}
                      style={{
                        padding: "10px 18px", borderRadius: 10, border: `1px solid ${active ? "rgba(212,132,90,0.5)" : "var(--border-subtle)"}`,
                        background: active ? "rgba(212,132,90,0.08)" : "var(--bg-surface)",
                        color: active ? "var(--accent-copper)" : "var(--text-tertiary)",
                        fontFamily: "var(--font-mono)", fontSize: 13, cursor: "pointer",
                        transition: "all 0.2s var(--ease-out-expo)", display: "flex", alignItems: "center", gap: 8,
                      }}>
                      {active && Icons.check}
                      <span>{fmt.label}</span>
                      <span style={{ fontSize: 9, opacity: 0.5, letterSpacing: "0.06em" }}>{fmt.group}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority */}
            <div style={{ marginBottom: 32 }}>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14, display: "block" }}>Priority</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { value: "standard", label: "Standard", desc: "Same-day delivery", icon: Icons.clock },
                  { value: "rush", label: "Rush", desc: "Priority queue (+75%)", icon: Icons.zap },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setForm(f => ({ ...f, priority: opt.value as any }))}
                    className="card" style={{
                      padding: "20px", cursor: "pointer", textAlign: "center",
                      borderColor: form.priority === opt.value ? (opt.value === "rush" ? "rgba(212,162,85,0.5)" : "rgba(212,132,90,0.5)") : undefined,
                      background: form.priority === opt.value ? "rgba(212,132,90,0.03)" : undefined,
                      transition: "all 0.3s var(--ease-out-expo)",
                    }}>
                    <div style={{ color: form.priority === opt.value ? "var(--accent-copper)" : "var(--text-tertiary)", marginBottom: 8, display: "flex", justifyContent: "center" }}>{opt.icon}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 32 }}>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "block" }}>Notes (optional)</label>
              <textarea className="input-forge" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional context, reference links, or special requirements..."
                style={{ minHeight: 80 }} />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(1)} className="btn-ghost btn-sm">Back</button>
              <button onClick={() => setStep(3)} className="btn-forge" style={{ flex: 1, justifyContent: "center" }}
                disabled={form.formats.length === 0}>
                Review Order {Icons.arrow}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Review & confirm</h2>
            <p style={{ fontSize: 14, color: "var(--text-tertiary)", marginBottom: 32 }}>Double-check your order before we start forging.</p>

            <div className="card" style={{ padding: 32, marginBottom: 24 }}>
              {/* Summary rows */}
              {[
                { label: "Asset Type", value: selectedAsset?.label || "" },
                { label: "Formats", value: form.formats.map(f => f.toUpperCase()).join(", ") },
                { label: "Priority", value: form.priority === "rush" ? "⚡ Rush" : "Standard" },
                ...(form.w ? [{ label: "Dimensions", value: `${form.w} × ${form.h} × ${form.d} ${form.unit}` }] : []),
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderBottom: i < 3 ? "1px solid var(--border-subtle)" : "none" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}

              <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: "var(--bg-elevated)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Description</span>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{form.description}</p>
              </div>
              {form.notes && (
                <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: "var(--bg-elevated)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Notes</span>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{form.notes}</p>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="card" style={{ padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, animation: "borderGlow 3s ease-in-out infinite", borderColor: "rgba(212,132,90,0.2)" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600 }}>Total</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, background: "var(--gradient-forge)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                ${price}
              </span>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(2)} className="btn-ghost btn-sm">Back</button>
              <button onClick={handleSubmit} className="btn-forge" disabled={submitting}
                style={{ flex: 1, justifyContent: "center", fontSize: 16, padding: "16px 28px", animation: submitting ? "pulseGlow 1.5s ease-in-out infinite" : undefined }}>
                {submitting ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 16, height: 16, border: "2px solid rgba(10,10,10,0.3)", borderTopColor: "var(--text-inverse)", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
                    Forging...
                  </span>
                ) : (
                  <>Proceed to Payment {Icons.arrow}</>
                )}
              </button>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ORDER DETAIL ───────────────────────────────────────────
function OrderDetail({ orderId }: { orderId: string | null }) {
  const { go } = useRoute();
  const order = DEMO_ORDERS.find(o => o.id === orderId);

  if (!order) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <p style={{ color: "var(--text-tertiary)" }}>Order not found.</p>
      <button onClick={() => go("dashboard")} className="btn-forge btn-sm">Back to Dashboard</button>
    </div>
  );

  const stages = [
    { key: "paid", label: "Payment", desc: "Payment confirmed" },
    { key: "queued", label: "Queued", desc: "Waiting in forge queue" },
    { key: "processing", label: "Scripting", desc: "AI generating Blender code" },
    { key: "rendering", label: "Rendering", desc: "Cycles engine active" },
    { key: "completed", label: "Delivered", desc: "Assets ready for download" },
  ];

  const statusOrder = ["paid", "queued", "processing", "rendering", "completed"];
  const currentIdx = Math.max(statusOrder.indexOf(order.status), 0);

  return (
    <div>
      <Nav showAuth />
      <div className="container-sm" style={{ padding: "48px 24px 96px" }}>
        <button onClick={() => go("dashboard")}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-body)", marginBottom: 40 }}>
          {Icons.arrowLeft} All Orders
        </button>

        {/* Header */}
        <div className="animate-fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, textTransform: "capitalize" }}>
                {order.assetType.replace(/_/g, " ")}
              </h1>
              {order.priority === "rush" && <span className="chip chip-warning">{Icons.zap} Rush</span>}
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-tertiary)" }}>
              {order.id} · {new Date(order.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, background: "var(--gradient-forge)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ${order.priceUsd}
          </div>
        </div>

        {/* Progress Pipeline */}
        <div className="card animate-fade-up delay-1" style={{ padding: 32, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
            {/* Connection line */}
            <div style={{ position: "absolute", top: 16, left: 24, right: 24, height: 2, background: "var(--border-subtle)", zIndex: 0 }} />
            <div style={{ position: "absolute", top: 16, left: 24, height: 2, background: "var(--gradient-forge)", zIndex: 1, width: `${Math.min((currentIdx / (stages.length - 1)) * 100, 100)}%`, transition: "width 1s var(--ease-out-expo)" }} />

            {stages.map((stage, i) => {
              const isComplete = i <= currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={stage.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 2, flex: 1 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: isComplete ? "var(--gradient-forge)" : "var(--bg-elevated)",
                    border: `2px solid ${isComplete ? "transparent" : "var(--border-default)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: isComplete ? "var(--text-inverse)" : "var(--text-tertiary)",
                    transition: "all 0.5s var(--ease-out-expo)",
                    animation: isCurrent && order.status !== "completed" ? "pulseGlow 2s ease-in-out infinite" : undefined,
                    boxShadow: isCurrent && order.status !== "completed" ? "0 0 20px rgba(212,132,90,0.3)" : undefined,
                  }}>
                    {isComplete && i < currentIdx ? Icons.check : (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500 }}>{i + 1}</span>
                    )}
                  </div>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: isComplete ? 600 : 400, color: isComplete ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                    {stage.label}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", textAlign: "center", maxWidth: 100 }}>
                    {stage.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div className="card animate-fade-up delay-2" style={{ padding: 28, marginBottom: 24 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 12 }}>Description</span>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.8 }}>{order.description}</p>
        </div>

        {/* Delivered Assets */}
        {order.assets.length > 0 && (
          <div className="animate-fade-up delay-3">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--success)" }}>{Icons.check}</span> Delivered Assets
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {order.assets.map((asset, i) => (
                <div key={asset.id} className="card" style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent-copper)", fontWeight: 500, textTransform: "uppercase" }}>{asset.format}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{asset.filename}</div>
                    </div>
                  </div>
                  <button className="btn-forge btn-sm" style={{ gap: 6 }}>{Icons.download} Download</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revision CTA for completed orders */}
        {order.status === "completed" && (
          <div className="animate-fade-up delay-4" style={{ marginTop: 32, textAlign: "center" }}>
            <button className="btn-ghost" style={{ gap: 8 }}>
              Request Revision {Icons.arrow}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

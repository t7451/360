import { Link } from 'react-router-dom';

const inkVaultUrl = import.meta.env.VITE_INKVAULT_URL ?? 'https://inkvault.app';

const FEATURES = [
  {
    icon: '⚡',
    title: 'AI-Generated Scripts',
    desc: 'Describe your 3D asset, Claude writes the Blender script. No 3D skills needed.',
  },
  {
    icon: '🎨',
    title: 'Blender-Grade Output',
    desc: 'Production-ready renders with Cycles/EEVEE. EXR, STL, 3MF, GLTF output. Industry-standard quality.',
  },
  {
    icon: '🚀',
    title: 'Fast Turnaround',
    desc: 'Most orders render in under 2 hours. Priority queue for retainer clients.',
  },
];

const STEPS = [
  { n: '01', label: 'Describe your asset', detail: 'Submit a text prompt — dimensions, material, style, purpose.' },
  { n: '02', label: 'AI generates the script', detail: 'Claude writes a Blender Python script tailored to your spec.' },
  { n: '03', label: 'Render completes', detail: 'Our pipeline executes and renders the scene automatically.' },
  { n: '04', label: 'Download production files', detail: 'EXR, PNG, STL, 3MF, or GLTF — ready to use immediately.' },
];

const PRICING = [
  {
    tier: 'STARTER',
    price: '$49',
    unit: '/asset',
    highlight: false,
    features: ['Single renders', 'Basic formats (PNG, STL)', 'Standard queue', 'Email delivery'],
    cta: 'Order Now',
    ctaTo: '/login',
  },
  {
    tier: 'PRO',
    price: '$149',
    unit: '/asset',
    highlight: true,
    features: ['Priority queue', 'All formats (EXR, GLTF, 3MF)', 'Revision rounds', 'Dashboard access'],
    cta: 'Order Now',
    ctaTo: '/login',
  },
  {
    tier: 'STUDIO',
    price: 'Custom',
    unit: '',
    highlight: false,
    features: ['Dedicated artist', 'White-label delivery', 'API access', 'SLA guaranteed'],
    cta: 'Contact Us',
    ctaTo: '/login',
  },
];

export function Landing() {
  return (
    <>
      <style>{`
        @keyframes gridPulse {
          0%, 100% { opacity: 0.06; }
          50% { opacity: 0.12; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-grid {
          background-image:
            linear-gradient(to right, #10b981 1px, transparent 1px),
            linear-gradient(to bottom, #10b981 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridPulse 4s ease-in-out infinite;
        }
        .fade-up { animation: fadeUp 0.8s ease both; }
        .fade-up-1 { animation: fadeUp 0.8s 0.15s ease both; }
        .fade-up-2 { animation: fadeUp 0.8s 0.3s ease both; }
        .fade-up-3 { animation: fadeUp 0.8s 0.45s ease both; }
        .hero-glow {
          text-shadow: 0 0 40px rgba(52,211,153,0.35), 0 0 80px rgba(52,211,153,0.15);
        }
        .inkvault-border {
          background: linear-gradient(#18181b, #18181b) padding-box,
                      linear-gradient(135deg, #a855f7, #7c3aed, #4f46e5) border-box;
          border: 2px solid transparent;
        }
      `}</style>

      <div className="min-h-screen bg-zinc-950 text-white">

        {/* ── Nav ── */}
        <nav className="fixed inset-x-0 top-0 z-50 border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur-sm px-6 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="text-xl font-bold tracking-tight">
              <span className="text-emerald-400">FORGE</span>3D
            </div>
            <div className="flex items-center gap-3">
              <a href="#features" className="hidden sm:block text-sm text-zinc-400 hover:text-white transition">Features</a>
              <a href="#pricing" className="hidden sm:block text-sm text-zinc-400 hover:text-white transition">Pricing</a>
              <Link to="/login" className="text-sm text-zinc-400 hover:text-white transition">Log in</Link>
              <Link
                to="/login"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-20 text-center">
          {/* animated grid */}
          <div className="hero-grid pointer-events-none absolute inset-0" />
          {/* radial fade-out mask */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,transparent_30%,#09090b_100%)]" />

          <div className="relative z-10 max-w-3xl">
            <div className="fade-up mb-5 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-emerald-400 uppercase">
              AI-Powered 3D Asset Production
            </div>
            <h1 className="fade-up-1 text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              FORGE3D<br />
              <span className="text-emerald-400 hero-glow">STUDIO</span>
            </h1>
            <p className="fade-up-2 mx-auto mt-6 max-w-xl text-lg text-zinc-400">
              Describe your asset. We generate the Blender script with AI,
              render it, and deliver production-ready files — in hours, not days.
            </p>
            <div className="fade-up-3 mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/login"
                className="rounded-xl bg-emerald-600 px-8 py-3.5 font-semibold hover:bg-emerald-500 transition shadow-lg shadow-emerald-900/40"
              >
                Get Started Free
              </Link>
              <a
                href="#how-it-works"
                className="rounded-xl border border-zinc-700 px-8 py-3.5 font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white transition"
              >
                View Samples →
              </a>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="mb-3 text-center text-3xl font-bold">Everything you need</h2>
          <p className="mb-12 text-center text-zinc-500">From prompt to production file, automated end-to-end.</p>
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-7 hover:border-emerald-800 transition">
                <div className="mb-4 text-3xl">{f.icon}</div>
                <h3 className="mb-2 font-semibold text-lg">{f.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="bg-zinc-900/40 px-6 py-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-3 text-center text-3xl font-bold">How It Works</h2>
            <p className="mb-14 text-center text-zinc-500">Four steps from idea to deliverable.</p>
            <ol className="space-y-8">
              {STEPS.map((s) => (
                <li key={s.n} className="flex items-start gap-6">
                  <span className="shrink-0 rounded-xl bg-emerald-600/15 border border-emerald-600/30 px-3 py-1.5 font-mono text-sm font-bold text-emerald-400">
                    {s.n}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{s.label}</p>
                    <p className="mt-1 text-sm text-zinc-500">{s.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="mb-3 text-center text-3xl font-bold">Simple Pricing</h2>
          <p className="mb-12 text-center text-zinc-500">No subscriptions. Pay per asset or go custom.</p>
          <div className="grid gap-6 md:grid-cols-3">
            {PRICING.map((p) => (
              <div
                key={p.tier}
                className={`relative rounded-2xl border p-8 flex flex-col ${
                  p.highlight
                    ? 'border-emerald-500 bg-emerald-950/30 shadow-xl shadow-emerald-900/20'
                    : 'border-zinc-800 bg-zinc-900'
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-semibold tracking-wide">
                    MOST POPULAR
                  </span>
                )}
                <div className="mb-1 text-xs font-bold tracking-widest text-zinc-500 uppercase">{p.tier}</div>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">{p.price}</span>
                  {p.unit && <span className="mb-1 text-sm text-zinc-500">{p.unit}</span>}
                </div>
                <ul className="my-6 flex-1 space-y-2.5">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-zinc-400">
                      <span className="text-emerald-500">✓</span> {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  to={p.ctaTo}
                  className={`mt-auto block rounded-xl py-3 text-center font-semibold transition ${
                    p.highlight
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── InkVault Cross-Promo ── */}
        <section className="px-6 py-12">
          <div className="mx-auto max-w-3xl">
            <div className="inkvault-border rounded-2xl bg-zinc-900 p-8 text-center">
              <p className="mb-2 text-2xl">🎨</p>
              <h3 className="text-xl font-bold">
                Also check out{' '}
                <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                  InkVault
                </span>
                {' '}— AI Tattoo Design Studio
              </h3>
              <p className="mt-3 text-sm text-zinc-400">
                Browse 133+ flash designs, AR body preview, custom AI linework
              </p>
              <a
                href={inkVaultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block rounded-xl border border-purple-500/40 bg-purple-600/10 px-6 py-2.5 text-sm font-semibold text-purple-300 hover:bg-purple-600/20 hover:border-purple-400 transition"
              >
                Explore InkVault →
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-zinc-900 px-6 py-12">
          <div className="mx-auto max-w-5xl flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div className="text-center md:text-left">
              <div className="text-lg font-bold">
                <span className="text-emerald-400">FORGE</span>3D
              </div>
              <p className="mt-1 text-xs text-zinc-600">AI-Powered 3D Asset Production</p>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
              <Link to="/dashboard" className="hover:text-zinc-300 transition">Dashboard</Link>
              <Link to="/orders/new" className="hover:text-zinc-300 transition">New Order</Link>
              <a href={inkVaultUrl} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition">InkVault</a>
            </nav>
            <p className="text-xs text-zinc-700">© 2025 PNW Solutions</p>
          </div>
        </footer>

      </div>
    </>
  );
}

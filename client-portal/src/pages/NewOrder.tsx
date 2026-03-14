import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Box, Upload, Zap, ArrowLeft } from 'lucide-react';

const ASSET_TYPES = [
  { value: 'product_render', label: 'Product Render', desc: 'Photorealistic 3D product mockup', price: '$100', icon: '📸' },
  { value: 'custom_stl', label: 'Custom 3D Print File', desc: 'STL/3MF file ready for 3D printing', price: '$50', icon: '🖨️' },
  { value: 'prototype_step', label: 'Rapid Prototype', desc: 'STEP file for manufacturing', price: '$150', icon: '⚙️' },
  { value: 'glass_digitize', label: 'Glass Art Digitization', desc: '3D replication of glass artwork', price: '$100', icon: '🔮' },
  { value: 'scene_render', label: 'Scene Render', desc: 'Custom 3D scene or environment', price: '$125', icon: '🌄' },
] as const;

const OUTPUT_FORMATS = [
  { value: 'png', label: 'PNG (Image)' },
  { value: 'jpg', label: 'JPG (Image)' },
  { value: 'stl', label: 'STL (3D Print)' },
  { value: '3mf', label: '3MF (3D Print)' },
  { value: 'step', label: 'STEP (CAD)' },
  { value: 'obj', label: 'OBJ (3D Model)' },
  { value: 'fbx', label: 'FBX (3D Model)' },
  { value: 'glb', label: 'GLB (Web 3D)' },
] as const;

export function NewOrder() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    assetType: '' as string,
    description: '',
    outputFormats: [] as string[],
    priority: 'standard' as 'standard' | 'rush',
    notes: '',
    width: '',
    height: '',
    depth: '',
    unit: 'mm' as 'mm' | 'cm' | 'in',
  });

  const toggleFormat = (fmt: string) => {
    setForm(prev => ({
      ...prev,
      outputFormats: prev.outputFormats.includes(fmt)
        ? prev.outputFormats.filter(f => f !== fmt)
        : [...prev.outputFormats, fmt],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        assetType: form.assetType,
        description: form.description,
        outputFormats: form.outputFormats,
        priority: form.priority,
        notes: form.notes,
      };

      if (form.width && form.height && form.depth) {
        body.dimensions = {
          width: parseFloat(form.width),
          height: parseFloat(form.height),
          depth: parseFloat(form.depth),
          unit: form.unit,
        };
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success && data.data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.data.checkoutUrl;
      } else {
        alert(data.error || 'Failed to create order');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-8 flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">New Order</h1>
          <p className="mt-2 text-zinc-400">Describe what you need — our AI builds it in minutes.</p>
        </div>

        {/* Progress */}
        <div className="mb-10 flex gap-2">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition ${s <= step ? 'bg-emerald-500' : 'bg-zinc-800'}`}
            />
          ))}
        </div>

        {/* Step 1: Asset Type */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">What do you need?</h2>
            <div className="grid gap-3">
              {ASSET_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => { setForm(f => ({ ...f, assetType: type.value })); setStep(2); }}
                  className={`flex items-center gap-4 rounded-xl border p-4 text-left transition hover:border-emerald-500/50 hover:bg-zinc-900 ${
                    form.assetType === type.value ? 'border-emerald-500 bg-zinc-900' : 'border-zinc-800'
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-zinc-500">{type.desc}</div>
                  </div>
                  <div className="text-emerald-400 font-mono text-sm">from {type.price}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Description & Formats */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Describe your asset</h2>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">Description *</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={5}
                placeholder="Be specific — dimensions, materials, colors, style. The more detail, the better the result.&#10;&#10;Example: A matte black ceramic coffee mug, 90mm tall, 80mm diameter, with a rounded handle. Minimal, modern aesthetic. Show it on a light marble surface with soft morning light."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">Output Formats *</label>
              <div className="flex flex-wrap gap-2">
                {OUTPUT_FORMATS.map(fmt => (
                  <button
                    key={fmt.value}
                    onClick={() => toggleFormat(fmt.value)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                      form.outputFormats.includes(fmt.value)
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">Dimensions (optional)</label>
              <div className="flex gap-2">
                <input type="number" placeholder="W" value={form.width} onChange={e => setForm(f => ({ ...f, width: e.target.value }))} className="w-20 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-center text-white focus:border-emerald-500 focus:outline-none" />
                <input type="number" placeholder="H" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} className="w-20 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-center text-white focus:border-emerald-500 focus:outline-none" />
                <input type="number" placeholder="D" value={form.depth} onChange={e => setForm(f => ({ ...f, depth: e.target.value }))} className="w-20 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-center text-white focus:border-emerald-500 focus:outline-none" />
                <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value as any }))} className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-white">
                  <option value="mm">mm</option>
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setStep(1)} className="rounded-lg border border-zinc-800 px-6 py-2.5 text-sm text-zinc-400 hover:text-white transition">Back</button>
              <button
                onClick={() => setStep(3)}
                disabled={!form.description || form.outputFormats.length === 0}
                className="flex-1 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Pay */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Review & Pay</h2>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-zinc-400">Asset Type</span>
                <span>{ASSET_TYPES.find(t => t.value === form.assetType)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Formats</span>
                <span>{form.outputFormats.join(', ').toUpperCase()}</span>
              </div>
              <div>
                <span className="text-zinc-400 text-sm">Description</span>
                <p className="mt-1 text-sm text-zinc-300">{form.description}</p>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <label className="mb-3 block text-sm text-zinc-400">Priority</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setForm(f => ({ ...f, priority: 'standard' }))}
                    className={`flex-1 rounded-lg border p-3 text-center text-sm transition ${form.priority === 'standard' ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800'}`}
                  >
                    <Box size={18} className="mx-auto mb-1" />
                    Standard
                  </button>
                  <button
                    onClick={() => setForm(f => ({ ...f, priority: 'rush' }))}
                    className={`flex-1 rounded-lg border p-3 text-center text-sm transition ${form.priority === 'rush' ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-800'}`}
                  >
                    <Zap size={18} className="mx-auto mb-1" />
                    Rush (+75%)
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">Additional notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Any extra details for the artist..."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)} className="rounded-lg border border-zinc-800 px-6 py-2.5 text-sm text-zinc-400 hover:text-white transition">Back</button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium hover:bg-emerald-500 disabled:opacity-60 transition"
              >
                {loading ? 'Creating order...' : 'Proceed to Payment →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

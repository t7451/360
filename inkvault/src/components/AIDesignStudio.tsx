import { useState } from 'react';
import { X, Sparkles, Loader2, Clock, BookMarked, Camera } from 'lucide-react';

// ─────────────────────────────────────────────
// AI DESIGN STUDIO
// ─────────────────────────────────────────────

export interface AIDesignStudioProps {
  onClose: () => void;
  onOpenAR?: () => void;
  onSaveToVault?: (designTag: string) => void;
}

interface GenerateRequest {
  style: string;
  placement: string;
  description: string;
  size: string;
  colors?: string[];
}

interface GenerateResponse {
  prompt: string;
  svgDescription: string;
  colorPalette: string[];
  styleNotes: string;
  placementTips: string;
  lineweightGuide: string;
  estimatedTime: string;
  designElements: string[];
}

const STYLES = [
  'Japanese Traditional', 'American Traditional', 'Blackwork', 'Geometric',
  'Watercolor', 'Realism', 'Neo-Traditional', 'Tribal', 'Dotwork',
  'Fine Line', 'Illustrative', 'Surrealism',
];

const PLACEMENTS = [
  'Forearm', 'Upper Arm', 'Bicep', 'Shoulder', 'Back', 'Chest',
  'Calf', 'Thigh', 'Ankle', 'Wrist', 'Neck', 'Ribcage', 'Hand', 'Foot',
];

const SIZES = [
  { label: 'Tiny', sub: '1in', value: 'Tiny (1in)' },
  { label: 'Small', sub: '2–3in', value: 'Small (2-3in)' },
  { label: 'Medium', sub: '4–6in', value: 'Medium (4-6in)' },
  { label: 'Large', sub: '7–10in', value: 'Large (7-10in)' },
  { label: 'XL', sub: '11in+', value: 'Extra Large (11in+)' },
  { label: 'Sleeve', sub: 'Full', value: 'Full Sleeve' },
];

const VITE_API_URL = import.meta.env.VITE_API_URL || '';

async function generateDesign(params: GenerateRequest): Promise<GenerateResponse> {
  const res = await fetch(`${VITE_API_URL}/api/inkvault/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Generation failed');
  }
  const data = await res.json();
  return data.data;
}

export function AIDesignStudio({ onClose, onOpenAR, onSaveToVault }: AIDesignStudioProps) {
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedPlacement, setSelectedPlacement] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [saved, setSaved] = useState(false);

  const canGenerate = selectedStyle && selectedPlacement && description.trim().length > 0;

  async function handleGenerate() {
    if (!canGenerate) return;
    setLoading(true);
    setError('');
    setResult(null);
    setSaved(false);
    try {
      const data = await generateDesign({
        style: selectedStyle,
        placement: selectedPlacement,
        description: description.trim(),
        size: selectedSize || 'Medium (4-6in)',
      });
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (result) {
      onSaveToVault?.(`AI: ${selectedStyle} — ${selectedPlacement}`);
      setSaved(true);
    }
  }

  return (
    <div className="studio-overlay" onClick={onClose}>
      <div
        className="studio-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="studio-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} style={{ color: '#D4A017' }} />
              AI DESIGN STUDIO
            </h2>
            <span className="studio-subtitle">Generate custom tattoo guidance with Claude AI</span>
          </div>
          <button className="studio-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ padding: '24px 24px 32px' }}>

          {/* Style selector */}
          <section style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>
              STYLE
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStyle(s)}
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    border: selectedStyle === s ? '2px solid #C41E1E' : '1px solid var(--border)',
                    borderRadius: 4,
                    background: selectedStyle === s ? 'rgba(196,30,30,0.12)' : 'transparent',
                    color: selectedStyle === s ? '#C41E1E' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          {/* Placement selector */}
          <section style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>
              PLACEMENT
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PLACEMENTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPlacement(p)}
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    border: selectedPlacement === p ? '2px solid #D4A017' : '1px solid var(--border)',
                    borderRadius: 4,
                    background: selectedPlacement === p ? 'rgba(212,160,23,0.12)' : 'transparent',
                    color: selectedPlacement === p ? '#D4A017' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </section>

          {/* Description */}
          <section style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>
              DESCRIBE YOUR VISION
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your vision... e.g. 'A koi fish swimming through waves with cherry blossoms'"
              rows={4}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                fontSize: 14,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--text)',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
            />
          </section>

          {/* Size selector */}
          <section style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>
              SIZE
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SIZES.map((sz) => (
                <label
                  key={sz.value}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '10px 16px',
                    border: selectedSize === sz.value ? '2px solid #C41E1E' : '1px solid var(--border)',
                    borderRadius: 6,
                    background: selectedSize === sz.value ? 'rgba(196,30,30,0.08)' : 'transparent',
                    cursor: 'pointer',
                    minWidth: 64,
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="radio"
                    name="size"
                    value={sz.value}
                    checked={selectedSize === sz.value}
                    onChange={() => setSelectedSize(sz.value)}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: selectedSize === sz.value ? '#C41E1E' : 'var(--text)' }}>{sz.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sz.sub}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.1em',
              background: canGenerate && !loading ? '#C41E1E' : 'var(--border)',
              color: canGenerate && !loading ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 6,
              cursor: canGenerate && !loading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.2s',
            }}
          >
            {loading ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> GENERATING...</>
            ) : (
              <><Sparkles size={16} /> GENERATE DESIGN</>
            )}
          </button>

          {/* Error */}
          {error && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(196,30,30,0.1)', border: '1px solid rgba(196,30,30,0.3)', borderRadius: 6, fontSize: 13, color: '#C41E1E' }}>
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={{ marginTop: 28 }}>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 20 }}>
                  ✨ AI DESIGN GUIDANCE
                </h3>

                {/* Design elements */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>DESIGN ELEMENTS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {result.designElements.map((el, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '5px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 20,
                          color: 'var(--text)',
                        }}
                      >
                        {el}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Color palette */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>COLOR PALETTE</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {result.colorPalette.map((color, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: color,
                            border: '2px solid var(--border)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          }}
                          title={color}
                        />
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{color}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Placement tips */}
                <div style={{ marginBottom: 16, padding: '14px 16px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>PLACEMENT TIPS</div>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text)', margin: 0 }}>{result.placementTips}</p>
                </div>

                {/* Style notes */}
                <div style={{ marginBottom: 16, padding: '14px 16px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>STYLE NOTES</div>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text)', margin: 0 }}>{result.styleNotes}</p>
                </div>

                {/* Line weight guide */}
                <div style={{ marginBottom: 16, padding: '14px 16px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>LINE WEIGHT GUIDE</div>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text)', margin: 0 }}>{result.lineweightGuide}</p>
                </div>

                {/* Estimated time badge */}
                <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={14} style={{ color: '#D4A017' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#D4A017', letterSpacing: '0.06em' }}>EST. TIME:</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{result.estimatedTime}</span>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={handleSave}
                    disabled={saved}
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      background: saved ? 'rgba(196,30,30,0.1)' : 'transparent',
                      color: saved ? '#C41E1E' : 'var(--text)',
                      border: saved ? '2px solid #C41E1E' : '1px solid var(--border)',
                      borderRadius: 6,
                      cursor: saved ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <BookMarked size={14} />
                    {saved ? 'SAVED TO VAULT' : 'SAVE TO VAULT'}
                  </button>
                  <button
                    onClick={onOpenAR}
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      background: 'transparent',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Camera size={14} />
                    TRY IN AR
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

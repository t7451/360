import { useState, useEffect, useCallback } from 'react';
import {
  X, Eye, PenTool, Palette, Ruler, Download, Printer, Check,
  Heart, Search, Star, Calendar, Sparkles, Flame, TrendingUp, Clock,
  Mail, Phone, Instagram, Pin, Camera, LayoutGrid, MapPin, Users, BookMarked
} from 'lucide-react';
import './App.css';

import type { Design, Artist, TabType, StudioTabType, CollectionViewType } from './types';
import { DESIGNS, ARTISTS, TESTIMONIALS, COLLECTIONS, STYLES, PLACEMENTS } from './data';
import { useFavorites, useFilter } from './hooks';
import { PinterestProfile, PinterestGrid, ARPreview } from './components';
import { AIDesignStudio } from './components/AIDesignStudio';
import { DrawingCanvas } from './components/DrawingCanvas';

// ─────────────────────────────────────────────
// INKVAULT FLASH LIBRARY v3.0
// Comprehensive Rebuild
// ─────────────────────────────────────────────

const FORGE3D_URL = import.meta.env.VITE_FORGE3D_URL || 'https://forge3d.netlify.app';

function bookDesign(design: Design) {
  const params = new URLSearchParams({
    design_title: design.title,
    design_style: design.style,
    design_placement: design.placement || '',
    design_image: design.image,
    design_id: String(design.id),
    source: 'inkvault',
  });
  window.open(`${FORGE3D_URL}/orders/new?${params.toString()}`, '_blank');
}

// ── Components ──────────────────────────────

// Design Studio Modal
function DesignStudio({ design, isOpen, onClose, onBookDesign }: { design: Design; isOpen: boolean; onClose: () => void; onBookDesign: (d: Design) => void }) {
  const [activeTab, setActiveTab] = useState<StudioTabType>('preview');
  const [stencilSettings, setStencilSettings] = useState({ lineThickness: 2, contrast: 100, invertColors: false, edgeEnhance: false, paperSize: 'letter' });
  const [customSettings, setCustomSettings] = useState({ customText: '', textPosition: 'top', primaryColor: design.colors[0] || '#C41E1E', secondaryColor: design.colors[1] || '#1a1a1a', rotation: 0, mirrorHorizontal: false, mirrorVertical: false });
  const [measureSettings, setMeasureSettings] = useState({ showGrid: true, gridSize: 1, actualWidth: 4, actualHeight: 5 });

  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);
  if (!isOpen) return null;

  const artist = ARTISTS.find(a => a.id === design.artistId);

  return (
    <div className="studio-overlay" onClick={onClose}>
      <div className="studio-modal" onClick={(e) => e.stopPropagation()}>
        <div className="studio-header">
          <div><h2>DESIGN STUDIO</h2><span className="studio-subtitle">{design.title} — #{String(design.id).padStart(3, '0')}</span></div>
          <button className="studio-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="studio-tabs">
          {(['preview', 'stencil', 'customize', 'measure', 'draw'] as StudioTabType[]).map((tab) => (
            <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
              {tab === 'preview' && <Eye size={16} />}
              {tab === 'stencil' && <PenTool size={16} />}
              {tab === 'customize' && <Palette size={16} />}
              {tab === 'measure' && <Ruler size={16} />}
              {tab === 'draw' && <PenTool size={16} />}
              <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            </button>
          ))}
        </div>
        <div className="studio-content">
          {activeTab === 'draw' ? (
            <div className="studio-draw-fullwidth">
              <DrawingCanvas backgroundImage={design.image} width={400} height={500} />
            </div>
          ) : (
          <><div className="studio-canvas">
            <div className="canvas-wrapper">
              <img
                src={design.image}
                alt={design.title}
                className="canvas-image"
                style={{
                  filter: activeTab === 'stencil' ? `contrast(${stencilSettings.contrast}%) grayscale(100%) ${stencilSettings.invertColors ? 'invert(100%)' : ''}` : 'none',
                  transform: `rotate(${customSettings.rotation}deg) ${customSettings.mirrorHorizontal ? 'scaleX(-1)' : ''} ${customSettings.mirrorVertical ? 'scaleY(-1)' : ''}`
                }}
              />
              {activeTab === 'measure' && measureSettings.showGrid && (
                <div className="grid-overlay">
                  <svg width="100%" height="100%" style={{ opacity: 0.3 }}>
                    {Array.from({ length: 20 }).map((_, i) => <line key={`h${i}`} x1="0" y1={i * 20} x2="100%" y2={i * 20} stroke="#C41E1E" strokeWidth="0.5" />)}
                    {Array.from({ length: 20 }).map((_, i) => <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="100%" stroke="#C41E1E" strokeWidth="0.5" />)}
                  </svg>
                </div>
              )}
              {activeTab === 'measure' && (
                <div className="dimension-labels">
                  <span>{measureSettings.actualWidth}" x {measureSettings.actualHeight}"</span>
                  <span>Ratio: {(measureSettings.actualWidth / measureSettings.actualHeight).toFixed(2)}:1</span>
                </div>
              )}
            </div>
          </div>
          <div className="studio-panel">
            {activeTab === 'preview' && (
              <div className="panel-section">
                <h3>Design Info</h3>
                <div className="design-info-card"><img src={design.image} alt={design.title} className="design-preview-thumb" /><div className="design-info-text"><p className="design-name">{design.title}</p><p className="design-meta">{design.style} • {artist?.name}</p></div></div>
                <p className="design-description">{design.description}</p>
                <div className="design-specs"><div className="spec-item"><label>Placement</label><span>{design.placement}</span></div><div className="spec-item"><label>Size</label><span>{design.size}</span></div><div className="spec-item"><label>Price</label><span style={{ color: '#D4A017' }}>${design.price}</span></div></div>
                <div className="color-dots">{design.colors.map((c, i) => <div key={i} className="color-dot" style={{ background: c }} />)}</div>
                <div className="panel-actions"><button className="btn-primary"><Heart size={16} />Save to Vault</button><button className="btn-secondary"><Download size={16} />Download</button><button className="studio-action-btn" onClick={() => onBookDesign(design)}>📅 Book Appointment</button></div>
              </div>
            )}
            {activeTab === 'stencil' && (
              <div className="panel-section">
                <h3>Stencil Settings</h3>
                <div className="control-group"><label>Line Thickness ({stencilSettings.lineThickness}px)</label><input type="range" min="1" max="5" value={stencilSettings.lineThickness} onChange={(e) => setStencilSettings({...stencilSettings, lineThickness: parseInt(e.target.value)})} /></div>
                <div className="control-group"><label>Contrast ({stencilSettings.contrast}%)</label><input type="range" min="50" max="200" value={stencilSettings.contrast} onChange={(e) => setStencilSettings({...stencilSettings, contrast: parseInt(e.target.value)})} /></div>
                <div className="control-group checkbox"><label><input type="checkbox" checked={stencilSettings.invertColors} onChange={(e) => setStencilSettings({...stencilSettings, invertColors: e.target.checked})} />Invert Colors</label></div>
                <div className="control-group checkbox"><label><input type="checkbox" checked={stencilSettings.edgeEnhance} onChange={(e) => setStencilSettings({...stencilSettings, edgeEnhance: e.target.checked})} />Edge Enhance</label></div>
                <div className="control-group"><label>Paper Size</label><select value={stencilSettings.paperSize} onChange={(e) => setStencilSettings({...stencilSettings, paperSize: e.target.value})}><option value="letter">Letter (8.5&quot; x 11&quot;)</option><option value="a4">A4 (210mm x 297mm)</option><option value="legal">Legal (8.5&quot; x 14&quot;)</option></select></div>
                <div className="panel-actions"><button className="btn-primary"><Check size={16} />Apply Effect</button><button className="btn-secondary"><Download size={16} />Download PNG</button><button className="btn-secondary"><Printer size={16} />Print Stencil</button></div>
              </div>
            )}
            {activeTab === 'customize' && (
              <div className="panel-section">
                <h3>Customize Design</h3>
                <div className="control-group"><label>Custom Text</label><input type="text" placeholder="Enter text..." value={customSettings.customText} onChange={(e) => setCustomSettings({...customSettings, customText: e.target.value})} /></div>
                <div className="control-group"><label>Text Position</label><select value={customSettings.textPosition} onChange={(e) => setCustomSettings({...customSettings, textPosition: e.target.value})}><option value="top">Top Banner</option><option value="bottom">Bottom Banner</option><option value="none">No Text</option></select></div>
                <div className="control-group color-row"><div><label>Primary</label><input type="color" value={customSettings.primaryColor} onChange={(e) => setCustomSettings({...customSettings, primaryColor: e.target.value})} /></div><div><label>Secondary</label><input type="color" value={customSettings.secondaryColor} onChange={(e) => setCustomSettings({...customSettings, secondaryColor: e.target.value})} /></div></div>
                <div className="control-group"><label>Rotation ({customSettings.rotation}°)</label><input type="range" min="-180" max="180" value={customSettings.rotation} onChange={(e) => setCustomSettings({...customSettings, rotation: parseInt(e.target.value)})} /></div>
                <div className="control-group checkbox"><label><input type="checkbox" checked={customSettings.mirrorHorizontal} onChange={(e) => setCustomSettings({...customSettings, mirrorHorizontal: e.target.checked})} />Mirror (Horizontal Flip)</label></div>
                <div className="control-group checkbox"><label><input type="checkbox" checked={customSettings.mirrorVertical} onChange={(e) => setCustomSettings({...customSettings, mirrorVertical: e.target.checked})} />Flip (Vertical)</label></div>
              </div>
            )}
            {activeTab === 'measure' && (
              <div className="panel-section">
                <h3>Measurement Tools</h3>
                <div className="control-group checkbox"><label><input type="checkbox" checked={measureSettings.showGrid} onChange={(e) => setMeasureSettings({...measureSettings, showGrid: e.target.checked})} />Show Grid</label></div>
                <div className="control-group"><label>Grid Size ({measureSettings.gridSize}&quot;)</label><input type="range" min="0.5" max="2" step="0.5" value={measureSettings.gridSize} onChange={(e) => setMeasureSettings({...measureSettings, gridSize: parseFloat(e.target.value)})} /></div>
                <div className="control-group"><label>Actual Width ({measureSettings.actualWidth}&quot;)</label><input type="number" min="1" max="20" value={measureSettings.actualWidth} onChange={(e) => setMeasureSettings({...measureSettings, actualWidth: parseFloat(e.target.value) || 1})} /></div>
                <div className="control-group"><label>Actual Height ({measureSettings.actualHeight}&quot;)</label><input type="number" min="1" max="20" value={measureSettings.actualHeight} onChange={(e) => setMeasureSettings({...measureSettings, actualHeight: parseFloat(e.target.value) || 1})} /></div>
                <div className="measure-stats"><div className="measure-stat"><label>Aspect Ratio</label><span>{(measureSettings.actualWidth / measureSettings.actualHeight).toFixed(2)}:1</span></div><div className="measure-stat"><label>Area</label><span>{(measureSettings.actualWidth * measureSettings.actualHeight).toFixed(2)} sq in</span></div><div className="measure-stat"><label>Est. Time</label><span>{Math.round(measureSettings.actualWidth * measureSettings.actualHeight * 0.5)} hrs</span></div></div>
              </div>
            )}
          </div></>
          )}
        </div>
      </div>
    </div>
  );
}

// Booking Modal
function BookingModal({ artist, design, isOpen, onClose }: { artist: Artist | null; design: Design | null; isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', date: '', notes: '' });

  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);
  useEffect(() => { if (isOpen) setStep(1); }, [isOpen]);
  if (!isOpen || !artist) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        {step === 1 && (
          <div className="booking-step">
            <h2>BOOK CONSULTATION</h2>
            <div className="booking-artist-info"><div className="booking-artist-avatar">{artist.avatar}</div><div><p className="booking-artist-name">{artist.name}</p><p className="booking-artist-shop">{artist.shop}</p><p className="booking-artist-rate">From ${artist.minRate}/hr</p></div></div>
            {design && <div className="booking-design-preview"><img src={design.image} alt={design.title} /><div><p>{design.title}</p><p>{design.style} — ${design.price}</p></div></div>}
            <div className="booking-form">
              <div className="form-group"><label>Your Name</label><input type="text" placeholder="Enter your name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
              <div className="form-group"><label>Email</label><input type="email" placeholder="your@email.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
              <div className="form-group"><label>Phone</label><input type="tel" placeholder="(555) 000-0000" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="form-group"><label>Preferred Date</label><input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} /></div>
              <div className="form-group"><label>Notes</label><textarea placeholder="Any specific requests or questions..." value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} /></div>
            </div>
            <button className="btn-primary booking-submit" onClick={() => setStep(3)} disabled={!formData.name || !formData.email}>REQUEST BOOKING</button>
          </div>
        )}
        {step === 3 && (
          <div className="booking-step booking-success">
            <div className="success-icon">✓</div>
            <h2>REQUEST SENT!</h2>
            <p>{artist.name} will review your request and get back to you within 48 hours.</p>
            <button className="btn-secondary" onClick={onClose}>CLOSE</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Flash Card
function FlashCard({ design, isFaved, onToggleFav, onSelect, onOpenStudio, onOpenAR, onBookDesign }: { design: Design; isFaved: boolean; onToggleFav: (id: number) => void; onSelect: (d: Design) => void; onOpenStudio: (d: Design) => void; onOpenAR: (d: Design) => void; onBookDesign: (d: Design) => void }) {
  const artist = ARTISTS.find(a => a.id === design.artistId);
  return (
    <div className="flash-card">
      <div className="flash-preview" onClick={() => onSelect(design)}>
        <img src={design.image} alt={design.title} className="flash-image" />
        <div className="flash-overlay" />
        {design.new && <span className="flash-badge new">NEW</span>}
        {design.trending && !design.new && <span className="flash-badge trending">HOT</span>}
        <span className="flash-number">#{String(design.id).padStart(3, '0')}</span>
        <button className={`flash-fav-btn ${isFaved ? 'faved' : ''}`} onClick={(e) => { e.stopPropagation(); onToggleFav(design.id); }}><Heart size={18} fill={isFaved ? "currentColor" : "none"} /></button>
        <button
          className="book-design-btn"
          onClick={(e) => { e.stopPropagation(); onBookDesign(design); }}
        >
          📅 Book
        </button>
      </div>
      <div className="flash-info">
        <div className="flash-style-tag">{design.style}</div>
        <div className="flash-title">{design.title}</div>
        <div className="flash-meta"><span className="flash-artist">{artist?.name}</span><span className="flash-price">${design.price}</span></div>
        <div className="flash-placement-tag">{design.placement} • {design.size}</div>
        <div className="flash-colors">{design.colors.map((c, i) => <div key={i} className="flash-color-dot" style={{ background: c }} />)}</div>
        <button className="studio-btn" onClick={() => onOpenStudio(design)}><PenTool size={14} />Open Studio</button>
        <button className="ar-try-btn" onClick={() => onOpenAR(design)}>📸 Try in AR</button>
      </div>
    </div>
  );
}

// Detail Modal
function DetailModal({ design, onClose, isFaved, onToggleFav, onOpenStudio, onBookArtist }: { design: Design; onClose: () => void; isFaved: boolean; onToggleFav: (id: number) => void; onOpenStudio: (d: Design) => void; onBookArtist: (artist: Artist, design: Design) => void }) {
  const artist = ARTISTS.find(a => a.id === design.artistId);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        <div className="modal-content">
          <div className="modal-art"><img src={design.image} alt={design.title} /></div>
          <div className="modal-details">
            <div className="style-label">{design.style} — #{String(design.id).padStart(3, '0')}</div>
            <h2>{design.title}</h2>
            <p className="description">{design.description}</p>
            <div className="modal-spec"><div className="modal-spec-item"><label>Placement</label><span>{design.placement}</span></div><div className="modal-spec-item"><label>Size</label><span>{design.size}</span></div><div className="modal-spec-item"><label>Starting</label><span style={{ color: '#D4A017' }}>${design.price}</span></div></div>
            {artist && <div className="modal-artist-row"><div className="modal-artist-avatar">{artist.avatar}</div><div><div className="modal-artist-name">{artist.name}</div><div className="modal-artist-shop">{artist.shop} — {artist.city}</div></div></div>}
            <div className="modal-colors">{design.colors.map((c, i) => <div key={i} className="modal-color-dot" style={{ background: c }} />)}</div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => onToggleFav(design.id)}><Heart size={16} fill={isFaved ? "currentColor" : "none"} />{isFaved ? 'SAVED' : 'SAVE TO VAULT'}</button>
              <button className="btn-secondary" onClick={() => { onClose(); onOpenStudio(design); }}><PenTool size={16} />OPEN STUDIO</button>
              {artist?.bookingOpen && <button className="btn-secondary book-btn" onClick={() => { onClose(); onBookArtist(artist, design); }}><Calendar size={16} />BOOK NOW</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hero Section
function HeroSection({ featuredDesigns, onSelect, onOpenStudio }: { featuredDesigns: Design[]; onSelect: (d: Design) => void; onOpenStudio: (d: Design) => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  useEffect(() => { const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % featuredDesigns.length), 5000); return () => clearInterval(timer); }, [featuredDesigns.length]);
  const design = featuredDesigns[currentSlide];
  const artist = ARTISTS.find(a => a.id === design.artistId);

  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-badge"><Sparkles size={14} />PREMIUM FLASH LIBRARY</div>
        <h1>INKVAULT</h1>
        <p className="hero-subtitle">Discover {DESIGNS.length}+ professional tattoo flash designs from PNW's finest artists. Preview, customize, and book your next piece.</p>
        <div className="hero-stats"><div><span>{DESIGNS.length}</span><label>Designs</label></div><div><span>{ARTISTS.length}</span><label>Artists</label></div><div><span>{STYLES.length}</span><label>Styles</label></div></div>
      </div>
      <div className="hero-showcase">
        <div className="hero-slide">
          <img src={design.image} alt={design.title} />
          <div className="hero-slide-info">
            <span className="hero-slide-style">{design.style}</span>
            <h3>{design.title}</h3>
            <p>by {artist?.name}</p>
            <div className="hero-slide-actions"><button onClick={() => onSelect(design)}>VIEW</button><button onClick={() => onOpenStudio(design)}><PenTool size={14} />STUDIO</button></div>
          </div>
        </div>
        <div className="hero-dots">{featuredDesigns.map((_, i) => <button key={i} className={i === currentSlide ? 'active' : ''} onClick={() => setCurrentSlide(i)} />)}</div>
      </div>
    </section>
  );
}

// Collections Section
function CollectionsSection({ onSelectCollection }: { onSelectCollection: (collection: string) => void }) {
  const icons = { new: Sparkles, featured: Flame, trending: TrendingUp, sale: Clock };
  return (
    <section className="collections-section">
      <h2>BROWSE COLLECTIONS</h2>
      <div className="collections-grid">
        {COLLECTIONS.map((col) => {
          const Icon = icons[col.id as keyof typeof icons];
          return (
            <div key={col.id} className="collection-card" onClick={() => onSelectCollection(col.id)}>
              <Icon size={32} />
              <h3>{col.name}</h3>
              <p>{col.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  return (
    <section className="testimonials-section">
      <h2>CLIENT STORIES</h2>
      <div className="testimonials-grid">
        {TESTIMONIALS.map((t) => (
          <div key={t.id} className="testimonial-card">
            <div className="testimonial-stars">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}</div>
            <p className="testimonial-text">"{t.text}"</p>
            <div className="testimonial-author"><span>{t.name}</span><label>got {t.design}</label></div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Body Placement View
function BodyPlacementView({ selectedPlacement, onSelectPlacement }: { selectedPlacement: string | null; onSelectPlacement: (p: string) => void }) {
  const hotspots = [
    { name: "Head/Neck", placement: "Neck", x: "50%", y: "8%", w: 36, h: 36 },
    { name: "L Shoulder", placement: "Shoulder", x: "30%", y: "18%", w: 34, h: 34 },
    { name: "R Shoulder", placement: "Shoulder", x: "70%", y: "18%", w: 34, h: 34 },
    { name: "Chest", placement: "Chest", x: "50%", y: "25%", w: 50, h: 38 },
    { name: "L Arm", placement: "Arm", x: "20%", y: "32%", w: 30, h: 42 },
    { name: "R Arm", placement: "Arm", x: "80%", y: "32%", w: 30, h: 42 },
    { name: "L Forearm", placement: "Forearm", x: "15%", y: "48%", w: 26, h: 38 },
    { name: "R Forearm", placement: "Forearm", x: "85%", y: "48%", w: 26, h: 38 },
    { name: "Ribs", placement: "Ribs", x: "50%", y: "38%", w: 44, h: 30 },
    { name: "Back", placement: "Back", x: "50%", y: "32%", w: 40, h: 36 },
    { name: "L Hand", placement: "Hand", x: "10%", y: "58%", w: 22, h: 22 },
    { name: "R Hand", placement: "Hand", x: "90%", y: "58%", w: 22, h: 22 },
    { name: "L Thigh", placement: "Thigh", x: "38%", y: "60%", w: 30, h: 46 },
    { name: "R Thigh", placement: "Thigh", x: "62%", y: "60%", w: 30, h: 46 },
    { name: "L Calf", placement: "Calf", x: "36%", y: "80%", w: 26, h: 40 },
    { name: "R Calf", placement: "Calf", x: "64%", y: "80%", w: 26, h: 40 },
  ];

  return (
    <div className="body-placement-container">
      <svg viewBox="0 0 200 500" className="body-svg">
        <defs><linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2A2D35"/><stop offset="100%" stopColor="#1A1D23"/></linearGradient></defs>
        <ellipse cx="100" cy="35" rx="22" ry="28" fill="url(#bodyGrad)" stroke="#3A3D45" strokeWidth="1"/>
        <rect x="90" y="60" width="20" height="15" fill="url(#bodyGrad)" stroke="#3A3D45" strokeWidth="1"/>
        <path d="M60 75 Q60 70 70 70 L130 70 Q140 70 140 75 L145 180 Q145 195 130 195 L70 195 Q55 195 55 180 Z" fill="url(#bodyGrad)" stroke="#3A3D45" strokeWidth="1"/>
        <path d="M60 75 L40 130 L30 200 L20 250 Q18 260 25 260 L35 260 Q40 260 40 250 L50 200 L55 130 Z" fill="url(#bodyGrad)" stroke="#3A3D45" strokeWidth="1"/>
        <path d="M140 75 L160 130 L170 200 L180 250 Q182 260 175 260 L165 260 Q160 260 160 250 L150 200 L145 130 Z" fill="url(#bodyGrad)" stroke="#3A3D45" strokeWidth="1"/>
        <path d="M70 195 L65 300 L60 400 L55 460 Q54 475 65 475 L80 475 Q85 475 84 460 L85 400 L90 300 L95 195 Z" fill="url(#bodyGrad)" stroke="#3A3D45" strokeWidth="1"/>
        <path d="M130 195 L135 300 L140 400 L145 460 Q146 475 135 475 L120 475 Q115 475 116 460 L115 400 L110 300 L105 195 Z" fill="url(#bodyGrad)" stroke="#3A3D45" strokeWidth="1"/>
      </svg>
      {hotspots.map((spot, i) => (
        <div key={i} className="body-hotspot" style={{ left: spot.x, top: spot.y, width: spot.w, height: spot.h, transform: 'translate(-50%, -50%)' }} onClick={() => onSelectPlacement(spot.placement)}>
          <div className={`hotspot-ring ${selectedPlacement === spot.placement ? 'active' : ''}`}><span className="hotspot-label">{spot.name}</span></div>
        </div>
      ))}
    </div>
  );
}

// ── Main App ───────────────────────────────
export default function InkVaultApp() {
  const [activeTab, setActiveTab] = useState<TabType>('flash');
  const [collectionView, setCollectionView] = useState<CollectionViewType>('all');
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [studioDesign, setStudioDesign] = useState<Design | null>(null);
  const [bookingArtist, setBookingArtist] = useState<Artist | null>(null);
  const [bookingDesign, setBookingDesign] = useState<Design | null>(null);
  const [bodyPlacement, setBodyPlacement] = useState<string | null>(null);
  const [showAR, setShowAR] = useState(false);
  const [arDesign, setArDesign] = useState<Design | null>(null);
  const [showAIStudio, setShowAIStudio] = useState(false);

  const { favorites, toggleFavorite, isFavorite, count: favCount } = useFavorites();
  const { filters, filteredDesigns, setSearch, setStyle, setPlacement, setCollection } = useFilter(DESIGNS);

  const openStudio = useCallback((design: Design) => setStudioDesign(design), []);
  const closeStudio = useCallback(() => setStudioDesign(null), []);
  const openBooking = useCallback((artist: Artist, design: Design | null = null) => { setBookingArtist(artist); setBookingDesign(design); }, []);
  const closeBooking = useCallback(() => { setBookingArtist(null); setBookingDesign(null); }, []);
  const handleCollectionSelect = useCallback((collection: string) => { setCollection(collection); setActiveTab('flash'); }, [setCollection]);
  const openAR = useCallback((design: Design) => { setArDesign(design); setShowAR(true); }, []);

  const bodyFilteredDesigns = bodyPlacement ? DESIGNS.filter(d => d.placement === bodyPlacement) : [];
  const favedDesigns = DESIGNS.filter(d => favorites.has(d.id));
  const featuredDesigns = DESIGNS.filter(d => d.featured).slice(0, 5);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-inner">
          <div className="logo"><div className="logo-mark">IV</div>INK<span>VAULT</span></div>
          {/* Desktop top nav — hidden on mobile */}
          <div className="nav-tabs desktop-nav">
            {(['flash', 'placement', 'artists', 'vault', 'pinterest'] as TabType[]).map((tab) => (
              <button key={tab} className={`nav-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab === 'pinterest' ? <><Pin size={14} />PINTEREST</> : tab.toUpperCase()}
                {tab === 'vault' && favCount > 0 && <span className="badge">{favCount}</span>}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="main">
        {activeTab === 'flash' && (
          <div className="animate-in">
            {!filters.collection && <HeroSection featuredDesigns={featuredDesigns} onSelect={setSelectedDesign} onOpenStudio={openStudio} />}
            {!filters.collection && <CollectionsSection onSelectCollection={handleCollectionSelect} />}
            
            <div className="stats-bar">
              <div className="stat-item"><span className="stat-value">{DESIGNS.length}</span><span className="stat-label">Flash Designs</span></div>
              <div className="stat-item"><span className="stat-value">{ARTISTS.length}</span><span className="stat-label">Artists</span></div>
              <div className="stat-item"><span className="stat-value">{STYLES.length}</span><span className="stat-label">Styles</span></div>
              <div className="stat-item"><span className="stat-value">{favCount}</span><span className="stat-label">Saved</span></div>
            </div>

            {filters.collection && (
              <div className="active-filter-bar">
                <span>Showing: {COLLECTIONS.find(c => c.id === filters.collection)?.name}</span>
                <button onClick={() => setCollection(null)}><X size={14} />Clear</button>
              </div>
            )}

            <div className="search-bar-sticky"><div className="search-bar"><Search size={18} className="search-icon" /><input type="text" placeholder="SEARCH DESIGNS, STYLES, PLACEMENTS..." value={filters.search} onChange={(e) => setSearch(e.target.value)} />{filters.search && <button className="search-clear" onClick={() => setSearch('')}><X size={18} /></button>}</div></div>

            <div className="filter-row filter-row-scroll"><button className={`filter-chip ${!filters.style ? 'active' : ''}`} onClick={() => setStyle(null)}>ALL STYLES</button>{STYLES.map(s => <button key={s} className={`filter-chip ${filters.style === s ? 'active' : ''}`} onClick={() => setStyle(filters.style === s ? null : s)}>{s}</button>)}</div>
            <div className="filter-row filter-row-scroll"><button className={`filter-chip ${!filters.placement ? 'active' : ''}`} onClick={() => setPlacement(null)}>ALL PLACEMENTS</button>{PLACEMENTS.map(p => <button key={p} className={`filter-chip ${filters.placement === p ? 'active' : ''}`} onClick={() => setPlacement(filters.placement === p ? null : p)}>{p}</button>)}</div>

            <div className="section-header"><h2>{filters.collection ? COLLECTIONS.find(c => c.id === filters.collection)?.name : 'FLASH LIBRARY'}</h2><div className="count">{filteredDesigns.length} DESIGNS FOUND</div></div>

            <div className="flash-grid">{filteredDesigns.map(d => <FlashCard key={d.id} design={d} isFaved={isFavorite(d.id)} onToggleFav={toggleFavorite} onSelect={setSelectedDesign} onOpenStudio={openStudio} onOpenAR={openAR} onBookDesign={bookDesign} />)}</div>
            {filteredDesigns.length === 0 && <div className="empty-state"><div className="empty-state-icon">⊘</div><h3>NO DESIGNS FOUND</h3><p>TRY ADJUSTING YOUR FILTERS OR SEARCH TERMS</p></div>}
            
            <TestimonialsSection />
          </div>
        )}

        {activeTab === 'placement' && (
          <div className="animate-in">
            <div className="section-header"><h2>BODY PLACEMENT MAP</h2><div className="count">TAP A BODY ZONE TO SEE MATCHING DESIGNS</div></div>
            <div className="placement-container">
              <div className="body-view"><h3>SELECT ZONE</h3><div className="body-svg-container"><BodyPlacementView selectedPlacement={bodyPlacement} onSelectPlacement={(p) => setBodyPlacement(bodyPlacement === p ? null : p)} /></div></div>
              <div className="placement-designs">
                <h3>{bodyPlacement ? `${bodyPlacement.toUpperCase()} DESIGNS` : 'ALL PLACEMENTS'}</h3>
                {!bodyPlacement && <div className="empty-state"><div className="empty-state-icon">◎</div><h3>SELECT A BODY ZONE</h3><p>TAP ON THE BODY MAP TO EXPLORE DESIGNS BY PLACEMENT</p></div>}
                {bodyPlacement && bodyFilteredDesigns.length === 0 && <div className="empty-state"><div className="empty-state-icon">⊘</div><h3>NO {bodyPlacement.toUpperCase()} DESIGNS YET</h3><p>CHECK BACK SOON — NEW FLASH DROPS WEEKLY</p></div>}
                <div className="placement-list">{bodyFilteredDesigns.map(d => { const artist = ARTISTS.find(a => a.id === d.artistId); return <div key={d.id} className="placement-item" onClick={() => setSelectedDesign(d)}><img src={d.image} alt={d.title} className="placement-item-thumb" /><div className="placement-item-info"><div className="placement-item-title">{d.title}</div><div className="placement-item-meta">{d.style} — {artist?.name}</div></div><div className="placement-item-price">${d.price}</div><button className={`flash-fav-btn ${isFavorite(d.id) ? 'faved' : ''}`} onClick={(e) => { e.stopPropagation(); toggleFavorite(d.id); }}><Heart size={16} fill={isFavorite(d.id) ? "currentColor" : "none"} /></button></div>; })}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'artists' && (
          <div className="animate-in">
            <div className="section-header"><h2>ARTIST DIRECTORY</h2><div className="count">{ARTISTS.length} PNW ARTISTS</div></div>
            <div className="search-bar" style={{ marginBottom: 24 }}><Search size={18} className="search-icon" /><input type="text" placeholder="SEARCH ARTISTS, SHOPS, STYLES..." value={filters.search} onChange={(e) => setSearch(e.target.value)} /></div>
            <div className="artist-grid">
              {ARTISTS.filter(a => !filters.search || a.name.toLowerCase().includes(filters.search.toLowerCase()) || a.shop.toLowerCase().includes(filters.search.toLowerCase()) || a.styles.some(s => s.toLowerCase().includes(filters.search.toLowerCase()))).map(artist => (
                <div key={artist.id} className="artist-card animate-in">
                  <div className="artist-card-header"><div className="artist-avatar">{artist.avatar}</div><div><div className="artist-name">{artist.name}</div><div className="artist-handle">{artist.handle}</div><div className="artist-shop">{artist.shop} — {artist.city}</div></div></div>
                  <p className="artist-bio">{artist.bio}</p>
                  <div className="artist-styles">{artist.styles.map(s => <span key={s} className="artist-style-tag">{s}</span>)}</div>
                  <div className="artist-footer"><div className="artist-rating"><Star size={12} fill="currentColor" /> {artist.rating} ({artist.reviews})</div><div className="artist-min-rate">FROM ${artist.minRate}/HR</div><span className={`artist-status ${artist.bookingOpen ? 'open' : 'closed'}`}>{artist.bookingOpen ? 'BOOKING OPEN' : 'WAITLIST'}</span></div>
                  {artist.bookingOpen && <button className="artist-book-btn" onClick={() => openBooking(artist, null)}><Calendar size={14} />BOOK CONSULT</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div className="animate-in">
            <div className="collections-header">
              <div className="section-header" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}><h2>YOUR VAULT</h2><div className="count">{favCount} SAVED DESIGNS</div></div>
              {favCount > 0 && <div className="collection-tabs"><button className={`collection-tab ${collectionView === 'all' ? 'active' : ''}`} onClick={() => setCollectionView('all')}>ALL</button><button className={`collection-tab ${collectionView === 'style' ? 'active' : ''}`} onClick={() => setCollectionView('style')}>BY STYLE</button><button className={`collection-tab ${collectionView === 'artist' ? 'active' : ''}`} onClick={() => setCollectionView('artist')}>BY ARTIST</button></div>}
            </div>
            {favCount === 0 ? <div className="empty-state"><div className="empty-state-icon">♡</div><h3>YOUR VAULT IS EMPTY</h3><p>SAVE FLASH DESIGNS FROM THE LIBRARY TO BUILD YOUR COLLECTION</p><button className="btn-primary" style={{ marginTop: 24, width: 'auto', padding: '14px 40px' }} onClick={() => setActiveTab('flash')}>BROWSE FLASH</button></div> : (
              <>
                {collectionView === 'all' && <div className="flash-grid" style={{ marginTop: 24 }}>{favedDesigns.map(d => <FlashCard key={d.id} design={d} isFaved={true} onToggleFav={toggleFavorite} onSelect={setSelectedDesign} onOpenStudio={openStudio} onOpenAR={openAR} onBookDesign={bookDesign} />)}</div>}
                {collectionView === 'style' && <div style={{ marginTop: 24 }}>{[...new Set(favedDesigns.map(d => d.style))].map(style => <div key={style} style={{ marginBottom: 32 }}><div className="section-header"><h2>{style.toUpperCase()}</h2><div className="count">{favedDesigns.filter(d => d.style === style).length} DESIGNS</div></div><div className="flash-grid">{favedDesigns.filter(d => d.style === style).map(d => <FlashCard key={d.id} design={d} isFaved={true} onToggleFav={toggleFavorite} onSelect={setSelectedDesign} onOpenStudio={openStudio} onOpenAR={openAR} onBookDesign={bookDesign} />)}</div></div>)}</div>}
                {collectionView === 'artist' && <div style={{ marginTop: 24 }}>{[...new Set(favedDesigns.map(d => d.artistId))].map(artistId => { const artist = ARTISTS.find(a => a.id === artistId); return <div key={artistId} style={{ marginBottom: 32 }}><div className="section-header"><h2>{artist?.name}</h2><div className="count">{artist?.shop} — {favedDesigns.filter(d => d.artistId === artistId).length} DESIGNS</div></div><div className="flash-grid">{favedDesigns.filter(d => d.artistId === artistId).map(d => <FlashCard key={d.id} design={d} isFaved={true} onToggleFav={toggleFavorite} onSelect={setSelectedDesign} onOpenStudio={openStudio} onOpenAR={openAR} onBookDesign={bookDesign} />)}</div></div>; })}</div>}
              </>
            )}
          </div>
        )}

        {activeTab === 'pinterest' && (
          <div className="animate-in">
            <div className="section-header">
              <h2><Pin size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />PINTEREST INSPIRATION</h2>
              <div className="count">CURATED TATTOO BOARDS</div>
            </div>
            <div className="pinterest-intro">
              <p>Explore our curated Pinterest collection featuring thousands of tattoo ideas, designs, and inspiration from artists worldwide.</p>
            </div>
            
            {/* Pinterest Profile Embed */}
            <div className="pinterest-section">
              <h3 className="pinterest-section-title">Featured Profile</h3>
              <PinterestProfile username="jameslangholz" showFollowButton={true} />
            </div>

            {/* Pinterest Boards Grid */}
            <div className="pinterest-section">
              <h3 className="pinterest-section-title">Tattoo Collections</h3>
              <PinterestGrid 
                boards={[
                  { 
                    name: 'Tattoo Designs', 
                    url: 'https://www.pinterest.com/jameslangholz/tattoo-designs/', 
                    pinCount: 16 
                  },
                  { 
                    name: 'Tattoo Stencils', 
                    url: 'https://www.pinterest.com/jameslangholz/tattoo-stencils-and-pictures/', 
                    pinCount: 327 
                  },
                  { 
                    name: 'Tattoos', 
                    url: 'https://www.pinterest.com/jameslangholz/tattoos/', 
                    pinCount: 517 
                  },
                  { 
                    name: 'Design Inspiration', 
                    url: 'https://www.pinterest.com/jameslangholz/design/', 
                    pinCount: 1053 
                  },
                  { 
                    name: 'Cool Art', 
                    url: 'https://www.pinterest.com/jameslangholz/cool-art/', 
                    pinCount: 211 
                  },
                  { 
                    name: 'Simple Lion Tattoo', 
                    url: 'https://www.pinterest.com/jameslangholz/simple-lion-tattoo/', 
                    pinCount: 4 
                  }
                ]}
              />
            </div>

            {/* External Link */}
            <div className="pinterest-external-link">
              <a 
                href="https://www.pinterest.com/jameslangholz/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <Pin size={18} />
                View Full Pinterest Profile
              </a>
            </div>
          </div>
        )}
        {activeTab === 'ar' && (
          <div className="animate-in">
            <div className="section-header"><h2><Camera size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />AR PREVIEW</h2><div className="count">COMING SOON</div></div>
            <div className="empty-state">
              <div className="empty-state-icon">📸</div>
              <h3>AR TATTOO PREVIEW</h3>
              <p>POINT YOUR CAMERA AT YOUR SKIN TO PREVIEW TATTOO DESIGNS IN REAL-TIME</p>
              <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 13 }}>This feature is coming soon. Stay tuned!</p>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand"><div className="logo-mark">IV</div><span>INKVAULT</span></div>
          <div className="footer-links"><a href="#"><Instagram size={18} /></a><a href="#"><Mail size={18} /></a><a href="#"><Phone size={18} /></a></div>
          <p className="footer-copy">© {new Date().getFullYear()} InkVault — Premium Flash Library · Powered by <a href="https://forge3d.netlify.app" style={{ color: '#D4A017', textDecoration: 'none' }}>FORGE3D</a> · A <a href="https://pnwenterprises.com" style={{ color: '#D4A017', textDecoration: 'none' }}>PNW Solutions</a> Product</p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        <button className={`bottom-nav-item ${activeTab === 'flash' ? 'active' : ''}`} onClick={() => setActiveTab('flash')}>
          <LayoutGrid size={22} />
          <span>Flash</span>
        </button>
        <button className={`bottom-nav-item ${activeTab === 'placement' ? 'active' : ''}`} onClick={() => setActiveTab('placement')}>
          <MapPin size={22} />
          <span>Placement</span>
        </button>
        <button className={`bottom-nav-item ${activeTab === 'artists' ? 'active' : ''}`} onClick={() => setActiveTab('artists')}>
          <Users size={22} />
          <span>Artists</span>
        </button>
        <button className={`bottom-nav-item ${activeTab === 'vault' ? 'active' : ''}`} onClick={() => setActiveTab('vault')}>
          <BookMarked size={22} />
          {favCount > 0 && <span className="bottom-nav-badge">{favCount}</span>}
          <span>Vault</span>
        </button>
        <button className={`bottom-nav-item ${activeTab === 'ar' ? 'active' : ''}`} onClick={() => setActiveTab('ar' as TabType)}>
          <Camera size={22} />
          <span>AR</span>
        </button>
        <button className="bottom-nav-item" onClick={() => setShowAIStudio(true)} style={{ color: '#D4A017' }}>
          <Sparkles size={22} />
          <span>AI</span>
        </button>
      </nav>

      {/* Floating AR Preview Button */}
      <button className="ar-fab" onClick={() => setActiveTab('ar' as TabType)} aria-label="Open AR Preview">
        <Camera size={22} />
      </button>

      {/* Floating AI Studio Button */}
      <button
        className="ar-fab"
        onClick={() => setShowAIStudio(true)}
        aria-label="Open AI Design Studio"
        style={{ bottom: 88, background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)', border: '1px solid #D4A017', color: '#D4A017' }}
      >
        <Sparkles size={22} />
      </button>

      {selectedDesign && <DetailModal design={selectedDesign} onClose={() => setSelectedDesign(null)} isFaved={isFavorite(selectedDesign.id)} onToggleFav={toggleFavorite} onOpenStudio={openStudio} onBookArtist={openBooking} />}
      {studioDesign && <DesignStudio design={studioDesign} isOpen={!!studioDesign} onClose={closeStudio} onBookDesign={bookDesign} />}
      <BookingModal artist={bookingArtist} design={bookingDesign} isOpen={!!bookingArtist} onClose={closeBooking} />
      {showAR && <ARPreview design={arDesign} designs={DESIGNS} onClose={() => setShowAR(false)} onBookDesign={bookDesign} />}
      {showAIStudio && (
        <AIDesignStudio
          onClose={() => setShowAIStudio(false)}
          onOpenAR={() => { setShowAIStudio(false); setShowAR(true); }}
          onSaveToVault={() => { /* saved notification shown in component */ }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// INKVAULT CONSTANTS
// ─────────────────────────────────────────────

export const STYLES = [
  "Traditional",
  "Neo-Trad",
  "Japanese",
  "Blackwork",
  "Geometric",
  "Dotwork",
  "Realism",
  "Tribal",
  "Chicano",
  "Trash Polka"
] as const;

export const PLACEMENTS = [
  "Arm",
  "Back",
  "Chest",
  "Forearm",
  "Thigh",
  "Shoulder",
  "Calf",
  "Hand",
  "Neck",
  "Ribs",
  "Elbow",
  "Full Sleeve",
  "Full Back",
  "Full Leg"
] as const;

export const SIZES = [
  "Small",
  "Medium",
  "Large",
  "Full Sleeve",
  "Full Back",
  "Full Leg"
] as const;

export const COLLECTIONS = [
  { id: "featured", name: "Featured", description: "Curated selection of our best work", icon: "Star" },
  { id: "new", name: "New Arrivals", description: "Fresh designs added this month", icon: "Sparkles" },
  { id: "trending", name: "Trending", description: "Most popular designs this week", icon: "TrendingUp" },
  { id: "staff-picks", name: "Staff Picks", description: "Our artists' favorites", icon: "Heart" },
  { id: "color", name: "Color Blast", description: "Vibrant full-color designs", icon: "Palette" },
  { id: "blackwork", name: "Blackwork", description: "Bold black ink designs", icon: "Moon" }
] as const;

export const PRICE_RANGES = {
  small: { min: 150, max: 400 },
  medium: { min: 350, max: 800 },
  large: { min: 700, max: 2000 },
  "full-sleeve": { min: 1500, max: 3500 },
  "full-back": { min: 2000, max: 5000 },
  "full-leg": { min: 2000, max: 4000 }
} as const;

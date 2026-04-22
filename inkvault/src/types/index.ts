// ─────────────────────────────────────────────
// INKVAULT TYPES
// ─────────────────────────────────────────────

export interface Design {
  id: number;
  title: string;
  style: string;
  placement: string;
  size: string;
  artistId: number;
  price: number;
  colors: string[];
  description: string;
  image: string;
  featured: boolean;
  new: boolean;
  trending: boolean;
}

export interface Artist {
  id: number;
  name: string;
  handle: string;
  shop: string;
  city: string;
  styles: string[];
  rating: number;
  reviews: number;
  avatar: string;
  bio: string;
  bookingOpen: boolean;
  minRate: number;
  featured: boolean;
}

export interface Testimonial {
  id: number;
  name: string;
  text: string;
  rating: number;
  design: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
}

export type TabType = 'flash' | 'placement' | 'artists' | 'vault' | 'pinterest';
export type StudioTabType = 'preview' | 'stencil' | 'customize' | 'measure' | 'draw';
export type CollectionViewType = 'all' | 'style' | 'artist';

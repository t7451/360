// ─────────────────────────────────────────────
// INKVAULT ARTISTS DATA
// ─────────────────────────────────────────────
import type { Artist } from '../types';

export const ARTISTS: Artist[] = [
  {
    id: 1,
    name: "MAKO",
    handle: "@mako.ink",
    shop: "Black Iron Studio",
    city: "Portland, OR",
    styles: ["Blackwork", "Geometric", "Dotwork"],
    rating: 4.9,
    reviews: 312,
    avatar: "M",
    bio: "15 years specializing in heavy blackwork and sacred geometry. Former machinist turned tattoo artist.",
    bookingOpen: true,
    minRate: 200,
    featured: true
  },
  {
    id: 2,
    name: "VERA SANTOS",
    handle: "@vera.flash",
    shop: "Rust & Bone Tattoo",
    city: "Seattle, WA",
    styles: ["Traditional", "Neo-Trad", "Chicano"],
    rating: 4.8,
    reviews: 287,
    avatar: "V",
    bio: "Old school flash with a modern edge. Walk-ins welcome Fridays.",
    bookingOpen: true,
    minRate: 150,
    featured: true
  },
  {
    id: 3,
    name: "KAI NØRGAARD",
    handle: "@kai.needles",
    shop: "Northline Collective",
    city: "Vancouver, BC",
    styles: ["Japanese", "Realism"],
    rating: 5.0,
    reviews: 198,
    avatar: "K",
    bio: "Traditional Japanese techniques, contemporary subjects. Apprenticed in Tokyo for 3 years.",
    bookingOpen: false,
    minRate: 300,
    featured: true
  },
  {
    id: 4,
    name: "BONE",
    handle: "@bone.ttt",
    shop: "Dead Hand Parlour",
    city: "Tacoma, WA",
    styles: ["Trash Polka", "Blackwork", "Tribal"],
    rating: 4.7,
    reviews: 156,
    avatar: "B",
    bio: "Chaos on skin. Abstract expressionism meets brutal linework.",
    bookingOpen: true,
    minRate: 175,
    featured: false
  },
  {
    id: 5,
    name: "LIZ VENOM",
    handle: "@liz.venom.ink",
    shop: "Electric Cathedral",
    city: "Eugene, OR",
    styles: ["Realism", "Neo-Trad"],
    rating: 4.9,
    reviews: 423,
    avatar: "L",
    bio: "Hyperrealistic portraits and nature pieces. 20+ years in the game.",
    bookingOpen: true,
    minRate: 250,
    featured: true
  },
  {
    id: 6,
    name: "ROOK",
    handle: "@rook.handpoke",
    shop: "Slow Burn Studio",
    city: "Olympia, WA",
    styles: ["Dotwork", "Geometric", "Tribal"],
    rating: 4.6,
    reviews: 89,
    avatar: "R",
    bio: "Hand-poke only. Every dot placed with intention. No machines.",
    bookingOpen: false,
    minRate: 180,
    featured: false
  }
];

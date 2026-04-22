// ─────────────────────────────────────────────
// USE FAVORITES HOOK
// ─────────────────────────────────────────────
import { useState, useCallback } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const toggleFavorite = useCallback((id: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: number) => favorites.has(id), [favorites]);

  return { favorites, toggleFavorite, isFavorite, count: favorites.size };
}

// ─────────────────────────────────────────────
// USE FILTER HOOK
// ─────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react';
import type { Design } from '../types';

interface FilterState {
  search: string;
  style: string | null;
  placement: string | null;
  collection: string | null;
}

export function useFilter(designs: Design[]) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    style: null,
    placement: null,
    collection: null
  });

  // Debounced search query (300ms)
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const filteredDesigns = useMemo(() => {
    return designs.filter(d => {
      const matchesSearch = !debouncedSearch ||
        d.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        d.style.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        d.description.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesStyle = !filters.style || d.style === filters.style;
      const matchesPlacement = !filters.placement || d.placement === filters.placement;
      
      const matchesCollection = !filters.collection || 
        (filters.collection === 'new' && d.new) ||
        (filters.collection === 'featured' && d.featured) ||
        (filters.collection === 'trending' && d.trending) ||
        (filters.collection === 'sale' && d.price < 500);

      return matchesSearch && matchesStyle && matchesPlacement && matchesCollection;
    });
  }, [designs, debouncedSearch, filters.style, filters.placement, filters.collection]);

  const setSearch = (search: string) => setFilters(prev => ({ ...prev, search }));
  const setStyle = (style: string | null) => setFilters(prev => ({ ...prev, style }));
  const setPlacement = (placement: string | null) => setFilters(prev => ({ ...prev, placement }));
  const setCollection = (collection: string | null) => setFilters(prev => ({ ...prev, collection }));
  const clearFilters = () => setFilters({ search: '', style: null, placement: null, collection: null });

  return {
    filters,
    filteredDesigns,
    debouncedSearch,
    setSearch,
    setStyle,
    setPlacement,
    setCollection,
    clearFilters,
    resultCount: filteredDesigns.length,
    hasActiveFilters: !!filters.search || !!filters.style || !!filters.placement,
  };
}

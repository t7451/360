import { useState, useCallback } from 'react';

const STORAGE_KEY = 'inkvault_recent_searches';
const MAX_HISTORY = 8;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
  });

  const addToHistory = useCallback((term: string) => {
    if (!term.trim() || term.length < 2) return;
    setHistory(prev => {
      const updated = [term, ...prev.filter(h => h !== term)].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, addToHistory, clearHistory };
}

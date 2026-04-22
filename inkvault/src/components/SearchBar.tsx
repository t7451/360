import { useRef, useState, useEffect } from 'react';
import { Search, X, Clock } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onCommit: (value: string) => void;
  resultCount: number;
  hasQuery: boolean;
  history: string[];
  onSelectHistory: (term: string) => void;
  onClearHistory: () => void;
}

export function SearchBar({
  value,
  onChange,
  onCommit,
  resultCount,
  hasQuery,
  history,
  onSelectHistory,
  onClearHistory,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  // Cmd+K / Ctrl+K to focus; Escape to blur
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') inputRef.current?.blur();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const showDropdown = focused && !value && history.length > 0;

  return (
    <div className="search-wrapper">
      <div className={`search-input-row ${focused ? 'focused' : ''}`}>
        <Search size={16} className="search-icon" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 200);
            if (value) onCommit(value);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && value) onCommit(value);
          }}
          placeholder="Search designs, styles, tags..."
          className="search-input"
        />
        {value && (
          <button className="search-clear" onClick={() => onChange('')} aria-label="Clear search">
            <X size={14} />
          </button>
        )}
        {!value && <kbd className="search-kbd">⌘K</kbd>}
      </div>

      {/* Result count badge */}
      {hasQuery && (
        <p className="search-result-count">
          {resultCount === 0 ? 'No results' : `${resultCount} design${resultCount !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Recent searches dropdown */}
      {showDropdown && (
        <div className="search-dropdown">
          <div className="search-dropdown-header">
            <span>Recent</span>
            <button onClick={onClearHistory} className="search-dropdown-clear">Clear</button>
          </div>
          {history.map(term => (
            <button
              key={term}
              className="search-dropdown-item"
              onMouseDown={() => onSelectHistory(term)}
            >
              <Clock size={12} />
              {term}
            </button>
          ))}
        </div>
      )}

      {/* Empty state suggestions */}
      {hasQuery && resultCount === 0 && (
        <div className="search-empty">
          <p>No designs found for "{value}"</p>
          <div className="search-suggestions">
            <span>Try:</span>
            {['dragon', 'rose', 'wolf', 'geometric', 'skull'].map(s => (
              <button key={s} className="search-suggestion-pill" onClick={() => onChange(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, Palette, X } from 'lucide-react';
import { ALL_THEMES, EditorThemeOption } from '@/lib/themes';

interface ThemeCommandPaletteProps {
  isOpen: boolean;
  currentTheme: string;
  onSelectTheme: (themeId: string) => void;
  onPreviewTheme: (themeId: string) => void;
  onClose: () => void;
}

export const ThemeCommandPalette: React.FC<ThemeCommandPaletteProps> = ({
  isOpen,
  currentTheme,
  onSelectTheme,
  onPreviewTheme,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const initialThemeRef = useRef(currentTheme);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter themes based on search query
  const filteredThemes = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_THEMES;
    return ALL_THEMES.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q)
    );
  }, [query]);

  // When opening, reset query, record initial theme, and focus input
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      initialThemeRef.current = currentTheme;
      const idx = ALL_THEMES.findIndex((t) => t.id === currentTheme);
      setSelectedIndex(idx >= 0 ? idx : 0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, currentTheme]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= filteredThemes.length) {
      setSelectedIndex(Math.max(0, filteredThemes.length - 1));
    }
  }, [filteredThemes, selectedIndex]);

  // Scroll selected item into view and preview theme on highlight (like VS Code)
  useEffect(() => {
    if (!isOpen) return;
    const activeItem = filteredThemes[selectedIndex];
    if (activeItem) {
      onPreviewTheme(activeItem.id);
      const container = listRef.current;
      if (container) {
        const itemElement = container.children[selectedIndex] as HTMLElement;
        if (itemElement) {
          itemElement.scrollIntoView({ block: 'nearest' });
        }
      }
    }
  }, [selectedIndex, filteredThemes, isOpen, onPreviewTheme]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredThemes.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredThemes.length) % filteredThemes.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = filteredThemes[selectedIndex];
      if (chosen) {
        onSelectTheme(chosen.id);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Restore initial theme on cancellation
      onPreviewTheme(initialThemeRef.current);
      onClose();
    }
  };

  const handleSelect = (t: EditorThemeOption) => {
    onSelectTheme(t.id);
  };

  const handleCancel = () => {
    onPreviewTheme(initialThemeRef.current);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={handleCancel}
    >
      <div
        className="w-full max-w-xl bg-canvas-elevated border border-canvas-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Command Search Input Bar */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-canvas-border bg-canvas-surface/60">
          <Palette className="w-4 h-4 text-brand-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Select Color Theme (Up/Down to preview, Enter to select, Esc to cancel)..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
          />
          <button
            onClick={handleCancel}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-canvas-surface transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-1.5 space-y-0.5 select-none">
          {filteredThemes.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No matching themes found for &quot;{query}&quot;
            </div>
          ) : (
            filteredThemes.map((t, idx) => {
              const isHighlighted = idx === selectedIndex;
              const isCurrent = t.id === currentTheme;

              return (
                <div
                  key={t.id}
                  onClick={() => handleSelect(t)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                    isHighlighted
                      ? 'bg-sky-500/20 text-sky-200 ring-1 ring-sky-500/40'
                      : 'text-slate-300 hover:bg-canvas-surface/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-medium text-sm text-slate-100 truncate">
                      {t.name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        t.type === 'dark'
                          ? 'bg-slate-800 text-slate-400 border border-slate-700/50'
                          : 'bg-amber-950/40 text-amber-300 border border-amber-800/40'
                      }`}
                    >
                      {t.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2 bg-canvas/60 border-t border-canvas-border flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-canvas-surface border border-canvas-border text-[10px] text-slate-300 mr-1 font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-canvas-surface border border-canvas-border text-[10px] text-slate-300 mr-1 font-mono">↓</kbd>
              Navigate & Preview
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-canvas-surface border border-canvas-border text-[10px] text-slate-300 mr-1 font-mono">Enter</kbd>
              Confirm
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-canvas-surface border border-canvas-border text-[10px] text-slate-300 mr-1 font-mono">Esc</kbd>
              Cancel
            </span>
          </div>
          <div className="text-[10px] text-slate-600 font-mono">
            {filteredThemes.length} themes
          </div>
        </div>
      </div>
    </div>
  );
};

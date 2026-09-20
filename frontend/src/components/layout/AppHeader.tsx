import React, { useEffect, useRef } from 'react';
import { Eye, EyeOff, Sun, Moon, Plus, Search } from 'lucide-react';
import { usePrivacy } from '../../context/PrivacyContext';
import { useTheme } from '../../context/ThemeContext';
import { TabType } from './BottomNav';

interface AppHeaderProps {
  currentTab: TabType | 'accounts';
  monthLabel?: string;
  onNewItemClick?: () => void;
  onSearchFocus?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentTab,
  monthLabel = 'Szeptember 2026',
  onNewItemClick,
  onSearchFocus
}) => {
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { actualTheme, toggleTheme } = useTheme();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: '/' focuses search, 'N' opens new item
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        onSearchFocus?.();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onNewItemClick?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewItemClick, onSearchFocus]);

  const getTabTitle = () => {
    switch (currentTab) {
      case 'overview':
        return 'Fix kiadások';
      case 'items':
        return 'Tételek';
      case 'calendar':
        return 'Naptár';
      case 'accounts':
        return 'Bankszámlák';
      case 'settings':
        return 'Beállítások';
      default:
        return 'Billflow';
    }
  };

  return (
    <header className="hidden lg:block sticky top-0 z-20 bg-bg/85 backdrop-blur-md border-b border-line px-8 py-3.5 transition-colors duration-200">
      <div className="max-w-app mx-auto flex items-center justify-between gap-4">
        {/* Left: Mobile Title or Desktop Tab Title */}
        <div>
          <span className="text-[11px] font-medium text-ink-2 uppercase tracking-wider block">
            {monthLabel}
          </span>
          <h1 className="text-xl lg:text-2xl font-bold text-ink tracking-tight">
            {getTabTitle()}
          </h1>
        </div>

        {/* Center: Desktop search bar */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-ink-2 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Keresés a fix tételek között... (nyomj '/' -t)"
              className="w-full bg-surface border border-line rounded-control pl-9 pr-8 py-1.5 text-sm text-ink placeholder:text-ink-2/60 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-ink-2 bg-bg px-1.5 py-0.5 rounded border border-line">
              /
            </kbd>
          </div>
        </div>

        {/* Right: Actions (Privacy, Theme, New item) */}
        <div className="flex items-center gap-2">
          {/* Privacy mode toggle button */}
          <button
            type="button"
            onClick={togglePrivacy}
            title={isPrivate ? 'Összegek megjelenítése (P)' : 'Összegek elrejtése (P)'}
            aria-label="Privacy mód kapcsolása"
            aria-pressed={isPrivate}
            className={`w-9 h-9 rounded-control flex items-center justify-center border transition-colors ${
              isPrivate
                ? 'bg-accent-tint text-accent-text border-accent/30'
                : 'bg-surface text-ink-2 hover:text-ink border-line'
            }`}
          >
            {isPrivate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Theme toggle (Light / Dark) */}
          <button
            type="button"
            onClick={toggleTheme}
            title={`Váltás ${actualTheme === 'dark' ? 'világos' : 'sötét'} módra`}
            aria-label="Téma váltása"
            className="w-9 h-9 rounded-control bg-surface border border-line text-ink-2 hover:text-ink flex items-center justify-center transition-colors"
          >
            {actualTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Desktop "Új tétel" button */}
          <button
            type="button"
            onClick={onNewItemClick}
            className="hidden lg:flex items-center gap-2 bg-accent-strong text-on-accent px-4 py-2 rounded-control text-sm font-semibold shadow-sm hover:opacity-95 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Új tétel</span>
            <kbd className="text-[10px] bg-white/20 px-1 py-0.5 rounded ml-1">N</kbd>
          </button>
        </div>
      </div>
    </header>
  );
};

import React, { useRef, useEffect, useState } from 'react';
import { Search, X, ChevronDown, Check, CreditCard, SlidersHorizontal } from 'lucide-react';
import { BankBadge } from '../common/BankBadge';
import { BankAccount } from '../../types';

export type FilterStatus = 'ALL' | 'PENDING' | 'OVERDUE' | 'PAID';

interface ItemsFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: FilterStatus;
  onStatusFilterChange: (status: FilterStatus) => void;
  counts: {
    all: number;
    pending: number;
    overdue: number;
    paid: number;
  };
  selectedAccount?: string;
  onAccountSelect?: (accountId?: string) => void;
  accounts?: BankAccount[];
}

export const ItemsFilterBar: React.FC<ItemsFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  counts,
  selectedAccount,
  onAccountSelect,
  accounts = []
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  // Scroll listener to smoothly collapse search bar when scrolling down and empty
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global '/' keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toUpperCase();
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        setIsFocused(true);
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close account dropdown on outside click or ESC (Rule 11)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(e.target as Node)
      ) {
        setIsAccountDropdownOpen(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAccountDropdownOpen(false);
      }
    };

    if (isAccountDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isAccountDropdownOpen]);

  const pills: { id: FilterStatus; label: string; count: number }[] = [
    { id: 'ALL', label: 'Összes', count: counts.all },
    { id: 'PENDING', label: 'Esedékes', count: counts.pending },
    { id: 'OVERDUE', label: 'Lejárt', count: counts.overdue },
    { id: 'PAID', label: 'Kifizetve', count: counts.paid }
  ];

  const currentSelectedAccountObj = accounts.find((a) => a.id === selectedAccount);
  const isSearchCollapsed = isScrolled && !isFocused && !searchQuery;

  return (
    <div className="space-y-2.5">
      {/* 1. Search Bar - Full Open at Top, Collapses on Scroll if empty */}
      <div className="transition-all duration-300 ease-in-out">
        {isSearchCollapsed ? (
          // Collapsed Trigger Button
          <button
            type="button"
            onClick={() => {
              setIsFocused(true);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            className="w-full sm:w-auto px-3.5 py-2 bg-surface/90 hover:bg-surface border border-line rounded-control text-xs font-semibold text-ink-2 flex items-center justify-between gap-3 shadow-xs hover:text-ink transition-all group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-accent" />
              <span>Keresés...</span>
            </div>
            <kbd className="px-1.5 py-0.5 border border-line rounded bg-bg text-[10px] text-ink-2/60 font-mono">
              /
            </kbd>
          </button>
        ) : (
          // Expanded Full-Width Input Box
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-2">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Keresés név vagy számla alapján... (/ billentyű)"
              className="w-full pl-10 pr-10 py-2.5 bg-surface border border-line rounded-control text-sm text-ink placeholder:text-ink-2/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-sm"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  searchInputRef.current?.focus();
                }}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-2 hover:text-ink transition-colors"
                title="Keresés törlése"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs text-ink-2/50 font-mono hidden sm:flex">
                <kbd className="px-1.5 py-0.5 border border-line rounded bg-bg text-[10px]">
                  /
                </kbd>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Filter Badges in Single Horizontal Row + Custom Account Dropdown */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
        {/* Status Filter Badges - Single Scrollable Row */}
        <div className="flex items-center gap-1.5 shrink-0">
          {pills.map((pill) => {
            const isActive = statusFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => onStatusFilterChange(pill.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-accent-strong text-on-accent shadow-sm ring-2 ring-accent/30'
                    : 'bg-surface border border-line text-ink-2 hover:text-ink hover:bg-surface-elevated'
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-white/25 text-on-accent font-bold'
                      : 'bg-bg text-ink-2'
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Account Dropdown Card (Replacing native select) */}
        {accounts.length > 0 && onAccountSelect && (
          <div className="relative shrink-0 ml-auto" ref={accountDropdownRef}>
            <button
              type="button"
              onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-control text-xs font-semibold border transition-all flex items-center gap-2 shadow-xs ${
                selectedAccount
                  ? 'bg-accent-tint/60 border-accent/40 text-ink'
                  : 'bg-surface border border-line text-ink-2 hover:text-ink hover:bg-surface-elevated'
              }`}
            >
              {currentSelectedAccountObj ? (
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: currentSelectedAccountObj.color || 'var(--accent)' }}
                  />
                  <span className="truncate max-w-[120px] font-bold">
                    {currentSelectedAccountObj.name}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-ink-2" />
                  <span>Minden számla</span>
                </div>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 text-ink-2 transition-transform duration-200 ${
                  isAccountDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Floating Dropdown Card */}
            {isAccountDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 p-1.5 bg-surface border border-line rounded-card shadow-dialog z-40 text-left animate-in fade-in zoom-in-95 duration-150 space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-2 border-b border-line/60">
                  Számla szűrés
                </div>

                {/* Option: Minden számla */}
                <button
                  type="button"
                  onClick={() => {
                    onAccountSelect(undefined);
                    setIsAccountDropdownOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-control text-xs font-semibold flex items-center justify-between transition-colors ${
                    !selectedAccount
                      ? 'bg-accent-tint text-accent-text font-bold'
                      : 'text-ink hover:bg-surface-elevated'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-ink-2" />
                    <span>Minden számla</span>
                  </div>
                  {!selectedAccount && <Check className="w-3.5 h-3.5 text-accent stroke-[2.5]" />}
                </button>

                {/* Option for each Account */}
                {accounts.map((acc) => {
                  const isSelected = selectedAccount === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        onAccountSelect(acc.id);
                        setIsAccountDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-2 rounded-control text-xs font-semibold flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-accent-tint text-accent-text font-bold'
                          : 'text-ink hover:bg-surface-elevated'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <BankBadge account={acc} size="sm" />
                        <span className="truncate">{acc.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-accent stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

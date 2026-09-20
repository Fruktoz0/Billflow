import React from 'react';
import { LayoutGrid, Calendar, Plus, Receipt, Settings } from 'lucide-react';

export type TabType = 'overview' | 'calendar' | 'items' | 'settings';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onNewItemClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  onNewItemClick
}) => {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-line safe-bottom transition-colors duration-200"
      aria-label="Mobil alsó navigáció"
    >
      <div className="flex items-center justify-around h-16 px-2 relative">
        {/* 1. Áttekintés */}
        <button
          type="button"
          onClick={() => onTabChange('overview')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'overview' ? 'text-accent font-semibold' : 'text-ink-2 hover:text-ink'
          }`}
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" strokeWidth={currentTab === 'overview' ? 2.3 : 1.8} />
          <span className="text-[11px]">Áttekintés</span>
        </button>

        {/* 2. Naptár */}
        <button
          type="button"
          onClick={() => onTabChange('calendar')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'calendar' ? 'text-accent font-semibold' : 'text-ink-2 hover:text-ink'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" strokeWidth={currentTab === 'calendar' ? 2.3 : 1.8} />
          <span className="text-[11px]">Naptár</span>
        </button>

        {/* Center: Lebegő FAB (+) Új tétel */}
        <div className="flex-1 flex justify-center -translate-y-3">
          <button
            type="button"
            onClick={onNewItemClick}
            aria-label="Új tétel hozzáadása"
            className="w-12 h-12 rounded-full bg-accent-strong text-on-accent flex items-center justify-center shadow-lg shadow-accent/25 hover:scale-105 active:scale-95 transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 3. Tételek */}
        <button
          type="button"
          onClick={() => onTabChange('items')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'items' ? 'text-accent font-semibold' : 'text-ink-2 hover:text-ink'
          }`}
        >
          <Receipt className="w-5 h-5 mb-0.5" strokeWidth={currentTab === 'items' ? 2.3 : 1.8} />
          <span className="text-[11px]">Tételek</span>
        </button>

        {/* 4. Beállítások */}
        <button
          type="button"
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'settings' ? 'text-accent font-semibold' : 'text-ink-2 hover:text-ink'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" strokeWidth={currentTab === 'settings' ? 2.3 : 1.8} />
          <span className="text-[11px]">Beállítások</span>
        </button>
      </div>
    </nav>
  );
};

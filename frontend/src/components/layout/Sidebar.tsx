import React from 'react';
import { LayoutGrid, Calendar, Receipt, CreditCard, Settings, Users, Home } from 'lucide-react';
import { TabType } from './BottomNav';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: TabType | 'accounts';
  onTabChange: (tab: TabType | 'accounts') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const { household, user } = useAuth();

  const navItems = [
    { id: 'overview', label: 'Áttekintés', icon: LayoutGrid },
    { id: 'calendar', label: 'Naptár', icon: Calendar },
    { id: 'items', label: 'Tételek', icon: Receipt },
    { id: 'accounts', label: 'Számlák', icon: CreditCard },
    { id: 'settings', label: 'Beállítások', icon: Settings }
  ] as const;

  return (
    <aside
      className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[232px] bg-surface border-r border-line flex-col justify-between p-4 z-30 transition-colors duration-200"
      aria-label="Oldalsáv navigáció"
    >
      <div>
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 px-3 py-4 mb-4">
          <div className="w-8 h-8 rounded-control bg-accent flex items-center justify-center text-white font-bold text-lg shadow-sm">
            B
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-ink">Billflow</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent ml-1 mb-1"></span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-control text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-accent-tint text-accent-text font-semibold shadow-sm'
                    : 'text-ink-2 hover:bg-bg hover:text-ink'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-ink-2'}`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Household & User info card at bottom */}
      <div className="p-3 rounded-card bg-bg border border-line">
        <div className="flex items-center gap-2 mb-1.5">
          <Home className="w-4 h-4 text-accent" />
          <span className="text-xs font-semibold text-ink truncate">
            {household ? household.name : 'Saját háztartás'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-ink-2">
          <span>{household ? household.currency : 'HUF'}</span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{user ? user.displayName : 'Bejelentkezve'}</span>
          </span>
        </div>
      </div>
    </aside>
  );
};

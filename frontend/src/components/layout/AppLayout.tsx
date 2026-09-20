import React from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav, TabType } from './BottomNav';
import { AppHeader } from './AppHeader';

interface AppLayoutProps {
  children: React.ReactNode;
  currentTab: TabType | 'accounts';
  onTabChange: (tab: TabType | 'accounts') => void;
  onNewItemClick: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentTab,
  onTabChange,
  onNewItemClick
}) => {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col selection:bg-accent/20">
      {/* 1. Desktop Sidebar (fixed left, 232px) */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={onTabChange}
      />

      {/* 2. Main content area (offset on desktop by 232px) */}
      <div className="flex-1 lg:pl-[232px] flex flex-col">
        {/* Header */}
        <AppHeader
          currentTab={currentTab}
          onNewItemClick={onNewItemClick}
        />

        {/* Page Content Container with notch protection on mobile */}
        <main className="flex-1 max-w-app w-full mx-auto p-4 pt-[max(1rem,env(safe-area-inset-top))] lg:p-8 pb-24 lg:pb-12">
          {children}
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation with FAB */}
      <BottomNav
        currentTab={currentTab === 'accounts' ? 'items' : currentTab}
        onTabChange={onTabChange}
        onNewItemClick={onNewItemClick}
      />
    </div>
  );
};

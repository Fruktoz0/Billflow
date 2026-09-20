import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { PrivacyProvider } from './context/PrivacyContext';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { TabType } from './components/layout/BottomNav';
import { BankAccount, FixedExpense } from './types';
import { api } from './services/api';

import { OverviewPage } from './pages/OverviewPage';
import { ItemsPage } from './pages/ItemsPage';
import { CalendarPage } from './pages/CalendarPage';
import { AccountsPage } from './pages/AccountsPage';
import { SettingsPage } from './pages/SettingsPage';
import { FixedExpenseModal } from './components/items/FixedExpenseModal';
import { OfflineBanner } from './components/common/OfflineBanner';

const defaultMockAccounts: BankAccount[] = [
  {
    id: 'acc-revolut',
    householdId: 'h-1',
    name: 'Revolut',
    type: 'REVOLUT',
    currency: 'HUF',
    color: '#0E8A9A',
    icon: 'credit-card',
    isDefault: false,
    active: true
  },
  {
    id: 'acc-unicredit',
    householdId: 'h-1',
    name: 'UniCredit Folyószámla',
    type: 'BANK_ACCOUNT',
    currency: 'HUF',
    color: '#5D9CEC',
    icon: 'credit-card',
    isDefault: true,
    active: true
  }
];

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType | 'accounts'>('overview');
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>(defaultMockAccounts);

  useEffect(() => {
    // 1. Service Worker registration for PWA & Push
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[Billflow] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[Billflow] Service Worker registration failed:', err);
        });
    }

    // 2. Handle PWA query shortcuts (e.g. ?action=new-item or ?tab=calendar)
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const tab = urlParams.get('tab');

    if (action === 'new-item') {
      setIsNewItemModalOpen(true);
    }
    if (tab && ['overview', 'items', 'calendar', 'accounts', 'settings'].includes(tab)) {
      setCurrentTab(tab as any);
    }

    // 3. Load live accounts
    api.accounts
      .getAll()
      .then((accs) => {
        if (accs && accs.length > 0) {
          setAccounts(accs);
        }
      })
      .catch(() => {});
  }, []);

  const handleCreateExpense = async (expenseData: Partial<FixedExpense>) => {
    try {
      await api.fixedExpenses.create(expenseData);
      window.dispatchEvent(new CustomEvent('billflow:expense-created'));
    } catch (err) {
      console.warn('[App] Local fallback on create:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* PWA Offline resilience notification banner */}
      <OfflineBanner />

      <AppLayout
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onNewItemClick={() => setIsNewItemModalOpen(true)}
      >
        {/* 1. Overview Screen (Phase F2 - Mockup 1) */}
        {currentTab === 'overview' && <OverviewPage />}

        {/* 2. Items Screen (Phase F3 - Mockup 2) */}
        {currentTab === 'items' && <ItemsPage />}

        {/* 3. Calendar Screen (Phase F4 - Havi naptár mátrix & napi lista) */}
        {currentTab === 'calendar' && <CalendarPage />}

        {/* 4. Accounts Screen (Phase F4 - FEAT-001 Számlák kezelése) */}
        {currentTab === 'accounts' && <AccountsPage />}

        {/* 5. Settings Screen (Phase F4 & F5 - FEAT-006 Háztartás, PWA & Web Push) */}
        {currentTab === 'settings' && <SettingsPage />}

        {/* Global New Item Modal (Triggered by FAB or Header '+' shortcut) */}
        {isNewItemModalOpen && (
          <FixedExpenseModal
            isOpen={isNewItemModalOpen}
            onClose={() => setIsNewItemModalOpen(false)}
            expense={null}
            accounts={accounts}
            onSave={handleCreateExpense}
          />
        )}
      </AppLayout>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <PrivacyProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </PrivacyProvider>
    </ThemeProvider>
  );
};

export default App;

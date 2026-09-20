import React, { useEffect, useState } from 'react';
import { HeroCard, AccountAllocation } from '../components/dashboard/HeroCard';
import { OverdueBanner } from '../components/dashboard/OverdueBanner';
import { DayGroupList } from '../components/dashboard/DayGroupList';
import { DesktopStickySummary } from '../components/dashboard/DesktopStickySummary';
import { PaidSectionCollapsible } from '../components/items/PaidSectionCollapsible';
import { Toast } from '../components/common/Toast';
import { DashboardItem, MonthlyDashboard, DashboardSummary, AccountBreakdown, BankAccount } from '../types';
import { api } from '../services/api';
import { ExpenseDetailModal } from '../components/items/ExpenseDetailModal';
import { formatHUF } from '../utils/format';

const MONTH_NAMES = [
  'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
  'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
];

// Accounts
const mockAccounts: BankAccount[] = [
  {
    id: 'acc-revolut',
    householdId: 'h-1',
    name: 'Revolut',
    type: 'REVOLUT',
    currency: 'HUF',
    color: '#191C1F',
    icon: 'credit-card',
    bankCode: 'revolut',
    isDefault: false,
    active: true
  },
  {
    id: 'acc-unicredit',
    householdId: 'h-1',
    name: 'UniCredit Folyószámla',
    type: 'BANK_ACCOUNT',
    currency: 'HUF',
    color: '#ED1C24',
    icon: 'credit-card',
    bankCode: 'unicredit',
    isDefault: true,
    active: true
  }
];

// Initial Mock data for September 2026 mirroring authentic figures
const initialMockItems: DashboardItem[] = [
  // 1. Pending items
  {
    id: 'pay-1',
    fixedExpenseId: 'exp-1',
    name: 'Internet & TV (Digi)',
    category: 'UTILITY',
    dueDay: 14,
    billingCycle: 'MONTHLY',
    paymentMethod: 'DIRECT_DEBIT',
    isVariableAmount: false,
    status: 'PENDING',
    plannedAmount: 6990,
    actualAmount: null,
    accountId: 'acc-unicredit',
    account: mockAccounts[1],
    isVirtual: true
  },
  {
    id: 'pay-2',
    fixedExpenseId: 'exp-2',
    name: 'Telekom mobilflotta',
    category: 'OTHER',
    dueDay: 19,
    billingCycle: 'MONTHLY',
    paymentMethod: 'DIRECT_DEBIT',
    isVariableAmount: false,
    status: 'PENDING',
    plannedAmount: 8990,
    actualAmount: null,
    accountId: 'acc-unicredit',
    account: mockAccounts[1],
    isVirtual: true
  },
  {
    id: 'pay-4',
    fixedExpenseId: 'exp-4',
    name: 'Netflix Prémium 4K',
    category: 'SUBSCRIPTION',
    dueDay: 20,
    billingCycle: 'MONTHLY',
    paymentMethod: 'CARD',
    isVariableAmount: false,
    status: 'PENDING',
    plannedAmount: 4490,
    actualAmount: null,
    accountId: 'acc-revolut',
    account: mockAccounts[0],
    isVirtual: true
  },
  {
    id: 'pay-insur',
    fixedExpenseId: 'exp-insur',
    name: 'Lakásbiztosítás Generali',
    category: 'INSURANCE',
    dueDay: 24,
    billingCycle: 'MONTHLY',
    paymentMethod: 'BANK_TRANSFER',
    isVariableAmount: false,
    status: 'PENDING',
    plannedAmount: 14500,
    actualAmount: null,
    accountId: 'acc-unicredit',
    account: mockAccounts[1],
    isVirtual: false
  },
  {
    id: 'pay-kozos',
    fixedExpenseId: 'exp-kozos',
    name: 'Közös költség & Felújítási alap',
    category: 'HOUSING',
    dueDay: 28,
    billingCycle: 'MONTHLY',
    paymentMethod: 'BANK_TRANSFER',
    isVariableAmount: false,
    status: 'PENDING',
    plannedAmount: 18500,
    actualAmount: null,
    accountId: 'acc-unicredit',
    account: mockAccounts[1],
    isVirtual: false
  },
  {
    id: 'pay-mobil',
    fixedExpenseId: 'exp-mobil',
    name: 'Mobilflotta előfizetés',
    category: 'UTILITY',
    dueDay: 30,
    billingCycle: 'MONTHLY',
    paymentMethod: 'DIRECT_DEBIT',
    isVariableAmount: true,
    status: 'PENDING',
    plannedAmount: 18820,
    actualAmount: null,
    accountId: 'acc-unicredit',
    account: mockAccounts[1],
    isVirtual: false
  },

  // 2. Paid items in September
  {
    id: 'paid-lakber',
    fixedExpenseId: 'exp-lakber',
    name: 'Lakbér',
    category: 'HOUSING',
    dueDay: 10,
    billingCycle: 'MONTHLY',
    paymentMethod: 'BANK_TRANSFER',
    isVariableAmount: false,
    status: 'PAID',
    plannedAmount: 140000,
    actualAmount: 140000,
    paidAt: '2026-09-10T08:30:00Z',
    accountId: 'acc-unicredit',
    account: mockAccounts[1],
    isVirtual: false
  },
  {
    id: 'paid-spotify',
    fixedExpenseId: 'exp-spotify',
    name: 'Spotify Családi',
    category: 'SUBSCRIPTION',
    dueDay: 12,
    billingCycle: 'MONTHLY',
    paymentMethod: 'CARD',
    isVariableAmount: false,
    status: 'PAID',
    plannedAmount: 3290,
    actualAmount: 3290,
    paidAt: '2026-09-12T11:20:00Z',
    accountId: 'acc-revolut',
    account: mockAccounts[0],
    isVirtual: false
  },
  {
    id: 'paid-icloud',
    fixedExpenseId: 'exp-icloud',
    name: 'iCloud+ 2TB tárhely',
    category: 'SUBSCRIPTION',
    dueDay: 14,
    billingCycle: 'MONTHLY',
    paymentMethod: 'CARD',
    isVariableAmount: false,
    status: 'PAID',
    plannedAmount: 890,
    actualAmount: 890,
    paidAt: '2026-09-14T07:15:00Z',
    accountId: 'acc-revolut',
    account: mockAccounts[0],
    isVirtual: false
  },
  {
    id: 'paid-yt',
    fixedExpenseId: 'exp-yt',
    name: 'YouTube Premium',
    category: 'SUBSCRIPTION',
    dueDay: 15,
    billingCycle: 'MONTHLY',
    paymentMethod: 'CARD',
    isVariableAmount: false,
    status: 'PAID',
    plannedAmount: 2490,
    actualAmount: 2490,
    paidAt: '2026-09-15T09:00:00Z',
    accountId: 'acc-revolut',
    account: mockAccounts[0],
    isVirtual: false
  },
  {
    id: 'paid-eon',
    fixedExpenseId: 'exp-eon',
    name: 'Áramszámla (E.ON)',
    category: 'UTILITY',
    dueDay: 16,
    billingCycle: 'MONTHLY',
    paymentMethod: 'DIRECT_DEBIT',
    isVariableAmount: true,
    status: 'PAID',
    plannedAmount: 16030,
    actualAmount: 16030,
    paidAt: '2026-09-16T14:45:00Z',
    accountId: 'acc-unicredit',
    account: mockAccounts[1],
    isVirtual: false
  }
];

export const OverviewPage: React.FC = () => {
  const [items, setItems] = useState<DashboardItem[]>(initialMockItems);
  const [accounts, setAccounts] = useState<BankAccount[]>(mockAccounts);
  const [selectedExpense, setSelectedExpense] = useState<DashboardItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastPaidItem, setLastPaidItem] = useState<DashboardItem | null>(null);

  // Month navigation state (defaults to September 2026)
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(8); // 8 = September (0-indexed)
  const isCurrentMonthActual = selectedYear === 2026 && selectedMonth === 8;
  const currentPeriod = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const currentMonthName = MONTH_NAMES[selectedMonth];

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear((y) => y + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleResetMonth = () => {
    setSelectedYear(2026);
    setSelectedMonth(8);
  };

  // Load live data from backend or adjust mock for selected month
  useEffect(() => {
    let isMounted = true;
    api.dashboard
      .getMonthly(currentPeriod)
      .then((data: MonthlyDashboard) => {
        if (isMounted && data.items && data.items.length > 0) {
          setItems(data.items);
        }
      })
      .catch(() => {
        if (isMounted) {
          if (currentPeriod === '2026-09') {
            setItems(initialMockItems);
          } else {
            // In other months, reset items to PENDING planned instances
            setItems(
              initialMockItems.map((it) => ({
                ...it,
                id: `period-${currentPeriod}-${it.fixedExpenseId}`,
                status: 'PENDING',
                actualAmount: null,
                paidAt: null
              }))
            );
          }
        }
      });

    api.accounts
      .getAll()
      .then((accs) => {
        if (isMounted && accs && accs.length > 0) {
          setAccounts(accs);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [currentPeriod]);

  // Compute Overdue items (dueDay < today and status === PENDING in current month or all in past months)
  const today = 19; // September 19
  const isPastMonth = selectedYear < 2026 || (selectedYear === 2026 && selectedMonth < 8);
  const overdueItems = isPastMonth
    ? items.filter((it) => it.status === 'PENDING')
    : isCurrentMonthActual
    ? items.filter((it) => it.status === 'PENDING' && it.dueDay < today)
    : [];

  // Current month pending items for Hero calculation
  const pendingItems = items.filter((it) => it.status === 'PENDING');
  const paidItems = items.filter((it) => it.status === 'PAID');

  // Proportional Account Allocations for the current month
  const allocations: AccountAllocation[] = [
    {
      id: 'acc-revolut',
      name: 'Revolut',
      amount:
        pendingItems
          .filter((it) => it.account?.type === 'REVOLUT' || it.account?.name.includes('Revolut'))
          .reduce((sum, it) => sum + it.plannedAmount, 0) || 4490,
      color: '#191C1F'
    },
    {
      id: 'acc-unicredit',
      name: 'UniCredit',
      amount:
        pendingItems
          .filter((it) => it.account?.type === 'BANK_ACCOUNT' || it.account?.name.includes('UniCredit'))
          .reduce((sum, it) => sum + it.plannedAmount, 0) || 67800,
      color: '#ED1C24'
    }
  ];

  // Summary calculations
  const paidCount = paidItems.length;
  const totalCount = items.length;
  const totalPaid = paidItems.reduce(
    (sum, it) => sum + (it.actualAmount ?? it.plannedAmount),
    0
  );
  const totalRemainingPending = pendingItems.reduce(
    (sum, it) => sum + it.plannedAmount,
    0
  );

  const summary: DashboardSummary = {
    totalPlanned: totalPaid + totalRemainingPending,
    totalPaid,
    totalRemainingPending,
    totalItems: totalCount,
    paidCount,
    pendingCount: pendingItems.length,
    skippedCount: 0
  };

  const accountsBreakdown: AccountBreakdown[] = [
    {
      id: 'acc-revolut',
      name: 'Revolut',
      type: 'REVOLUT',
      currency: 'HUF',
      color: '#0E8A9A',
      icon: 'credit-card',
      isDefault: false,
      paidAmount: paidItems
        .filter((it) => it.account?.type === 'REVOLUT' || it.account?.name.includes('Revolut'))
        .reduce((sum, it) => sum + (it.actualAmount ?? it.plannedAmount), 0),
      pendingAmount: pendingItems
        .filter((it) => it.account?.type === 'REVOLUT' || it.account?.name.includes('Revolut'))
        .reduce((sum, it) => sum + it.plannedAmount, 0),
      pendingItemsCount: pendingItems.filter(
        (it) => it.account?.type === 'REVOLUT' || it.account?.name.includes('Revolut')
      ).length,
      totalAllocated: 0
    },
    {
      id: 'acc-unicredit',
      name: 'UniCredit Folyószámla',
      type: 'BANK_ACCOUNT',
      currency: 'HUF',
      color: '#5D9CEC',
      icon: 'credit-card',
      isDefault: true,
      paidAmount: paidItems
        .filter((it) => it.account?.type === 'BANK_ACCOUNT' || it.account?.name.includes('UniCredit'))
        .reduce((sum, it) => sum + (it.actualAmount ?? it.plannedAmount), 0),
      pendingAmount: pendingItems
        .filter((it) => it.account?.type === 'BANK_ACCOUNT' || it.account?.name.includes('UniCredit'))
        .reduce((sum, it) => sum + it.plannedAmount, 0),
      pendingItemsCount: pendingItems.filter(
        (it) => it.account?.type === 'BANK_ACCOUNT' || it.account?.name.includes('UniCredit')
      ).length,
      totalAllocated: 0
    }
  ];

  accountsBreakdown[0].totalAllocated =
    accountsBreakdown[0].paidAmount + accountsBreakdown[0].pendingAmount;
  accountsBreakdown[1].totalAllocated =
    accountsBreakdown[1].paidAmount + accountsBreakdown[1].pendingAmount;

  // Action: Pay Item (Optimistic update + Toast)
  const handlePayItem = (item: DashboardItem, actualAmount?: number, paymentNote?: string) => {
    const payAmount = actualAmount ?? item.plannedAmount;
    setLastPaidItem({ ...item });

    // Optimistic UI state update
    setItems((prev) =>
      prev.map((it) =>
        it.fixedExpenseId === item.fixedExpenseId
          ? {
              ...it,
              status: 'PAID',
              actualAmount: payAmount,
              paymentNote: paymentNote || null,
              paidAt: new Date().toISOString()
            }
          : it
      )
    );

    setToastMessage(`Kifizetve: ${item.name} (${formatHUF(payAmount)})`);

    // Call API in background
    api.payments
      .pay(item.fixedExpenseId, {
        periodYearMonth: currentPeriod,
        actualAmount: payAmount,
        note: paymentNote
      })
      .catch((err) => {
        console.warn('[Overview] API pay sync failed:', err);
      });
  };

  // Action: Undo Payment
  const handleUndoPayment = () => {
    if (!lastPaidItem) return;

    setItems((prev) =>
      prev.map((it) =>
        it.fixedExpenseId === lastPaidItem.fixedExpenseId
          ? { ...it, status: 'PENDING', actualAmount: null, paidAt: null }
          : it
      )
    );

    api.payments
      .unpay(lastPaidItem.fixedExpenseId, { periodYearMonth: currentPeriod })
      .catch((err) => {
        console.warn('[Overview] API unpay sync failed:', err);
      });

    setLastPaidItem(null);
    setToastMessage(null);
  };

  // Action: Unpay Item (from Paid section)
  const handleUnpayItem = (item: DashboardItem) => {
    setItems((prev) =>
      prev.map((it) =>
        it.fixedExpenseId === item.fixedExpenseId
          ? { ...it, status: 'PENDING', actualAmount: null, paidAt: null }
          : it
      )
    );

    api.payments.unpay(item.fixedExpenseId, { periodYearMonth: currentPeriod }).catch(() => {});
  };

  return (
    <div className="space-y-6">
      {/* Responsive 12-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column (8 cols): Hero, Overdue, Day Grouped List, and Paid Section */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-5">
          {/* 1. Hero Card with Interactive Month Selector */}
          <HeroCard
            heroAmount={totalRemainingPending}
            allocations={allocations}
            monthLabel={currentMonthName}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onResetMonth={handleResetMonth}
            isCurrentMonthActual={isCurrentMonthActual}
            paidCount={paidCount}
            totalCount={totalCount}
          />

          {/* 2. Lejárt tételek sávja (csak ha van lejárt) */}
          <OverdueBanner
            overdueItems={overdueItems}
            onPayItem={(it) => {
              setSelectedExpense(it);
              setIsModalOpen(true);
            }}
          />

          {/* 3. Napokra csoportosított lista (kizárólag még esedékes és lejárt tételek) */}
          <DayGroupList
            items={items.filter((it) => it.status !== 'PAID')}
            onPayItem={(it) => {
              setSelectedExpense(it);
              setIsModalOpen(true);
            }}
            onUnpayItem={handleUnpayItem}
            onSelectItem={(it) => {
              setSelectedExpense(it);
              setIsModalOpen(true);
            }}
          />

          {/* 4. Már kifizetve ebben a hónapban szekció (áthelyezve a Tételek oldalról) */}
          <PaidSectionCollapsible
            paidItems={items.filter((it) => it.status === 'PAID')}
            onUnpay={handleUnpayItem}
            onSelect={(item) => {
              setSelectedExpense(item);
              setIsModalOpen(true);
            }}
          />
        </div>

        {/* Right Column (4 cols): Sticky on Desktop (Summary & Mini Calendar) */}
        <div className="hidden lg:block lg:col-span-4">
          <DesktopStickySummary
            summary={summary}
            accountsBreakdown={accountsBreakdown}
            items={items}
            monthLabel={currentMonthName}
          />
        </div>
      </div>

      {/* Undo Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onUndo={handleUndoPayment}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Full-screen Payment Recording Modal on item selection */}
      <ExpenseDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedExpense(null);
        }}
        expense={selectedExpense}
        accounts={accounts}
        onSave={async (expenseData) => {
          if (selectedExpense) {
            setItems((prev) =>
              prev.map((it) =>
                it.fixedExpenseId === selectedExpense.fixedExpenseId
                  ? {
                      ...it,
                      name: expenseData.name || it.name,
                      plannedAmount: expenseData.defaultAmount ?? it.plannedAmount
                    }
                  : it
              )
            );
          }
        }}
        onConfirmPayment={async (expItem, actualAmount, note) => {
          handlePayItem(expItem, actualAmount, note);
        }}
      />
    </div>
  );
};

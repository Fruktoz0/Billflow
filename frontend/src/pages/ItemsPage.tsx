import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Wifi,
  Home,
  Tv,
  Shield,
  CreditCard,
  FileText,
  PauseCircle,
  PlayCircle,
  History,
  Edit3,
  Trash2,
  Calendar,
  CheckCircle2,
  Layers,
  Repeat
} from 'lucide-react';
import {
  FixedExpense,
  BankAccount,
  ExpenseCategory,
  BillingCycle,
  PaymentHistoryRecord
} from '../types';
import { usePrivacy } from '../context/PrivacyContext';
import { api } from '../services/api';
import { FixedExpenseModal } from '../components/items/FixedExpenseModal';
import { ExpenseHistoryModal } from '../components/items/ExpenseHistoryModal';
import { Toast } from '../components/common/Toast';
import { formatHUF } from '../utils/format';

// Mock accounts
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

// Initial recurring expense templates (Master Catalog)
const initialFixedExpenses: FixedExpense[] = [
  {
    id: 'exp-telekom-urgent',
    householdId: 'h-1',
    name: 'Telekom Otthoni Net + TV',
    category: 'UTILITY',
    defaultAmount: 18900,
    isVariableAmount: false,
    billingCycle: 'MONTHLY',
    dueDay: 17,
    paymentMethod: 'DIRECT_DEBIT',
    defaultAccountId: 'acc-revolut',
    defaultAccount: mockAccounts[0],
    active: true
  },
  {
    id: 'exp-digi',
    householdId: 'h-1',
    name: 'DIGI Internet 1000',
    category: 'UTILITY',
    defaultAmount: 8990,
    isVariableAmount: false,
    billingCycle: 'MONTHLY',
    dueDay: 21,
    paymentMethod: 'DIRECT_DEBIT',
    defaultAccountId: 'acc-revolut',
    defaultAccount: mockAccounts[0],
    active: true
  },
  {
    id: 'exp-insur',
    householdId: 'h-1',
    name: 'Lakásbiztosítás Generali',
    category: 'INSURANCE',
    defaultAmount: 14500,
    isVariableAmount: false,
    billingCycle: 'MONTHLY',
    dueDay: 24,
    paymentMethod: 'BANK_TRANSFER',
    defaultAccountId: 'acc-unicredit',
    defaultAccount: mockAccounts[1],
    active: true
  },
  {
    id: 'exp-netflix',
    householdId: 'h-1',
    name: 'Netflix Prémium 4K',
    category: 'SUBSCRIPTION',
    defaultAmount: 4490,
    isVariableAmount: false,
    billingCycle: 'MONTHLY',
    dueDay: 25,
    paymentMethod: 'CARD',
    defaultAccountId: 'acc-revolut',
    defaultAccount: mockAccounts[0],
    active: true
  },
  {
    id: 'exp-lakber',
    householdId: 'h-1',
    name: 'Lakbér',
    category: 'HOUSING',
    defaultAmount: 140000,
    isVariableAmount: false,
    billingCycle: 'MONTHLY',
    dueDay: 10,
    paymentMethod: 'BANK_TRANSFER',
    defaultAccountId: 'acc-unicredit',
    defaultAccount: mockAccounts[1],
    active: true
  },
  {
    id: 'exp-spotify',
    householdId: 'h-1',
    name: 'Spotify Családi',
    category: 'SUBSCRIPTION',
    defaultAmount: 3290,
    isVariableAmount: false,
    billingCycle: 'MONTHLY',
    dueDay: 12,
    paymentMethod: 'CARD',
    defaultAccountId: 'acc-revolut',
    defaultAccount: mockAccounts[0],
    active: true
  },
  {
    id: 'exp-icloud',
    householdId: 'h-1',
    name: 'iCloud+ 2TB tárhely',
    category: 'SUBSCRIPTION',
    defaultAmount: 890,
    isVariableAmount: false,
    billingCycle: 'MONTHLY',
    dueDay: 14,
    paymentMethod: 'CARD',
    defaultAccountId: 'acc-revolut',
    defaultAccount: mockAccounts[0],
    active: true
  },
  {
    id: 'exp-yt',
    householdId: 'h-1',
    name: 'YouTube Premium',
    category: 'SUBSCRIPTION',
    defaultAmount: 2490,
    isVariableAmount: false,
    billingCycle: 'MONTHLY',
    dueDay: 15,
    paymentMethod: 'CARD',
    defaultAccountId: 'acc-revolut',
    defaultAccount: mockAccounts[0],
    active: true
  },
  {
    id: 'exp-eon',
    householdId: 'h-1',
    name: 'Áramszámla (E.ON)',
    category: 'UTILITY',
    defaultAmount: 16030,
    isVariableAmount: true,
    billingCycle: 'MONTHLY',
    dueDay: 16,
    paymentMethod: 'DIRECT_DEBIT',
    defaultAccountId: 'acc-unicredit',
    defaultAccount: mockAccounts[1],
    active: true
  },
  {
    id: 'exp-kozos',
    householdId: 'h-1',
    name: 'Közös költség & Felújítási alap',
    category: 'HOUSING',
    defaultAmount: 18500,
    isVariableAmount: false,
    billingCycle: 'MONTHLY',
    dueDay: 28,
    paymentMethod: 'BANK_TRANSFER',
    defaultAccountId: 'acc-unicredit',
    defaultAccount: mockAccounts[1],
    active: true
  },
  {
    id: 'exp-mobil',
    householdId: 'h-1',
    name: 'Mobilflotta előfizetés',
    category: 'UTILITY',
    defaultAmount: 18820,
    isVariableAmount: true,
    billingCycle: 'MONTHLY',
    dueDay: 30,
    paymentMethod: 'DIRECT_DEBIT',
    defaultAccountId: 'acc-unicredit',
    defaultAccount: mockAccounts[1],
    active: true
  },
  {
    id: 'exp-hbomax',
    householdId: 'h-1',
    name: 'Max (korábban HBO Max)',
    category: 'SUBSCRIPTION',
    defaultAmount: 2790,
    isVariableAmount: false,
    billingCycle: 'MONTHLY',
    dueDay: 8,
    paymentMethod: 'CARD',
    defaultAccountId: 'acc-revolut',
    defaultAccount: mockAccounts[0],
    active: false,
    pausedUntil: '2026-11-01',
    notes: 'Nyári szünetre szüneteltetve'
  }
];

const categoryIcons: Record<string, React.ReactNode> = {
  UTILITY: <Wifi className="w-5 h-5" />,
  HOUSING: <Home className="w-5 h-5" />,
  SUBSCRIPTION: <Tv className="w-5 h-5" />,
  INSURANCE: <Shield className="w-5 h-5" />,
  LOAN: <CreditCard className="w-5 h-5" />,
  OTHER: <FileText className="w-5 h-5" />
};

const categoryLabels: Record<string, string> = {
  UTILITY: 'Közmű / Rezsi',
  HOUSING: 'Lakhatás',
  SUBSCRIPTION: 'Előfizetés',
  INSURANCE: 'Biztosítás',
  LOAN: 'Hitel',
  OTHER: 'Egyéb'
};

const billingCycleLabels: Record<string, string> = {
  MONTHLY: 'Havonta',
  BIMONTHLY: 'Kéthavonta',
  QUARTERLY: 'Negyedévente',
  YEARLY: 'Évente'
};

export const ItemsPage: React.FC = () => {
  const { isPrivate } = usePrivacy();

  const [expenses, setExpenses] = useState<FixedExpense[]>(initialFixedExpenses);
  const [accounts, setAccounts] = useState<BankAccount[]>(mockAccounts);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyExpenseName, setHistoryExpenseName] = useState('');
  const [historyRecords, setHistoryRecords] = useState<PaymentHistoryRecord[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load backend data if available
  useEffect(() => {
    let isMounted = true;
    const loadExpenses = () => {
      api.fixedExpenses
        .getAll(true)
        .then((data) => {
          if (isMounted && data && data.length > 0) {
            setExpenses(data);
          }
        })
        .catch(() => {});
    };

    loadExpenses();

    api.accounts
      .getAll()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setAccounts(data);
        }
      })
      .catch(() => {});

    window.addEventListener('billflow:expense-created', loadExpenses);

    return () => {
      isMounted = false;
      window.removeEventListener('billflow:expense-created', loadExpenses);
    };
  }, []);

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = exp.name.toLowerCase().includes(q);
        const matchCat = (categoryLabels[exp.category] || '').toLowerCase().includes(q);
        if (!matchName && !matchCat) return false;
      }

      // Status
      if (statusFilter === 'ACTIVE' && !exp.active) return false;
      if (statusFilter === 'PAUSED' && exp.active) return false;

      // Category
      if (categoryFilter !== 'ALL' && exp.category !== categoryFilter) return false;

      // Account
      if (selectedAccountId !== 'ALL' && exp.defaultAccountId !== selectedAccountId) return false;

      return true;
    });
  }, [expenses, searchQuery, statusFilter, categoryFilter, selectedAccountId]);

  // Master Statistics
  const activeExpenses = expenses.filter((e) => e.active);
  const pausedExpenses = expenses.filter((e) => !e.active);
  const totalMonthlyCommitment = activeExpenses.reduce((sum, e) => sum + e.defaultAmount, 0);

  // Action: Toggle Pause / Resume
  const handleTogglePause = async (exp: FixedExpense, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newActiveState = !exp.active;
    const newPausedUntil = newActiveState ? null : exp.pausedUntil;

    // Optimistic UI update
    setExpenses((prev) =>
      prev.map((it) =>
        it.id === exp.id
          ? { ...it, active: newActiveState, pausedUntil: newPausedUntil }
          : it
      )
    );

    const msg = newActiveState
      ? `${exp.name} sikeresen újraaktiválva!`
      : `${exp.name} szüneteltetve (nem generál havi kötelezettséget).`;
    setToastMessage(msg);

    try {
      await api.fixedExpenses.update(exp.id, {
        active: newActiveState,
        ...(newActiveState && { pausedUntil: null })
      });
    } catch (err) {
      console.warn('[ItemsPage] Toggle active sync failed:', err);
    }
  };

  // Action: Save or Update Template
  const handleSaveExpense = async (data: Partial<FixedExpense>) => {
    if (editingExpense) {
      // Update existing
      setExpenses((prev) =>
        prev.map((it) =>
          it.id === editingExpense.id
            ? {
                ...it,
                ...data,
                defaultAccount:
                  accounts.find((a) => a.id === data.defaultAccountId) || it.defaultAccount
              }
            : it
        )
      );
      setToastMessage(`${data.name || editingExpense.name} sablon frissítve.`);

      try {
        await api.fixedExpenses.update(editingExpense.id, data);
      } catch (err) {
        console.warn('[ItemsPage] Update failed:', err);
      }
    } else {
      // Create new template
      const newId = `exp-custom-${Date.now()}`;
      const acc = accounts.find((a) => a.id === data.defaultAccountId) || accounts[0];
      const newExpense: FixedExpense = {
        id: newId,
        householdId: 'h-1',
        name: data.name || 'Új kiadás',
        category: data.category || 'UTILITY',
        defaultAmount: data.defaultAmount || 0,
        isVariableAmount: Boolean(data.isVariableAmount),
        billingCycle: data.billingCycle || 'MONTHLY',
        dueDay: data.dueDay || 15,
        paymentMethod: data.paymentMethod || 'DIRECT_DEBIT',
        defaultAccountId: acc?.id || null,
        defaultAccount: acc,
        active: data.active !== false,
        notes: data.notes || null
      };

      setExpenses((prev) => [newExpense, ...prev]);
      setToastMessage(`${newExpense.name} sikeresen rögzítve a rendszeres kiadások közé!`);

      try {
        await api.fixedExpenses.create(data);
      } catch (err) {
        console.warn('[ItemsPage] Create failed:', err);
      }
    }
  };

  // Action: Delete Template
  const handleDeleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((it) => it.id !== id));
    setToastMessage('Tétel véglegesen eltávolítva a rendszerből.');
    try {
      await api.fixedExpenses.delete(id);
    } catch (err) {
      console.warn('[ItemsPage] Delete failed:', err);
    }
  };

  // Action: Open Payment History Modal
  const handleOpenHistory = (exp: FixedExpense, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setHistoryExpenseName(exp.name);

    // Generate realistic historical records matching this expense
    const pastRecords: PaymentHistoryRecord[] = [
      {
        id: `hist-${exp.id}-1`,
        periodYearMonth: '2026-08',
        amount: exp.defaultAmount,
        paidAt: '2026-08-15T09:30:00Z',
        status: 'PAID',
        paymentMethod: exp.paymentMethod,
        accountName: exp.defaultAccount?.name || 'Revolut'
      },
      {
        id: `hist-${exp.id}-2`,
        periodYearMonth: '2026-07',
        amount: exp.isVariableAmount ? Math.round(exp.defaultAmount * 0.94) : exp.defaultAmount,
        paidAt: '2026-07-16T11:00:00Z',
        status: 'PAID',
        paymentMethod: exp.paymentMethod,
        accountName: exp.defaultAccount?.name || 'Revolut'
      },
      {
        id: `hist-${exp.id}-3`,
        periodYearMonth: '2026-06',
        amount: exp.isVariableAmount ? Math.round(exp.defaultAmount * 1.05) : exp.defaultAmount,
        paidAt: '2026-06-15T14:15:00Z',
        status: 'PAID',
        paymentMethod: exp.paymentMethod,
        accountName: exp.defaultAccount?.name || 'Revolut'
      },
      {
        id: `hist-${exp.id}-4`,
        periodYearMonth: '2026-05',
        amount: exp.defaultAmount,
        paidAt: '2026-05-15T08:45:00Z',
        status: 'PAID',
        paymentMethod: exp.paymentMethod,
        accountName: exp.defaultAccount?.name || 'Revolut'
      },
      {
        id: `hist-${exp.id}-5`,
        periodYearMonth: '2026-04',
        amount: exp.defaultAmount,
        paidAt: '2026-04-14T10:20:00Z',
        status: 'PAID',
        paymentMethod: exp.paymentMethod,
        accountName: exp.defaultAccount?.name || 'Revolut'
      }
    ];

    setHistoryRecords(pastRecords);
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="billflow-card rounded-card p-4 bg-surface border border-line shadow-card">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-2">Rendszeres kiadások áttekintése</span>
          <button
            type="button"
            onClick={() => {
              setEditingExpense(null);
              setIsEditModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-control bg-accent hover:bg-accent-strong active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Új tétel</span>
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-line/60">
          {/* Havi fix */}
          <div className="space-y-0.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-ink-2 uppercase tracking-wider">
              <Layers className="w-3 h-3 text-accent" />
              <span>Havi</span>
            </div>
            <div
              className={`text-base sm:text-lg font-extrabold text-ink tabular-nums ${
                isPrivate ? 'privacy-blur' : ''
              }`}
            >
              {formatHUF(totalMonthlyCommitment)}
            </div>
          </div>
          {/* Aktív */}
          <div className="space-y-0.5 text-center border-x border-line/60">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <PlayCircle className="w-3 h-3" />
              <span>Aktív</span>
            </div>
            <div className="text-base sm:text-lg font-extrabold text-ink tabular-nums">
              {activeExpenses.length} db
            </div>
          </div>
          {/* Szüneteltetett */}
          <div className="space-y-0.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <PauseCircle className="w-3 h-3" />
              <span>Szünet</span>
            </div>
            <div className="text-base sm:text-lg font-extrabold text-ink tabular-nums">
              {pausedExpenses.length} db
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="billflow-card rounded-card p-4 bg-surface border border-line shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Keresés tétel neve vagy kategóriája szerint..."
              className="w-full pl-10 pr-4 py-2 bg-bg border border-line rounded-control text-xs sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-ink-2/60"
            />
          </div>

          {/* Account Filter Dropdown */}
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="px-3.5 py-2 bg-bg border border-line rounded-control text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="ALL">Minden bankszámla</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Chips & Category Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/60">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-bg p-1 rounded-control border border-line text-xs font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-control transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-surface text-ink shadow-xs'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              Mind ({expenses.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 rounded-control transition-all ${
                statusFilter === 'ACTIVE'
                  ? 'bg-surface text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              Aktív ({activeExpenses.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PAUSED')}
              className={`px-3 py-1 rounded-control transition-all ${
                statusFilter === 'PAUSED'
                  ? 'bg-surface text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              Szüneteltetett ({pausedExpenses.length})
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold py-1">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-full border transition-all shrink-0 ${
                categoryFilter === 'ALL'
                  ? 'border-accent bg-accent-tint text-accent-text'
                  : 'border-line text-ink-2 hover:text-ink'
              }`}
            >
              Összes kategória
            </button>
            {Object.entries(categoryLabels).map(([catKey, label]) => (
              <button
                key={catKey}
                type="button"
                onClick={() => setCategoryFilter(catKey)}
                className={`px-2.5 py-1 rounded-full border transition-all shrink-0 ${
                  categoryFilter === catKey
                    ? 'border-accent bg-accent-tint text-accent-text'
                    : 'border-line text-ink-2 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Master Catalog List: Individual Cards without monthly overdue / pay buttons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-2">
            Rendszerben rögzített sablonok ({filteredExpenses.length})
          </span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="billflow-card rounded-card p-8 bg-surface border border-line text-center space-y-2">
            <p className="text-sm font-semibold text-ink">Nincs a szűrésnek megfelelő tétel</p>
            <p className="text-xs text-ink-2">Próbáld módosítani a keresési vagy szűrési feltételeket.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => {
                    setEditingExpense(exp);
                    setIsEditModalOpen(true);
                  }}
                  className={`billflow-card rounded-card border bg-surface hover:bg-surface-elevated transition-all shadow-card cursor-pointer group ${
                    exp.active ? 'border-line' : 'border-amber-300/60 dark:border-amber-700/40 opacity-80'
                  }`}
                >
                  {/* Card Body */}
                  <div className="p-3.5 sm:p-4">
                    {/* Top Row: Icon + Title/Category + Aesthetic Amount capsule */}
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Category Icon + Title & Category subtitle */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-10 h-10 rounded-control flex items-center justify-center shrink-0 border ${
                            exp.active
                              ? 'bg-accent-tint text-accent-text border-accent/20'
                              : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 border-amber-300 dark:border-amber-800/40'
                          }`}
                        >
                          {categoryIcons[exp.category] || <FileText className="w-5 h-5" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm sm:text-base font-bold text-ink truncate group-hover:text-accent transition-colors leading-snug">
                            {exp.name}
                          </h3>
                          <p className="text-xs text-ink-2 font-medium truncate mt-0.5">
                            {categoryLabels[exp.category] || 'Egyéb'}
                          </p>
                        </div>
                      </div>

                      {/* Right: Aesthetic Amount Capsule */}
                      <div className="shrink-0 text-right">
                        <div className="inline-flex flex-col items-end px-3 py-1.5 rounded-control bg-accent-tint/40 dark:bg-accent-tint/25 border border-accent/25 shadow-2xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-accent-text dark:text-accent leading-none mb-1">
                            {exp.isVariableAmount ? 'Várható / hó' : 'Fix / hó'}
                          </span>
                          <span
                            className={`text-sm sm:text-base font-black text-accent dark:text-accent-text tracking-tight tabular-nums leading-none ${
                              isPrivate ? 'privacy-blur' : ''
                            }`}
                          >
                            {exp.isVariableAmount && (
                              <span className="text-accent-text font-bold text-xs mr-0.5">~</span>
                            )}
                            {formatHUF(exp.defaultAmount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Status Row: Full-width, clean non-wrapping badges */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2.5">
                      {/* 1. Gyakoriság badge */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-control bg-bg border border-line text-ink font-semibold text-xs shadow-2xs">
                        <Repeat className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span>{billingCycleLabels[exp.billingCycle] || 'Havonta'}</span>
                      </span>

                      {/* 2. Esedékességi nap badge */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-control bg-accent-tint/60 border border-accent/25 text-accent-text font-bold text-xs font-mono shadow-2xs">
                        <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span>minden hó {exp.dueDay}-én</span>
                      </span>

                      {/* 3. Paused status badge (ONLY when paused) */}
                      {!exp.active && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-control bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-500/25 shadow-2xs">
                          <PauseCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>
                            {exp.pausedUntil
                              ? `Szünetel: ${exp.pausedUntil.replace(/-/g, '.')}-ig`
                              : 'Szüneteltetve'}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: 3-column equal action buttons for comfortable mobile tap */}
                  <div
                    className="p-2 sm:p-2.5 border-t border-line/60 grid grid-cols-3 gap-2 bg-surface-elevated/30"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* 1. Pause / Resume */}
                    <button
                      type="button"
                      onClick={(e) => handleTogglePause(exp, e)}
                      className={`h-10 px-2 sm:px-3 rounded-control border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-xs ${
                        exp.active
                          ? 'bg-bg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-ink hover:text-amber-600 border-line hover:border-amber-300'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/50'
                      }`}
                      title={exp.active ? 'Tétel szüneteltetése' : 'Tétel újraaktiválása'}
                    >
                      {exp.active ? (
                        <>
                          <PauseCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">Szünet</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">Aktiválás</span>
                        </>
                      )}
                    </button>

                    {/* 2. History */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenHistory(exp, e)}
                      className="h-10 px-2 sm:px-3 rounded-control bg-bg hover:bg-surface-elevated text-ink hover:text-accent border border-line transition-all active:scale-98 flex items-center justify-center gap-1.5 text-xs font-semibold shadow-xs"
                      title="Fizetési előzmények megtekintése"
                    >
                      <History className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="truncate">Előzmények</span>
                    </button>

                    {/* 3. Edit */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExpense(exp);
                        setIsEditModalOpen(true);
                      }}
                      className="h-10 px-2 sm:px-3 rounded-control bg-bg hover:bg-surface-elevated text-ink hover:text-accent border border-line transition-all active:scale-98 flex items-center justify-center gap-1.5 text-xs font-semibold shadow-xs"
                      title="Sablon szerkesztése"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-ink-2 shrink-0" />
                      <span className="truncate">Szerkesztés</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 5. Fixed Expense Create / Edit Modal */}
      {isEditModalOpen && (
        <FixedExpenseModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingExpense(null);
          }}
          onSave={handleSaveExpense}
          onDelete={handleDeleteExpense}
          expense={editingExpense}
          accounts={accounts}
        />
      )}

      {/* 6. Payment History Modal */}
      {isHistoryModalOpen && (
        <ExpenseHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          expenseName={historyExpenseName}
          historyRecords={historyRecords}
        />
      )}

      {/* 7. Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Home,
  Tv,
  Shield,
  CreditCard,
  FileText,
  Clock
} from 'lucide-react';
import { DashboardItem, BankAccount, FixedExpense } from '../types';
import { usePrivacy } from '../context/PrivacyContext';
import { api } from '../services/api';
import { ExpenseDetailModal } from '../components/items/ExpenseDetailModal';
import { Toast } from '../components/common/Toast';

const WEEKDAYS = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
const MONTH_NAMES = [
  'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
  'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
];

const mockAccounts: BankAccount[] = [
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

const initialMockItems: DashboardItem[] = [
  {
    id: 'cal-item-1',
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
    id: 'cal-item-2',
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
    id: 'cal-item-3',
    fixedExpenseId: 'exp-telekom-urgent',
    name: 'Telekom Otthoni Net + TV',
    category: 'UTILITY',
    dueDay: 17,
    billingCycle: 'MONTHLY',
    paymentMethod: 'DIRECT_DEBIT',
    isVariableAmount: false,
    status: 'PENDING',
    plannedAmount: 18900,
    actualAmount: null,
    accountId: 'acc-revolut',
    account: mockAccounts[0],
    isVirtual: false
  },
  {
    id: 'cal-item-4',
    fixedExpenseId: 'exp-digi',
    name: 'DIGI Internet 1000',
    category: 'UTILITY',
    dueDay: 21,
    billingCycle: 'MONTHLY',
    paymentMethod: 'DIRECT_DEBIT',
    isVariableAmount: false,
    status: 'PENDING',
    plannedAmount: 8990,
    actualAmount: null,
    accountId: 'acc-revolut',
    account: mockAccounts[0],
    isVirtual: false
  },
  {
    id: 'cal-item-5',
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
    id: 'cal-item-6',
    fixedExpenseId: 'exp-netflix',
    name: 'Netflix Prémium 4K',
    category: 'SUBSCRIPTION',
    dueDay: 25,
    billingCycle: 'MONTHLY',
    paymentMethod: 'CARD',
    isVariableAmount: false,
    status: 'PENDING',
    plannedAmount: 4490,
    actualAmount: null,
    accountId: 'acc-revolut',
    account: mockAccounts[0],
    isVirtual: false
  },
  {
    id: 'cal-item-7',
    fixedExpenseId: 'exp-kozos',
    name: 'Közös költség',
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
  }
];

const categoryIcons: Record<string, React.ReactNode> = {
  UTILITY: <Wifi className="w-4 h-4" />,
  HOUSING: <Home className="w-4 h-4" />,
  SUBSCRIPTION: <Tv className="w-4 h-4" />,
  INSURANCE: <Shield className="w-4 h-4" />,
  LOAN: <CreditCard className="w-4 h-4" />,
  OTHER: <FileText className="w-4 h-4" />
};

export const CalendarPage: React.FC = () => {
  const { isPrivate } = usePrivacy();

  // Current calendar viewing state (September 2026 per mockups)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 0-indexed: 8 is September
  const [selectedDay, setSelectedDay] = useState<number>(19); // default selected day: 19th
  const [items, setItems] = useState<DashboardItem[]>(initialMockItems);
  const [accounts, setAccounts] = useState<BankAccount[]>(mockAccounts);

  // Modal and toast states
  const [selectedExpense, setSelectedExpense] = useState<DashboardItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastPaidItem, setLastPaidItem] = useState<DashboardItem | null>(null);

  const todayDay = 19; // 19th of September
  const isCurrentMonthActual = currentYear === 2026 && currentMonth === 8;

  const formatHUF = (val: number) =>
    new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(Math.round(val)) + '\u00A0Ft';

  // Load monthly items if available
  useEffect(() => {
    let isMounted = true;
    const yearMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    api.dashboard
      .getMonthly(yearMonth)
      .then((data) => {
        if (isMounted && data.items && data.items.length > 0) {
          setItems(data.items);
        } else if (isMounted) {
          if (currentYear === 2026 && currentMonth === 8) {
            setItems(initialMockItems);
          } else {
            setItems(
              initialMockItems.map((it) => ({
                ...it,
                status: 'PENDING',
                actualAmount: null,
                paidAt: null
              }))
            );
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          if (currentYear === 2026 && currentMonth === 8) {
            setItems(initialMockItems);
          } else {
            setItems(
              initialMockItems.map((it) => ({
                ...it,
                status: 'PENDING',
                actualAmount: null,
                paidAt: null
              }))
            );
          }
        }
      });

    api.accounts.getAll().then((accs) => {
      if (isMounted && accs.length > 0) setAccounts(accs);
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [currentYear, currentMonth]);

  // Calendar math: Monday-based days grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Monday = 0

  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  const calendarCells = useMemo(() => {
    const cells: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Preceding month filler
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        dateStr: 'prev'
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        isCurrentMonth: true,
        dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      });
    }

    // Next month filler to complete rows of 7
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      cells.push({
        day: n,
        isCurrentMonth: false,
        dateStr: 'next'
      });
    }

    return cells;
  }, [currentYear, currentMonth, daysInMonth, firstDayIndex, prevMonthDays]);

  // Map items to due days
  const itemsByDay = useMemo(() => {
    const map: Record<number, DashboardItem[]> = {};
    items.forEach((it) => {
      if (!map[it.dueDay]) map[it.dueDay] = [];
      map[it.dueDay].push(it);
    });
    return map;
  }, [items]);

  // Items on selected day
  const selectedDayItems = itemsByDay[selectedDay] || [];
  const selectedDayTotal = selectedDayItems.reduce(
    (sum, it) => sum + (it.actualAmount ?? it.plannedAmount),
    0
  );

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(8);
    setSelectedDay(19);
  };

  // Pay Item handler
  const handlePay = (item: DashboardItem) => {
    setLastPaidItem({ ...item });
    setItems((prev) =>
      prev.map((it) =>
        it.fixedExpenseId === item.fixedExpenseId
          ? { ...it, status: 'PAID', actualAmount: it.plannedAmount, paidAt: new Date().toISOString() }
          : it
      )
    );

    setToastMessage(`Kifizetve: ${item.name}`);

    api.payments
      .pay(item.fixedExpenseId, {
        periodYearMonth: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
        actualAmount: item.plannedAmount
      })
      .catch(() => {});
  };

  const handleUndo = () => {
    if (!lastPaidItem) return;

    setItems((prev) =>
      prev.map((it) =>
        it.fixedExpenseId === lastPaidItem.fixedExpenseId
          ? { ...it, status: 'PENDING', actualAmount: null, paidAt: null }
          : it
      )
    );

    api.payments
      .unpay(lastPaidItem.fixedExpenseId, {
        periodYearMonth: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
      })
      .catch(() => {});

    setLastPaidItem(null);
    setToastMessage(null);
  };

  const handleSaveExpense = async (data: Partial<FixedExpense>) => {
    if (selectedExpense) {
      const targetId = selectedExpense.fixedExpenseId || selectedExpense.id;
      if (targetId) {
        try {
          await api.fixedExpenses.update(targetId, data);
        } catch {}
      }
      setItems((prev) =>
        prev.map((it) =>
          it.fixedExpenseId === targetId
            ? {
                ...it,
                name: data.name || it.name,
                category: data.category || it.category,
                plannedAmount: data.defaultAmount ?? it.plannedAmount,
                dueDay: data.dueDay ?? it.dueDay
              }
            : it
        )
      );
    }
  };

  // Monthly totals
  const totalPlanned = items.reduce((sum, it) => sum + (it.actualAmount ?? it.plannedAmount), 0);
  const totalPaid = items
    .filter((it) => it.status === 'PAID')
    .reduce((sum, it) => sum + (it.actualAmount ?? it.plannedAmount), 0);
  const totalPending = totalPlanned - totalPaid;

  return (
    <div className="space-y-6">
      {/* 1. Full-Width Centered Year Selector Header */}
      <div className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-card bg-surface border border-line shadow-card">
        <button
          type="button"
          onClick={() => setCurrentYear((y) => y - 1)}
          className="p-2 sm:p-2.5 rounded-control hover:bg-surface-elevated text-ink-2 hover:text-ink transition-colors"
          title="Előző év"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-accent" />
          <span className="text-base sm:text-lg font-extrabold text-ink font-mono tracking-tight">
            {currentYear}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setCurrentYear((y) => y + 1)}
          className="p-2 sm:p-2.5 rounded-control hover:bg-surface-elevated text-ink-2 hover:text-ink transition-colors"
          title="Következő év"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Horizontal Scroll-Snap Month Pill Bar (Jan - Dec) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 scroll-smooth">
        {MONTH_NAMES.map((mName, idx) => {
          const isSelected = currentMonth === idx;
          return (
            <button
              key={mName}
              type="button"
              onClick={() => setCurrentMonth(idx)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                isSelected
                  ? 'bg-accent-strong text-on-accent shadow-sm font-bold ring-2 ring-accent/30'
                  : 'bg-surface border border-line text-ink-2 hover:text-ink hover:bg-surface-elevated'
              }`}
            >
              {mName}
            </button>
          );
        })}
      </div>

      {/* 3. Aesthetic Current Date Card (Under the Month Badges) */}
      <div className="flex items-center justify-between p-3.5 rounded-card bg-surface border border-line shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-control bg-accent-tint text-accent flex flex-col items-center justify-center font-mono border border-accent/20 shrink-0">
            <span className="text-[9px] font-bold uppercase leading-none text-accent-text">SZEPT</span>
            <span className="text-sm font-extrabold leading-none mt-0.5">19</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-2 block">
              Aktuális mai dátum
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-ink font-display">
              2026. szeptember 19., szombat
            </h4>
          </div>
        </div>

        {!isCurrentMonthActual && (
          <button
            type="button"
            onClick={handleGoToToday}
            className="px-3 py-1.5 rounded-control text-xs font-bold text-accent bg-accent-tint/60 hover:bg-accent-tint active:scale-95 transition-all shadow-2xs"
          >
            Ugrás mára
          </button>
        )}
      </div>

      {/* 2. Monthly Summary: Kifizetve & Még esedékes (2 columns) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="p-3.5 rounded-card bg-surface border border-line shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-paid block">
            Kifizetve
          </span>
          <span
            className={`text-base sm:text-lg font-extrabold text-paid tabular-nums ${
              isPrivate ? 'privacy-blur' : ''
            }`}
          >
            {formatHUF(totalPaid)}
          </span>
        </div>

        <div className="p-3.5 rounded-card bg-surface border border-line shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-accent block">
            Még esedékes
          </span>
          <span
            className={`text-base sm:text-lg font-extrabold text-accent tabular-nums ${
              isPrivate ? 'privacy-blur' : ''
            }`}
          >
            {formatHUF(totalPending)}
          </span>
        </div>
      </div>

      {/* 3. Main Grid Layout (Desktop 12-cols or stacked mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Calendar Grid */}
        <div className="lg:col-span-8 billflow-card rounded-hero p-4 sm:p-6 bg-surface border border-line shadow-card space-y-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((wd, i) => (
              <div
                key={wd}
                className={`py-1 text-xs font-bold ${
                  i >= 5 ? 'text-accent' : 'text-ink-2'
                }`}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarCells.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return (
                  <div
                    key={`dim-${idx}`}
                    className="min-h-[52px] sm:min-h-[64px] p-1.5 rounded-control text-ink-2/30 text-xs font-medium bg-bg/40 border border-transparent select-none"
                  >
                    <span>{cell.day}</span>
                  </div>
                );
              }

              const dayItems = itemsByDay[cell.day] || [];
              const isToday = isCurrentMonthActual && cell.day === todayDay;
              const isSelected = cell.day === selectedDay;

              const hasOverdue = dayItems.some(
                (it) => it.status === 'PENDING' && cell.day < todayDay && isCurrentMonthActual
              );
              const hasPending = dayItems.some(
                (it) => it.status === 'PENDING' && (cell.day >= todayDay || !isCurrentMonthActual)
              );
              const hasPaid = dayItems.some((it) => it.status === 'PAID');

              return (
                <div
                  key={`day-${cell.day}`}
                  onClick={() => setSelectedDay(cell.day)}
                  className={`min-h-[52px] sm:min-h-[64px] p-1.5 rounded-control cursor-pointer transition-all flex flex-col justify-between border ${
                    isSelected
                      ? 'bg-accent-tint/40 border-accent ring-2 ring-accent/30 shadow-xs'
                      : 'bg-surface hover:bg-surface-elevated border-line/60'
                  }`}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-accent text-white shadow-xs'
                          : isSelected
                          ? 'text-accent font-extrabold'
                          : 'text-ink'
                      }`}
                    >
                      {cell.day}
                    </span>

                    {dayItems.length > 0 && (
                      <span className="text-[10px] font-mono text-ink-2 hidden sm:inline">
                        {dayItems.length}
                      </span>
                    )}
                  </div>

                  {/* Status Dots */}
                  <div className="flex items-center gap-1 mt-1 justify-center sm:justify-start">
                    {hasOverdue && (
                      <span
                        className="w-2 h-2 rounded-full bg-overdue shadow-xs"
                        title="Lejárt tétel"
                      />
                    )}
                    {hasPending && (
                      <span
                        className="w-2 h-2 rounded-full bg-accent shadow-xs"
                        title="Esedékes tétel"
                      />
                    )}
                    {hasPaid && (
                      <span
                        className="w-2 h-2 rounded-full bg-paid shadow-xs"
                        title="Kifizetett tétel"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-line text-[11px] text-ink-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span>Esedékes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-overdue" />
                <span>Lejárt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-paid" />
                <span>Kifizetve</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">
                19
              </span>
              <span>Mai nap</span>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Selected Day Detail List */}
        <div className="lg:col-span-4 billflow-card rounded-hero p-5 bg-surface border border-line shadow-card space-y-4">
          <div className="border-b border-line pb-3 flex items-baseline justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-2 block">
                Kiválasztott nap
              </span>
              <h3 className="text-base sm:text-lg font-bold text-ink">
                {currentYear}. {MONTH_NAMES[currentMonth]} {selectedDay}.
              </h3>
            </div>

            {selectedDayTotal > 0 && (
              <span
                className={`text-sm font-bold text-ink tabular-nums ${
                  isPrivate ? 'privacy-blur' : ''
                }`}
              >
                {formatHUF(selectedDayTotal)}
              </span>
            )}
          </div>

          {/* Selected Day Items */}
          {selectedDayItems.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-accent-tint text-accent flex items-center justify-center mx-auto">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-ink">
                Nincs esedékes tétel ezen a napon
              </p>
              <p className="text-[11px] text-ink-2 max-w-[200px] mx-auto">
                Kattints egy másik napra pöttyökkel a kötelezettségek megtekintéséhez.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {selectedDayItems.map((item) => {
                const amount = item.actualAmount ?? item.plannedAmount;
                const isOverdue =
                  item.status === 'PENDING' && selectedDay < todayDay && isCurrentMonthActual;

                return (
                  <div
                    key={item.id || item.fixedExpenseId}
                    onClick={() => {
                      setSelectedExpense(item);
                      setIsModalOpen(true);
                    }}
                    className="p-3 rounded-card border border-line bg-bg hover:bg-surface-elevated transition-colors cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-control bg-accent-tint text-accent-text flex items-center justify-center shrink-0">
                          {categoryIcons[item.category] || <FileText className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-ink truncate group-hover:text-accent transition-colors">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-ink-2 mt-0.5">
                            <span className="font-mono text-ink-2 font-medium">
                              {currentYear}.{String(currentMonth + 1).padStart(2, '0')}.{String(item.dueDay).padStart(2, '0')}.
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`text-xs font-extrabold text-ink tabular-nums ${
                            isPrivate ? 'privacy-blur' : ''
                          }`}
                        >
                          {formatHUF(amount)}
                        </div>
                        <span
                          className={`text-[10px] font-bold ${
                            item.status === 'PAID'
                              ? 'text-paid'
                              : isOverdue
                              ? 'text-overdue'
                              : 'text-accent'
                          }`}
                        >
                          {item.status === 'PAID'
                            ? 'Kifizetve'
                            : isOverdue
                            ? 'Lejárt'
                            : 'Esedékes'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Action Button: Wide Befizetés Button */}
                    {item.status === 'PENDING' && (
                      <div className="pt-1 border-t border-line/60 flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExpense(item);
                            setIsModalOpen(true);
                          }}
                          className="px-3 py-1 rounded-control bg-accent hover:bg-accent-strong text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Befizetés</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Expense Detail Modal */}
      <ExpenseDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedExpense(null);
        }}
        expense={selectedExpense}
        accounts={accounts}
        onSave={handleSaveExpense}
        onConfirmPayment={async (expItem, actualAmount, note) => {
          handlePay(expItem);
        }}
      />

      {/* Undo Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onUndo={handleUndo}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};

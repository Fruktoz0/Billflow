import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Check,
  Calendar,
  Trash2,
  PauseCircle,
  PlayCircle,
  Clock
} from 'lucide-react';
import {
  FixedExpense,
  ExpenseCategory,
  BillingCycle,
  PaymentMethod,
  BankAccount
} from '../../types';
import { BankBadge } from '../common/BankBadge';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface FixedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FixedExpense>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  expense?: FixedExpense | null;
  accounts: BankAccount[];
}

const CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: 'UTILITY', label: 'Közmű / Rezsi' },
  { id: 'HOUSING', label: 'Lakhatás / Bérlet' },
  { id: 'SUBSCRIPTION', label: 'Előfizetés / Digitális' },
  { id: 'INSURANCE', label: 'Biztosítás' },
  { id: 'LOAN', label: 'Hitel / Lízing' },
  { id: 'OTHER', label: 'Egyéb rendszeres kiadás' }
];

const BILLING_CYCLES: { id: BillingCycle; label: string }[] = [
  { id: 'MONTHLY', label: 'Havonta' },
  { id: 'BIMONTHLY', label: 'Kéthavonta' },
  { id: 'QUARTERLY', label: 'Negyedévente' },
  { id: 'YEARLY', label: 'Évente' }
];

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'DIRECT_DEBIT', label: 'Csoportos beszedés' },
  { id: 'BANK_TRANSFER', label: 'Banki átutalás' },
  { id: 'CARD', label: 'Bankkártyás levonás' },
  { id: 'MANUAL', label: 'Készpénz / Manuális' }
];

export const FixedExpenseModal: React.FC<FixedExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  expense,
  accounts
}) => {
  useBodyScrollLock(isOpen);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('UTILITY');
  const [amount, setAmount] = useState<number | string>(10000);
  const [isVariableAmount, setIsVariableAmount] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [dueDay, setDueDay] = useState<number>(15);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('DIRECT_DEBIT');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [active, setActive] = useState(true);
  const [pauseType, setPauseType] = useState<'months' | 'date' | 'indefinite'>('months');
  const [pauseMonths, setPauseMonths] = useState<number>(1);
  const [pauseSpecificDate, setPauseSpecificDate] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (expense) {
      setName(expense.name || '');
      setCategory(expense.category || 'UTILITY');
      setAmount(expense.defaultAmount || 0);
      setIsVariableAmount(Boolean(expense.isVariableAmount));
      setBillingCycle(expense.billingCycle || 'MONTHLY');
      setDueDay(expense.dueDay || 15);
      setPaymentMethod(expense.paymentMethod || 'DIRECT_DEBIT');
      setSelectedAccountId(expense.defaultAccountId || accounts[0]?.id || '');
      setActive(expense.active !== false);
      setNotes(expense.notes || '');

      if (expense.pausedUntil) {
        setPauseSpecificDate(expense.pausedUntil);
        setPauseType('date');
      } else if (expense.active === false) {
        setPauseType('indefinite');
        setPauseMonths(1);
        setPauseSpecificDate('');
      } else {
        setPauseType('months');
        setPauseMonths(1);
        setPauseSpecificDate('');
      }
    } else {
      setName('');
      setCategory('UTILITY');
      setAmount(10000);
      setIsVariableAmount(false);
      setBillingCycle('MONTHLY');
      setDueDay(15);
      setPaymentMethod('DIRECT_DEBIT');
      setSelectedAccountId(accounts[0]?.id || '');
      setActive(true);
      setPauseType('months');
      setPauseMonths(1);
      setPauseSpecificDate('');
      setNotes('');
    }
    setShowDeleteConfirm(false);
  }, [expense, accounts, isOpen]);

  // Calculate calculated date when pausedUntil is in months
  const calculatePausedUntil = (): string | null => {
    if (active) return null;
    if (pauseType === 'indefinite') return null;
    if (pauseType === 'date') return pauseSpecificDate || null;
    if (pauseType === 'months') {
      const d = new Date();
      d.setMonth(d.getMonth() + pauseMonths);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(Math.min(Number(dueDay) || 15, new Date(yyyy, d.getMonth() + 1, 0).getDate())).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return null;
  };

  // Human-friendly preview of resume date
  const getResumeDatePreview = (): string => {
    const computed = calculatePausedUntil();
    if (!computed) return 'Kézi újraaktiválásig szünetel';
    const parts = computed.split('-');
    if (parts.length === 3) {
      return `Újraindul: ${parts[0]}. ${parts[1]}. ${parts[2]}.`;
    }
    return `Újraindul: ${computed}`;
  };

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSaving(true);
      await onSave({
        name: name.trim(),
        category,
        defaultAmount: typeof amount === 'string' ? parseFloat(amount) || 0 : amount,
        isVariableAmount,
        billingCycle,
        dueDay: Number(dueDay) || 1,
        paymentMethod,
        defaultAccountId: selectedAccountId,
        active,
        pausedUntil: calculatePausedUntil(),
        notes: notes.trim() || null
      });
      onClose();
    } catch (err) {
      console.error('[FixedExpenseModal] Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-surface flex flex-col w-screen h-[100dvh] max-h-[100dvh] overflow-hidden animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      {/* Sticky Header with X */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-line bg-surface-elevated/80 flex items-center justify-between gap-3 shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <BankBadge account={selectedAccount} size="md" />
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-xl font-extrabold text-ink tracking-tight truncate leading-tight">
              {expense ? 'Tétel sablon szerkesztése' : 'Új rendszeres kiadás felvitele'}
            </h2>
            <p className="text-xs text-ink-2 mt-0.5 truncate">
              {expense
                ? expense.name
                : 'Állandó havi rezsi, előfizetés vagy fix kötelezettség'}
            </p>
          </div>
        </div>

        {/* Top Sticky Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-surface-elevated active:scale-95 text-ink-2 hover:text-ink transition-all shrink-0 border border-line/60 bg-surface/80"
          title="Bezárás (Esc)"
          aria-label="Bezárás"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Content - Full Width Edge-to-Edge with min-h-0 so flex child scrolls and doesn't push footer offscreen */}
      <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 lg:px-12 py-5 space-y-6 w-full max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Basic Details */}
          <div className="space-y-5">
            {/* 1. Name */}
            <div className="billflow-card rounded-card p-5 bg-surface border border-line shadow-xs space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                  Tétel megnevezése *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="pl. Telekom Otthoni Net, Lakbér, Spotify..."
                  className="w-full text-base font-bold px-4 py-3 bg-bg border border-line rounded-control text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Category Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                  Kategória
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3.5 py-2.5 bg-bg border border-line rounded-control text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Amount & Variable flag */}
            <div className="billflow-card rounded-card p-5 bg-surface border border-line shadow-xs space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                  Alapértelmezett / Tervezett összeg
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full text-2xl font-extrabold px-4 py-3 bg-bg border border-line rounded-control text-ink tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-base text-ink-2">
                    Ft
                  </span>
                </div>
              </div>

              {/* Variable Amount Checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer pt-2 border-t border-line/60">
                <input
                  type="checkbox"
                  checked={isVariableAmount}
                  onChange={(e) => setIsVariableAmount(e.target.checked)}
                  className="w-4 h-4 rounded border-line text-accent focus:ring-accent accent-accent"
                />
                <span className="text-xs font-semibold text-ink">
                  Változó összegű kiadás (fogyasztásfüggő rezsi, percdíj stb.)
                </span>
              </label>
            </div>
          </div>

          {/* Right Column: Schedule, Account & Status */}
          <div className="space-y-5">
            {/* 3. Schedule & Frequency */}
            <div className="billflow-card rounded-card p-5 bg-surface border border-line shadow-xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Billing Cycle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                    Gyakoriság
                  </label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                    className="w-full px-3.5 py-2.5 bg-bg border border-line rounded-control text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {BILLING_CYCLES.map((cycle) => (
                      <option key={cycle.id} value={cycle.label === 'Havonta' ? 'MONTHLY' : cycle.id}>
                        {cycle.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Day */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                    Esedékesség napja (1-31)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={dueDay}
                      onChange={(e) => setDueDay(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-full px-4 py-2.5 bg-bg border border-line rounded-control text-sm font-bold text-ink tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-ink-2 font-medium">
                      . napján
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5 pt-3 border-t border-line/60">
                <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                  Fizetési mód
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3.5 py-2.5 bg-bg border border-line rounded-control text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bank Account Selection */}
              <div className="space-y-1.5 pt-3 border-t border-line/60">
                <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                  Terhelendő bankszámla
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {accounts.map((acc) => {
                    const isSelected = selectedAccountId === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setSelectedAccountId(acc.id)}
                        className={`p-3 rounded-control border flex items-center gap-2.5 text-left transition-all ${
                          isSelected
                            ? 'border-accent bg-accent-tint/40 text-ink shadow-xs'
                            : 'border-line bg-bg hover:bg-surface-elevated text-ink-2'
                        }`}
                      >
                        <BankBadge account={acc} size="sm" />
                        <span className="text-xs font-bold truncate">{acc.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Active / Paused Switch */}
            <div className="billflow-card rounded-card p-5 bg-surface border border-line shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                    Előfizetés státusza
                  </h4>
                  <p className="text-xs text-ink-2 mt-0.5">
                    Szüneteltetés esetén a tétel megmarad a rendszerben, de nem generálódik havi fizetési kötelezettség.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActive((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50'
                      : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50'
                  }`}
                >
                  {active ? (
                    <>
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Aktív</span>
                    </>
                  ) : (
                    <>
                      <PauseCircle className="w-3.5 h-3.5" />
                      <span>Szüneteltetve</span>
                    </>
                  )}
                </button>
              </div>

              {/* Pause Duration Configuration (Shown when paused) */}
              {!active && (
                <div className="pt-3 border-t border-line/60 space-y-3.5 animate-in fade-in duration-200">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink block">
                    Szüneteltetés időtartama
                  </label>

                  {/* Mode selector pills */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPauseType('months')}
                      className={`p-2 rounded-control text-xs font-bold border transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                        pauseType === 'months'
                          ? 'bg-accent-tint border-accent text-accent-text ring-1 ring-accent'
                          : 'bg-bg border-line text-ink-2 hover:text-ink'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Hónapok száma</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPauseType('date')}
                      className={`p-2 rounded-control text-xs font-bold border transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                        pauseType === 'date'
                          ? 'bg-accent-tint border-accent text-accent-text ring-1 ring-accent'
                          : 'bg-bg border-line text-ink-2 hover:text-ink'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Konkrét dátum</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPauseType('indefinite')}
                      className={`p-2 rounded-control text-xs font-bold border transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                        pauseType === 'indefinite'
                          ? 'bg-accent-tint border-accent text-accent-text ring-1 ring-accent'
                          : 'bg-bg border-line text-ink-2 hover:text-ink'
                      }`}
                    >
                      <PauseCircle className="w-3.5 h-3.5" />
                      <span>Visszavonásig</span>
                    </button>
                  </div>

                  {/* Sub-options for Months */}
                  {pauseType === 'months' && (
                    <div className="space-y-2.5 p-3 rounded-card bg-bg border border-line animate-in fade-in duration-150">
                      <span className="text-[11px] font-semibold text-ink-2 block">
                        Válaszd ki a szüneteltetés hosszát:
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {[1, 2, 3, 6, 12].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setPauseMonths(m)}
                            className={`px-3 py-1.5 rounded-control text-xs font-bold border transition-all ${
                              pauseMonths === m
                                ? 'bg-accent text-white border-accent shadow-xs'
                                : 'bg-surface border-line text-ink hover:bg-surface-elevated'
                            }`}
                          >
                            {m === 12 ? '1 év' : `${m} hónap`}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2 flex items-center justify-between text-xs">
                        <span className="text-ink-2">Várható visszatérés:</span>
                        <span className="font-bold text-accent font-mono">
                          {getResumeDatePreview()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Sub-options for Specific Date */}
                  {pauseType === 'date' && (
                    <div className="space-y-2.5 p-3 rounded-card bg-bg border border-line animate-in fade-in duration-150">
                      <span className="text-[11px] font-semibold text-ink-2 block">
                        Szüneteltetés végső határideje:
                      </span>
                      <input
                        type="date"
                        value={pauseSpecificDate}
                        onChange={(e) => setPauseSpecificDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-control bg-surface border border-line text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      {pauseSpecificDate && (
                        <div className="pt-1 flex items-center justify-between text-xs">
                          <span className="text-ink-2">Állapot:</span>
                          <span className="font-bold text-accent font-mono">
                            {getResumeDatePreview()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Indefinite note */}
                  {pauseType === 'indefinite' && (
                    <div className="p-3 rounded-card bg-bg border border-line text-xs text-ink-2 leading-relaxed animate-in fade-in duration-150">
                      A tétel mindaddig szünetel a rendszerben, amíg kézzel újra nem aktiválod a fenti kapcsolóval.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 5. Notes */}
            <div className="billflow-card rounded-card p-5 bg-surface border border-line shadow-xs space-y-1.5">
              <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                Megjegyzés & Szerződés azonosító
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="pl. Szerződésszám, ügyfél-azonosító vagy egyéb feljegyzés..."
                className="w-full px-3.5 py-2.5 bg-bg border border-line rounded-control text-sm text-ink placeholder:text-ink-2/60 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>

            {/* Delete option in edit mode */}
            {expense && onDelete && (
              <div className="pt-2">
                {showDeleteConfirm ? (
                  <div className="p-3.5 rounded-card bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 space-y-2">
                    <p className="text-xs font-bold text-red-600 dark:text-red-400">
                      Biztosan törölni szeretnéd ezt a tételt a törzsadatok közül?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await onDelete(expense.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-overdue text-white rounded-control text-xs font-bold hover:bg-overdue/90 active:scale-95"
                      >
                        Igen, törlés
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-1.5 bg-surface border border-line text-ink rounded-control text-xs font-semibold"
                      >
                        Mégse
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs font-semibold text-overdue hover:underline flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Tétel végleges törlése a törzsadatokból</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Bottom Sticky Action Bar */}
      <div
        className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-line bg-surface flex items-center justify-end shrink-0"
        style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          disabled={isSaving || !name.trim()}
          onClick={handleSubmit}
          className="w-full sm:w-auto px-6 py-3 rounded-control bg-accent hover:bg-accent-strong active:scale-98 text-white text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>
            {isSaving
              ? 'Mentés folyamatban...'
              : expense
              ? 'Sablon módosítások mentése'
              : 'Új tétel rögzítése'}
          </span>
        </button>
      </div>
    </div>,
    document.body
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  CreditCard,
  Bell,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  History,
  Check,
  FileText,
  Clock,
  ArrowRight,
  AlertTriangle,
  X
} from 'lucide-react';
import {
  FixedExpense,
  DashboardItem,
  ExpenseCategory,
  BillingCycle,
  BankAccount,
  PaymentHistoryRecord
} from '../../types';
import { usePrivacy } from '../../context/PrivacyContext';
import { ExpenseHistoryModal } from './ExpenseHistoryModal';
import { PaymentDetailModal } from './PaymentDetailModal';
import { BankBadge } from '../common/BankBadge';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface ExpenseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: FixedExpense | DashboardItem | null;
  accounts: BankAccount[];
  onSave: (expenseData: Partial<FixedExpense>) => Promise<void>;
  onConfirmPayment?: (item: DashboardItem, actualAmount: number, note?: string) => Promise<void>;
  onDelete?: (expenseId: string) => Promise<void>;
}

const REMINDER_OPTIONS = [
  { id: '2_days_before', label: '2 nappal előtte (ajánlott)' },
  { id: '1_day_before', label: '1 nappal előtte' },
  { id: '3_days_before', label: '3 nappal előtte' },
  { id: 'on_day', label: 'Aznap reggel 8:00' },
  { id: 'none', label: 'Nem kérek' }
];

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  isOpen,
  onClose,
  expense,
  accounts,
  onSave,
  onConfirmPayment,
  onDelete
}) => {
  const { isPrivate } = usePrivacy();

  // Body scroll lock (prevents page from scrolling behind modal)
  useBodyScrollLock(isOpen);

  // State variables for fields
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number | string>(10000);
  const [notes, setNotes] = useState('');
  const [reminder, setReminder] = useState('2_days_before');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [dueDay, setDueDay] = useState<number>(19);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAdvancedEditOpen, setIsAdvancedEditOpen] = useState(false);

  // Sub-modal states
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedPaymentForDetail, setSelectedPaymentForDetail] = useState<PaymentHistoryRecord | null>(null);

  useEffect(() => {
    if (expense) {
      setName(expense.name || '');
      const baseAmount =
        'actualAmount' in expense && expense.actualAmount !== null
          ? expense.actualAmount
          : 'plannedAmount' in expense
          ? expense.plannedAmount
          : 'defaultAmount' in expense
          ? expense.defaultAmount
          : 10000;
      setAmount(baseAmount);
      setBillingCycle(expense.billingCycle || 'MONTHLY');
      setDueDay(expense.dueDay || 19);
      setSelectedAccountId(
        ('defaultAccountId' in expense ? expense.defaultAccountId : expense.accountId) ||
          accounts[0]?.id ||
          ''
      );
      setNotes(('paymentNote' in expense ? expense.paymentNote : expense.notes) || '');
    } else {
      setName('');
      setAmount(10000);
      setBillingCycle('MONTHLY');
      setDueDay(19);
      setSelectedAccountId(accounts[0]?.id || '');
      setNotes('');
    }
    setShowDeleteConfirm(false);
    setIsHistoryModalOpen(false);
    setSelectedPaymentForDetail(null);
    setIsAdvancedEditOpen(false);
  }, [expense, accounts, isOpen]);

  // ESC key listener for modal closure (Rule 11)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isHistoryModalOpen && !selectedPaymentForDetail) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isHistoryModalOpen, selectedPaymentForDetail, onClose]);

  const formatHUF = (val: number) =>
    new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(Math.round(val)) + '\u00A0Ft';

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  // Formatted due dates
  const formattedDueDate = `2026.09.${String(dueDay).padStart(2, '0')}.`;
  const nextDueDate = `2026.10.${String(dueDay).padStart(2, '0')}.`;

  const isAlreadyPaid = Boolean(expense && 'status' in expense && expense.status === 'PAID');

  // Compute 12-month payment history with month-over-month trend diffs
  const historyRecords: PaymentHistoryRecord[] = useMemo(() => {
    if (!expense) return [];
    const base = Number(amount) || 18900;
    const account = selectedAccount || accounts[0] || null;

    const months = [
      { period: '2026-08', label: '2026. augusztus', actual: base, planned: base, paidAt: '2026-08-19T14:32:00Z', note: 'Időben rendezve' },
      { period: '2026-07', label: '2026. július', actual: base, planned: base, paidAt: '2026-07-18T09:15:00Z', note: null },
      { period: '2026-06', label: '2026. június', actual: Math.round(base * 0.95), planned: base, paidAt: '2026-06-19T11:00:00Z', note: 'Kedvezményes időszak' },
      { period: '2026-05', label: '2026. május', actual: Math.round(base * 0.95), planned: base, paidAt: '2026-05-19T10:45:00Z', note: null },
      { period: '2026-04', label: '2026. április', actual: Math.round(base * 0.95), planned: base, paidAt: '2026-04-18T16:20:00Z', note: null },
      { period: '2026-03', label: '2026. március', actual: Math.round(base * 0.98), planned: base, paidAt: '2026-03-19T08:30:00Z', note: null },
      { period: '2026-02', label: '2026. február', actual: Math.round(base * 0.98), planned: base, paidAt: '2026-02-18T13:10:00Z', note: null },
      { period: '2026-01', label: '2026. január', actual: Math.round(base * 0.98), planned: base, paidAt: '2026-01-19T15:00:00Z', note: null },
      { period: '2025-12', label: '2025. december', actual: Math.round(base * 0.92), planned: Math.round(base * 0.92), paidAt: '2025-12-19T11:40:00Z', note: 'Év végi elszámolás' },
      { period: '2025-11', label: '2025. november', actual: Math.round(base * 0.92), planned: Math.round(base * 0.92), paidAt: '2025-11-18T10:00:00Z', note: null },
      { period: '2025-10', label: '2025. október', actual: Math.round(base * 0.92), planned: Math.round(base * 0.92), paidAt: '2025-10-19T09:25:00Z', note: null },
      { period: '2025-09', label: '2025. szeptember', actual: Math.round(base * 0.90), planned: Math.round(base * 0.90), paidAt: '2025-09-19T14:00:00Z', note: 'Szerződéskötés' }
    ];

    return months.map((m, idx) => {
      const prev = idx < months.length - 1 ? months[idx + 1].actual : null;
      const diff = prev !== null ? m.actual - prev : null;
      const diffPct = prev !== null && prev > 0 ? Math.round(((m.actual - prev) / prev) * 1000) / 10 : null;

      const targetExpenseId = 'fixedExpenseId' in expense ? expense.fixedExpenseId : expense.id;

      return {
        id: `pay-${m.period}-${targetExpenseId}`,
        fixedExpenseId: targetExpenseId,
        periodYearMonth: m.period,
        periodLabel: m.label,
        actualAmount: m.actual,
        plannedAmount: m.planned,
        previousAmount: prev,
        diffAmount: diff,
        diffPercentage: diffPct,
        status: 'PAID' as const,
        paidAt: m.paidAt,
        paidByUser: { id: 'usr-1', displayName: 'Családfő (Te)', email: 'admin@billflow.hu' },
        account,
        paymentMethod: ('paymentMethod' in expense ? expense.paymentMethod : 'BANK_TRANSFER'),
        note: m.note
      };
    });
  }, [expense, amount, selectedAccount, accounts]);

  if (!isOpen) return null;

  // Primary action: Confirm Payment or Save
  const handleConfirmPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const numericAmount = Number(amount) || 0;
      if (expense && 'fixedExpenseId' in expense && onConfirmPayment) {
        await onConfirmPayment(expense, numericAmount, notes.trim());
      } else {
        await onSave({
          name: name.trim(),
          defaultAmount: numericAmount,
          notes: notes.trim() || null
        });
      }
      onClose();
    } catch (err) {
      console.error('[ExpenseDetailModal] Action failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!expense || !onDelete) return;
    const targetId = 'fixedExpenseId' in expense ? expense.fixedExpenseId : expense.id;
    if (!targetId) return;

    setIsSaving(true);
    try {
      await onDelete(targetId);
      onClose();
    } catch (err) {
      console.error('[ExpenseDetailModal] Delete failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-surface flex flex-col w-screen h-[100dvh] max-h-[100dvh] overflow-hidden animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      {/* Top Header: sticky, bank icon + name (truncated) + X */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-line bg-surface-elevated/80 flex items-center justify-between gap-3 shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <BankBadge account={selectedAccount} size="md" />
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-xl font-extrabold text-ink tracking-tight truncate leading-tight">
              {name || 'Tétel részletei'}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-ink-2 mt-0.5 flex-wrap">
              <span className="font-semibold text-ink truncate max-w-[120px]">{selectedAccount?.name}</span>
              <span>•</span>
              <span className="font-mono font-medium">{formattedDueDate}</span>
              {isAlreadyPaid && (
                <>
                  <span>•</span>
                  <span className="text-paid font-bold">Kifizetve</span>
                </>
              )}
            </div>
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

      {/* Scrollable Modal Content (Full-width edge-to-edge layout) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 lg:px-12 py-5 space-y-5 w-full max-w-5xl mx-auto">
        {/* 1. Editable Planned/Actual Amount & Immediate Note Field */}
        <div className="billflow-card rounded-card p-5 bg-surface border border-line shadow-xs space-y-4">
          {/* Amount Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink uppercase tracking-wider block">
              Tervezett befizetés
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className={`w-full text-2xl sm:text-3xl font-extrabold px-4 py-3 bg-bg border border-line rounded-control text-ink tabular-nums focus:outline-none focus:ring-2 focus:ring-accent ${
                  isPrivate ? 'privacy-blur' : ''
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-base text-ink-2">
                Ft
              </span>
            </div>
            <p className="text-[11px] text-ink-2">
              Szükség esetén itt azonnal átírhatod az aktuális számla pontos összegét.
            </p>
          </div>

          {/* Note Field DIRECTLY below Amount */}
          <div className="space-y-1.5 pt-3 border-t border-line/60">
            <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-accent" />
              <span>Megjegyzés & Óraállás</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="pl. Mérőóra állás: 45210 kWh, gázfogyasztás: 180 m³, számla sorszáma..."
              className="w-full px-3.5 py-2.5 bg-bg border border-line rounded-control text-sm text-ink placeholder:text-ink-2/60 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>
        </div>

        {/* 2. Compact 3-column Horizontal Segmented Bar (Mobile & Desktop) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3.5 rounded-card bg-bg border border-line">
          {/* Frequency (Gyakoriság) */}
          <div className="space-y-0.5 text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-2 block">
              Gyakoriság
            </span>
            <span className="text-xs sm:text-sm font-bold text-ink">
              {billingCycle === 'MONTHLY'
                ? 'Havonta'
                : billingCycle === 'QUARTERLY'
                ? 'Negyedévente'
                : 'Évente'}
            </span>
          </div>

          {/* Due Day (Esedékesség - short text) */}
          <div className="space-y-0.5 text-center sm:text-left border-x border-line/70 px-2 sm:px-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-2 block">
              Esedékesség
            </span>
            <span className="text-xs sm:text-sm font-bold text-ink">
              {dueDay}-én
            </span>
          </div>

          {/* Reminder (Emlékeztető) */}
          <div className="space-y-0.5 text-center sm:text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-ink-2 block flex items-center justify-center sm:justify-start gap-1">
              <Bell className="w-2.5 h-2.5 text-accent" />
              <span>Értesítés</span>
            </label>
            <select
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              className="w-full text-xs font-bold text-ink bg-transparent focus:outline-none cursor-pointer text-center sm:text-left truncate"
            >
              {REMINDER_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Next Due Date Display */}
        <div className="p-3.5 rounded-control bg-accent-tint/30 border border-accent/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink">
            <Clock className="w-4 h-4 text-accent" />
            <span>Következő tervezett esedékesség:</span>
          </div>
          <span className="font-mono font-bold text-xs text-accent">
            {nextDueDate}
          </span>
        </div>

        {/* 4. Payment History Section: Trendbadge positioned UNDER the amount */}
        <div className="billflow-card rounded-card p-5 bg-surface border border-line shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-accent" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
                Fizetési előzmények (utolsó 3 hónap)
              </h4>
            </div>

            {/* View all history modal button */}
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="text-xs font-bold text-accent hover:text-accent-strong hover:underline flex items-center gap-1 transition-colors"
            >
              <span>Összes előzmény ({historyRecords.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3-month history cards with trend under amount */}
          <div className="space-y-2">
            {historyRecords.slice(0, 3).map((rec) => {
              const isHigher = rec.diffAmount !== null && rec.diffAmount > 0;
              const isLower = rec.diffAmount !== null && rec.diffAmount < 0;
              const isSame = rec.diffAmount !== null && rec.diffAmount === 0;

              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedPaymentForDetail(rec)}
                  className="p-3 rounded-control border border-line/70 bg-bg hover:bg-surface-elevated hover:border-accent/40 cursor-pointer flex items-center justify-between gap-3 transition-all group"
                >
                  {/* Left: Month label and exact date (Full width, no squeezed text) */}
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="text-xs sm:text-sm font-bold text-ink group-hover:text-accent transition-colors block truncate">
                      {rec.periodLabel}
                    </span>
                    <span className="text-[11px] text-ink-2 block mt-0.5">
                      {new Date(rec.paidAt).toLocaleDateString('hu-HU', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Right: Amount & Trend Badge UNDER the amount */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="flex flex-col items-end">
                      <span
                        className={`text-sm font-extrabold text-ink tabular-nums ${
                          isPrivate ? 'privacy-blur' : ''
                        }`}
                      >
                        {formatHUF(rec.actualAmount)}
                      </span>

                      {/* Trend Badge under amount */}
                      <div className="mt-0.5">
                        {isHigher && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-overdue bg-overdue-bg px-1.5 py-0.2 rounded-full border border-overdue/30">
                            <TrendingUp className="w-2.5 h-2.5" />
                            <span>+{formatHUF(rec.diffAmount!)}</span>
                            {rec.diffPercentage !== null && <span>(+{rec.diffPercentage}%)</span>}
                          </span>
                        )}
                        {isLower && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-paid bg-paid-bg px-1.5 py-0.2 rounded-full border border-paid/30">
                            <TrendingDown className="w-2.5 h-2.5" />
                            <span>{formatHUF(rec.diffAmount!)}</span>
                            {rec.diffPercentage !== null && <span>({rec.diffPercentage}%)</span>}
                          </span>
                        )}
                        {isSame && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-ink-2 bg-bg px-1.5 py-0.2 rounded-full border border-line">
                            <Minus className="w-2 h-2" />
                            <span>Változatlan</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-ink-2 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Discreet Option to Edit Template Baseline (Name, Account) */}
        <div className="pt-2">
          {!isAdvancedEditOpen ? (
            <button
              type="button"
              onClick={() => setIsAdvancedEditOpen(true)}
              className="text-xs text-ink-2 hover:text-ink underline transition-colors"
            >
              Tétel alapadatainak módosítása (név, forrásszámla)...
            </button>
          ) : (
            <div className="p-4 rounded-control border border-line bg-surface-elevated/40 space-y-3 animate-in fade-in">
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">
                  Tétel megnevezése
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-line rounded-control text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">
                  Forrásszámla
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-line rounded-control text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent font-medium"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Delete Danger Zone with Explicit Historical Retention Notice */}
        {expense && onDelete && (
          <div className="pt-2 border-t border-line">
            {showDeleteConfirm ? (
              <div className="p-4 bg-overdue-bg border border-overdue/40 rounded-control space-y-2.5">
                <div className="flex items-center gap-2 text-overdue font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Tétel inaktiválása a jelenlegi hónaptól</span>
                </div>
                <p className="text-xs text-ink leading-relaxed">
                  <strong>Fontos tudnivaló:</strong> A tétel visszamenőleg <strong>nem törlődik</strong> a korábbi hónapok fizetési naplójából és statisztikáiból, kizárólag az aktuális és a jövőbeli időszakokból kerül inaktiválásra. Később bármikor újraaktiválhatod!
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleDelete}
                    className="px-4 py-2 bg-overdue text-white rounded-control text-xs font-bold hover:bg-overdue/90 active:scale-95 transition-all"
                  >
                    Igen, inaktiválás
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-surface border border-line text-ink rounded-control text-xs font-semibold hover:bg-surface-elevated active:scale-95 transition-all"
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
                <span>Tétel inaktiválása a jelenlegi hónaptól</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Actions Bar: Sticks to viewport bottom */}
      <div
        className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-line bg-surface flex items-center justify-end shrink-0"
        style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          disabled={isSaving}
          onClick={() => handleConfirmPayment()}
          className="w-full sm:w-auto px-6 py-3 rounded-control bg-accent hover:bg-accent-strong active:scale-98 text-white text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>
            {isSaving
              ? 'Rögzítés folyamatban...'
              : isAlreadyPaid
              ? 'Módosítások mentése'
              : 'Befizetés rögzítése'}
          </span>
        </button>
      </div>

      {/* Sub-Modal: Full History Modal */}
      {isHistoryModalOpen && (
        <ExpenseHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          expenseName={name}
          historyRecords={historyRecords}
          onSelectPayment={(payment) => {
            setSelectedPaymentForDetail(payment);
          }}
        />
      )}

      {/* Sub-Modal: Payment Transaction Receipt Detail Modal */}
      {selectedPaymentForDetail && (
        <PaymentDetailModal
          isOpen={Boolean(selectedPaymentForDetail)}
          onClose={() => setSelectedPaymentForDetail(null)}
          payment={selectedPaymentForDetail}
          expenseName={name}
        />
      )}
    </div>,
    document.body
  );
};

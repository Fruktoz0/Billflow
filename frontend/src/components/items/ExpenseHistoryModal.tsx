import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Calendar,
  CreditCard,
  ChevronRight,
  Filter,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { PaymentHistoryRecord, BankAccount } from '../../types';
import { usePrivacy } from '../../context/PrivacyContext';
import { PaymentDetailModal } from './PaymentDetailModal';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface ExpenseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseName: string;
  historyRecords: PaymentHistoryRecord[];
}

export const ExpenseHistoryModal: React.FC<ExpenseHistoryModalProps> = ({
  isOpen,
  onClose,
  expenseName,
  historyRecords
}) => {
  const { isPrivate } = usePrivacy();

  // Body scroll lock
  useBodyScrollLock(isOpen);

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PAID' | 'SKIPPED'>('ALL');

  // Detail modal state for clicked payment
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistoryRecord | null>(null);

  // ESC key listener for modal closure (Rule 11)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !selectedPayment) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedPayment, onClose]);

  const formatHUF = (val: number) =>
    new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(Math.round(val)) + '\u00A0Ft';

  // Extract available years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    historyRecords.forEach((r) => {
      const y = r.periodYearMonth.split('-')[0];
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [historyRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return historyRecords.filter((r) => {
      if (selectedYear !== 'ALL' && !r.periodYearMonth.startsWith(selectedYear)) {
        return false;
      }
      if (selectedStatus !== 'ALL' && r.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [historyRecords, selectedYear, selectedStatus]);

  // Stats calculation
  const stats = useMemo(() => {
    const paidOnly = filteredRecords.filter((r) => r.status === 'PAID');
    const total = paidOnly.reduce((sum, r) => sum + r.actualAmount, 0);
    const average = paidOnly.length > 0 ? Math.round(total / paidOnly.length) : 0;
    const amounts = paidOnly.map((r) => r.actualAmount);
    const min = amounts.length > 0 ? Math.min(...amounts) : 0;
    const max = amounts.length > 0 ? Math.max(...amounts) : 0;

    return {
      total,
      average,
      min,
      max,
      count: paidOnly.length
    };
  }, [filteredRecords]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-surface flex flex-col w-screen h-[100dvh] max-h-[100dvh] overflow-hidden animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      {/* Header */}
      <div className="px-5 sm:px-8 py-4 border-b border-line flex items-center justify-between shrink-0 bg-surface-elevated/80 pt-[max(1.25rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-control bg-accent-tint text-accent flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink">
              Fizetési Előzmények
            </h2>
            <p className="text-xs text-ink-2 truncate max-w-sm">
              {expenseName} – Teljes múltbéli költéstörténet és statisztikák
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-control text-ink-2 hover:text-ink hover:bg-surface-elevated transition-colors"
          title="Bezárás (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. Statistics Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Average */}
            <div className="p-3.5 rounded-card bg-bg border border-line">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-2 block">
                Havi átlagos díj
              </span>
              <span
                className={`text-base sm:text-lg font-extrabold text-ink tabular-nums mt-0.5 block ${
                  isPrivate ? 'privacy-blur' : ''
                }`}
              >
                {formatHUF(stats.average)}
              </span>
              <span className="text-[10px] text-ink-2">
                {stats.count} lezárt hónap alapján
              </span>
            </div>

            {/* Total Paid */}
            <div className="p-3.5 rounded-card bg-bg border border-line">
              <span className="text-[10px] font-bold uppercase tracking-wider text-paid block">
                Eddig kifizetve
              </span>
              <span
                className={`text-base sm:text-lg font-extrabold text-paid tabular-nums mt-0.5 block ${
                  isPrivate ? 'privacy-blur' : ''
                }`}
              >
                {formatHUF(stats.total)}
              </span>
              <span className="text-[10px] text-ink-2">
                Összes eddigi bizonylat
              </span>
            </div>

            {/* Min Amount */}
            <div className="p-3.5 rounded-card bg-bg border border-line">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-2 block">
                Legalacsonyabb
              </span>
              <span
                className={`text-base sm:text-lg font-extrabold text-ink tabular-nums mt-0.5 block ${
                  isPrivate ? 'privacy-blur' : ''
                }`}
              >
                {formatHUF(stats.min)}
              </span>
              <span className="text-[10px] text-paid flex items-center gap-0.5">
                <ArrowDownRight className="w-3 h-3" />
                Minimum rekord
              </span>
            </div>

            {/* Max Amount */}
            <div className="p-3.5 rounded-card bg-bg border border-line">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-2 block">
                Legmagasabb
              </span>
              <span
                className={`text-base sm:text-lg font-extrabold text-ink tabular-nums mt-0.5 block ${
                  isPrivate ? 'privacy-blur' : ''
                }`}
              >
                {formatHUF(stats.max)}
              </span>
              <span className="text-[10px] text-overdue flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                Maximum csúcs
              </span>
            </div>
          </div>

          {/* 2. Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-line/60">
            {/* Year filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-ink-2 mr-1">Év:</span>
              <button
                type="button"
                onClick={() => setSelectedYear('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  selectedYear === 'ALL'
                    ? 'bg-accent-strong text-on-accent shadow-xs'
                    : 'bg-surface border border-line text-ink-2 hover:text-ink'
                }`}
              >
                Összes
              </button>
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedYear === yr
                      ? 'bg-accent-strong text-on-accent shadow-xs'
                      : 'bg-surface border border-line text-ink-2 hover:text-ink'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            {/* Status filter pills */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedStatus('ALL')}
                className={`px-2.5 py-1 rounded-control text-xs font-medium transition-colors ${
                  selectedStatus === 'ALL'
                    ? 'bg-surface-elevated text-ink font-bold border border-line'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                Minden státusz ({historyRecords.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus('PAID')}
                className={`px-2.5 py-1 rounded-control text-xs font-medium transition-colors ${
                  selectedStatus === 'PAID'
                    ? 'bg-paid/15 text-paid font-bold'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                Kifizetve ({historyRecords.filter((r) => r.status === 'PAID').length})
              </button>
            </div>
          </div>

          {/* 3. Structured Historical List */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-2 block">
              Havi költések időrendben ({filteredRecords.length} tétel)
            </span>

            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center rounded-card bg-bg border border-line text-ink-2 text-xs">
                Nincs a szűrésnek megfelelő befizetés ebben az időszakban.
              </div>
            ) : (
              <div className="divide-y divide-line/60 rounded-card border border-line bg-surface overflow-hidden shadow-xs">
                {filteredRecords.map((record) => {
                  const hasDiff = record.diffAmount !== undefined && record.diffAmount !== null;
                  const isIncrease = hasDiff && (record.diffAmount || 0) > 0;
                  const isDecrease = hasDiff && (record.diffAmount || 0) < 0;
                  const isUnchanged = hasDiff && record.diffAmount === 0;

                  return (
                    <div
                      key={record.id}
                      onClick={() => setSelectedPayment(record)}
                      className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-surface-elevated transition-colors cursor-pointer group"
                    >
                      {/* Left: Period & Paid date */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-ink group-hover:text-accent transition-colors">
                            {record.periodLabel}
                          </span>
                          <span className="px-1.5 py-0.2 rounded-full bg-paid/15 text-paid font-bold text-[10px]">
                            Kifizetve
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-ink-2 mt-0.5">
                          {record.account && (
                            <div className="flex items-center gap-1">
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: record.account.color || '#0E8A9A' }}
                              />
                              <span>{record.account.name}</span>
                            </div>
                          )}
                          <span>•</span>
                          <span>
                            {new Date(record.paidAt).toLocaleDateString('hu-HU', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Right: Amount & Month-over-Month Trend Diff */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div
                            className={`text-sm sm:text-base font-extrabold text-ink tabular-nums ${
                              isPrivate ? 'privacy-blur' : ''
                            }`}
                          >
                            {formatHUF(record.actualAmount)}
                          </div>

                          {/* Trend Diff Badge */}
                          {hasDiff ? (
                            <div
                              className={`text-[11px] font-bold flex items-center justify-end gap-1 ${
                                isIncrease
                                  ? 'text-overdue'
                                  : isDecrease
                                  ? 'text-paid'
                                  : 'text-ink-2'
                              }`}
                            >
                              {isIncrease && <TrendingUp className="w-3 h-3 stroke-[2.5]" />}
                              {isDecrease && <TrendingDown className="w-3 h-3 stroke-[2.5]" />}
                              {isUnchanged && <Minus className="w-3 h-3" />}
                              <span>
                                {isIncrease && `+${formatHUF(record.diffAmount!)} (+${record.diffPercentage}%)`}
                                {isDecrease && `${formatHUF(record.diffAmount!)} (${record.diffPercentage}%)`}
                                {isUnchanged && '0 Ft (Változatlan)'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-ink-2/60 italic">
                              Kezdő időszak
                            </span>
                          )}
                        </div>

                        <ChevronRight className="w-4 h-4 text-ink-2 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 pb-8 sm:pb-5 border-t border-line bg-surface flex justify-end shrink-0 safe-bottom">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-control border border-line text-ink font-semibold text-xs hover:bg-surface-elevated active:scale-98 transition-colors"
          >
            Bezárás
          </button>
        </div>

      {/* Sub-modal: Individual Payment Details */}
      <PaymentDetailModal
        isOpen={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        payment={selectedPayment}
        expenseName={expenseName}
      />
    </div>,
    document.body
  );
};

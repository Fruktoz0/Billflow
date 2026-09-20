import React, { useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Calendar,
  CreditCard,
  User,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Hash
} from 'lucide-react';
import { PaymentHistoryRecord } from '../../types';
import { usePrivacy } from '../../context/PrivacyContext';
import { BankBadge } from '../common/BankBadge';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface PaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentHistoryRecord | null;
  expenseName: string;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  DIRECT_DEBIT: 'Csoportos beszedési megbízás',
  CARD: 'Bankkártyás fizetés',
  BANK_TRANSFER: 'Banki átutalás',
  MANUAL: 'Készpénzes / Kézi befizetés'
};

export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  isOpen,
  onClose,
  payment,
  expenseName
}) => {
  const { isPrivate } = usePrivacy();

  // Body scroll lock
  useBodyScrollLock(isOpen);

  // ESC key listener for modal closure (Rule 11)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !payment) return null;

  const formatHUF = (val: number) =>
    new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(Math.round(val)) + '\u00A0Ft';

  const hasDiff = payment.diffAmount !== undefined && payment.diffAmount !== null;
  const isIncrease = hasDiff && (payment.diffAmount || 0) > 0;
  const isDecrease = hasDiff && (payment.diffAmount || 0) < 0;
  const isUnchanged = hasDiff && payment.diffAmount === 0;

  return (
    <div
      className="fixed inset-0 z-[60] bg-surface flex flex-col w-full h-full overflow-hidden safe-top safe-bottom animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      {/* Header */}
      <div className="px-5 sm:px-8 py-5 border-b border-line flex items-center justify-between shrink-0 bg-surface-elevated/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-accent-tint text-accent-text text-[11px] font-bold">
              {payment.periodLabel}
            </span>
            <span className="text-xs text-ink-2 font-medium">Befizetési bizonylat</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-ink mt-0.5 truncate">
            {expenseName}
          </h2>
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

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-4 max-w-2xl w-full mx-auto">
        {/* Highlight Hero Card */}
        <div className="p-5 rounded-card bg-bg border border-line space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-2 block">
            Befizetett összeg
          </span>
          <div className="flex items-baseline justify-between gap-3">
            <span
              className={`text-3xl sm:text-4xl font-extrabold text-ink tabular-nums ${
                isPrivate ? 'privacy-blur' : ''
              }`}
            >
              {formatHUF(payment.actualAmount)}
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-bold text-paid bg-paid-bg px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sikeres</span>
            </span>
          </div>

          <div className="pt-2 border-t border-line/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-ink-2">
              Tervezett: <span className="font-semibold text-ink">{formatHUF(payment.plannedAmount)}</span>
              {payment.actualAmount !== payment.plannedAmount && (
                <span className="ml-1 text-[11px] text-ink-2 font-mono">
                  (eltérés: {payment.actualAmount > payment.plannedAmount ? '+' : ''}
                  {formatHUF(payment.actualAmount - payment.plannedAmount)})
                </span>
              )}
            </span>

            {/* Month-over-month trend badge */}
            {hasDiff && (
              <div
                className={`px-2 py-0.5 rounded-control text-[11px] font-bold flex items-center gap-1 ${
                  isIncrease
                    ? 'bg-overdue/10 text-overdue border border-overdue/20'
                    : isDecrease
                    ? 'bg-paid/10 text-paid border border-paid/20'
                    : 'bg-bg text-ink-2 border border-line'
                }`}
              >
                {isIncrease && <TrendingUp className="w-3 h-3" />}
                {isDecrease && <TrendingDown className="w-3 h-3" />}
                {isUnchanged && <Minus className="w-3 h-3" />}
                <span>
                  {isIncrease && `+${formatHUF(payment.diffAmount!)} (+${payment.diffPercentage}%)`}
                  {isDecrease && `${formatHUF(payment.diffAmount!)} (${payment.diffPercentage}%)`}
                  {isUnchanged && 'Változatlan'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Structured Transaction Metadata */}
        <div className="divide-y divide-line/60 rounded-card border border-line bg-surface overflow-hidden text-xs">
          {/* Timestamp */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-ink-2 font-medium">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>Fizetés pontos időpontja</span>
            </div>
            <span className="font-semibold text-ink">
              {new Date(payment.paidAt).toLocaleString('hu-HU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          {/* Account with authentic BankBadge */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-ink-2 font-medium">
              <CreditCard className="w-3.5 h-3.5 text-accent" />
              <span>Forrásszámla</span>
            </div>
            <div className="flex items-center gap-2 font-semibold text-ink">
              <BankBadge account={payment.account} size="md" />
              <span>{payment.account?.name || 'Alapértelmezett számla'}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-ink-2 font-medium">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span>Fizetési mód</span>
            </div>
            <span className="font-semibold text-ink">
              {payment.paymentMethod
                ? PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod
                : 'Banki átutalás'}
            </span>
          </div>

          {/* Paid By User */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-ink-2 font-medium">
              <User className="w-3.5 h-3.5 text-accent" />
              <span>Befizető / Rögzítő</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-accent-tint text-accent font-bold text-[10px] flex items-center justify-center">
                {(payment.paidByUser?.displayName || 'U').slice(0, 1).toUpperCase()}
              </div>
              <span className="font-semibold text-ink">
                {payment.paidByUser?.displayName || 'Családfő (Te)'}
              </span>
            </div>
          </div>

          {/* Transaction Reference ID */}
          <div className="px-4 py-3.5 flex items-center justify-between font-mono text-[11px]">
            <div className="flex items-center gap-2 text-ink-2 font-medium">
              <Hash className="w-3.5 h-3.5 text-accent" />
              <span>Tranzakció azonosító</span>
            </div>
            <span className="text-ink-2 bg-bg px-2 py-0.5 rounded border border-line">
              {payment.id.slice(0, 20)}
            </span>
          </div>
        </div>

        {/* Payment Notes if present */}
        {payment.note && (
          <div className="p-4 rounded-card bg-bg border border-line space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-accent" />
              Megjegyzés a befizetéshez
            </span>
            <p className="text-xs text-ink leading-relaxed font-medium">
              {payment.note}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 sm:p-5 pb-8 sm:pb-5 border-t border-line bg-surface flex justify-end shrink-0 safe-bottom">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto px-7 py-3 rounded-control bg-accent text-white text-xs font-bold hover:bg-accent-strong active:scale-98 transition-all shadow-xs"
        >
          Rendben
        </button>
      </div>
    </div>
  );
};

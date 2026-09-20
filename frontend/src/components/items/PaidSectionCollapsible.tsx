import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  RotateCcw,
  Check,
  X,
  Wifi,
  Home,
  Tv,
  Shield,
  CreditCard,
  FileText
} from 'lucide-react';
import { DashboardItem } from '../../types';
import { usePrivacy } from '../../context/PrivacyContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

const categoryIcons: Record<string, React.ReactNode> = {
  UTILITY: <Wifi className="w-5 h-5" />,
  HOUSING: <Home className="w-5 h-5" />,
  SUBSCRIPTION: <Tv className="w-5 h-5" />,
  INSURANCE: <Shield className="w-5 h-5" />,
  LOAN: <CreditCard className="w-5 h-5" />,
  OTHER: <FileText className="w-5 h-5" />
};

interface PaidSectionCollapsibleProps {
  paidItems: DashboardItem[];
  onUnpay: (item: DashboardItem) => void;
  onSelect?: (item: DashboardItem) => void;
}

export const PaidSectionCollapsible: React.FC<PaidSectionCollapsibleProps> = ({
  paidItems,
  onUnpay,
  onSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [itemToUnpay, setItemToUnpay] = useState<DashboardItem | null>(null);
  const { isPrivate } = usePrivacy();

  // Lock body scroll while confirmation modal is open
  useBodyScrollLock(Boolean(itemToUnpay));

  // ESC handler for confirmation modal (Rule 11)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && itemToUnpay) {
        setItemToUnpay(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itemToUnpay]);

  if (paidItems.length === 0) {
    return null;
  }

  const formatHUF = (val: number) =>
    new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(Math.round(val)) + '\u00A0Ft';

  const totalPaid = paidItems.reduce(
    (sum, it) => sum + (it.actualAmount ?? it.plannedAmount),
    0
  );

  // Helper to format paid date into "09.20" format
  const getPaidDateFormatted = (paidAt?: string | null) => {
    if (!paidAt) return '09.20';
    try {
      const d = new Date(paidAt);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${m}.${day}`;
    } catch {
      return '09.20';
    }
  };

  const handleConfirmUnpay = () => {
    if (itemToUnpay) {
      onUnpay(itemToUnpay);
      setItemToUnpay(null);
    }
  };

  return (
    <>
      <div className="billflow-card rounded-card bg-surface border border-line overflow-hidden transition-all shadow-card">
        {/* Collapsible Header Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between text-left hover:bg-surface-elevated transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-paid/15 text-paid flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold text-ink">
              Már kifizetve ebben a hónapban
            </span>
            <span className="text-xs text-ink-2 font-medium">
              ({paidItems.length} tétel ·{' '}
              <span className={`tabular-nums font-semibold ${isPrivate ? 'privacy-blur' : ''}`}>
                {formatHUF(totalPaid)}
              </span>
              )
            </span>
          </div>

          <div className="text-ink-2 p-1">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* Expanded Items List */}
        {isOpen && (
          <div className="divide-y divide-line/60 border-t border-line/60">
            {paidItems.map((item) => {
              const amount = item.actualAmount ?? item.plannedAmount;
              const formattedDueDate = `2026.09.${String(item.dueDay).padStart(2, '0')}.`;
              const formattedPaidDate = getPaidDateFormatted(item.paidAt);

              return (
                <div
                  key={item.id || item.fixedExpenseId}
                  className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-bg/40 transition-colors group"
                >
                  {/* Left: Category Icon & Details */}
                  <div
                    className="flex items-center gap-3 min-w-0 cursor-pointer"
                    onClick={() => onSelect?.(item)}
                  >
                    {/* Category Icon instead of checkmark */}
                    <div className="w-10 h-10 rounded-control bg-accent-tint text-accent-text flex items-center justify-center shrink-0 border border-accent/20">
                      {categoryIcons[item.category] || <FileText className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-ink truncate group-hover:text-accent transition-colors">
                        {item.name}
                      </p>

                      {/* Due date */}
                      <div className="text-[11px] font-mono text-ink-2 font-medium">
                        {formattedDueDate}
                      </div>

                      {/* Pale Green Settlement Badge: "rendezve 09.20" */}
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40 font-bold text-[10px] font-mono tracking-tight shadow-2xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          <span>rendezve {formattedPaidDate}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Undo Action Button with Confirmation Trigger */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-sm sm:text-base font-extrabold text-ink tabular-nums ${
                        isPrivate ? 'privacy-blur' : ''
                      }`}
                    >
                      {formatHUF(amount)}
                    </span>

                    <button
                      type="button"
                      onClick={() => setItemToUnpay(item)}
                      title="Visszaállítás esedékesre (megerősítéssel)"
                      className="p-2 rounded-control text-ink-2 hover:text-ink hover:bg-surface-elevated active:scale-95 transition-all shadow-2xs"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Reopening / Unpaying Item */}
      {itemToUnpay && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setItemToUnpay(null)}
        >
          <div
            className="w-full max-w-md bg-surface border border-line rounded-hero p-5 sm:p-6 shadow-dialog space-y-4 animate-in zoom-in-95 duration-150 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">Tétel újranyitása</h3>
                  <p className="text-xs text-ink-2">Kifizetés visszavonása és állapot visszaállítása</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setItemToUnpay(null)}
                className="p-1 rounded-full text-ink-2 hover:text-ink hover:bg-surface-elevated transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-ink leading-relaxed">
                Biztosan újranyitod ezt a tételt? A tétel státusza visszaáll <strong>esedékesre</strong> (még nem kifizetett).
              </p>

              <div className="p-3 rounded-card bg-bg border border-line space-y-1">
                <div className="text-xs font-bold text-ink truncate">{itemToUnpay.name}</div>
                <div className="flex items-center justify-between text-xs text-ink-2">
                  <span>Összeg:</span>
                  <span className="font-extrabold text-ink tabular-nums">
                    {formatHUF(itemToUnpay.actualAmount ?? itemToUnpay.plannedAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-ink-2">
                  <span>Kifizetés dátuma:</span>
                  <span className="font-mono">{getPaidDateFormatted(itemToUnpay.paidAt)}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setItemToUnpay(null)}
                className="px-4 py-2 rounded-control border border-line text-ink text-xs font-semibold hover:bg-surface-elevated transition-colors"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={handleConfirmUnpay}
                className="px-4 py-2 rounded-control bg-accent hover:bg-accent-strong active:scale-95 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Igen, újranyitás</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

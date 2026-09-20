import React from 'react';
import { AlertTriangle, Check, Clock } from 'lucide-react';
import { DashboardItem } from '../../types';
import { usePrivacy } from '../../context/PrivacyContext';
import { BankBadge } from '../common/BankBadge';

interface UrgentActionCardProps {
  overdueItem: DashboardItem;
  onPay?: (item: DashboardItem) => void;
  onSelect?: (item: DashboardItem) => void;
}

export const UrgentActionCard: React.FC<UrgentActionCardProps> = ({
  overdueItem,
  onPay,
  onSelect
}) => {
  const { isPrivate } = usePrivacy();

  const formatHUF = (val: number) =>
    new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(Math.round(val)) + '\u00A0Ft';

  const amount = overdueItem.actualAmount ?? overdueItem.plannedAmount;
  const formattedDueDate = `2026.09.${String(overdueItem.dueDay).padStart(2, '0')}.`;
  const overdueDays = Math.max(1, 19 - overdueItem.dueDay);

  const handleAction = () => {
    if (onSelect) {
      onSelect(overdueItem);
    } else if (onPay) {
      onPay(overdueItem);
    }
  };

  return (
    <div className="billflow-card rounded-card p-4 sm:p-5 bg-overdue-bg border border-overdue/40 shadow-sm relative overflow-hidden">
      {/* Top Warning Badge with Red Triangle */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-overdue/15 flex items-center justify-center text-overdue shrink-0">
            <AlertTriangle className="w-4 h-4 fill-overdue/20" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-overdue">
            Azonnali teendő
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-overdue">
          <Clock className="w-3.5 h-3.5" />
          <span>Lejárt {overdueDays} napja</span>
        </div>
      </div>

      {/* Main Content & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Item Info */}
        <div
          className="space-y-1.5 cursor-pointer group"
          onClick={handleAction}
        >
          <h3 className="text-base font-bold text-ink group-hover:text-accent transition-colors">
            {overdueItem.name}
          </h3>

          <div className="flex items-center gap-2 text-xs text-ink-2">
            {/* Formatted Due Date */}
            <span className="font-mono text-ink-2 font-medium">{formattedDueDate}</span>

            <span>•</span>

            {/* Amount */}
            <span
              className={`font-bold text-ink text-sm tabular-nums ${
                isPrivate ? 'privacy-blur' : ''
              }`}
            >
              {formatHUF(amount)}
            </span>
          </div>
        </div>

        {/* Action Button: Wide Befizetés */}
        <button
          type="button"
          onClick={handleAction}
          className="w-full sm:w-auto px-5 py-2.5 rounded-control bg-overdue hover:bg-overdue/90 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all shrink-0"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>Befizetés</span>
        </button>
      </div>
    </div>
  );
};

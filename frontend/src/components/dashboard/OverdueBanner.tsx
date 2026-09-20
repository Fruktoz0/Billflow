import React from 'react';
import { AlertCircle } from 'lucide-react';
import { formatHUF } from '../../utils/format';
import { DashboardItem } from '../../types';

interface OverdueBannerProps {
  overdueItems: DashboardItem[];
  onPayItem: (item: DashboardItem) => void;
}

export const OverdueBanner: React.FC<OverdueBannerProps> = ({
  overdueItems,
  onPayItem
}) => {
  if (!overdueItems || overdueItems.length === 0) {
    return null;
  }

  const primaryItem = overdueItems[0];
  const totalOverdueAmount = overdueItems.reduce(
    (sum, it) => sum + (it.actualAmount ?? it.plannedAmount),
    0
  );

  const displayTitle =
    overdueItems.length === 1
      ? `Lejárt: ${primaryItem.name}, ${formatHUF(primaryItem.actualAmount ?? primaryItem.plannedAmount)}`
      : `${overdueItems.length} lejárt tétel (${formatHUF(totalOverdueAmount)})`;

  return (
    <div
      role="alert"
      className="bg-overdue-bg border border-overdue/25 rounded-card p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-all duration-200"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-full bg-overdue/10 text-overdue flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-4 h-4" />
        </div>
        <span className="text-xs sm:text-sm font-semibold text-overdue truncate">
          {displayTitle}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onPayItem(primaryItem)}
        className="flex-shrink-0 bg-overdue text-white rounded-control px-4 py-1.5 text-xs font-bold hover:bg-overdue/90 active:scale-95 transition-all duration-150 shadow-xs"
      >
        Befizetés
      </button>
    </div>
  );
};

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DashboardItem } from '../../types';
import { ExpenseRow } from './ExpenseRow';

interface DayGroupListProps {
  items: DashboardItem[];
  onPayItem: (item: DashboardItem) => void;
  onUnpayItem: (item: DashboardItem) => void;
  onSelectItem?: (item: DashboardItem) => void;
}

export const DayGroupList: React.FC<DayGroupListProps> = ({
  items,
  onPayItem,
  onUnpayItem,
  onSelectItem
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort items by due day
  const sortedItems = [...items].sort((a, b) => a.dueDay - b.dueDay);

  // Limit to initial 5 items unless expanded
  const INITIAL_VISIBLE_COUNT = 5;
  const visibleItems = isExpanded ? sortedItems : sortedItems.slice(0, INITIAL_VISIBLE_COUNT);
  const remainingCount = sortedItems.length - visibleItems.length;

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {visibleItems.map((item) => (
          <ExpenseRow
            key={item.fixedExpenseId}
            item={item}
            onPay={onPayItem}
            onUnpay={onUnpayItem}
            onClick={onSelectItem}
          />
        ))}
      </div>

      {/* Expand / Collapse Button if there are remaining items */}
      {sortedItems.length > INITIAL_VISIBLE_COUNT && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2.5 px-4 rounded-control border border-line bg-surface hover:bg-bg text-ink-2 hover:text-ink text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>
            {isExpanded
              ? 'Kevesebb tétel mutatása'
              : `Még ${remainingCount} tétel a hónapban`}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

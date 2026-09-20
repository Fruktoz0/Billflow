import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Shield,
  Tv,
  Zap,
  Home,
  CreditCard,
  Check,
  RotateCcw,
  AlertTriangle,
  X
} from 'lucide-react';
import { DashboardItem, ExpenseCategory } from '../../types';
import { formatHUF } from '../../utils/format';
import { BankBadge } from '../common/BankBadge';

interface ExpenseRowProps {
  item: DashboardItem;
  onPay?: (item: DashboardItem) => void;
  onUnpay?: (item: DashboardItem) => void;
  onClick?: (item: DashboardItem) => void;
}

export const ExpenseRow: React.FC<ExpenseRowProps> = ({
  item,
  onPay,
  onUnpay,
  onClick
}) => {
  const [showOverdueBubble, setShowOverdueBubble] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Close bubble on outside click or ESC key (Rule 11)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        setShowOverdueBubble(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showOverdueBubble) {
        setShowOverdueBubble(false);
      }
    };
    if (showOverdueBubble) {
      document.addEventListener('click', handleOutsideClick);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showOverdueBubble]);

  const getCategoryIcon = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'UTILITY':
        return Zap;
      case 'HOUSING':
        return Home;
      case 'SUBSCRIPTION':
        return Tv;
      case 'INSURANCE':
        return Shield;
      case 'LOAN':
        return CreditCard;
      default:
        return Smartphone;
    }
  };

  const Icon = getCategoryIcon(item.category);
  const amountToDisplay =
    item.status === 'PAID' && item.actualAmount !== null
      ? item.actualAmount
      : item.plannedAmount;

  // Compute exact due date in 2026.09.XX. format
  const formattedDueDate = `2026.09.${String(item.dueDay).padStart(2, '0')}.`;

  const today = 19; // September 19 per mockup
  const isOverdue = item.status === 'PENDING' && item.dueDay < today;
  const overdueDays = Math.max(1, today - item.dueDay);

  // Relative due badge placed directly under the date
  const renderDueRelativeBadge = () => {
    if (item.status === 'PAID' || item.status === 'SKIPPED') {
      return null;
    }

    const diff = item.dueDay - today;

    if (diff < 0) {
      return (
        <span className="inline-flex items-center text-[10px] font-semibold bg-overdue/10 text-overdue border border-overdue/25 px-2 py-0.5 rounded-full">
          {Math.abs(diff)} napja lejárt
        </span>
      );
    }

    if (diff === 0) {
      return (
        <span className="inline-flex items-center text-[10px] font-semibold bg-soon-bg text-soon border border-amber-300/40 px-2 py-0.5 rounded-full">
          Ma esedékes
        </span>
      );
    }

    return (
      <span className="inline-flex items-center text-[10px] font-medium text-ink-2 bg-bg border border-line px-2 py-0.5 rounded-full">
        {diff} nap múlva
      </span>
    );
  };

  const renderStatusChipOrWarning = () => {
    if (item.status === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-paid-bg text-paid px-2 py-0.5 rounded-full">
          <Check className="w-3 h-3 stroke-[2.5]" />
          Kifizetve
        </span>
      );
    }
    if (item.status === 'SKIPPED') {
      return (
        <span className="inline-flex items-center text-[11px] font-semibold bg-bg border border-line text-ink-2 px-2 py-0.5 rounded-full">
          Kihagyva
        </span>
      );
    }

    // Pending: if overdue -> red warning triangle with interactive bubble
    if (isOverdue) {
      return (
        <div className="relative inline-block" ref={bubbleRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowOverdueBubble((prev) => !prev);
            }}
            className="w-7 h-7 rounded-full bg-overdue/15 hover:bg-overdue/25 active:scale-95 flex items-center justify-center text-overdue transition-all"
            title="Lejárt tétel - kattints a részletekért"
          >
            <AlertTriangle className="w-4 h-4 stroke-[2.2] fill-overdue/20" />
          </button>

          {/* Floating Overdue Popover Bubble: soft pastel red with thin border */}
          {showOverdueBubble && (
            <div
              className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-red-50/95 dark:bg-red-950/90 border border-red-200 dark:border-red-800/40 rounded-card shadow-lg z-30 text-left animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-2 border-b border-red-200/60 dark:border-red-800/40 pb-1.5 mb-1.5">
                <div className="flex items-center gap-1.5 text-overdue font-bold text-xs">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Lejárt kötelezettség!</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOverdueBubble(false)}
                  className="text-ink-2 hover:text-ink p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1 text-xs text-ink">
                <div>
                  <span className="text-ink-2 font-medium">Esedékesség: </span>
                  <span className="font-bold">{formattedDueDate}</span>
                </div>
                <div>
                  <span className="text-ink-2 font-medium">Késedelem: </span>
                  <span className="font-extrabold text-overdue">{overdueDays} napja lejárt</span>
                </div>
                <div>
                  <span className="text-ink-2 font-medium">Tervezett összeg: </span>
                  <span className="font-bold tabular-nums">{formatHUF(item.plannedAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Normal pending items: relative due badge is rendered under the date on the left/middle
    return null;
  };

  return (
    <div
      onClick={() => onClick?.(item)}
      className="billflow-card rounded-card p-3 sm:p-3.5 flex items-center justify-between gap-3 group hover:border-accent/40 hover:shadow-sm cursor-pointer transition-all duration-150"
    >
      {/* 1. Left Icon Container */}
      <div className="w-10 h-10 rounded-control bg-accent-tint flex items-center justify-center text-accent-text flex-shrink-0">
        <Icon className="w-5 h-5 stroke-[1.9]" />
      </div>

      {/* 2. Middle Details: Item Name + Due Date + Relative Due Badge */}
      <div className="flex-1 min-w-0 pr-2">
        <span className="font-semibold text-sm text-ink truncate block group-hover:text-accent transition-colors">
          {item.name}
        </span>
        <div className="mt-1 flex flex-col items-start gap-1">
          {/* Formatted Date */}
          <span className="font-mono text-[11px] text-ink-2 font-medium">
            {formattedDueDate}
          </span>
          {/* Relative Due Badge (under the date) */}
          {renderDueRelativeBadge()}
        </div>
      </div>

      {/* 3. Right: Amount & Status / Wide Pay Button */}
      <div className="flex flex-col items-end flex-shrink-0">
        <span className="font-bold text-sm text-ink tabular-nums privacy-blur block leading-tight">
          {formatHUF(amountToDisplay)}
        </span>

        <div className="mt-1 flex items-center gap-2">
          {renderStatusChipOrWarning()}

          {/* Wide, Well-Touchable "Befizetés" Button (opens reduced modal instead of instant pay) */}
          {item.status !== 'PAID' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(item); // opens reduced detail/payment modal
              }}
              className="px-3 py-1 rounded-control bg-accent hover:bg-accent-strong text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
              title="Befizetés rögzítése és adatok ellenőrzése"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Befizetés</span>
            </button>
          )}

          {item.status === 'PAID' && onUnpay && (
            <button
              type="button"
              title="Visszavonás nyitottra"
              onClick={(e) => {
                e.stopPropagation();
                onUnpay(item);
              }}
              className="w-6 h-6 rounded-full bg-bg border border-line text-ink-2 flex items-center justify-center hover:text-ink active:scale-90 transition-all opacity-0 group-hover:opacity-100"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

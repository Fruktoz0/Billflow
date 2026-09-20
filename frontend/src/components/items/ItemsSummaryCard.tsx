import React from 'react';
import { usePrivacy } from '../../context/PrivacyContext';

interface ItemsSummaryCardProps {
  remainingPending: number;
  totalPlanned: number;
  paidAmount: number;
  paidCount: number;
  totalCount: number;
  currentDayStr?: string;
}

export const ItemsSummaryCard: React.FC<ItemsSummaryCardProps> = ({
  remainingPending,
  totalPlanned,
  paidAmount,
  paidCount,
  totalCount,
  currentDayStr = '09.19'
}) => {
  const { isPrivate } = usePrivacy();

  const formatHUF = (val: number) =>
    new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(Math.round(val)) + '\u00A0Ft';

  // Calculate percentage of paid amount
  const paidPercent = totalPlanned > 0 ? Math.min(100, Math.round((paidAmount / totalPlanned) * 100)) : 0;

  return (
    <div className="billflow-card rounded-hero p-5 sm:p-6 bg-surface border border-line shadow-card space-y-4 relative overflow-hidden">
      {/* Top Header: Még fizetendő + Mini Day Card in Top Right Corner */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-2">
            Még fizetendő ebben a hónapban
          </span>
          <div
            className={`text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-display tabular-nums mt-0.5 ${
              isPrivate ? 'privacy-blur' : ''
            }`}
          >
            {formatHUF(remainingPending)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ink-2 mt-1">
            <span>Teljes havi keret:</span>
            <span
              className={`font-bold text-ink tabular-nums ${
                isPrivate ? 'privacy-blur' : ''
              }`}
            >
              {formatHUF(totalPlanned)}
            </span>
          </div>
        </div>

        {/* Mini Day Indicator Card in Top Right Corner ("09.19") */}
        <div className="shrink-0 flex flex-col items-center justify-center px-2.5 py-1.5 rounded-control bg-surface border border-line shadow-xs">
          <span className="text-[9px] uppercase font-bold tracking-wider text-ink-2">Ma</span>
          <span className="text-xs sm:text-sm font-extrabold font-mono text-accent">
            {currentDayStr}
          </span>
        </div>
      </div>

      {/* Progress Bar (Paid vs Remaining) */}
      <div className="space-y-1.5 pt-1">
        <div className="h-3 w-full bg-accent-tint/60 rounded-full overflow-hidden flex p-0.5 border border-line/40">
          <div
            className="h-full bg-paid rounded-full transition-all duration-500 ease-out"
            style={{ width: `${paidPercent}%` }}
          />
        </div>

        {/* Counter and Ratio Details */}
        <div className="flex items-center justify-between text-xs text-ink-2 pt-0.5">
          <span className="font-medium">
            <span className="text-ink font-semibold">{paidCount}</span> a(z) {totalCount} tételből kifizetve
          </span>
          <span className="font-semibold text-paid tabular-nums">
            {paidPercent}% teljesítve ({formatHUF(paidAmount)})
          </span>
        </div>
      </div>
    </div>
  );
};

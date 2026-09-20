import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatHUF } from '../../utils/format';

export interface AccountAllocation {
  id: string;
  name: string;
  amount: number;
  color?: string;
  dotClass?: string;
}

interface HeroCardProps {
  periodTitle?: string;
  heroAmount: number;
  allocations: AccountAllocation[];
  monthLabel?: string;
  paidCount: number;
  totalCount: number;
  selectedYear?: number;
  selectedMonth?: number;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onResetMonth?: () => void;
  isCurrentMonthActual?: boolean;
  todayLabel?: string; // e.g. "2026. szeptember 19., szombat"
}

const TODAY_MONTH_IDX = 8; // September
const TODAY_YEAR = 2026;
const TODAY_DAY = 19;
const DAY_NAMES = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];

export const HeroCard: React.FC<HeroCardProps> = ({
  heroAmount,
  allocations,
  monthLabel = 'Szeptember',
  paidCount,
  totalCount,
  selectedYear = TODAY_YEAR,
  selectedMonth = TODAY_MONTH_IDX,
  onPrevMonth,
  onNextMonth,
  onResetMonth,
  isCurrentMonthActual
}) => {
  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0) || 1;
  const progressPercent = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  // Compute current day label (only for actual current month)
  const todayDate = new Date(TODAY_YEAR, TODAY_MONTH_IDX, TODAY_DAY);
  const dayName = DAY_NAMES[todayDate.getDay()];
  const todayDisplayLabel = `${TODAY_YEAR}. ${monthLabel.toLowerCase()} ${TODAY_DAY}., ${dayName}`;

  return (
    <div className="billflow-card rounded-hero p-5 sm:p-6 bg-surface shadow-sm transition-colors duration-200">

      {/* 1. Teljes szélességű hónapválasztó */}
      {onPrevMonth && onNextMonth ? (
        <div className="flex items-center justify-between gap-2 mb-3 bg-bg rounded-control border border-line px-2 py-1.5">
          <button
            type="button"
            onClick={onPrevMonth}
            className="p-2 rounded-control hover:bg-surface-elevated active:scale-95 text-ink-2 hover:text-ink transition-all"
            title="Előző hónap"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 text-center">
            <span className="text-base sm:text-lg font-extrabold text-ink tracking-tight">
              {selectedYear}. {monthLabel.toLowerCase()}
            </span>
          </div>

          <button
            type="button"
            onClick={onNextMonth}
            className="p-2 rounded-control hover:bg-surface-elevated active:scale-95 text-ink-2 hover:text-ink transition-all"
            title="Következő hónap"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      ) : null}

      {/* 2. Aktuális nap kártya (csak aktuális hónapban, vagy kattintva navigál vissza) */}
      <div className="mb-4">
        <button
          type="button"
          onClick={!isCurrentMonthActual && onResetMonth ? onResetMonth : undefined}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-control border transition-all text-left ${
            isCurrentMonthActual
              ? 'bg-accent-tint/40 border-accent/20 cursor-default'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300/60 dark:border-amber-700/40 hover:bg-amber-100 dark:hover:bg-amber-950/50 cursor-pointer active:scale-[0.99]'
          }`}
        >
          <Calendar className={`w-4 h-4 shrink-0 ${isCurrentMonthActual ? 'text-accent' : 'text-amber-600 dark:text-amber-400'}`} />
          <div className="min-w-0">
            {isCurrentMonthActual ? (
              <span className="text-xs sm:text-sm font-bold text-ink">
                {todayDisplayLabel}
              </span>
            ) : (
              <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300">
                Ma: {todayDisplayLabel} — kattints a visszaugráshoz
              </span>
            )}
          </div>
        </button>
      </div>

      {/* 3. Hero Big Number */}
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-2 mb-1">Hátralévő befizetés</p>
        <span className="text-3xl sm:text-4xl font-bold tracking-tight text-ink tabular-nums privacy-blur block leading-tight">
          {formatHUF(heroAmount)}
        </span>
      </div>

      {/* 4. Segmented Proportional Account Bar */}
      {allocations.length > 0 && (
        <div className="mb-3.5">
          <div className="w-full h-2 rounded-full flex overflow-hidden gap-[2px] bg-line/40">
            {allocations.map((acc, idx) => {
              const widthPct = Math.max(5, (acc.amount / totalAllocated) * 100);
              const bgStyle =
                idx === 0
                  ? 'bg-accent'
                  : idx === 1
                  ? 'bg-accent-soft'
                  : 'bg-accent-strong opacity-75';

              return (
                <div
                  key={acc.id || idx}
                  style={{ width: `${widthPct}%` }}
                  className={`${bgStyle} h-full transition-all duration-300`}
                  title={`${acc.name}: ${formatHUF(acc.amount)}`}
                />
              );
            })}
          </div>

          {/* Account Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 pt-2 text-xs text-ink-2">
            {allocations.map((acc, idx) => {
              const dotColor =
                idx === 0
                  ? 'bg-accent'
                  : idx === 1
                  ? 'bg-accent-soft'
                  : 'bg-accent-strong';

              return (
                <div key={acc.id || idx} className="flex items-center justify-between sm:justify-start gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                    <span className="font-medium text-ink">{acc.name}</span>
                  </div>
                  <span className="font-semibold text-ink tabular-nums privacy-blur">
                    {formatHUF(acc.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Monthly Progress at bottom */}
      <div className="pt-3 border-t border-line/60">
        <div className="flex items-center justify-between text-xs text-ink-2 mb-1.5">
          <span>
            {monthLabel}: <strong className="text-ink font-semibold">{paidCount}</strong> a{' '}
            <strong className="text-ink font-semibold">{totalCount}</strong>-ből kifizetve
          </span>
          <span className="text-[11px] font-semibold text-accent">{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-line/60 overflow-hidden">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-accent transition-all duration-500 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

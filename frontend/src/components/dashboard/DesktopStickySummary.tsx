import React from 'react';
import { Calendar as CalendarIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { DashboardSummary, AccountBreakdown, DashboardItem } from '../../types';
import { formatHUF } from '../../utils/format';

interface DesktopStickySummaryProps {
  summary: DashboardSummary;
  accountsBreakdown: AccountBreakdown[];
  items: DashboardItem[];
  monthLabel?: string;
}

export const DesktopStickySummary: React.FC<DesktopStickySummaryProps> = ({
  summary,
  accountsBreakdown,
  items,
  monthLabel = 'Szeptember'
}) => {
  const paidPercent =
    summary.totalPlanned > 0
      ? Math.min(100, Math.round((summary.totalPaid / summary.totalPlanned) * 100))
      : 0;

  // Calendar matrix generator for the current month
  const today = new Date();
  const currentMonthDay = today.getDate();
  const daysInMonth = 30; // September has 30 days
  const startDayOfWeek = 2; // e.g. Tuesday (0: Mon, 1: Tue, etc.)

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekDays = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];

  return (
    <aside className="space-y-6 sticky top-20">
      {/* 1. Monthly Summary Card */}
      <div className="billflow-card rounded-hero p-5 sm:p-6 bg-surface shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-2 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-accent" />
            {monthLabel} összesen
          </span>
          <span className="text-xs font-bold text-accent px-2 py-0.5 rounded-full bg-accent-tint">
            {summary.paidCount} / {summary.totalItems} fizetve
          </span>
        </div>

        {/* Dual numbers: Teljes keret vs Még szükséges fedezet */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <span className="text-xs text-ink-2 block mb-0.5">Még esedékes</span>
            <span className="text-xl font-bold text-ink tabular-nums privacy-blur">
              {formatHUF(summary.totalRemainingPending)}
            </span>
          </div>
          <div>
            <span className="text-xs text-ink-2 block mb-0.5">Már kifizetve</span>
            <span className="text-xl font-bold text-paid tabular-nums privacy-blur">
              {formatHUF(summary.totalPaid)}
            </span>
          </div>
        </div>

        {/* Haladási sáv */}
        <div className="mb-5">
          <div className="w-full h-2 rounded-full bg-line/60 overflow-hidden flex">
            <div
              style={{ width: `${paidPercent}%` }}
              className="h-full bg-paid transition-all duration-500 rounded-full"
            />
          </div>
        </div>

        {/* Számlánkénti fedezeti bontás */}
        <div className="pt-4 border-t border-line space-y-2.5">
          <span className="text-xs font-semibold text-ink block">Számlánkénti fedezeti igény</span>
          {accountsBreakdown.map((acc) => (
            <div key={acc.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: acc.color || '#0E8A9A' }}
                />
                <span className="text-ink font-medium">{acc.name}</span>
              </div>
              <span className="font-semibold text-ink tabular-nums privacy-blur">
                {formatHUF(acc.pendingAmount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Mini Havi Naptár Widget */}
      <div className="billflow-card rounded-hero p-5 bg-surface shadow-sm">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-semibold text-ink">Naptár ({monthLabel})</span>
          <span className="text-[11px] text-ink-2">Hétfővel induló</span>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-ink-2 mb-1.5">
          {weekDays.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {/* Empty offset days */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <span key={`empty-${i}`} className="p-1.5" />
          ))}

          {/* Month days */}
          {daysArray.map((day) => {
            const isToday = day === currentMonthDay;
            const itemsOnDay = items.filter((it) => it.dueDay === day);
            const hasOverdue = itemsOnDay.some((it) => it.status !== 'PAID' && day < currentMonthDay);
            const hasPending = itemsOnDay.some((it) => it.status === 'PENDING' && day >= currentMonthDay);
            const hasPaid = itemsOnDay.some((it) => it.status === 'PAID');

            let dotColor = '';
            if (hasOverdue) dotColor = 'bg-overdue';
            else if (hasPending) dotColor = 'bg-accent';
            else if (hasPaid) dotColor = 'bg-paid';

            return (
              <div
                key={day}
                className={`flex flex-col items-center justify-center p-1 rounded-control transition-colors relative ${
                  isToday
                    ? 'bg-accent text-white font-bold shadow-sm'
                    : 'text-ink hover:bg-bg'
                }`}
              >
                <span>{day}</span>
                {dotColor && (
                  <span
                    className={`w-1 h-1 rounded-full mt-0.5 ${
                      isToday ? 'bg-white' : dotColor
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

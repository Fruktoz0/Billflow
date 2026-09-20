import React from 'react';
import { CreditCard, Star, Edit3, Trash2 } from 'lucide-react';
import { BankAccount } from '../../types';
import { usePrivacy } from '../../context/PrivacyContext';
import { BankBadge } from '../common/BankBadge';

interface AccountCardProps {
  account: BankAccount;
  itemCount: number;
  totalAllocated: number;
  onEdit: (account: BankAccount) => void;
  onDelete?: (account: BankAccount) => void;
}

const TYPE_LABELS: Record<string, string> = {
  BANK_ACCOUNT: 'Banki folyószámla',
  REVOLUT: 'Revolut / Fintech',
  CREDIT_CARD: 'Hitelkártya',
  CASH: 'Készpénz keret',
  SAVINGS: 'Megtakarítás'
};

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  itemCount,
  totalAllocated,
  onEdit,
  onDelete
}) => {
  const { isPrivate } = usePrivacy();

  const formatHUF = (val: number) =>
    new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(Math.round(val)) + '\u00A0Ft';

  return (
    <div className="billflow-card rounded-hero p-5 bg-surface border border-line shadow-card flex flex-col justify-between space-y-4 relative overflow-hidden group">
      {/* Top accent line indicator */}
      <div
        className="absolute top-0 inset-x-0 h-1.5"
        style={{ backgroundColor: account.color || '#0E8A9A' }}
      />

      {/* Header Info */}
      <div className="space-y-2 pt-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <BankBadge account={account} size="md" />
            <h3 className="text-base font-bold text-ink truncate">
              {account.name}
            </h3>
          </div>

          {account.isDefault && (
            <span className="px-2 py-0.5 rounded-full bg-accent-tint text-accent-text text-[10px] font-bold flex items-center gap-1 border border-accent/20 shrink-0">
              <Star className="w-3 h-3 fill-accent text-accent" />
              <span>Alapértelmezett</span>
            </span>
          )}
        </div>

        <p className="text-xs text-ink-2 font-medium">
          {TYPE_LABELS[account.type] || 'Egyéb számla'}
        </p>
      </div>

      {/* Stats Breakdown */}
      <div className="p-3 rounded-card bg-bg border border-line/60 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-2 block">
            Hozzárendelt fix tételek
          </span>
          <span className="text-sm font-bold text-ink">
            {itemCount} kötelezettség
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-2 block">
            Havi szükséges fedezet
          </span>
          <span
            className={`text-sm font-extrabold text-ink tabular-nums ${
              isPrivate ? 'privacy-blur' : ''
            }`}
          >
            {formatHUF(totalAllocated)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-1 border-t border-line/60 text-xs">
        <span className="font-mono text-ink-2/60 text-[11px]">
          {account.currency || 'HUF'}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(account)}
            className="px-3 py-1.5 rounded-control text-ink-2 hover:text-ink hover:bg-surface-elevated font-semibold transition-colors flex items-center gap-1 border border-line"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Szerkesztés</span>
          </button>

          {onDelete && !account.isDefault && (
            <button
              type="button"
              onClick={() => onDelete(account)}
              className="p-1.5 rounded-control text-overdue hover:bg-overdue-bg transition-colors"
              title="Számla inaktiválása"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

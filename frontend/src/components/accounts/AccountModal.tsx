import React, { useState, useEffect } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { BankAccount, AccountType } from '../../types';
import { BANK_PRESETS, BankPreset, findBankPreset } from '../../utils/bankPresets';
import { BankBadge } from '../common/BankBadge';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: BankAccount | null;
  onSave: (data: Partial<BankAccount>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#0E8A9A', // Billflow Cyan
  '#5D9CEC', // Sky Blue
  '#2ECC71', // Emerald Green
  '#F39C12', // Warm Orange
  '#9B59B6', // Purple
  '#E74C3C'  // Crimson Red
];

const ACCOUNT_TYPES: { id: AccountType; label: string }[] = [
  { id: 'BANK_ACCOUNT', label: 'Banki folyószámla' },
  { id: 'REVOLUT', label: 'Revolut / Fintech kártya' },
  { id: 'CREDIT_CARD', label: 'Hitelkártya' },
  { id: 'CASH', label: 'Készpénz keret' },
  { id: 'SAVINGS', label: 'Megtakarítási számla' }
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  account,
  onSave,
  onDelete
}) => {
  const isEditing = Boolean(account);

  // Body scroll lock
  useBodyScrollLock(isOpen);

  const [selectedPresetId, setSelectedPresetId] = useState<string>('otp');
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('BANK_ACCOUNT');
  const [color, setColor] = useState('#0E8A9A');
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name || '');
      setType(account.type || 'BANK_ACCOUNT');
      setColor(account.color || '#0E8A9A');
      setIsDefault(Boolean(account.isDefault));
      const matched = findBankPreset(account.bankCode || account.name);
      setSelectedPresetId(matched.id);
    } else {
      const defaultPreset = BANK_PRESETS[0]; // OTP
      setSelectedPresetId(defaultPreset.id);
      setName(defaultPreset.name);
      setType(defaultPreset.defaultType);
      setColor(defaultPreset.brandColor);
      setIsDefault(false);
    }
    setShowDeleteConfirm(false);
  }, [account, isOpen]);

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

  if (!isOpen) return null;

  const handleSelectPreset = (preset: BankPreset) => {
    setSelectedPresetId(preset.id);
    if (preset.id !== 'custom') {
      setName(preset.name);
      setColor(preset.brandColor);
      setType(preset.defaultType);
    } else {
      if (!name || name === 'OTP Bank') setName('Egyedi számla');
      setColor('#0E8A9A');
      setType('BANK_ACCOUNT');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        type,
        color,
        bankCode: selectedPresetId,
        isDefault
      });
      onClose();
    } catch (err) {
      console.error('[AccountModal] Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!account || !onDelete) return;
    setIsSaving(true);
    try {
      await onDelete(account.id);
      onClose();
    } catch (err) {
      console.error('[AccountModal] Delete failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full sm:max-w-lg bg-surface border border-line rounded-t-hero sm:rounded-hero shadow-dialog overflow-hidden flex flex-col max-h-[92vh] safe-bottom animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-line flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <BankBadge bankCode={selectedPresetId} size="md" />
            <h3 className="text-base font-bold text-ink">
              {isEditing ? 'Számla szerkesztése' : 'Új számla rögzítése'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-control text-ink-2 hover:text-ink hover:bg-surface-elevated transition-colors"
            title="Bezárás (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* 1. Bank Preset Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink uppercase tracking-wider block">
              Válassz bankot vagy szolgáltatót
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto p-1 border border-line rounded-control bg-bg/50">
              {BANK_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2 rounded-control flex flex-col items-center gap-1 text-center transition-all border ${
                      isSelected
                        ? 'border-accent bg-accent/10 shadow-xs font-bold'
                        : 'border-transparent hover:border-line hover:bg-surface'
                    }`}
                  >
                    <BankBadge bankCode={preset.id} size="md" showTooltip={false} />
                    <span className="text-[11px] text-ink truncate w-full leading-tight">
                      {preset.shortName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink uppercase tracking-wider">
              Számla megnevezése <span className="text-overdue">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="pl. OTP Folyószámla, Revolut..."
              className="w-full px-3.5 py-2.5 bg-bg border border-line rounded-control text-sm text-ink placeholder:text-ink-2/60 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* 3. Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink uppercase tracking-wider">
              Számla típusa
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full px-3.5 py-2.5 bg-bg border border-line rounded-control text-sm text-ink font-medium focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Color Picker (active mainly for custom or overriding) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink uppercase tracking-wider">
              Egyedi színválasztás
            </label>
            <div className="flex items-center gap-3 pt-1">
              {PRESET_COLORS.map((col) => {
                const isSelected = color.toLowerCase() === col.toLowerCase();
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setColor(col)}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-105 flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: col }}
                  >
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Default account checkbox */}
          <label className="flex items-center gap-2.5 pt-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-line text-accent focus:ring-accent w-4 h-4"
            />
            <span className="text-xs font-bold text-ink">
              Elsődleges (alapértelmezett) számla a háztartásban
            </span>
          </label>

          {/* Delete Danger Zone */}
          {isEditing && onDelete && (
            <div className="pt-2 border-t border-line">
              {showDeleteConfirm ? (
                <div className="p-3 bg-overdue-bg border border-overdue/40 rounded-control space-y-2">
                  <p className="text-xs font-semibold text-overdue">
                    Biztosan inaktiválni szeretnéd ezt a számlát?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleDelete}
                      className="px-3 py-1.5 bg-overdue text-white rounded-control text-xs font-bold hover:bg-overdue/90"
                    >
                      Igen, inaktiválás
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 bg-surface border border-line text-ink rounded-control text-xs font-semibold hover:bg-surface-elevated"
                    >
                      Mégse
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs font-semibold text-overdue hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Számla inaktiválása
                </button>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-surface flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-control border border-line text-ink text-sm font-semibold hover:bg-surface-elevated transition-colors"
          >
            Mégse
          </button>
          <button
            type="button"
            disabled={isSaving || !name.trim()}
            onClick={handleSubmit}
            className="px-5 py-2 rounded-control bg-accent-strong hover:bg-accent-strong/90 active:scale-98 text-on-accent text-sm font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? 'Mentés...' : 'Mentés'}
          </button>
        </div>
      </div>
    </div>
  );
};

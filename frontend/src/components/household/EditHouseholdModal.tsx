import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Home, RefreshCw, AlertTriangle, Check, Loader2, Save } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { api } from '../../services/api';
import { Household } from '../../types';

interface EditHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  household: Household | null;
  onSaved: (updated: Household) => void;
}

export const EditHouseholdModal: React.FC<EditHouseholdModalProps> = ({
  isOpen,
  onClose,
  household,
  onSaved
}) => {
  useBodyScrollLock(isOpen);

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('HUF');
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (household && isOpen) {
      setName(household.name);
      setCurrency(household.currency || 'HUF');
      setError(null);
      setSuccessMsg(null);
      setShowRegenConfirm(false);
    }
  }, [household, isOpen]);

  if (!isOpen || !household) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError('A háztartás neve nem lehet üres!');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.households.updateCurrent({
        name: name.trim(),
        currency: currency.trim()
      });
      if (res.household) {
        onSaved(res.household);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Nem sikerült elmenteni a módosításokat');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateCode = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsRegenerating(true);
    try {
      const res = await api.households.regenerateInviteCode();
      setShowRegenConfirm(false);
      setSuccessMsg(`Új meghívókód generálva: ${res.inviteCode}`);
      onSaved({
        ...household,
        inviteCode: res.inviteCode
      });
    } catch (err: any) {
      setError(err.message || 'Nem sikerült újragenerálni a meghívókódot');
    } finally {
      setIsRegenerating(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-surface flex flex-col w-screen h-[100dvh] max-h-[100dvh] overflow-hidden animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      {/* Header */}
      <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-line bg-surface-elevated/80 flex items-center justify-between gap-3 shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-accent-tint text-accent flex items-center justify-center shrink-0 border border-accent/20">
            <Home className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink truncate font-display">
              Háztartás beállításai
            </h2>
            <p className="text-[11px] text-ink-2 truncate">
              Név és biztonsági meghívókód módosítása
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-bg hover:bg-surface-elevated border border-line flex items-center justify-center text-ink-2 hover:text-ink transition-colors shrink-0"
          aria-label="Bezárás"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6 max-w-xl mx-auto w-full space-y-6 overscroll-contain">
        {error && (
          <div className="p-3.5 rounded-card bg-overdue-tint border border-overdue/30 text-overdue text-xs font-semibold animate-in fade-in duration-200">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-card bg-paid-tint border border-paid/30 text-paid-text text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-paid shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="billflow-card rounded-card p-5 bg-surface border border-line space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-2 mb-1.5">
              Háztartás megnevezése
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="pl. Budapesti Otthon / Kovács Család"
              className="w-full px-3.5 py-2.5 rounded-control bg-bg border border-line text-ink text-sm placeholder:text-ink-2/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-2 mb-1.5">
              Alapértelmezett pénznem
            </label>
            <input
              type="text"
              disabled
              value={currency}
              className="w-full px-3.5 py-2.5 rounded-control bg-bg/50 border border-line text-ink-2 text-sm font-mono cursor-not-allowed"
            />
            <span className="text-[11px] text-ink-2 mt-1 block">
              A Billflow jelenleg a Magyar Forint (HUF) elszámolást támogatja.
            </span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2.5 px-4 rounded-control bg-accent hover:bg-accent/90 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mentés...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Módosítások mentése</span>
              </>
            )}
          </button>
        </form>

        {/* Security: Regenerate invite code section */}
        <div className="billflow-card rounded-card p-5 bg-surface border border-line space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-2">
              Meghívókód érvénytelenítése & újragenerálása
            </span>
          </div>

          <p className="text-xs text-ink-2 leading-relaxed">
            Ha a jelenlegi meghívókód (<span className="font-mono font-bold text-ink">{household.inviteCode}</span>) illetéktelenekhez jutott, újragenerálhatod. A korábbi kód és a hozzá tartozó régebbi linkek azonnal érvénytelenné válnak.
          </p>

          {!showRegenConfirm ? (
            <button
              type="button"
              onClick={() => setShowRegenConfirm(true)}
              className="py-2 px-3.5 rounded-control bg-bg hover:bg-surface-elevated border border-line text-ink font-semibold text-xs flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-accent" />
              <span>Új meghívókód generálása</span>
            </button>
          ) : (
            <div className="p-3.5 rounded-card bg-overdue-tint/60 border border-overdue/30 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-2 text-xs text-overdue">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold">
                  Biztosan új kódot generálsz? A jelenlegi kód ({household.inviteCode}) azonnal megszűnik működni!
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isRegenerating}
                  onClick={handleRegenerateCode}
                  className="py-1.5 px-3 rounded-control bg-overdue text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generálás...</span>
                    </>
                  ) : (
                    <span>Igen, kód újragenerálása</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowRegenConfirm(false)}
                  className="py-1.5 px-3 rounded-control bg-bg border border-line text-ink text-xs font-semibold hover:bg-surface-elevated"
                >
                  Mégse
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-4 sm:px-6 py-3 border-t border-line bg-surface-elevated/80 flex items-center justify-end gap-3 shrink-0 backdrop-blur-md"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-control bg-bg hover:bg-surface-elevated border border-line text-ink text-xs font-semibold transition-colors"
        >
          Bezárás
        </button>
      </div>
    </div>,
    document.body
  );
};

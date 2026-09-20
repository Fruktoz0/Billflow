import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Key, LogIn, AlertCircle, Check, Loader2, Info } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { api } from '../../services/api';
import { Household } from '../../types';

interface JoinHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined: (household: Household) => void;
}

export const JoinHouseholdModal: React.FC<JoinHouseholdModalProps> = ({
  isOpen,
  onClose,
  onJoined
}) => {
  useBodyScrollLock(isOpen);

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (isOpen) {
      setCode('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setCode(val);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = code.trim().toUpperCase();
    if (!clean || clean.length < 4) {
      setError('Kérlek adj meg egy érvényes meghívókódot (pl. BF-XXXXXX)!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.households.joinByCode(clean);
      if (res.household) {
        onJoined(res.household);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Nem sikerült csatlakozni a megadott kóddal');
    } finally {
      setIsLoading(false);
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
            <Key className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink truncate font-display">
              Csatlakozás háztartáshoz
            </h2>
            <p className="text-[11px] text-ink-2 truncate">
              Közös számlák és fix kiadások megosztása
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
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6 max-w-lg mx-auto w-full space-y-5 overscroll-contain">
        {error && (
          <div className="p-3.5 rounded-card bg-overdue-tint border border-overdue/30 text-overdue text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="billflow-card rounded-card p-5 bg-surface border border-line space-y-5">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-2">
              Írd be a meghívókódot
            </span>
            <p className="text-xs text-ink-2">
              A háztartás tulajdonosa által megosztott 9 karakteres kód (pl. <span className="font-mono font-bold text-ink">BF-K8M2P4</span>).
            </p>
          </div>

          <div>
            <input
              type="text"
              required
              autoFocus
              maxLength={12}
              value={code}
              onChange={handleInputChange}
              placeholder="BF-XXXXXX"
              className="w-full text-center py-3.5 px-4 rounded-card bg-bg border-2 border-line text-ink font-mono font-black text-xl sm:text-2xl tracking-widest placeholder:text-ink-2/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all uppercase"
            />
          </div>

          {/* Warning note */}
          <div className="p-3.5 rounded-card bg-bg border border-line flex items-start gap-2.5 text-xs text-ink-2">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Csatlakozáskor átkerülsz az új háztartásba, és hozzáférsz annak közös számláihoz és fix költség sablonjaihoz.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="w-full py-3 px-4 rounded-control bg-accent hover:bg-accent/90 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Csatlakozás folyamatban...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Csatlakozás a háztartáshoz</span>
              </>
            )}
          </button>
        </form>
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
          Mégse
        </button>
      </div>
    </div>,
    document.body
  );
};

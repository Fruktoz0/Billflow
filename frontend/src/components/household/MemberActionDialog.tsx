import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Shield, UserMinus, LogOut, Loader2 } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { User } from '../../types';

export type MemberActionType = 'PROMOTE_OWNER' | 'DEMOTE_MEMBER' | 'REMOVE_MEMBER' | 'LEAVE_HOUSEHOLD';

interface MemberActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: MemberActionType | null;
  targetMember: User | null;
  householdName: string;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export const MemberActionDialog: React.FC<MemberActionDialogProps> = ({
  isOpen,
  onClose,
  actionType,
  targetMember,
  householdName,
  onConfirm,
  isLoading
}) => {
  useBodyScrollLock(isOpen);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !actionType) return null;

  const isDanger = actionType === 'REMOVE_MEMBER' || actionType === 'LEAVE_HOUSEHOLD' || actionType === 'DEMOTE_MEMBER';

  const getDialogDetails = () => {
    switch (actionType) {
      case 'PROMOTE_OWNER':
        return {
          title: 'Kinevezés tulajdonossá',
          icon: <Shield className="w-5 h-5 text-accent" />,
          description: `Biztosan Tulajdonos (OWNER) szerepkört adsz ${targetMember?.displayName || 'a tagnak'}? Ezzel teljes hozzáférést kap a háztartás beállításaihoz és az új tagok meghívásához.`,
          confirmLabel: 'Igen, kinevezés Tulajdonossá',
          confirmBtnClass: 'bg-accent hover:bg-accent/90 text-white'
        };
      case 'DEMOTE_MEMBER':
        return {
          title: 'Visszaminősítés taggá',
          icon: <AlertTriangle className="w-5 h-5 text-overdue" />,
          description: `Biztosan visszaminősíted ${targetMember?.displayName || 'a tulajdonost'} normál Tag (MEMBER) szerepkörbe? A háztartás beállításait ezután már nem fogja tudni módosítani.`,
          confirmLabel: 'Igen, visszaminősítés Taggá',
          confirmBtnClass: 'bg-overdue hover:bg-overdue/90 text-white'
        };
      case 'REMOVE_MEMBER':
        return {
          title: 'Tag eltávolítása a háztartásból',
          icon: <UserMinus className="w-5 h-5 text-overdue" />,
          description: `Biztosan eltávolítod ${targetMember?.displayName || 'a tagot'} a(z) ${householdName} háztartásból? A felhasználó automatikusan egy új, önálló személyes háztartást kap, így a fiókja nem vész el.`,
          confirmLabel: 'Igen, tag eltávolítása',
          confirmBtnClass: 'bg-overdue hover:bg-overdue/90 text-white'
        };
      case 'LEAVE_HOUSEHOLD':
        return {
          title: 'Kilépés a háztartásból',
          icon: <LogOut className="w-5 h-5 text-overdue" />,
          description: `Biztosan kilépsz a(z) ${householdName} háztartásból? Kilépés után saját önálló háztartásba kerülsz, és a közös számlákhoz csak új meghívóval vagy kóddal férhetsz hozzá újra.`,
          confirmLabel: 'Igen, kilépek a háztartásból',
          confirmBtnClass: 'bg-overdue hover:bg-overdue/90 text-white'
        };
    }
  };

  const details = getDialogDetails();

  return createPortal(
    <div
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="billflow-card rounded-hero bg-surface border border-line shadow-hero max-w-md w-full p-5 sm:p-6 space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              isDanger ? 'bg-overdue-tint text-overdue border-overdue/20' : 'bg-accent-tint text-accent border-accent/20'
            }`}>
              {details.icon}
            </div>
            <h3 className="text-base font-bold text-ink font-display">
              {details.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-bg hover:bg-surface-elevated border border-line flex items-center justify-center text-ink-2 hover:text-ink transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-ink-2 leading-relaxed">
          {details.description}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-control bg-bg hover:bg-surface-elevated border border-line text-ink text-xs font-semibold transition-colors"
          >
            Mégse
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-control font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs ${details.confirmBtnClass} disabled:opacity-50`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Feldolgozás...</span>
              </>
            ) : (
              <span>{details.confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

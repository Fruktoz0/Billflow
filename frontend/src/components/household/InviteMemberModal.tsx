import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Mail,
  UserPlus,
  Shield,
  User,
  Copy,
  Check,
  Share2,
  Key,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { api } from '../../services/api';
import { HouseholdInvitation } from '../../types';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdName: string;
  inviteCode: string;
  onInviteSent?: (invitation: HouseholdInvitation) => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  householdName,
  inviteCode,
  onInviteSent
}) => {
  useBodyScrollLock(isOpen);

  const [activeTab, setActiveTab] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'OWNER'>('MEMBER');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset form when reopened
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setRole('MEMBER');
      setError(null);
      setSuccessMsg(null);
      setCreatedInviteLink(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Kérlek adj meg egy érvényes e-mail címet!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.households.createInvitation({
        email: email.trim(),
        role
      });
      setSuccessMsg(`A meghívó sikeresen elküldve: ${email.trim()}`);
      setCreatedInviteLink(res.inviteLink);
      if (onInviteSent && res.invitation) {
        onInviteSent(res.invitation);
      }
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Nem sikerült kiküldeni a meghívót');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, type: 'code' | 'link') => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2200);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2200);
      }
    } catch (err) {
      console.warn('[InviteMemberModal] Copy failed:', err);
    }
  };

  const handleShare = async (text: string, url: string) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Meghívó a(z) ${householdName} háztartásba`,
          text: text || `Csatlakozz a(z) ${householdName} közös számláihoz és pénzügyeihez a Billflow-ban!`,
          url
        });
      } catch (err) {
        // Share cancelled or not supported
      }
    } else {
      handleCopy(url, 'link');
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
            <UserPlus className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink truncate font-display">
              Új tag meghívása
            </h2>
            <p className="text-[11px] text-ink-2 truncate">
              {householdName}
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

      {/* Navigation tabs */}
      <div className="px-4 sm:px-6 pt-3 pb-0 border-b border-line bg-surface shrink-0">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'email'
                ? 'border-accent text-accent'
                : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>E-mailes meghívó & link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'border-accent text-accent'
                : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Gyors meghívókód</span>
          </button>
        </div>
      </div>

      {/* Modal content body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5 max-w-2xl mx-auto w-full space-y-5 overscroll-contain">
        {error && (
          <div className="p-3.5 rounded-card bg-overdue-tint border border-overdue/30 text-overdue text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-card bg-paid-tint border border-paid/30 text-paid-text text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <Check className="w-4 h-4 shrink-0 mt-0.5 text-paid" />
            <div className="space-y-1">
              <span className="font-bold block">{successMsg}</span>
              <span className="text-[11px] opacity-90 block">
                A címzett 7 napig fogadhatja el a meghívót. Az alábbi közvetlen linkkel azonnal beléphet:
              </span>
            </div>
          </div>
        )}

        {/* Tab 1: Email and Link Invite */}
        {activeTab === 'email' && (
          <div className="space-y-5">
            <form onSubmit={handleSendEmailInvite} className="billflow-card rounded-card p-4 sm:p-5 bg-surface border border-line space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-2 mb-1.5">
                  Meghívandó partner e-mail címe
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-ink-2 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="pelda@csalad.hu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-control bg-bg border border-line text-ink text-sm placeholder:text-ink-2/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                </div>
              </div>

              {/* Role selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-2 mb-1.5">
                  Szerepkör a háztartásban
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRole('MEMBER')}
                    className={`p-3 rounded-card text-left border transition-all ${
                      role === 'MEMBER'
                        ? 'bg-accent-tint border-accent text-accent-text ring-1 ring-accent'
                        : 'bg-bg border-line text-ink hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 font-bold text-xs">
                      <User className="w-3.5 h-3.5 text-accent" />
                      <span>Tag (MEMBER)</span>
                    </div>
                    <p className="text-[11px] text-ink-2 leading-relaxed">
                      Látja a közös számlákat, rögzíthet befizetéseket és felülbírálásokat.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('OWNER')}
                    className={`p-3 rounded-card text-left border transition-all ${
                      role === 'OWNER'
                        ? 'bg-accent-tint border-accent text-accent-text ring-1 ring-accent'
                        : 'bg-bg border-line text-ink hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 font-bold text-xs">
                      <Shield className="w-3.5 h-3.5 text-accent" />
                      <span>Tulajdonos (OWNER)</span>
                    </div>
                    <p className="text-[11px] text-ink-2 leading-relaxed">
                      Kezelheti a háztartás nevét, új tagokat hívhat meg és szerepköröket módosíthat.
                    </p>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-control bg-accent hover:bg-accent/90 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Meghívó generálása...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Meghívó létrehozása</span>
                  </>
                )}
              </button>
            </form>

            {/* Generated Invite Link Card (shown after creation or if available) */}
            {createdInviteLink && (
              <div className="billflow-card rounded-card p-4 sm:p-5 bg-surface border border-accent/30 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink uppercase tracking-wider">
                    Közvetlen meghívó link (7 napig érvényes)
                  </span>
                </div>

                <div className="p-2.5 rounded-control bg-bg border border-line font-mono text-xs text-ink break-all select-all">
                  {createdInviteLink}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(createdInviteLink, 'link')}
                    className={`flex-1 py-2 px-3 rounded-control font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                      copiedLink
                        ? 'bg-paid text-white'
                        : 'bg-accent-tint text-accent-text hover:bg-accent hover:text-white'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Link másolva!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Link másolása</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShare(`Billflow meghívó: ${householdName}`, createdInviteLink)}
                    className="py-2 px-3.5 rounded-control bg-bg hover:bg-surface-elevated border border-line text-ink font-semibold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Megosztás</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Quick Invite Code */}
        {activeTab === 'code' && (
          <div className="space-y-4">
            <div className="billflow-card rounded-card p-5 bg-surface border border-line space-y-4 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-2 block">
                Háztartási gyorscsatlakozási kód
              </span>

              <div className="inline-block p-4 px-6 rounded-card bg-bg border-2 border-dashed border-accent/40 font-mono font-black text-ink text-2xl sm:text-3xl tracking-widest select-all shadow-inner">
                {inviteCode}
              </div>

              <p className="text-xs text-ink-2 max-w-md mx-auto leading-relaxed">
                Add meg ezt a kódot a családtagodnak. A regisztráció során vagy meglévő fiókkal a Beállítások felületen beírva azonnal csatlakozhat ehhez a háztartáshoz.
              </p>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopy(inviteCode, 'code')}
                  className={`py-2 px-4 rounded-control font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                    copiedCode
                      ? 'bg-paid text-white'
                      : 'bg-accent text-white hover:bg-accent/90'
                  }`}
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Kód másolva!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kód másolása</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleShare(`Billflow meghívókód: ${inviteCode}`, window.location.origin)}
                  className="py-2 px-4 rounded-control bg-bg hover:bg-surface-elevated border border-line text-ink font-semibold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Kód megosztása</span>
                </button>
              </div>
            </div>
          </div>
        )}
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
          Kész / Bezárás
        </button>
      </div>
    </div>,
    document.body
  );
};

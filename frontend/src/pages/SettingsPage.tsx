import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  Copy,
  Check,
  Sun,
  Moon,
  Laptop,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  LogOut,
  Shield,
  Smartphone,
  Download,
  Share,
  Info,
  UserPlus,
  Edit3,
  Key,
  Mail,
  UserMinus,
  RefreshCw,
  X,
  Share2,
  Crown,
  AlertCircle,
  LogIn,
  Send
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { pushService } from '../services/pushService';
import { User, Household, HouseholdInvitation } from '../types';
import { InviteMemberModal } from '../components/household/InviteMemberModal';
import { JoinHouseholdModal } from '../components/household/JoinHouseholdModal';
import { EditHouseholdModal } from '../components/household/EditHouseholdModal';
import { MemberActionDialog, MemberActionType } from '../components/household/MemberActionDialog';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { user, household, members, logout, refreshMe } = useAuth();

  // Code copy feedback
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Push notifications state
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);

  // PWA install prompt state
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Household interactive state
  const [householdDetails, setHouseholdDetails] = useState<Household | null>(household);
  const [householdMembers, setHouseholdMembers] = useState<User[]>(members || []);
  const [householdInvitations, setHouseholdInvitations] = useState<HouseholdInvitation[]>([]);
  const [myIncomingInvitations, setMyIncomingInvitations] = useState<HouseholdInvitation[]>([]);

  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Member action confirmation dialog state
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    actionType: MemberActionType | null;
    targetMember: User | null;
  }>({
    isOpen: false,
    actionType: null,
    targetMember: null
  });
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Load live household data
  const loadHouseholdData = async () => {
    try {
      const [membersData, invitesData, myInvitesData, currentHh] = await Promise.all([
        api.households.getMembers().catch(() => null),
        api.households.getInvitations().catch(() => []),
        api.households.getMyInvitations().catch(() => []),
        api.households.getCurrent().catch(() => null)
      ]);

      if (membersData) setHouseholdMembers(membersData);
      if (invitesData) setHouseholdInvitations(invitesData);
      if (myInvitesData) setMyIncomingInvitations(myInvitesData);
      if (currentHh) setHouseholdDetails(currentHh);
    } catch (err) {
      console.warn('[Settings] Failed loading household data:', err);
    }
  };

  useEffect(() => {
    loadHouseholdData();
  }, [household?.id]);

  // Check push subscription & PWA on mount
  useEffect(() => {
    pushService.getSubscription().then((sub) => {
      setIsPushSubscribed(Boolean(sub));
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Invite code copy handler
  const handleCopyInviteCode = async () => {
    const code = householdDetails?.inviteCode || household?.inviteCode || 'BF-89X4K';
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    } catch (err) {
      console.warn('[Settings] Clipboard copy failed:', err);
    }
  };

  // Copy pending invite link
  const handleCopyPendingLink = async (inv: HouseholdInvitation) => {
    const link = inv.inviteLink || `${window.location.origin}/join?token=${inv.token}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
      }
      setCopiedLinkId(inv.id);
      setTimeout(() => setCopiedLinkId(null), 2200);
    } catch (err) {
      console.warn('[Settings] Link copy failed:', err);
    }
  };

  // Share invite code via Web Share API
  const handleShareCode = async () => {
    const code = householdDetails?.inviteCode || household?.inviteCode || 'BF-89X4K';
    const name = householdDetails?.name || household?.name || 'Budapesti Otthon';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Meghívó: ${name}`,
          text: `Csatlakozz a(z) ${name} háztartáshoz a Billflow-ban ezzel a kóddal: ${code}`,
          url: window.location.origin
        });
      } catch (err) {
        // User dismissed
      }
    } else {
      handleCopyInviteCode();
    }
  };

  // Member actions execution
  const handleConfirmMemberAction = async () => {
    const { actionType, targetMember } = actionDialog;
    if (!actionType) return;

    setIsActionLoading(true);
    setStatusFeedback(null);

    try {
      if (actionType === 'PROMOTE_OWNER' && targetMember) {
        await api.households.updateMemberRole(targetMember.id, 'OWNER');
        setStatusFeedback(`${targetMember.displayName} sikeresen előléptetve Tulajdonossá.`);
      } else if (actionType === 'DEMOTE_MEMBER' && targetMember) {
        await api.households.updateMemberRole(targetMember.id, 'MEMBER');
        setStatusFeedback(`${targetMember.displayName} szerepköre Taggá módosítva.`);
      } else if (actionType === 'REMOVE_MEMBER' && targetMember) {
        await api.households.removeMember(targetMember.id);
        setStatusFeedback(`${targetMember.displayName} el lett távolítva a háztartásból.`);
      } else if (actionType === 'LEAVE_HOUSEHOLD' && user) {
        await api.households.removeMember(user.id);
        await refreshMe();
        setStatusFeedback('Sikeresen kiléptél a háztartásból. Új személyes háztartást hoztunk létre.');
      }

      await loadHouseholdData();
      setActionDialog({ isOpen: false, actionType: null, targetMember: null });
    } catch (err: any) {
      setStatusFeedback(`Hiba: ${err.message || 'A művelet sikertelen'}`);
    } finally {
      setIsActionLoading(false);
      setTimeout(() => setStatusFeedback(null), 4000);
    }
  };

  // Cancel outgoing invitation
  const handleCancelInvitation = async (id: string) => {
    try {
      await api.households.cancelInvitation(id);
      setHouseholdInvitations((prev) => prev.filter((i) => i.id !== id));
      setStatusFeedback('A meghívó sikeresen vissza lett vonva.');
    } catch (err: any) {
      setStatusFeedback(`Hiba: ${err.message || 'Nem sikerült visszavonni a meghívót'}`);
    } finally {
      setTimeout(() => setStatusFeedback(null), 3000);
    }
  };

  // Resend / extend outgoing invitation
  const handleResendInvitation = async (id: string) => {
    try {
      const res = await api.households.resendInvitation(id);
      setStatusFeedback('A meghívó érvényessége meghosszabbítva 7 nappal.');
      await loadHouseholdData();
    } catch (err: any) {
      setStatusFeedback(`Hiba: ${err.message || 'Nem sikerült megújítani a meghívót'}`);
    } finally {
      setTimeout(() => setStatusFeedback(null), 3000);
    }
  };

  // Accept incoming invitation to join another household
  const handleAcceptMyInvite = async (token: string) => {
    try {
      await api.households.acceptInvitation(token);
      await refreshMe();
      await loadHouseholdData();
      setStatusFeedback('Sikeresen csatlakoztál az új háztartáshoz!');
    } catch (err: any) {
      setStatusFeedback(`Hiba: ${err.message || 'Nem sikerült elfogadni a meghívást'}`);
    } finally {
      setTimeout(() => setStatusFeedback(null), 4000);
    }
  };

  // Decline incoming invitation
  const handleDeclineMyInvite = async (token: string) => {
    try {
      await api.households.declineInvitation(token);
      setMyIncomingInvitations((prev) => prev.filter((i) => i.token !== token));
      setStatusFeedback('A meghívás elutasítva.');
    } catch (err: any) {
      setStatusFeedback(`Hiba: ${err.message || 'Nem sikerült elutasítani a meghívást'}`);
    } finally {
      setTimeout(() => setStatusFeedback(null), 3000);
    }
  };

  // Push subscription toggle handler
  const handleTogglePush = async () => {
    setIsPushLoading(true);
    setPushStatus(null);
    try {
      if (isPushSubscribed) {
        await pushService.unsubscribe();
        setIsPushSubscribed(false);
        setPushStatus('Web Push leiratkozás sikeres.');
      } else {
        await pushService.subscribe();
        setIsPushSubscribed(true);
        setPushStatus('Web Push sikeresen bekapcsolva!');
      }
    } catch (err: any) {
      setPushStatus(err.message || 'Nem sikerült módosítani az értesítést.');
    } finally {
      setIsPushLoading(false);
      setTimeout(() => setPushStatus(null), 4000);
    }
  };

  // Push notification test handler
  const handleTestPush = async () => {
    setIsPushLoading(true);
    setPushStatus(null);
    try {
      await api.push.sendTest();
      setPushStatus('Teszt értesítés sikeresen elküldve a készülékedre!');
    } catch (err: any) {
      setPushStatus('Értesítés küldése sikertelen. Kérlek kapcsold be a fenti kapcsolóval.');
    } finally {
      setIsPushLoading(false);
      setTimeout(() => setPushStatus(null), 4000);
    }
  };

  // PWA Install click
  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream;

  const currentHhName = householdDetails?.name || household?.name || 'Budapesti Otthon';
  const currentInviteCode = householdDetails?.inviteCode || household?.inviteCode || 'BF-89X4K';
  const isCurrentUserOwner = user?.role === 'OWNER';

  // Fallback display members if initial state is empty
  const displayMembers =
    householdMembers.length > 0
      ? householdMembers
      : members && members.length > 0
      ? members
      : [
          {
            id: user?.id || 'usr-1',
            displayName: user?.displayName || 'Családfő (Te)',
            email: user?.email || 'admin@billflow.hu',
            role: (user?.role || 'OWNER') as const,
            createdAt: '2026-09-01'
          }
        ];

  const pendingInvitationsList = householdInvitations.filter(
    (inv) => inv.status === 'PENDING'
  );

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <h1 className="text-2xl font-extrabold text-ink tracking-tight font-display flex items-center gap-2">
          <Settings className="w-6 h-6 text-accent" />
          <span>Beállítások & Háztartáskezelés</span>
        </h1>
        <p className="text-xs text-ink-2">
          Családi megosztás, meghívók, jogosultságok, megjelenés és értesítések
        </p>
      </div>

      {/* Status Feedback Banner */}
      {statusFeedback && (
        <div className="p-3.5 rounded-card bg-accent-tint border border-accent/30 text-accent-text text-xs font-bold flex items-center justify-between animate-in fade-in duration-200 shadow-sm">
          <span>{statusFeedback}</span>
          <button
            type="button"
            onClick={() => setStatusFeedback(null)}
            className="text-ink-2 hover:text-ink"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Incoming Invitations Notification Banner */}
      {myIncomingInvitations.length > 0 && (
        <div className="billflow-card rounded-hero p-4 sm:p-5 bg-accent-tint/40 border-2 border-accent space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-accent" />
            <h3 className="text-sm font-bold text-ink font-display">
              Meghívást kaptál egy másik háztartásba!
            </h3>
          </div>

          <div className="divide-y divide-accent/20">
            {myIncomingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="text-xs text-ink font-semibold">
                    <strong className="text-accent">{inv.household?.name || 'Közös háztartás'}</strong>
                    {' '}csapatához ({inv.invitedBy?.displayName || 'Családtag'} által)
                  </p>
                  <span className="text-[11px] text-ink-2">
                    Szerepkör: {inv.role === 'OWNER' ? 'Tulajdonos' : 'Tag'} • Lejár: {inv.expiresAt ? inv.expiresAt.substring(0, 10) : '7 nap múlva'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAcceptMyInvite(inv.token)}
                    className="py-1.5 px-3 rounded-control bg-paid text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-paid/90"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Csatlakozás elfogadása</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeclineMyInvite(inv.token)}
                    className="py-1.5 px-3 rounded-control bg-surface border border-line text-ink-2 hover:text-ink text-xs font-semibold"
                  >
                    Elutasítás
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. Household & Members Management (FEAT-006) */}
      <div className="billflow-card rounded-hero p-5 sm:p-6 bg-surface border border-line shadow-card space-y-6">
        {/* Household Top Meta Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-tint text-accent flex items-center justify-center shrink-0 border border-accent/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-ink font-display truncate">
                  {currentHhName}
                </h2>
                {isCurrentUserOwner && (
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-1 rounded-control text-ink-2 hover:text-accent hover:bg-bg transition-colors"
                    title="Háztartás nevének és beállításainak szerkesztése"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-ink-2">
                  {displayMembers.length} aktív tag
                </span>
                <span className="text-ink-2 text-xs">•</span>
                <span
                  className={`px-2 py-0.2 text-[10px] font-bold rounded-full border ${
                    isCurrentUserOwner
                      ? 'bg-accent-tint text-accent-text border-accent/20'
                      : 'bg-bg text-ink-2 border-line'
                  }`}
                >
                  {isCurrentUserOwner ? 'Tulajdonos vagy' : 'Tag vagy'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="py-2 px-3.5 rounded-control bg-accent hover:bg-accent/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tag meghívása</span>
            </button>

            <button
              type="button"
              onClick={() => setIsJoinModalOpen(true)}
              className="py-2 px-3 rounded-control bg-bg hover:bg-surface-elevated border border-line text-ink font-semibold text-xs flex items-center gap-1.5 transition-colors"
              title="Csatlakozás másik háztartáshoz kód megadásával"
            >
              <Key className="w-3.5 h-3.5 text-ink-2" />
              <span className="hidden sm:inline">Csatlakozás kóddal</span>
            </button>
          </div>
        </div>

        {/* Invite Code Box & Quick Share Banner */}
        <div className="p-4 rounded-card bg-bg border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-2 block">
              Háztartási meghívókód (Invite code)
            </span>
            <span className="text-xs text-ink-2">
              Bármely családtag közvetlenül beírhatja ezt a kódot a csatlakozáshoz.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 rounded-control bg-surface border border-line font-mono font-bold text-ink text-sm sm:text-base tracking-widest select-all shadow-xs">
              {currentInviteCode}
            </div>

            <button
              type="button"
              onClick={handleCopyInviteCode}
              className={`px-3 py-2 rounded-control font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                copiedCode
                  ? 'bg-paid text-white'
                  : 'bg-accent-tint text-accent-text hover:bg-accent hover:text-white'
              }`}
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Másolva!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Másolás</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShareCode}
              className="p-2 rounded-control bg-surface hover:bg-surface-elevated border border-line text-ink-2 hover:text-ink transition-colors"
              title="Kód megosztása mobilon"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Members List Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-2 block">
              Háztartás tagjai ({displayMembers.length})
            </span>
          </div>

          <div className="divide-y divide-line/60 rounded-card border border-line bg-bg overflow-hidden">
            {displayMembers.map((m) => {
              const isSelf = m.id === user?.id;
              const isMemberOwner = m.role === 'OWNER';
              const otherOwnersCount = displayMembers.filter(
                (x) => x.role === 'OWNER' && x.id !== m.id
              ).length;

              return (
                <div
                  key={m.id}
                  className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-elevated/40 transition-colors"
                >
                  {/* Member info */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border ${
                        isMemberOwner
                          ? 'bg-accent-tint text-accent border-accent/30'
                          : 'bg-surface text-ink-2 border-line'
                      }`}
                    >
                      {m.displayName ? m.displayName.slice(0, 2).toUpperCase() : 'TA'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-ink">{m.displayName}</p>
                        {isSelf && (
                          <span className="px-1.5 py-0.2 rounded bg-surface border border-line text-[10px] font-bold text-accent">
                            Te
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-2">
                        {m.email}
                        {m.createdAt && (
                          <span className="text-[11px] opacity-70 ml-2">
                            • Csatlakozott: {m.createdAt.substring(0, 10)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Role badge & Management actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 border ${
                        isMemberOwner
                          ? 'bg-accent-tint text-accent-text border-accent/25'
                          : 'bg-surface border border-line text-ink-2'
                      }`}
                    >
                      {isMemberOwner ? (
                        <>
                          <Crown className="w-3 h-3 text-accent" />
                          <span>Tulajdonos</span>
                        </>
                      ) : (
                        <span>Tag</span>
                      )}
                    </span>

                    {/* Actions if current user is OWNER */}
                    {isCurrentUserOwner && !isSelf && (
                      <div className="flex items-center gap-1 border-l border-line/60 pl-2">
                        {isMemberOwner ? (
                          <button
                            type="button"
                            disabled={otherOwnersCount === 0}
                            onClick={() =>
                              setActionDialog({
                                isOpen: true,
                                actionType: 'DEMOTE_MEMBER',
                                targetMember: m
                              })
                            }
                            className="p-1.5 rounded-control text-ink-2 hover:text-overdue hover:bg-surface border border-transparent hover:border-line transition-all text-xs"
                            title="Visszaminősítés Taggá"
                          >
                            Taggá
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setActionDialog({
                                isOpen: true,
                                actionType: 'PROMOTE_OWNER',
                                targetMember: m
                              })
                            }
                            className="p-1.5 rounded-control text-ink-2 hover:text-accent hover:bg-surface border border-transparent hover:border-line transition-all text-xs flex items-center gap-1"
                            title="Előléptetés Tulajdonossá"
                          >
                            <Shield className="w-3 h-3 text-accent" />
                            <span>Tulajdonos</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setActionDialog({
                              isOpen: true,
                              actionType: 'REMOVE_MEMBER',
                              targetMember: m
                            })
                          }
                          className="p-1.5 rounded-control text-ink-2 hover:text-overdue hover:bg-overdue-tint/40 transition-colors"
                          title="Eltávolítás a háztartásból"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Self-leave action if not the only member */}
                    {isSelf && displayMembers.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setActionDialog({
                            isOpen: true,
                            actionType: 'LEAVE_HOUSEHOLD',
                            targetMember: m
                          })
                        }
                        className="py-1 px-2 rounded-control text-[11px] font-semibold text-ink-2 hover:text-overdue hover:bg-overdue-tint/40 border border-transparent hover:border-overdue/30 transition-colors flex items-center gap-1"
                        title="Kilépés a háztartásból"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Kilépés</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 1.C Pending Outgoing Invitations Section */}
        {pendingInvitationsList.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-2 block">
                Függőben lévő kiküldött meghívók ({pendingInvitationsList.length})
              </span>
            </div>

            <div className="divide-y divide-line/60 rounded-card border border-line bg-bg overflow-hidden">
              {pendingInvitationsList.map((inv) => (
                <div
                  key={inv.id}
                  className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface border border-line flex items-center justify-center text-ink-2">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-ink">{inv.email}</p>
                        <span className="px-1.5 py-0.2 rounded bg-surface border border-line text-[10px] font-semibold text-ink-2">
                          {inv.role === 'OWNER' ? 'Tulajdonosként' : 'Tagként'}
                        </span>
                      </div>
                      <span className="text-[11px] text-ink-2">
                        {inv.isExpired
                          ? 'Lejárt meghívó'
                          : `Lejár: ${inv.expiresAt ? inv.expiresAt.substring(0, 10) : '7 nap múlva'}`}
                      </span>
                    </div>
                  </div>

                  {/* Actions for pending invite */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleCopyPendingLink(inv)}
                      className={`py-1 px-2.5 rounded-control text-xs font-semibold flex items-center gap-1 transition-colors border shadow-xs ${
                        copiedLinkId === inv.id
                          ? 'bg-paid text-white border-paid'
                          : 'bg-surface border-line text-ink hover:bg-surface-elevated'
                      }`}
                    >
                      {copiedLinkId === inv.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Másolva!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Link másolása</span>
                        </>
                      )}
                    </button>

                    {isCurrentUserOwner && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleResendInvitation(inv.id)}
                          className="p-1.5 rounded-control bg-surface border border-line text-ink-2 hover:text-accent hover:bg-surface-elevated transition-colors"
                          title="Meghívó megújítása (+7 nap)"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCancelInvitation(inv.id)}
                          className="p-1.5 rounded-control bg-surface border border-line text-ink-2 hover:text-overdue hover:bg-overdue-tint/40 transition-colors"
                          title="Meghívó visszavonása"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Display & Privacy Preferences */}
      <div className="billflow-card rounded-hero p-5 sm:p-6 bg-surface border border-line shadow-card space-y-5">
        <h2 className="text-base font-bold text-ink pb-2 border-b border-line font-display">
          Megjelenés és Adatvédelem
        </h2>

        {/* Theme Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-2 block">
            Téma kiválasztása
          </label>
          <div className="grid grid-cols-3 gap-2 max-w-md">
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-2.5 rounded-control text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                theme === 'system'
                  ? 'bg-accent-tint border-accent text-accent-text font-bold shadow-xs'
                  : 'bg-bg border-line text-ink hover:bg-surface-elevated'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>Rendszer</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-2.5 rounded-control text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                theme === 'light'
                  ? 'bg-accent-tint border-accent text-accent-text font-bold shadow-xs'
                  : 'bg-bg border-line text-ink hover:bg-surface-elevated'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Világos</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-2.5 rounded-control text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                theme === 'dark'
                  ? 'bg-accent-tint border-accent text-accent-text font-bold shadow-xs'
                  : 'bg-bg border-line text-ink hover:bg-surface-elevated'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Sötét</span>
            </button>
          </div>
        </div>

        {/* Privacy Mode Switch */}
        <div className="flex items-center justify-between p-3.5 rounded-card bg-bg border border-line max-w-md">
          <div className="flex items-center gap-2.5">
            {isPrivate ? (
              <EyeOff className="w-4 h-4 text-accent" />
            ) : (
              <Eye className="w-4 h-4 text-ink-2" />
            )}
            <div>
              <span className="text-xs font-bold text-ink block">
                Összegek elrejtése (Privacy mód)
              </span>
              <span className="text-[11px] text-ink-2 block">
                Elmossa az összes pénzösszeget (Gyorsbillentyű: P)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={togglePrivacy}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              isPrivate
                ? 'bg-accent text-white shadow-xs'
                : 'bg-surface border border-line text-ink-2 hover:text-ink'
            }`}
          >
            {isPrivate ? 'Bekapcsolva' : 'Kikapcsolva'}
          </button>
        </div>
      </div>

      {/* 3. Web Push Notifications (FEAT-007) */}
      <div className="billflow-card rounded-hero p-5 sm:p-6 bg-surface border border-line shadow-card space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-line">
          <Bell className="w-5 h-5 text-accent" />
          <div>
            <h2 className="text-base font-bold text-ink font-display">Értesítések (Web Push)</h2>
            <p className="text-xs text-ink-2">Automatikus reggeli és határidő előtti Web Push figyelmeztetések</p>
          </div>
        </div>

        <div className="p-4 rounded-card bg-bg border border-line space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-ink block">
                Böngésző Web Push emlékeztetők
              </span>
              <span className="text-[11px] text-ink-2 block">
                2 nappal a határidő előtt jelzést kapsz a szükséges számlafedezetről.
              </span>
            </div>

            <button
              type="button"
              disabled={isPushLoading}
              onClick={handleTogglePush}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                isPushSubscribed
                  ? 'bg-paid text-white'
                  : 'bg-surface border border-line text-ink-2 hover:text-ink hover:bg-surface-elevated'
              }`}
            >
              {isPushSubscribed ? (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Bekapcsolva</span>
                </>
              ) : (
                <>
                  <BellOff className="w-3.5 h-3.5" />
                  <span>Kikapcsolva</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 border-t border-line/60 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isPushLoading}
              onClick={handleTestPush}
              className="px-4 py-2 rounded-control bg-accent-tint text-accent-text hover:bg-accent hover:text-white font-semibold text-xs transition-colors flex items-center gap-1.5 border border-accent/20"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isPushLoading ? 'Küldés...' : 'Teszt értesítés küldése'}</span>
            </button>

            {pushStatus && (
              <span className="text-xs font-semibold text-accent animate-in fade-in">
                {pushStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. PWA Installation Card */}
      <div className="billflow-card rounded-hero p-5 sm:p-6 bg-surface border border-line shadow-card space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-line">
          <Smartphone className="w-5 h-5 text-accent" />
          <div>
            <h2 className="text-base font-bold text-ink font-display">PWA Telepítés & Mobil Élmény</h2>
            <p className="text-xs text-ink-2">Használd natív appként a telefonodon vagy számítógépeden</p>
          </div>
        </div>

        {isInstalled ? (
          <div className="p-4 rounded-card bg-paid/10 border border-paid/30 flex items-center gap-3 text-xs text-paid font-semibold">
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>Az alkalmazás sikeresen telepítve van és önálló (standalone) módban fut!</span>
          </div>
        ) : installPrompt ? (
          <div className="p-4 rounded-card bg-bg border border-line flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-ink block">
                Telepítés a kezdőképernyőre
              </span>
              <span className="text-[11px] text-ink-2 block">
                Gyorsabb betöltés, offline elérés és kényelmes teljes képernyős nézet.
              </span>
            </div>

            <button
              type="button"
              onClick={handleInstallClick}
              className="px-4 py-2 rounded-control bg-accent-strong text-on-accent text-xs font-bold hover:bg-accent-strong/90 flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Telepítés</span>
            </button>
          </div>
        ) : isIOS ? (
          <div className="p-4 rounded-card bg-accent-tint/30 border border-accent/20 flex items-start gap-3 text-xs text-ink">
            <Share className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-accent-text block">
                Telepítés iPhone / iPad készülékre (Safari):
              </span>
              <span className="text-ink-2 leading-relaxed block mt-0.5">
                Koppints a Safari alsó sávjában a <strong>Megosztás</strong> (Share) ikonra, majd válaszd a <strong>"Főképernyőhöz adás"</strong> opciót.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-card bg-bg border border-line flex items-center gap-3 text-xs text-ink-2">
            <Info className="w-4 h-4 text-accent shrink-0" />
            <span>
              A Billflow böngészőből és telepített webes alkalmazásként (PWA) is automatikusan gyorsítótárazza a kötelezettségeket az offline használathoz.
            </span>
          </div>
        )}
      </div>

      {/* 5. Session & Logout */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={logout}
          className="px-4 py-2.5 rounded-control border border-overdue/40 text-overdue hover:bg-overdue-bg text-xs font-bold transition-colors flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Kijelentkezés a fiókból</span>
        </button>
      </div>

      {/* Modals */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        householdName={currentHhName}
        inviteCode={currentInviteCode}
        onInviteSent={() => loadHouseholdData()}
      />

      <JoinHouseholdModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoined={async (newHousehold) => {
          setHouseholdDetails(newHousehold);
          await refreshMe();
          await loadHouseholdData();
          setStatusFeedback(`Sikeresen csatlakoztál a(z) ${newHousehold.name} háztartáshoz!`);
        }}
      />

      <EditHouseholdModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        household={householdDetails || household}
        onSaved={(updated) => {
          setHouseholdDetails(updated);
          loadHouseholdData();
        }}
      />

      <MemberActionDialog
        isOpen={actionDialog.isOpen}
        onClose={() =>
          setActionDialog({ isOpen: false, actionType: null, targetMember: null })
        }
        actionType={actionDialog.actionType}
        targetMember={actionDialog.targetMember}
        householdName={currentHhName}
        onConfirm={handleConfirmMemberAction}
        isLoading={isActionLoading}
      />
    </div>
  );
};

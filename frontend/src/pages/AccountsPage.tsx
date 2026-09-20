import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, ShieldCheck } from 'lucide-react';
import { BankAccount } from '../types';
import { api } from '../services/api';
import { AccountCard } from '../components/accounts/AccountCard';
import { AccountModal } from '../components/accounts/AccountModal';

const defaultMockAccounts: BankAccount[] = [
  {
    id: 'acc-revolut',
    householdId: 'h-1',
    name: 'Revolut',
    type: 'REVOLUT',
    currency: 'HUF',
    color: '#0E8A9A',
    icon: 'credit-card',
    isDefault: false,
    active: true
  },
  {
    id: 'acc-unicredit',
    householdId: 'h-1',
    name: 'UniCredit Folyószámla',
    type: 'BANK_ACCOUNT',
    currency: 'HUF',
    color: '#5D9CEC',
    icon: 'credit-card',
    isDefault: true,
    active: true
  }
];

export const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>(defaultMockAccounts);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.accounts
      .getAll()
      .then((accs) => {
        if (isMounted && accs && accs.length > 0) {
          setAccounts(accs);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveAccount = async (accountData: Partial<BankAccount>) => {
    if (selectedAccount) {
      // Update
      try {
        await api.accounts.update(selectedAccount.id, accountData);
      } catch {}

      setAccounts((prev) =>
        prev.map((a) =>
          a.id === selectedAccount.id
            ? {
                ...a,
                name: accountData.name || a.name,
                type: accountData.type || a.type,
                color: accountData.color || a.color,
                isDefault: Boolean(accountData.isDefault)
              }
            : accountData.isDefault
            ? { ...a, isDefault: false }
            : a
        )
      );
    } else {
      // Create new
      let createdId = `acc-${Date.now()}`;
      try {
        const res = await api.accounts.create(accountData);
        if (res && res.id) createdId = res.id;
      } catch {}

      const newAcc: BankAccount = {
        id: createdId,
        householdId: 'h-1',
        name: accountData.name || 'Új számla',
        type: accountData.type || 'BANK_ACCOUNT',
        currency: 'HUF',
        color: accountData.color || '#0E8A9A',
        icon: 'credit-card',
        isDefault: Boolean(accountData.isDefault),
        active: true
      };

      setAccounts((prev) => {
        if (newAcc.isDefault) {
          return [...prev.map((a) => ({ ...a, isDefault: false })), newAcc];
        }
        return [...prev, newAcc];
      });
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await api.accounts.delete(accountId);
    } catch {}

    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-extrabold text-ink tracking-tight font-display flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-accent" />
            <span>Számlák Kezelése</span>
          </h1>
          <p className="text-xs text-ink-2">
            Forrásszámlák, kártyák és készpénzkeretek a háztartásban (FEAT-001)
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedAccount(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 rounded-control bg-accent-strong hover:bg-accent-strong/90 active:scale-98 text-on-accent font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all ml-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Új számla</span>
        </button>
      </div>

      {/* Security notice card */}
      <div className="p-4 rounded-hero bg-accent-tint/40 border border-accent/20 flex items-start gap-3 text-xs text-ink">
        <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-accent-text">Biztonságos számlakövetés:</span>
          <span className="text-ink-2">
            A Billflow nem kér és nem tárol banki bejelentkezési adatokat, kártyaszámokat vagy egyenlegeket. A számlák kizárólag a fix kötelezettségek forrásainak és a szükséges fedezetnek a csoportosítására szolgálnak.
          </span>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          // Calculate mock stats
          const isRevolut = acc.type === 'REVOLUT' || acc.name.includes('Revolut');
          const count = isRevolut ? 6 : 5;
          const allocated = isRevolut ? 77480 : 169420;

          return (
            <AccountCard
              key={acc.id}
              account={acc}
              itemCount={count}
              totalAllocated={allocated}
              onEdit={(target) => {
                setSelectedAccount(target);
                setIsModalOpen(true);
              }}
              onDelete={(target) => handleDeleteAccount(target.id)}
            />
          );
        })}
      </div>

      {/* Account Modal */}
      <AccountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAccount(null);
        }}
        account={selectedAccount}
        onSave={handleSaveAccount}
        onDelete={handleDeleteAccount}
      />
    </div>
  );
};

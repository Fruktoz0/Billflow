export type AccountType = 'BANK_ACCOUNT' | 'REVOLUT' | 'CREDIT_CARD' | 'CASH' | 'SAVINGS';

export type ExpenseCategory = 'UTILITY' | 'HOUSING' | 'SUBSCRIPTION' | 'LOAN' | 'INSURANCE' | 'OTHER';

export type BillingCycle = 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'YEARLY';

export type PaymentMethod = 'DIRECT_DEBIT' | 'CARD' | 'BANK_TRANSFER' | 'MANUAL';

export type PaymentStatus = 'PENDING' | 'PAID' | 'SKIPPED';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'OWNER' | 'MEMBER';
  householdId?: string;
  createdAt: string;
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';

export interface HouseholdInvitation {
  id: string;
  householdId: string;
  invitedByUserId?: string | null;
  email: string;
  role: 'OWNER' | 'MEMBER';
  status: InvitationStatus;
  token: string;
  expiresAt: string;
  createdAt: string;
  isExpired?: boolean;
  inviteLink?: string;
  invitedBy?: { id: string; displayName: string; email: string };
  household?: { id: string; name: string; currency: string };
}

export interface Household {
  id: string;
  name: string;
  currency: string;
  inviteCode: string;
  createdAt?: string;
  memberCount?: number;
  pendingInvitesCount?: number;
  myRole?: 'OWNER' | 'MEMBER';
}

export interface BankAccount {
  id: string;
  householdId: string;
  name: string;
  type: AccountType;
  currency: string;
  color: string;
  icon: string;
  bankCode?: string;
  isDefault: boolean;
  active: boolean;
}

export interface FixedExpense {
  id: string;
  householdId: string;
  defaultAccountId?: string | null;
  defaultAccount?: BankAccount | null;
  name: string;
  category: ExpenseCategory;
  defaultAmount: number;
  isVariableAmount: boolean;
  billingCycle: BillingCycle;
  dueDay: number;
  paymentMethod: PaymentMethod;
  active: boolean;
  pausedUntil?: string | null;
  notes?: string | null;
}

export interface DashboardItem {
  id: string | null;
  fixedExpenseId: string;
  name: string;
  category: ExpenseCategory;
  dueDay: number;
  billingCycle: BillingCycle;
  paymentMethod: PaymentMethod;
  isVariableAmount: boolean;
  notes?: string | null;
  status: PaymentStatus;
  plannedAmount: number;
  actualAmount: number | null;
  paidAt?: string | null;
  paidByUser?: { id: string; displayName: string; email: string } | null;
  paymentNote?: string | null;
  accountId?: string | null;
  account?: BankAccount | null;
  isVirtual: boolean;
}

export interface DashboardSummary {
  totalPlanned: number;
  totalPaid: number;
  totalRemainingPending: number;
  totalItems: number;
  paidCount: number;
  pendingCount: number;
  skippedCount: number;
}

export interface AccountBreakdown {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  color: string;
  icon: string;
  isDefault: boolean;
  paidAmount: number;
  pendingAmount: number;
  pendingItemsCount: number;
  totalAllocated: number;
}

export interface MonthlyDashboard {
  periodYearMonth: string;
  summary: DashboardSummary;
  accountsBreakdown: AccountBreakdown[];
  items: DashboardItem[];
}

export interface PaymentHistoryRecord {
  id: string;
  fixedExpenseId: string;
  periodYearMonth: string;
  periodLabel: string;
  actualAmount: number;
  plannedAmount: number;
  previousAmount?: number | null;
  diffAmount?: number | null;
  diffPercentage?: number | null;
  status: PaymentStatus;
  paidAt: string;
  paidByUser?: { id: string; displayName: string; email: string } | null;
  account?: BankAccount | null;
  paymentMethod?: PaymentMethod;
  note?: string | null;
}


import {
  User,
  Household,
  HouseholdInvitation,
  BankAccount,
  FixedExpense,
  MonthlyDashboard
} from '../types';

const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Get token from localStorage if present as fallback for Authorization header
  const token = localStorage.getItem('billflow_token');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include' // include HttpOnly cookies
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error || 'Hiba történt a kérés feldolgozásakor', response.status, data.details);
  }

  return data as T;
}

export const api = {
  auth: {
    register: (body: { email: string; password: string; displayName: string; inviteCode?: string }) =>
      request<{ message: string; token: string; user: User; household: Household }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
    login: (body: { email: string; password: string }) =>
      request<{ message: string; token: string; user: User; household: Household }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
    getMe: () =>
      request<{ user: User; household: Household; members: User[] }>('/auth/me'),
    logout: () =>
      request<{ message: string }>('/auth/logout', { method: 'POST' })
  },

  accounts: {
    getAll: () => request<BankAccount[]>('/accounts'),
    create: (body: Partial<BankAccount>) =>
      request<BankAccount>('/accounts', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<BankAccount>) =>
      request<BankAccount>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<{ message: string; id: string }>(`/accounts/${id}`, { method: 'DELETE' })
  },

  fixedExpenses: {
    getAll: (includeInactive?: boolean) =>
      request<FixedExpense[]>(`/fixed-expenses${includeInactive ? '?includeInactive=true' : ''}`),
    create: (body: Partial<FixedExpense>) =>
      request<FixedExpense>('/fixed-expenses', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<FixedExpense>) =>
      request<FixedExpense>(`/fixed-expenses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<{ message: string; id: string }>(`/fixed-expenses/${id}`, { method: 'DELETE' })
  },

  dashboard: {
    getMonthly: (yearMonth: string) =>
      request<MonthlyDashboard>(`/dashboard/${yearMonth}`)
  },

  payments: {
    pay: (fixedExpenseId: string, body: { periodYearMonth: string; actualAmount?: number; accountId?: string; paidAt?: string; note?: string }) =>
      request<any>(`/expenses/${fixedExpenseId}/pay`, { method: 'POST', body: JSON.stringify(body) }),
    unpay: (fixedExpenseId: string, body: { periodYearMonth: string }) =>
      request<any>(`/expenses/${fixedExpenseId}/unpay`, { method: 'POST', body: JSON.stringify(body) }),
    skip: (fixedExpenseId: string, body: { periodYearMonth: string; note?: string }) =>
      request<any>(`/expenses/${fixedExpenseId}/skip`, { method: 'POST', body: JSON.stringify(body) })
  },

  push: {
    getVapidKey: () => request<{ publicKey: string }>('/push/vapid-public-key'),
    subscribe: (body: any) => request<any>('/push/subscribe', { method: 'POST', body: JSON.stringify(body) }),
    unsubscribe: (body: { endpoint: string }) => request<any>('/push/unsubscribe', { method: 'POST', body: JSON.stringify(body) }),
    sendTest: () => request<any>('/push/test', { method: 'POST' })
  },

  households: {
    getCurrent: () =>
      request<Household>('/households/current'),
    updateCurrent: (body: { name?: string; currency?: string }) =>
      request<{ message: string; household: Household }>('/households/current', { method: 'PUT', body: JSON.stringify(body) }),
    regenerateInviteCode: () =>
      request<{ message: string; inviteCode: string }>('/households/current/regenerate-code', { method: 'POST' }),
    getMembers: () =>
      request<User[]>('/households/current/members'),
    updateMemberRole: (userId: string, role: 'OWNER' | 'MEMBER') =>
      request<{ message: string; member: User }>(`/households/current/members/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    removeMember: (userId: string) =>
      request<{ message: string; userId: string; newHouseholdId?: string }>(`/households/current/members/${userId}`, { method: 'DELETE' }),
    getInvitations: () =>
      request<HouseholdInvitation[]>('/households/current/invitations'),
    createInvitation: (body: { email: string; role?: 'OWNER' | 'MEMBER' }) =>
      request<{ message: string; invitation: HouseholdInvitation; inviteLink: string }>('/households/current/invitations', { method: 'POST', body: JSON.stringify(body) }),
    cancelInvitation: (id: string) =>
      request<{ message: string; id: string }>(`/households/current/invitations/${id}`, { method: 'DELETE' }),
    resendInvitation: (id: string) =>
      request<{ message: string; invitation: HouseholdInvitation; inviteLink: string }>(`/households/current/invitations/${id}/resend`, { method: 'POST' }),
    getMyInvitations: () =>
      request<HouseholdInvitation[]>('/households/my-invitations'),
    joinByCode: (code: string) =>
      request<{ message: string; household: Household }>('/households/join-by-code', { method: 'POST', body: JSON.stringify({ code }) }),
    getInvitationInfo: (token: string) =>
      request<{ isValid: boolean; isExpired: boolean; status: string; householdName: string; currency: string; inviterName: string; email: string; role: string; expiresAt: string }>(`/households/invitations/info/${token}`),
    acceptInvitation: (token: string) =>
      request<{ message: string; household: Household }>(`/households/invitations/accept/${token}`, { method: 'POST' }),
    declineInvitation: (token: string) =>
      request<{ message: string }>(`/households/invitations/decline/${token}`, { method: 'POST' })
  }
};

export { ApiError };

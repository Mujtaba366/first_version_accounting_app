export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';
export type EntrySide = 'debit' | 'credit';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  created_at?: string;
}

export interface Entry {
  id: string;
  transaction_id: string;
  account_id: string;
  amount: number | string;
  side: EntrySide;
  created_at?: string;
  account?: Account;
}

export interface Transaction {
  id: string;
  date: string;
  memo: string;
  created_at?: string;
  entries?: Entry[];
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...(init?.headers || {}),
    },
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'error' in payload
        ? String((payload as { error?: string }).error || 'Request failed')
        : 'Request failed';
    throw new Error(message);
  }

  return payload as T;
}

export const ACCOUNT_TYPES: { value: AccountType; label: string; normal: EntrySide }[] = [
  { value: 'asset', label: 'Asset', normal: 'debit' },
  { value: 'liability', label: 'Liability', normal: 'credit' },
  { value: 'equity', label: 'Equity', normal: 'credit' },
  { value: 'income', label: 'Income', normal: 'credit' },
  { value: 'expense', label: 'Expense', normal: 'debit' },
];

export function normalBalance(type: AccountType): EntrySide {
  const hit = ACCOUNT_TYPES.find((x) => x.value === type);
  return hit ? hit.normal : 'debit';
}

export function fmt(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export async function apiGetAccounts(): Promise<Account[]> {
  const payload = await request<{ accounts?: Account[] }>('/api/accounts', { method: 'GET' });
  return payload.accounts || [];
}

export async function apiCreateAccount(input: Pick<Account, 'code' | 'name' | 'type'>): Promise<Account> {
  const payload = await request<{ account: Account }>('/api/accounts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return payload.account;
}

export async function apiUpdateAccount(
  accountId: string,
  input: Partial<Pick<Account, 'code' | 'name' | 'type'>>
): Promise<Account> {
  const payload = await request<{ account: Account }>(`/api/accounts/${accountId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return payload.account;
}

export async function apiDeleteAccount(accountId: string): Promise<void> {
  await request<{ deleted: boolean }>(`/api/accounts/${accountId}`, {
    method: 'DELETE',
  });
}

export async function apiGetTransactions(): Promise<Transaction[]> {
  const payload = await request<{ transactions?: Transaction[] }>('/api/transactions', { method: 'GET' });
  return payload.transactions || [];
}

export async function apiCreateTransaction(input: Pick<Transaction, 'date' | 'memo'>): Promise<Transaction> {
  const payload = await request<{ transaction: Transaction }>('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return payload.transaction;
}

export async function apiDeleteTransaction(transactionId: string): Promise<void> {
  await request<{ deleted: boolean }>(`/api/transactions/${transactionId}`, {
    method: 'DELETE',
  });
}

export async function apiGetEntries(): Promise<Entry[]> {
  const payload = await request<{ entries?: Entry[] }>('/api/entries', { method: 'GET' });
  return payload.entries || [];
}

export async function apiCreateEntries(
  input: Array<Pick<Entry, 'transaction_id' | 'account_id' | 'amount' | 'side'>>
): Promise<Entry[]> {
  const created: Entry[] = [];
  for (const line of input) {
    const payload = await request<{ entry: Entry }>('/api/entries', {
      method: 'POST',
      body: JSON.stringify(line),
    });
    created.push(payload.entry);
  }
  return created;
}

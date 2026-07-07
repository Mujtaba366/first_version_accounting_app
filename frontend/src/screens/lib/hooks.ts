import { useEffect, useState } from 'react';
import {
  apiGetAccounts,
  apiGetEntries,
  apiGetTransactions,
  normalBalance,
  type Account,
  type AccountType,
  type Transaction,
} from './supabase';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      const rows = await apiGetAccounts();
      setAccounts(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  return { accounts, loading, reload };
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      const [transactionsRows, entriesRows, accountRows] = await Promise.all([
        apiGetTransactions(),
        apiGetEntries(),
        apiGetAccounts(),
      ]);

      const accountById = new Map(accountRows.map((a) => [a.id, a]));
      const entriesByTx = new Map<string, NonNullable<Transaction['entries']>>();

      for (const e of entriesRows) {
        const list = entriesByTx.get(e.transaction_id) || [];
        list.push({
          ...e,
          amount: Number(e.amount || 0),
          account: accountById.get(e.account_id),
        });
        entriesByTx.set(e.transaction_id, list);
      }

      const withEntries = transactionsRows
        .map((t) => ({ ...t, entries: entriesByTx.get(t.id) || [] }))
        .sort((a, b) => {
          const byDate = b.date.localeCompare(a.date);
          if (byDate !== 0) {
            return byDate;
          }
          return (b.created_at || '').localeCompare(a.created_at || '');
        });

      setTransactions(withEntries);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  return { transactions, loading, reload };
}

export type AccountBalance = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  debit: number;
  credit: number;
  balance: number;
};

export function computeBalances(accounts: Account[], transactions: Transaction[]): AccountBalance[] {
  const rollup = new Map<string, AccountBalance>();

  for (const account of accounts) {
    rollup.set(account.id, {
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      debit: 0,
      credit: 0,
      balance: 0,
    });
  }

  for (const tx of transactions) {
    for (const entry of tx.entries || []) {
      const row = rollup.get(entry.account_id);
      if (!row) {
        continue;
      }
      const amount = Number(entry.amount || 0);
      if (entry.side === 'debit') {
        row.debit += amount;
      } else {
        row.credit += amount;
      }
    }
  }

  return Array.from(rollup.values()).map((row) => {
    const normal = normalBalance(row.type);
    const balance = normal === 'debit' ? row.debit - row.credit : row.credit - row.debit;
    return { ...row, balance };
  });
}

export function totalByType(balances: AccountBalance[], type: AccountType): number {
  return balances.filter((x) => x.type === type).reduce((sum, x) => sum + x.balance, 0);
}

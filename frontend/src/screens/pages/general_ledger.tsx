import { useState } from 'react';
import { FileText } from 'lucide-react';
import { PageHeader, Card, Select, EmptyState } from '../components/ui';
import { useAccounts, useTransactions } from '../lib/hooks';
import { fmt, normalBalance } from '../lib/supabase';

export default function GeneralLedger() {
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();
  const [selected, setSelected] = useState('');

  const account = accounts.find((a) => a.id === selected);
  const nb = account ? normalBalance(account.type) : 'debit';

  // Filter entries for this account, sorted by date
  const lines = transactions
    .filter((t) => (t.entries || []).some((e) => e.account_id === selected))
    .sort((a, b) => a.date.localeCompare(b.date))
    .flatMap((t) =>
      (t.entries || [])
        .filter((e) => e.account_id === selected)
        .map((e) => ({ date: t.date, memo: t.memo, side: e.side, amount: Number(e.amount) }))
    );

  let running = 0;
  const rows = lines.map((l) => {
    running += l.side === nb ? l.amount : -l.amount;
    return { ...l, balance: running };
  });

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader title="General Ledger" subtitle="Chronological record of all entries per account" />

      <Card className="p-4 mb-6">
        <Select label="Select Account" value={selected} onChange={setSelected} className="max-w-md">
          <option value="">Choose an account…</option>
          {accounts.sort((a, b) => a.code.localeCompare(b.code)).map((a) => (
            <option key={a.id} value={a.id}>{a.code} · {a.name}</option>
          ))}
        </Select>
      </Card>

      {!selected ? (
        <Card className="p-6">
          <EmptyState icon={<FileText className="w-7 h-7" />} title="Select an account" message="Choose an account above to view its ledger." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">{account?.code} · {account?.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Normal balance: {nb}</p>
          </div>
          {rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-400">No entries for this account.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase tracking-wide bg-slate-50">
                    <th className="text-left font-semibold px-5 py-2.5">Date</th>
                    <th className="text-left font-semibold px-3 py-2.5">Description</th>
                    <th className="text-right font-semibold px-3 py-2.5">Debit</th>
                    <th className="text-right font-semibold px-3 py-2.5">Credit</th>
                    <th className="text-right font-semibold px-5 py-2.5">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-5 py-2.5 text-slate-600 whitespace-nowrap">
                        {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-2.5 text-slate-800">{r.memo || '—'}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-600">{r.side === 'debit' ? fmt(r.amount) : '—'}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-600">{r.side === 'credit' ? fmt(r.amount) : '—'}</td>
                      <td className="px-5 py-2.5 text-right font-mono font-semibold text-slate-800">{fmt(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td colSpan={4} className="px-5 py-3 text-right text-sm font-bold text-slate-700">Ending Balance</td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">{fmt(running)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

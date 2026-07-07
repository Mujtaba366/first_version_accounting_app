import { Scale } from 'lucide-react';
import { PageHeader, Card, EmptyState } from '../components/ui';
import { useAccounts, useTransactions, computeBalances } from '../lib/hooks';
import { fmt } from '../lib/supabase';

export default function TrialBalance() {
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();

  const balances = computeBalances(accounts, transactions);
  const withActivity = balances.filter((b) => b.debit !== 0 || b.credit !== 0).sort((a, b) => a.code.localeCompare(b.code));

  const totalDebit = withActivity.reduce((s, b) => s + (b.debit > b.credit ? b.balance : 0), 0);
  const totalCredit = withActivity.reduce((s, b) => s + (b.credit > b.debit ? b.balance : 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.005;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader title="Trial Balance" subtitle="List of all accounts with debit or credit balances" />

      {withActivity.length === 0 ? (
        <Card className="p-6">
          <EmptyState icon={<Scale className="w-7 h-7" />} title="No data" message="Post transactions to generate a trial balance." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200">
                  <th className="text-left font-semibold px-5 py-3">Code</th>
                  <th className="text-left font-semibold px-3 py-3">Account</th>
                  <th className="text-left font-semibold px-3 py-3">Type</th>
                  <th className="text-right font-semibold px-3 py-3">Debit</th>
                  <th className="text-right font-semibold px-5 py-3">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {withActivity.map((b) => {
                  const isDebit = b.balance >= 0;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-2.5 font-mono text-xs text-slate-400">{b.code}</td>
                      <td className="px-3 py-2.5 text-slate-800">{b.name}</td>
                      <td className="px-3 py-2.5 text-slate-500 capitalize">{b.type}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-700">{isDebit ? fmt(b.balance) : '—'}</td>
                      <td className="px-5 py-2.5 text-right font-mono text-slate-700">{!isDebit ? fmt(Math.abs(b.balance)) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td colSpan={3} className="px-5 py-3.5 text-right text-sm font-bold text-slate-700">Totals</td>
                  <td className="px-3 py-3.5 text-right font-mono font-bold text-slate-900">{fmt(totalDebit)}</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">{fmt(totalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">As of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span className={`text-sm font-semibold ${balanced ? 'text-emerald-600' : 'text-rose-600'}`}>
              {balanced ? '✓ Balanced' : 'Out of balance'}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}

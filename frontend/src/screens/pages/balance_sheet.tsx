import { Scale } from 'lucide-react';
import { PageHeader, Card, EmptyState } from '../components/ui';
import { useAccounts, useTransactions, computeBalances } from '../lib/hooks';
import { fmt } from '../lib/supabase';

export default function BalanceSheet() {
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();

  const balances = computeBalances(accounts, transactions);

  const assets = balances.filter((b) => b.type === 'asset' && b.balance !== 0).sort((a, b) => a.code.localeCompare(b.code));
  const liabilities = balances.filter((b) => b.type === 'liability' && b.balance !== 0).sort((a, b) => a.code.localeCompare(b.code));
  const equity = balances.filter((b) => b.type === 'equity' && b.balance !== 0).sort((a, b) => a.code.localeCompare(b.code));

  // Add net income as retained earnings (current period)
  const incomes = balances.filter((b) => b.type === 'income');
  const expenses = balances.filter((b) => b.type === 'expense');
  const netIncome = incomes.reduce((s, b) => s + b.balance, 0) - expenses.reduce((s, b) => s + b.balance, 0);

  const totalAssets = assets.reduce((s, b) => s + b.balance, 0);
  const totalLiabilities = liabilities.reduce((s, b) => s + b.balance, 0);
  const totalEquity = equity.reduce((s, b) => s + b.balance, 0) + netIncome;
  const balanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.005;

  const hasData = assets.length > 0 || liabilities.length > 0 || equity.length > 0 || netIncome !== 0;

  const Section = ({ title, items, total, totalLabel }: { title: string; items: typeof assets; total: number; totalLabel: string }) => (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 py-2">No {title.toLowerCase()} recorded.</p>
      ) : (
        <div className="space-y-1">
          {items.map((b) => (
            <div key={b.id} className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-sm text-slate-700">
                <span className="font-mono text-xs text-slate-400 mr-2">{b.code}</span>{b.name}
              </span>
              <span className="font-mono text-sm text-slate-700">{fmt(b.balance)}</span>
            </div>
          ))}
          {title === 'Equity' && netIncome !== 0 && (
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-sm text-slate-700 italic">Current Period Net Income</span>
              <span className="font-mono text-sm text-slate-700">{fmt(netIncome)}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-3 mt-1">
            <span className="text-sm font-bold text-slate-800">{totalLabel}</span>
            <span className="font-mono text-base font-bold text-slate-900">{fmt(total)}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader title="Balance Sheet" subtitle="Statement of financial position — assets, liabilities & equity" />

      {!hasData ? (
        <Card className="p-6">
          <EmptyState icon={<Scale className="w-7 h-7" />} title="No data" message="Post transactions to generate a balance sheet." />
        </Card>
      ) : (
        <Card className="p-6 lg:p-8">
          <div className="text-center mb-6 pb-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Ledger Accounting</h2>
            <p className="text-sm text-slate-500 mt-1">Balance Sheet</p>
            <p className="text-xs text-slate-400 mt-1">As of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          <Section title="Assets" items={assets} total={totalAssets} totalLabel="Total Assets" />

          <div className="my-6 border-t border-slate-100" />

          <Section title="Liabilities" items={liabilities} total={totalLiabilities} totalLabel="Total Liabilities" />

          <div className="my-6 border-t border-slate-100" />

          <Section title="Equity" items={equity} total={totalEquity} totalLabel="Total Equity" />

          <div className="mt-6 pt-6 border-t-2 border-slate-200">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
              <span className="font-bold text-slate-800">Total Liabilities + Equity</span>
              <span className="font-mono text-xl font-bold text-slate-900">{fmt(totalLiabilities + totalEquity)}</span>
            </div>
            <div className="flex items-center justify-between mt-3 px-4">
              <span className="text-sm text-slate-500">Accounting Equation Check</span>
              <span className={`text-sm font-semibold ${balanced ? 'text-emerald-600' : 'text-rose-600'}`}>
                {balanced ? '✓ Balanced' : 'Out of balance'}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { PageHeader, Card, EmptyState } from '../components/ui';
import { useAccounts, useTransactions, computeBalances } from '../lib/hooks';
import { fmt } from '../lib/supabase';

export default function IncomeStatement() {
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();

  const balances = computeBalances(accounts, transactions);
  const incomes = balances.filter((b) => b.type === 'income' && b.balance !== 0).sort((a, b) => a.code.localeCompare(b.code));
  const expenses = balances.filter((b) => b.type === 'expense' && b.balance !== 0).sort((a, b) => a.code.localeCompare(b.code));
  const totalIncome = incomes.reduce((s, b) => s + b.balance, 0);
  const totalExpenses = expenses.reduce((s, b) => s + b.balance, 0);
  const netIncome = totalIncome - totalExpenses;

  const hasData = incomes.length > 0 || expenses.length > 0;

  const Section = ({ title, items, total, totalLabel }: { title: string; items: typeof incomes; total: number; totalLabel: string }) => (
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
      <PageHeader title="Income Statement" subtitle="Profit & Loss — revenues and expenses over the period" />

      {!hasData ? (
        <Card className="p-6">
          <EmptyState icon={<BarChart3 className="w-7 h-7" />} title="No data" message="Post income or expense transactions to generate this report." />
        </Card>
      ) : (
        <Card className="p-6 lg:p-8">
          <div className="text-center mb-6 pb-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Ledger Accounting</h2>
            <p className="text-sm text-slate-500 mt-1">Income Statement</p>
            <p className="text-xs text-slate-400 mt-1">For the period ending {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          <Section title="Revenue" items={incomes} total={totalIncome} totalLabel="Total Revenue" />

          <div className="my-6 border-t border-slate-100" />

          <Section title="Expenses" items={expenses} total={totalExpenses} totalLabel="Total Expenses" />

          <div className="mt-6 pt-6 border-t-2 border-slate-200">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
              <div className="flex items-center gap-2">
                {netIncome >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : <TrendingDown className="w-5 h-5 text-rose-600" />}
                <span className="font-bold text-slate-800">Net Income</span>
              </div>
              <span className={`font-mono text-xl font-bold ${netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {fmt(netIncome)}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

import { TrendingUp, TrendingDown, Wallet, Scale, ArrowRight, BookOpen, PlusCircle } from 'lucide-react';
import { PageHeader, Card, StatCard, Button, Badge } from '../components/ui';
import { useAccounts, useTransactions, computeBalances, totalByType } from '../lib/hooks';
import { fmt } from '../lib/supabase';
import type { View } from '../nav';

export default function Dashboard({ onNavigate }: { onNavigate: (v: View) => void }) {
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();

  const balances = computeBalances(accounts, transactions);
  const totalAssets = totalByType(balances, 'asset');
  const totalLiabilities = totalByType(balances, 'liability');
  const totalEquity = totalByType(balances, 'equity');
  const totalIncome = totalByType(balances, 'income');
  const totalExpenses = totalByType(balances, 'expense');
  const netIncome = totalIncome - totalExpenses;
  const recentTx = transactions.slice(0, 5);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle="Financial overview of your books"
        action={
          <Button onClick={() => onNavigate('new-transaction')}>
            <span className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> New Transaction
            </span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Assets" value={fmt(totalAssets)} accent="blue" icon={<Wallet className="w-5 h-5" />} />
        <StatCard label="Total Liabilities" value={fmt(totalLiabilities)} accent="rose" icon={<Scale className="w-5 h-5" />} />
        <StatCard label="Total Equity" value={fmt(totalEquity)} accent="slate" icon={<Scale className="w-5 h-5" />} />
        <StatCard
          label="Net Income"
          value={fmt(netIncome)}
          sub={`${fmt(totalIncome)} revenue · ${fmt(totalExpenses)} expenses`}
          accent={netIncome >= 0 ? 'emerald' : 'rose'}
          icon={netIncome >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Recent Transactions</h2>
            <button
              onClick={() => onNavigate('journal')}
              className="text-sm text-emerald-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {recentTx.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              No transactions yet. Create your first journal entry to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {recentTx.map((t) => {
                const total = (t.entries || []).reduce((s, e) => (e.side === 'debit' ? s + Number(e.amount) : s), 0);
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{t.memo || 'Journal entry'}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' · '}{(t.entries || []).length} lines
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-semibold text-slate-700">{fmt(total)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-bold text-slate-900 mb-4">Account Summary</h2>
          <div className="space-y-3">
            {(['asset', 'liability', 'equity', 'income', 'expense'] as const).map((type) => {
              const total = totalByType(balances, type);
              return (
                <div key={type} className="flex items-center justify-between">
                  <Badge type={type} />
                  <span className="font-mono text-sm font-semibold text-slate-700">{fmt(total)}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-600">Accounting Equation</span>
            </div>
            <p className="font-mono text-xs text-slate-500 mt-2">
              Assets = Liab + Equity
            </p>
            <p className={`font-mono text-sm font-bold mt-1 ${Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {fmt(totalAssets)} = {fmt(totalLiabilities)} + {fmt(totalEquity)}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

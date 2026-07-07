import { useEffect, useState } from 'react';
// import type { ReactNode } from 'react';
import Accounts from './pages/accounts';
import NewTransaction from './pages/new_transaction';
import Journal from './pages/journal';
import GeneralLedger from './pages/general_ledger';
import TrialBalance from './pages/trial_balance';
import IncomeStatement from './pages/income_statement';
import BalanceSheet from './pages/balance_sheet';
import Dashboard from './pages/dashboard';
import {
  type LucideIcon,
  LayoutDashboard,
  FileText,
  Wallet,
  BookOpen,
  BarChart3,
  Menu,
  PlusCircle,
  Scale,
} from 'lucide-react';

export type View =
  | 'dashboard'
  | 'accounts'
  | 'new-transaction'
  | 'journal'
  | 'ledger'
  | 'trial-balance'
  | 'income-statement'
  | 'balance-sheet';

const NAV: { id: View; label: string; icon: LucideIcon; group: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { id: 'new-transaction', label: 'New Transaction', icon: PlusCircle, group: 'Overview' },
  { id: 'journal', label: 'Journal', icon: BookOpen, group: 'Overview' },
  { id: 'accounts', label: 'Chart of Accounts', icon: Wallet, group: 'Overview' },
  { id: 'ledger', label: 'General Ledger', icon: FileText, group: 'Reports' },
  { id: 'trial-balance', label: 'Trial Balance', icon: Scale, group: 'Reports' },
  { id: 'income-statement', label: 'Income Statement', icon: BarChart3, group: 'Reports' },
  { id: 'balance-sheet', label: 'Balance Sheet', icon: Scale, group: 'Reports' },
];
export default function Nav() {
  const [view, setView] = useState<View>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [view]);

  const groups = Array.from(new Set(NAV.map((n) => n.group)));
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#0b1220] text-slate-300 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-6 h-16 border-b border-white/5">
          {/* <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Scale className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div> */}
          <div>
            <h1 className="text-white font-bold text-lg leading-none">Accounting app</h1>
            {/* <p className="text-[11px] text-slate-500 mt-0.5">Accounting System</p> */}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {groups.map((group) => (
            <div key={group}>
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2">
                {group}
              </p>
              <div className="space-y-1">
                {NAV.filter((n) => n.group === group).map((item) => {
                  const Icon = item.icon;
                  const active = view === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'bg-emerald-500/10 text-emerald-400 shadow-sm'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.5 : 2} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-white/5">
          <p className="text-[11px] text-slate-600">Double-Entry Bookkeeping</p>
          <p className="text-[11px] text-slate-700 mt-0.5">All reports auto-generated</p>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-slate-200 sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} aria-label="Open navigation menu" title="Open menu">
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          <span className="font-bold text-slate-800">Ledger</span>
          <div className="w-6" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="animate-fade-in" key={view}>
            {view === 'dashboard' && <Dashboard onNavigate={setView} />}
            {view === 'accounts' && <Accounts />}
            {view === 'new-transaction' && <NewTransaction onDone={() => setView('journal')} />}
            {view === 'journal' && <Journal />}
            {view === 'ledger' && <GeneralLedger />}
            {view === 'trial-balance' && <TrialBalance />}
            {view === 'income-statement' && <IncomeStatement />}
            {view === 'balance-sheet' && <BalanceSheet />}
          </div>
        </main>
      </div>
    </div>
  );
}
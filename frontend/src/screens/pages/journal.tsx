import { useState } from 'react';
import { BookOpen, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { PageHeader, Card, Badge, EmptyState } from '../components/ui';
import { useTransactions } from '../lib/hooks';
import { apiDeleteTransaction, fmt } from '../lib/supabase';

export default function Journal() {
  const { transactions, loading, reload } = useTransactions();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this transaction and all its entries?')) return;
    await apiDeleteTransaction(id);
    reload();
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader title="Journal" subtitle="All posted transactions in chronological order" />

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : transactions.length === 0 ? (
        <Card className="p-6">
          <EmptyState icon={<BookOpen className="w-7 h-7" />} title="No transactions" message="Post a journal entry to see it here." />
        </Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((t) => {
            const open = expanded.has(t.id);
            const total = (t.entries || []).reduce((s, e) => (e.side === 'debit' ? s + Number(e.amount) : s), 0);
            return (
              <Card key={t.id} className="overflow-hidden">
                <button
                  onClick={() => toggle(t.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {open ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{t.memo || 'Journal entry'}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-mono text-sm font-semibold text-slate-700">{fmt(total)}</span>
                    <span
                      onClick={(e) => { e.stopPropagation(); remove(t.id); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </span>
                  </div>
                </button>

                {open && (
                  <div className="border-t border-slate-100 animate-fade-in">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-500 uppercase tracking-wide bg-slate-50">
                          <th className="text-left font-semibold px-5 py-2">Account</th>
                          <th className="text-left font-semibold px-3 py-2 w-24">Type</th>
                          <th className="text-right font-semibold px-3 py-2 w-32">Debit</th>
                          <th className="text-right font-semibold px-5 py-2 w-32">Credit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {(t.entries || []).map((e) => (
                          <tr key={e.id} className="hover:bg-slate-50/50">
                            <td className="px-5 py-2.5">
                              <span className="font-mono text-xs text-slate-400 mr-2">{e.account?.code}</span>
                              <span className="text-slate-800">{e.account?.name}</span>
                            </td>
                            <td className="px-3 py-2.5"><Badge type={e.account?.type || ''} /></td>
                            <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                              {e.side === 'debit' ? fmt(Number(e.amount)) : '—'}
                            </td>
                            <td className="px-5 py-2.5 text-right font-mono text-slate-700">
                              {e.side === 'credit' ? fmt(Number(e.amount)) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

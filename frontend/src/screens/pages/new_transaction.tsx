import { useState } from 'react';
import { Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { PageHeader, Card, Button, Input } from '../components/ui';
import { useAccounts } from '../lib/hooks';
import { apiCreateEntries, apiCreateTransaction, fmt, type Account } from '../lib/supabase';

interface Line {
  id: string;
  account_id: string;
  debit: string;
  credit: string;
}

let lineId = 0;
const newLine = (): Line => ({ id: `l${++lineId}`, account_id: '', debit: '', credit: '' });

export default function NewTransaction({ onDone }: { onDone: () => void }) {
  const { accounts } = useAccounts();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState('');
  const [lines, setLines] = useState<Line[]>([newLine(), newLine()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.005 && totalDebit > 0;

  const update = (id: string, field: keyof Line, value: string) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, newLine()]);
  const removeLine = (id: string) => setLines((prev) => (prev.length > 2 ? prev.filter((l) => l.id !== id) : prev));

  const save = async () => {
    setError('');
    if (!memo.trim()) {
      setError('A memo/description is required.');
      return;
    }
    if (!balanced) {
      setError('Debits and credits must be equal and greater than zero.');
      return;
    }
    const valid = lines.filter((l) => l.account_id && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0));
    if (valid.length < 2) {
      setError('At least two valid line items are required.');
      return;
    }

    setSaving(true);
    try {
      const tx = await apiCreateTransaction({ date, memo });

      const entries = valid.map((l) => ({
        transaction_id: tx.id,
        account_id: l.account_id,
        amount: parseFloat(l.debit) || parseFloat(l.credit),
        side: (parseFloat(l.debit) > 0 ? 'debit' : 'credit') as 'debit' | 'credit',
      }));

      await apiCreateEntries(entries);
      onDone();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save transaction';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const accountLabel = (a: Account) => `${a.code} · ${a.name}`;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader title="New Transaction" subtitle="Record a balanced double-entry journal transaction" />

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Input label="Date" type="date" value={date} onChange={setDate} />
          <div className="sm:col-span-2">
            <Input label="Memo / Description" value={memo} onChange={setMemo} placeholder="e.g. Paid office rent for July" />
          </div>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left font-semibold px-2 pb-2">Account</th>
                <th className="text-right font-semibold px-2 pb-2 w-32">Debit</th>
                <th className="text-right font-semibold px-2 pb-2 w-32">Credit</th>
                <th className="w-10 pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id} className="group">
                  <td className="px-2 pb-2">
                    <select
                      value={l.account_id}
                      onChange={(e) => update(l.id, 'account_id', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    >
                      <option value="">Select account…</option>
                      {accounts.sort((a, b) => a.code.localeCompare(b.code)).map((a) => (
                        <option key={a.id} value={a.id}>{accountLabel(a)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 pb-2">
                    <input
                      type="number"
                      step="0.01"
                      value={l.debit}
                      onChange={(e) => {
                        update(l.id, 'debit', e.target.value);
                        if (parseFloat(e.target.value) > 0) update(l.id, 'credit', '');
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </td>
                  <td className="px-2 pb-2">
                    <input
                      type="number"
                      step="0.01"
                      value={l.credit}
                      onChange={(e) => {
                        update(l.id, 'credit', e.target.value);
                        if (parseFloat(e.target.value) > 0) update(l.id, 'debit', '');
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </td>
                  <td className="px-1 pb-2">
                    <button
                      onClick={() => removeLine(l.id)}
                      disabled={lines.length <= 2}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200">
                <td className="px-2 pt-3">
                  <button onClick={addLine} className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                    <Plus className="w-4 h-4" /> Add line
                  </button>
                </td>
                <td className="px-2 pt-3 text-right font-mono font-bold text-slate-800">{fmt(totalDebit)}</td>
                <td className="px-2 pt-3 text-right font-mono font-bold text-slate-800">{fmt(totalCredit)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm">
          {balanced ? (
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <Check className="w-4 h-4" /> Balanced
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-400">
              <AlertCircle className="w-4 h-4" />
              {totalDebit === 0 && totalCredit === 0
                ? 'Enter amounts to balance the entry'
                : `Out of balance by ${fmt(Math.abs(totalDebit - totalCredit))}`}
            </span>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="secondary" onClick={onDone}>Cancel</Button>
          <Button onClick={save} disabled={saving || !balanced}>
            {saving ? 'Saving…' : 'Post Transaction'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

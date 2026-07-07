import { useState } from 'react';
import { Plus, Trash2, Pencil, X, Wallet } from 'lucide-react';
import { PageHeader, Card, Button, Input, Select, Badge, EmptyState } from '../components/ui';
import { useAccounts } from '../lib/hooks';
import {
  ACCOUNT_TYPES,
  apiCreateAccount,
  apiDeleteAccount,
  apiUpdateAccount,
  type AccountType,
  type Account,
} from '../lib/supabase';

export default function Accounts() {
  const { accounts, loading, reload } = useAccounts();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState({ code: '', name: '', type: 'asset' as AccountType });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const openNew = () => {
    setEditing(null);
    setForm({ code: '', name: '', type: 'asset' });
    setError('');
    setShowForm(true);
  };

  const openEdit = (a: Account) => {
    setEditing(a);
    setForm({ code: a.code, name: a.name, type: a.type });
    setError('');
    setShowForm(true);
  };

  const save = async () => {
    setError('');
    if (!form.code.trim() || !form.name.trim()) {
      setError('Code and name are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiUpdateAccount(editing.id, form);
      } else {
        await apiCreateAccount(form);
      }
      setShowForm(false);
      await reload();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save account';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a: Account) => {
    if (!confirm(`Delete account "${a.name}"? This cannot be undone if it has entries.`)) return;
    try {
      await apiDeleteAccount(a.id);
      await reload();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete account';
      setError(message);
    }
  };

  const grouped = ACCOUNT_TYPES.map((t) => ({
    ...t,
    accounts: accounts.filter((a) => a.type === t.value).sort((a, b) => a.code.localeCompare(b.code)),
  }));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Chart of Accounts"
        subtitle="Manage your asset, liability, equity, income, and expense accounts"
        action={
          <Button onClick={openNew}>
            <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Account</span>
          </Button>
        }
      />

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading accounts…</div>
      ) : accounts.length === 0 ? (
        <Card className="p-6">
          <EmptyState icon={<Wallet className="w-7 h-7" />} title="No accounts yet" message="Add your first account to start recording transactions." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {grouped.map((g) => (
            <Card key={g.value} className="overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge type={g.value} />
                  <span className="text-xs text-slate-400">Normal balance: {g.normal}</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">{g.accounts.length} accounts</span>
              </div>
              <div className="divide-y divide-slate-50">
                {g.accounts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold text-slate-400 w-12">{a.code}</span>
                      <span className="text-sm font-medium text-slate-800">{a.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(a)} className="p-1.5 rounded hover:bg-slate-200 text-slate-500">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(a)} className="p-1.5 rounded hover:bg-rose-100 text-rose-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {g.accounts.length === 0 && (
                  <p className="px-5 py-4 text-sm text-slate-400">No accounts in this category.</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Account' : 'New Account'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="space-y-4">
              <Input label="Account Code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} placeholder="e.g. 1000" />
              <Input label="Account Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Cash" />
              <Select label="Account Type" value={form.type} onChange={(v) => setForm({ ...form, type: v as AccountType })}>
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
              {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={save} disabled={saving} className="flex-1">{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Account'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

type Accent = 'blue' | 'rose' | 'slate' | 'emerald';

function joinClass(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={joinClass('rounded-2xl border border-slate-200 bg-white shadow-sm', className)} {...props} />;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  const style =
    variant === 'secondary'
      ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
      : 'bg-emerald-500 text-white hover:bg-emerald-400';

  return (
    <button
      className={joinClass(
        'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed',
        style,
        className
      )}
      {...props}
    />
  );
}

export function Input({
  label,
  value,
  onChange,
  className,
  ...props
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className={joinClass('block', className)}>
      {label && <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>}
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
      />
    </label>
  );
}

export function Select({
  label,
  className,
  value,
  onChange,
  children,
  ...props
}: {
  label?: string;
  className?: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange' | 'children'>) {
  return (
    <label className={joinClass('block', className)}>
      {label && <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>}
      <select
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
      >
        {children}
      </select>
    </label>
  );
}

export function Badge({ type }: { type: string }) {
  const value = (type || '').toLowerCase();
  const styles: Record<string, string> = {
    asset: 'bg-blue-50 text-blue-700 border-blue-200',
    liability: 'bg-rose-50 text-rose-700 border-rose-200',
    equity: 'bg-violet-50 text-violet-700 border-violet-200',
    income: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    expense: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={joinClass('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold capitalize', styles[value] || 'bg-slate-100 text-slate-700 border-slate-200')}>
      {value || 'unknown'}
    </span>
  );
}

export function EmptyState({ icon, title, message }: { icon: ReactNode; title: string; message: string }) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3">{icon}</div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="text-sm text-slate-500 mt-1">{message}</p>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  accent?: Accent;
}) {
  const accents: Record<Accent, string> = {
    blue: 'text-blue-600 bg-blue-50',
    rose: 'text-rose-600 bg-rose-50',
    slate: 'text-slate-700 bg-slate-100',
    emerald: 'text-emerald-600 bg-emerald-50',
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        {icon && (
          <div className={joinClass('w-9 h-9 rounded-lg flex items-center justify-center', accents[accent || 'slate'])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

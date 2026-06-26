import type { LucideIcon } from 'lucide-react';
import { classNames } from '../lib/formatters';

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'blue',
  detail
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'blue' | 'green' | 'yellow' | 'red' | 'orange';
  detail?: string;
}) {
  const toneClass = {
    blue: 'text-pbm-glow bg-pbm-blue/10 border-pbm-blue/30 shadow-[0_0_18px_rgba(56,189,248,.16)]',
    green: 'text-pbm-green bg-pbm-green/10 border-pbm-green/30 shadow-[0_0_18px_rgba(34,197,94,.14)]',
    yellow: 'text-pbm-yellow bg-pbm-yellow/10 border-pbm-yellow/30 shadow-[0_0_18px_rgba(250,204,21,.14)]',
    red: 'text-pbm-red bg-pbm-red/10 border-pbm-red/30 shadow-[0_0_18px_rgba(239,68,68,.14)]',
    orange: 'text-pbm-orange bg-pbm-orange/10 border-pbm-orange/30 shadow-[0_0_18px_rgba(245,158,11,.14)]'
  }[tone];

  return (
    <article className="metric-card animate-card-in rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-pbm-muted">{label}</p>
          <p className="metric-value mt-2 text-3xl font-black leading-none text-pbm-text">{value}</p>
        </div>
        <div className={classNames('rounded-lg border p-2.5', toneClass)}>
          <Icon size={20} aria-hidden="true" />
        </div>
      </div>
      {detail ? <p className="mt-3 text-sm text-pbm-muted">{detail}</p> : null}
    </article>
  );
}

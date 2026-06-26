import type { ReactNode } from 'react';
import type { ServiceStatus, StockStatus } from '../types/pbm';
import { classNames } from '../lib/formatters';

const serviceTone: Record<ServiceStatus, string> = {
  'Sin programar': 'border-pbm-blue/40 bg-pbm-blue/10 text-pbm-muted',
  Pendiente: 'border-pbm-yellow/50 bg-pbm-yellow/10 text-pbm-yellow shadow-[0_0_16px_rgba(250,204,21,.12)]',
  Realizado: 'border-pbm-green/60 bg-pbm-green/10 text-pbm-green'
};

const stockTone: Record<StockStatus, string> = {
  Suficiente: 'border-pbm-green/60 bg-pbm-green/10 text-pbm-green',
  Bajo: 'border-pbm-yellow/50 bg-pbm-yellow/10 text-pbm-yellow',
  Critico: 'border-pbm-red/60 bg-pbm-red/10 text-pbm-red'
};

const priorityTone: Record<string, string> = {
  Baja: 'border-pbm-muted/40 bg-pbm-muted/10 text-pbm-muted',
  Media: 'border-pbm-yellow/50 bg-pbm-yellow/10 text-pbm-yellow',
  Alta: 'border-pbm-orange/60 bg-pbm-orange/10 text-pbm-orange',
  Critica: 'border-pbm-red/60 bg-pbm-red/10 text-pbm-red'
};

export function StatusBadge({
  children,
  tone = 'neutral',
  className
}: {
  children: ReactNode;
  tone?: 'neutral' | 'blue' | 'green' | 'yellow' | 'red' | 'orange';
  className?: string;
}) {
  const tones = {
    neutral: 'border-pbm-border bg-white/5 text-pbm-muted',
    blue: 'border-pbm-blue/60 bg-pbm-blue/10 text-pbm-glow',
    green: 'border-pbm-green/60 bg-pbm-green/10 text-pbm-green',
    yellow: 'border-pbm-yellow/50 bg-pbm-yellow/10 text-pbm-yellow',
    red: 'border-pbm-red/60 bg-pbm-red/10 text-pbm-red',
    orange: 'border-pbm-orange/60 bg-pbm-orange/10 text-pbm-orange'
  };

  return (
    <span
      className={classNames(
        'badge-pulse inline-flex min-h-7 items-center rounded-md border px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-normal shadow-[inset_0_1px_0_rgba(255,255,255,.06)]',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
  return (
    <span className={classNames('badge-pulse inline-flex min-h-7 items-center rounded-md border px-2.5 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,.06)]', serviceTone[status])}>
      {status}
    </span>
  );
}

export function StockStatusBadge({ status }: { status: StockStatus }) {
  return (
    <span className={classNames('badge-pulse inline-flex min-h-7 items-center rounded-md border px-2.5 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,.06)]', stockTone[status])}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={classNames(
        'badge-pulse inline-flex min-h-7 items-center rounded-md border px-2.5 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,.06)]',
        priorityTone[priority] ?? priorityTone.Baja
      )}
    >
      {priority || 'Sin prioridad'}
    </span>
  );
}

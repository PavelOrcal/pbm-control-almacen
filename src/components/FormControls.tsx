import type { ReactNode } from 'react';
import { classNames } from '../lib/formatters';

export function Field({
  label,
  children,
  hint
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-pbm-muted">{label}</span>
      <div className="mt-2">{children}</div>
      {hint ? <span className="mt-1 block text-xs text-pbm-muted">{hint}</span> : null}
    </label>
  );
}

export const inputClassName =
  'form-control min-h-12 w-full rounded-lg border border-pbm-border px-3 text-sm text-pbm-text outline-none transition placeholder:text-pbm-muted focus:border-pbm-blue focus:ring-2 focus:ring-pbm-blue/20';

export function PrimaryButton({
  children,
  type = 'button',
  disabled,
  className,
  onClick
}: {
  children: ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={classNames(
        'pressable inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-pbm-orange/60 bg-[linear-gradient(135deg,#F59E0B,#FACC15)] px-4 text-sm font-black text-slate-950 shadow-orange transition disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  type = 'button',
  disabled,
  className,
  onClick
}: {
  children: ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={classNames(
        'pressable inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-pbm-border bg-pbm-card/90 px-4 text-sm font-bold text-pbm-text shadow-[inset_0_1px_0_rgba(255,255,255,.05)] transition disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {children}
    </button>
  );
}

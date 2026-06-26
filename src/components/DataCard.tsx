import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { classNames } from '../lib/formatters';

export function DataCard({
  title,
  subtitle,
  leading,
  meta,
  children,
  to,
  accent = 'blue'
}: {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  to?: string;
  accent?: 'blue' | 'orange' | 'green' | 'red' | 'yellow';
}) {
  const accentClass = {
    blue: 'border-l-pbm-blue',
    orange: 'border-l-pbm-orange',
    green: 'border-l-pbm-green',
    red: 'border-l-pbm-red',
    yellow: 'border-l-pbm-yellow'
  }[accent];

  const content = (
    <article
      data-accent={accent}
      className={classNames(
        'premium-card animate-card-in rounded-lg border-l-4 p-4 transition duration-200 hover:border-pbm-blue/60 hover:shadow-glow',
        accentClass
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {leading ? <div className="shrink-0">{leading}</div> : null}
          <div className="min-w-0">
            <h3 className="break-words text-base font-bold leading-tight text-pbm-text">{title}</h3>
            {subtitle ? <p className="mt-1 break-words text-sm text-pbm-muted">{subtitle}</p> : null}
          </div>
        </div>
        {to ? <ChevronRight className="mt-1 shrink-0 text-pbm-muted" size={18} aria-hidden="true" /> : null}
      </div>
      {meta ? <div className="mt-3 flex flex-wrap gap-2">{meta}</div> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );

  if (!to) return content;
  return (
    <Link to={to} className="pressable block">
      {content}
    </Link>
  );
}

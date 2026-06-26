import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { clientInitials, resolveCustomerLogo } from '../lib/assets';
import { classNames } from '../lib/formatters';

export function ClientLogo({
  empresa,
  logoCliente,
  size = 'md',
  className
}: {
  empresa: string;
  logoCliente?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : resolveCustomerLogo(empresa, logoCliente);
  const sizeClass = {
    sm: 'h-10 w-10 text-xs',
    md: 'h-14 w-14 text-sm',
    lg: 'h-20 w-20 text-xl'
  }[size];

  return (
    <div
      className={classNames(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-pbm-blue/30 bg-[linear-gradient(145deg,rgba(14,26,43,.94),rgba(17,24,39,.9))] font-black text-pbm-glow shadow-glow',
        sizeClass,
        className
      )}
      aria-label={`Logo ${empresa}`}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-contain p-1.5"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-0.5">
          <Building2 size={size === 'lg' ? 22 : 16} aria-hidden="true" />
          <span className="leading-none">{clientInitials(empresa)}</span>
        </div>
      )}
    </div>
  );
}

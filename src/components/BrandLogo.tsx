import { useState } from 'react';
import { BRAND_LOGO_SRC } from '../lib/assets';
import { classNames } from '../lib/formatters';

export function BrandLogo({ className, imageClassName }: { className?: string; imageClassName?: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={classNames('header-logo-frame flex items-center justify-center rounded-lg px-3', className)}>
      {failed ? (
        <div className="text-center leading-none">
          <p className="text-sm font-black tracking-[0.18em] text-pbm-text">PBM</p>
          <p className="mt-1 text-[0.58rem] font-black uppercase tracking-[0.2em] text-pbm-glow">Control</p>
        </div>
      ) : (
        <img
          src={BRAND_LOGO_SRC}
          alt="PBM Control"
          className={classNames('w-auto object-contain', imageClassName)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

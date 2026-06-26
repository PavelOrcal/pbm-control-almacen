import { Cog } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export function PremiumSplash({ exiting = false }: { exiting?: boolean }) {
  return (
    <div className={`premium-splash ${exiting ? 'premium-splash-out' : ''}`} aria-hidden="true">
      <div className="splash-orbit">
        <div className="splash-gear">
          <Cog size={54} strokeWidth={1.6} />
        </div>
        <div className="splash-halo" />
      </div>
      <BrandLogo className="mt-6 h-20 w-52 px-5" imageClassName="max-h-14" />
      <h1 className="mt-5 text-3xl font-black tracking-tight text-pbm-text">PBM Control</h1>
      <p className="mt-2 text-sm font-bold uppercase tracking-[0.22em] text-pbm-glow">Paradigm Bio Metal</p>
      <p className="mt-5 text-sm font-semibold text-pbm-muted">Inicializando sistema de control...</p>
      <div className="mt-5 h-1.5 w-52 overflow-hidden rounded-full border border-pbm-blue/30 bg-pbm-bg/80">
        <div className="splash-loader h-full rounded-full" />
      </div>
    </div>
  );
}

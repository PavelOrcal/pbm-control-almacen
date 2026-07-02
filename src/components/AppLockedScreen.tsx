import { Pause, ShieldCheck } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export function AppLockedScreen() {
  return (
    <main className="app-lock-screen min-h-screen px-4 py-8">
      <section className="app-lock-panel screen-fade mx-auto rounded-lg p-5 sm:p-8">
        <div className="relative z-10 flex flex-col items-center text-center">
          <BrandLogo className="h-20 w-52 px-5" imageClassName="max-h-14" />

          <div className="app-lock-emblem mt-7" aria-hidden="true">
            <Pause size={30} strokeWidth={2.25} />
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-pbm-orange/40 bg-pbm-orange/10 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.16em] text-pbm-orange">
            <span className="h-1.5 w-1.5 rounded-full bg-pbm-orange shadow-orange" />
            Acceso pausado
          </div>

          <p className="mt-6 text-[0.68rem] font-black uppercase tracking-[0.2em] text-pbm-glow">
            Paradigm Bio Metal
          </p>
          <h1 className="mt-2 text-4xl font-black leading-none text-pbm-text sm:text-5xl">
            PBM Control
          </h1>
          <h2 className="mt-4 text-xl font-black text-pbm-text sm:text-2xl">
            Sistema temporalmente en pausa
          </h2>

          <p className="mt-5 max-w-md text-sm leading-7 text-pbm-muted sm:text-base">
            El servicio se encuentra temporalmente desactivado por mantenimiento administrativo. Los datos permanecen
            seguros y no se ha eliminado información.
          </p>

          <div className="mt-7 flex w-full max-w-md items-start gap-3 rounded-lg border border-pbm-blue/25 bg-pbm-blue/10 p-4 text-left">
            <ShieldCheck className="mt-0.5 shrink-0 text-pbm-glow" size={20} aria-hidden="true" />
            <p className="text-sm font-semibold leading-6 text-pbm-muted">
              Contacta al administrador para reactivar el acceso.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

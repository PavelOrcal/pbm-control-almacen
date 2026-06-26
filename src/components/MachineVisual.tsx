import { useEffect, useState } from 'react';
import { Cpu, Gauge, ImageOff, Zap } from 'lucide-react';
import { resolveEquipmentImage } from '../lib/assets';
import { classNames } from '../lib/formatters';

function MachineFallback({ model, variant }: { model: string; variant: 'card' | 'detail' }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_18%,rgba(56,189,248,.24),transparent_42%),linear-gradient(135deg,rgba(0,174,239,.16),rgba(7,17,31,.98))] p-4">
      <div className="w-full max-w-72 rounded-lg border border-pbm-blue/30 bg-pbm-bg/55 p-4 text-center shadow-glow backdrop-blur">
        <div className="mx-auto grid w-fit grid-cols-3 gap-3 text-pbm-glow/80">
          <Cpu size={variant === 'detail' ? 34 : 26} aria-hidden="true" />
          <Gauge size={variant === 'detail' ? 34 : 26} aria-hidden="true" />
          <Zap size={variant === 'detail' ? 34 : 26} aria-hidden="true" />
        </div>
        <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-pbm-border bg-pbm-panel/80 px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] text-pbm-muted">
          <ImageOff size={14} aria-hidden="true" />
          Imagen no disponible
        </div>
        <p className="mt-3 break-words text-lg font-black text-pbm-text">{model || 'Modelo sin dato'}</p>
      </div>
    </div>
  );
}

export function MachineVisual({
  model,
  fotoMaquina,
  variant = 'card'
}: {
  model: string;
  fotoMaquina?: string;
  variant?: 'card' | 'detail';
}) {
  const src = resolveEquipmentImage(model, fotoMaquina);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  return (
    <div
      className={classNames(
        'machine-frame relative overflow-hidden rounded-lg',
        variant === 'detail' ? 'aspect-[16/10]' : 'aspect-[16/9]'
      )}
    >
      {src && !imageFailed ? (
        <img
          src={src}
          alt={`Equipo ${model}`}
          className="machine-image h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <MachineFallback model={model} variant={variant} />
      )}
      <div className="absolute left-3 top-3 z-10 h-8 w-8 rounded-full border border-pbm-blue/35 bg-pbm-bg/50 backdrop-blur">
        <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pbm-green shadow-[0_0_14px_rgba(34,197,94,.85)]" />
      </div>
      <div className="absolute bottom-3 left-3 z-10 rounded-md border border-pbm-blue/40 bg-pbm-bg/80 px-2.5 py-1 text-xs font-black text-pbm-glow backdrop-blur">
        {model || 'Modelo'}
      </div>
      <div className="absolute bottom-3 right-3 z-10 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-pbm-muted backdrop-blur">
        Ficha tecnica
      </div>
    </div>
  );
}

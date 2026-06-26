import { LockKeyhole, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { inputClassName } from '../components/FormControls';
import { MachineVisual } from '../components/MachineVisual';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { PriorityBadge, StatusBadge } from '../components/StatusBadge';
import { usePbmData } from '../hooks/usePbmData';
import { hasInventoryAccess } from '../lib/inventoryAccess';

export default function Maquinas() {
  const { data, isLoading, error } = usePbmData();
  const [query, setQuery] = useState('');
  const inventoryUnlocked = hasInventoryAccess();

  const maquinas = useMemo(() => {
    if (!data) return [];
    const search = query.trim().toLowerCase();
    return data.maquinas.filter((maquina) =>
      [
        maquina.idMaquina,
        maquina.idCliente,
        maquina.empresa,
        maquina.modelo,
        inventoryUnlocked ? maquina.producto : '',
        maquina.estado,
        maquina.ubicacionArea
      ]
        .join(' ')
        .toLowerCase()
        .includes(search)
    );
  }, [data, inventoryUnlocked, query]);

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Error desconocido'} />;

  return (
    <div className="screen-fade space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pbm-muted" size={18} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={`${inputClassName} pl-10`}
          placeholder="Buscar maquina"
        />
      </div>
      {maquinas.length === 0 ? <EmptyState label="No hay maquinas para este filtro." /> : null}
      <section className="space-y-3">
        {maquinas.map((maquina) => (
          <article
            key={maquina.idMaquina}
            className="premium-card animate-card-in overflow-hidden rounded-lg transition"
            data-accent={maquina.prioridadServicio === 'Critica' ? 'red' : maquina.prioridadServicio === 'Alta' ? 'orange' : 'blue'}
          >
            <Link to={`/maquinas/${maquina.idMaquina}`} className="pressable block">
              <MachineVisual model={maquina.modelo} fotoMaquina={maquina.fotoMaquina} />
              <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-pbm-muted">Equipo instalado</p>
                    <h3 className="mt-1 text-2xl font-black leading-none text-pbm-text">{maquina.modelo}</h3>
                    <p className="mt-1 text-sm font-bold text-pbm-glow">{maquina.idMaquina}</p>
                    <p className="mt-1 break-words text-sm text-pbm-muted">{maquina.empresa}</p>
                  </div>
                  <div className="shrink-0 rounded-lg border border-pbm-blue/30 bg-pbm-blue/10 px-3 py-2 text-right shadow-glow">
                    {inventoryUnlocked ? (
                      <>
                        <p className="text-lg font-black leading-none text-pbm-glow">{maquina.capacidadLitros ?? 0}</p>
                        <p className="text-[0.62rem] font-bold uppercase text-pbm-muted">Litros</p>
                      </>
                    ) : (
                      <>
                        <LockKeyhole className="ml-auto text-pbm-orange" size={18} aria-hidden="true" />
                        <p className="text-[0.62rem] font-bold uppercase text-pbm-muted">Protegido</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone={maquina.estado === 'Activa' ? 'green' : 'yellow'}>{maquina.estado}</StatusBadge>
                  <PriorityBadge priority={maquina.prioridadServicio} />
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-pbm-border/80 bg-pbm-bg/45 p-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
                  <div>
                    <p className="text-pbm-muted">Producto</p>
                    <p className="font-black text-pbm-text">{inventoryUnlocked ? maquina.producto : 'Protegido'}</p>
                  </div>
                  <div>
                    <p className="text-pbm-muted">Ubicacion</p>
                    <p className="font-black text-pbm-text">{maquina.ubicacionArea || 'Sin dato'}</p>
                  </div>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}

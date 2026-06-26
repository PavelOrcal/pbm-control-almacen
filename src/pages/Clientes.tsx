import { Building2, MapPin, Search, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ClientLogo } from '../components/ClientLogo';
import { DataCard } from '../components/DataCard';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { PriorityBadge, StatusBadge } from '../components/StatusBadge';
import { usePbmData } from '../hooks/usePbmData';
import { countClienteMaquinas, formatDate, getClienteNextService, inputClassName } from '../lib/pageHelpers';

export default function Clientes() {
  const { data, isLoading, error } = usePbmData();
  const [query, setQuery] = useState('');

  const clientes = useMemo(() => {
    if (!data) return [];
    const search = query.trim().toLowerCase();
    return data.clientes.filter((cliente) =>
      [cliente.empresa, cliente.ciudad, cliente.tipoCliente, cliente.idCliente].join(' ').toLowerCase().includes(search)
    );
  }, [data, query]);

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Error desconocido'} />;

  const activos = clientes.filter((cliente) => cliente.activo === 'SI').length;

  return (
    <div className="screen-fade space-y-5">
      <section className="hero-panel rounded-2xl p-5 lg:p-6">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-pbm-glow">Directorio operativo</p>
            <h2 className="mt-2 text-3xl font-black text-pbm-text lg:text-5xl">Clientes</h2>
            <p className="mt-2 max-w-2xl text-sm text-pbm-muted">Vista ejecutiva de cartera, ubicacion, prioridad y proximo servicio.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center lg:w-80">
            <div className="rounded-xl border border-pbm-blue/30 bg-pbm-bg/65 p-3">
              <UsersRound className="mx-auto text-pbm-glow" size={18} aria-hidden="true" />
              <p className="mt-2 text-2xl font-black text-pbm-text">{clientes.length}</p>
              <p className="text-[0.65rem] text-pbm-muted">Filtrados</p>
            </div>
            <div className="rounded-xl border border-pbm-green/30 bg-pbm-green/10 p-3">
              <Building2 className="mx-auto text-pbm-green" size={18} aria-hidden="true" />
              <p className="mt-2 text-2xl font-black text-pbm-text">{activos}</p>
              <p className="text-[0.65rem] text-pbm-muted">Activos</p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel-card rounded-2xl p-3 lg:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pbm-muted" size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={`${inputClassName} pl-10`}
            placeholder="Buscar cliente, ciudad, giro o ID"
          />
        </div>
      </section>

      {clientes.length === 0 ? <EmptyState label="No hay clientes para este filtro." /> : null}

      <section className="section-grid">
        {clientes.map((cliente) => {
          const nextService = getClienteNextService(cliente, data.servicios);
          return (
            <DataCard
              key={cliente.idCliente}
              title={cliente.empresa}
              subtitle={`${cliente.ciudad} / ${cliente.tipoCliente}`}
              leading={<ClientLogo empresa={cliente.empresa} logoCliente={cliente.logoCliente} size="md" />}
              to={`/clientes/${cliente.idCliente}`}
              accent={cliente.prioridad === 'Critica' ? 'red' : cliente.prioridad === 'Alta' ? 'orange' : 'blue'}
              meta={
                <>
                  <PriorityBadge priority={cliente.prioridad} />
                  <StatusBadge tone={cliente.estadoCliente === 'Activo' ? 'green' : 'neutral'}>{cliente.estadoCliente}</StatusBadge>
                </>
              }
            >
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-pbm-border/70 bg-pbm-bg/40 p-3">
                  <p className="text-pbm-muted">Maquinas</p>
                  <p className="font-black text-pbm-text">{countClienteMaquinas(cliente, data.maquinas)}</p>
                </div>
                <div className="rounded-lg border border-pbm-border/70 bg-pbm-bg/40 p-3">
                  <p className="text-pbm-muted">Proximo servicio</p>
                  <p className="font-black text-pbm-text">{formatDate(nextService?.fechaProgramada)}</p>
                </div>
                <div className="col-span-2 flex items-center gap-2 rounded-lg border border-pbm-blue/25 bg-pbm-blue/10 p-3">
                  <MapPin size={15} className="text-pbm-glow" aria-hidden="true" />
                  <span className="font-bold text-pbm-muted">{cliente.ciudad || 'Sin ciudad'}</span>
                </div>
              </div>
            </DataCard>
          );
        })}
      </section>
    </div>
  );
}

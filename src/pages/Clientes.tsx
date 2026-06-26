import { Search } from 'lucide-react';
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

  return (
    <div className="screen-fade space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pbm-muted" size={18} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={`${inputClassName} pl-10`}
          placeholder="Buscar cliente"
        />
      </div>

      {clientes.length === 0 ? <EmptyState label="No hay clientes para este filtro." /> : null}

      <section className="space-y-3">
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
                <div>
                  <p className="text-pbm-muted">Maquinas</p>
                  <p className="font-black text-pbm-text">{countClienteMaquinas(cliente, data.maquinas)}</p>
                </div>
                <div>
                  <p className="text-pbm-muted">Proximo servicio</p>
                  <p className="font-black text-pbm-text">{formatDate(nextService?.fechaProgramada)}</p>
                </div>
              </div>
            </DataCard>
          );
        })}
      </section>
    </div>
  );
}

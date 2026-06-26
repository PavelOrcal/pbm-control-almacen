import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { SecondaryButton } from '../components/FormControls';
import { OfflineSyncCard } from '../components/OfflineSyncCard';
import { ErrorState, LoadingState } from '../components/States';
import { StatusBadge } from '../components/StatusBadge';
import { PBM_DATA_QUERY_KEY, usePbmData } from '../hooks/usePbmData';
import { useAuth } from '../lib/auth';
import { hasInventoryAccess, protectedInventoryLabel } from '../lib/inventoryAccess';
import { SHEET_ID, SHEET_NAME } from '../lib/sheetSchema';

function SyncLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-b border-pbm-border/60 py-3 last:border-b-0">
      <p className="text-xs font-bold uppercase tracking-normal text-pbm-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-pbm-text">{value}</p>
    </div>
  );
}

export default function SyncStatus() {
  const { data, isLoading, error, isFetching } = usePbmData();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const inventoryUnlocked = hasInventoryAccess();

  if (isLoading) {
    return (
      <div className="screen-fade space-y-5">
        <OfflineSyncCard showEntries />
        <LoadingState />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="screen-fade space-y-5">
        <OfflineSyncCard showEntries />
        <ErrorState message={error instanceof Error ? error.message : 'Error desconocido'} />
      </div>
    );
  }

  return (
    <div className="screen-fade space-y-5">
      <section className="premium-card rounded-lg p-4" data-accent={data.sync.apiUrlConfigured ? 'green' : 'yellow'}>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-pbm-glow">{SHEET_NAME}</p>
        <h2 className="mt-1 text-xl font-black text-pbm-text">Sincronizacion</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge tone={data.sync.source === 'apps-script' ? 'green' : 'yellow'}>
            {data.sync.source === 'apps-script' ? 'Apps Script' : 'Mock temporal'}
          </StatusBadge>
          <StatusBadge tone={data.sync.apiUrlConfigured ? 'green' : 'red'}>
            VITE_API_URL {data.sync.apiUrlConfigured ? 'configurado' : 'pendiente'}
          </StatusBadge>
        </div>
      </section>

      <OfflineSyncCard showEntries />

      <section className="panel-card rounded-lg px-4">
        <SyncLine label="Sheet ID" value={SHEET_ID} />
        <SyncLine label="Usuario activo" value={user ? `${user.username} / ${user.role}` : 'Sin sesion'} />
        <SyncLine label="Ultima carga" value={new Date(data.sync.loadedAt).toLocaleString('es-MX')} />
        <SyncLine label="Clientes" value={data.clientes.length} />
        <SyncLine label="Maquinas" value={data.maquinas.length} />
        <SyncLine label="Servicios" value={data.servicios.length} />
        <SyncLine label="Productos" value={protectedInventoryLabel(inventoryUnlocked, data.productos.length)} />
        <SyncLine label="Articulos bodega" value={protectedInventoryLabel(inventoryUnlocked, data.stockBodega.length)} />
      </section>

      <SecondaryButton
        disabled={isFetching}
        onClick={() => queryClient.invalidateQueries({ queryKey: PBM_DATA_QUERY_KEY })}
        className="gap-2"
      >
        <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} aria-hidden="true" />
        {isFetching ? 'Actualizando...' : 'Actualizar datos'}
      </SecondaryButton>

      <section className="panel-card rounded-lg p-4 text-sm text-pbm-muted">
        <p className="font-bold text-pbm-text">Conexion pendiente de despliegue</p>
        <p className="mt-2">
          Cuando pegues la URL del Web App de Apps Script en <span className="font-mono text-pbm-glow">VITE_API_URL</span>, la app dejara de usar mock temporal.
        </p>
      </section>
    </div>
  );
}

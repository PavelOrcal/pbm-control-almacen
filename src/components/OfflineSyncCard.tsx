import { AlertTriangle, Clock3, RefreshCw, Trash2, Wifi, WifiOff } from 'lucide-react';
import { SecondaryButton } from './FormControls';
import { StatusBadge } from './StatusBadge';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import type { OfflineActionType, OfflineQueueEntry } from '../lib/offlineQueue';

const actionLabels: Record<OfflineActionType, string> = {
  updateServicio: 'Actualizar servicio',
  markServicioRealizado: 'Marcar servicio realizado',
  markServicioDeleted: 'Eliminar servicio activo',
  markHistorialServicioDeleted: 'Eliminar realizado'
};

function formatSyncDate(value: string | null): string {
  if (!value) return 'Sin sincronizaciones';
  return new Date(value).toLocaleString('es-MX');
}

function entryTarget(entry: OfflineQueueEntry): string {
  const payload = entry.payload as Record<string, unknown>;
  return String(payload.idServicio ?? payload.idHistorialServicio ?? entry.context?.targetId ?? 'Sin ID');
}

function entryHasPhotos(entry: OfflineQueueEntry): boolean {
  const payload = entry.payload as Record<string, unknown>;
  const photos = payload.fotosServicio as Record<string, unknown> | undefined;
  return Boolean(photos && Object.values(photos).some(Boolean));
}

export function OfflineSyncManager() {
  useOfflineQueue({ autoSync: true });
  return null;
}

export function OfflineSyncCard({ showEntries = false, compact = false }: { showEntries?: boolean; compact?: boolean }) {
  const { isOnline, summary, entries, isSyncing, lastResult, syncNow, discardAction } = useOfflineQueue();
  const accent = !isOnline ? 'red' : summary.errorCount > 0 ? 'orange' : summary.totalActive > 0 ? 'yellow' : 'green';
  const Icon = isOnline ? Wifi : WifiOff;

  if (compact) {
    return (
      <section className="panel-card rounded-lg px-3 py-2.5" data-accent={accent}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-pbm-blue/35 bg-pbm-blue/10 text-pbm-glow shadow-glow">
            <Icon size={18} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-pbm-text">{isOnline ? 'Online' : 'Sin conexion'}</p>
            <p className="truncate text-[0.7rem] font-semibold text-pbm-muted">{summary.totalActive} pendiente(s) / {formatSyncDate(summary.lastSyncAt)}</p>
          </div>
          <button
            type="button"
            disabled={isSyncing || (!isOnline && summary.totalActive === 0)}
            onClick={() => void syncNow()}
            className="pressable inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-pbm-blue/45 bg-pbm-blue/10 px-3 text-xs font-black text-pbm-glow disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSyncing ? 'Sync...' : 'Sync'}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="premium-card rounded-lg p-4" data-accent={accent}>
      <div className="flex items-start gap-3">
        <div className="rounded-lg border border-pbm-blue/35 bg-pbm-blue/10 p-3 text-pbm-glow shadow-glow">
          <Icon size={22} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-pbm-muted">Sincronizacion offline</p>
          <h3 className="mt-1 text-xl font-black text-pbm-text">{isOnline ? 'Online' : 'Sin conexion'}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge tone={isOnline ? 'green' : 'red'}>{isOnline ? 'Online' : 'Offline'}</StatusBadge>
            <StatusBadge tone={summary.totalActive > 0 ? 'yellow' : 'green'}>{summary.totalActive} pendiente(s)</StatusBadge>
            {summary.errorCount > 0 ? <StatusBadge tone="red">{summary.errorCount} error(es)</StatusBadge> : null}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-pbm-border/70 bg-pbm-bg/45 p-3">
          <p className="text-pbm-muted">Pendientes por sincronizar</p>
          <p className="metric-value mt-1 text-2xl font-black text-pbm-text">{summary.totalActive}</p>
        </div>
        <div className="rounded-lg border border-pbm-border/70 bg-pbm-bg/45 p-3">
          <p className="text-pbm-muted">Ultima sincronizacion</p>
          <p className="mt-1 text-xs font-black text-pbm-text">{formatSyncDate(summary.lastSyncAt)}</p>
        </div>
      </div>

      {lastResult ? (
        <p className="mt-3 rounded-lg border border-pbm-border/70 bg-pbm-bg/45 p-3 text-sm font-bold text-pbm-muted">
          {lastResult.message}
        </p>
      ) : null}

      <SecondaryButton type="button" disabled={isSyncing || (!isOnline && summary.totalActive === 0)} onClick={() => void syncNow()} className="mt-4 gap-2">
        <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} aria-hidden="true" />
        {isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
      </SecondaryButton>

      {showEntries && entries.length > 0 ? (
        <div className="mt-4 space-y-3">
          {entries.slice(0, 6).map((entry) => (
            <div key={entry.id} className="rounded-lg border border-pbm-border/70 bg-pbm-bg/45 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-pbm-text">{actionLabels[entry.action]}</p>
                  <p className="mt-1 text-xs text-pbm-muted">Servicio: {entryTarget(entry)}</p>
                  <p className="mt-1 text-xs text-pbm-muted">{new Date(entry.createdAt).toLocaleString('es-MX')} / {entry.status} / intento {entry.attempts}</p>
                </div>
                {entry.status === 'error' ? <AlertTriangle className="shrink-0 text-pbm-red" size={18} aria-hidden="true" /> : <Clock3 className="shrink-0 text-pbm-yellow" size={18} aria-hidden="true" />}
              </div>
              {entryHasPhotos(entry) ? <p className="mt-2 rounded-md border border-pbm-blue/30 bg-pbm-blue/10 px-2 py-1 text-xs font-black text-pbm-glow">Error al subir evidencia fotografica</p> : null}
              {entry.error ? <p className="mt-2 whitespace-pre-line text-xs font-bold leading-relaxed text-pbm-red">{entry.error}</p> : null}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void syncNow()}
                  className="pressable inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-pbm-blue/40 bg-pbm-blue/10 px-3 text-xs font-black text-pbm-glow"
                >
                  <RefreshCw size={14} aria-hidden="true" />
                  Reintentar
                </button>
                <button
                  type="button"
                  onClick={() => void discardAction(entry.id)}
                  className="pressable inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-pbm-red/40 bg-pbm-red/10 px-3 text-xs font-black text-pbm-red"
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Descartar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

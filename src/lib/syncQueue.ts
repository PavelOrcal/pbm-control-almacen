import {
  deleteOfflineQueueEntry,
  getActiveOfflineQueueEntries,
  setLastOfflineSyncAt,
  updateOfflineQueueEntry,
  type OfflineQueueEntry
} from './offlineQueue';
import {
  fetchPbmData,
  markHistorialServicioDeleted,
  markServicioDeleted,
  markServicioRealizado,
  updateServicio
} from './api';
import { deleteServicePhotoDraft } from './servicePhotos';
import type { PbmData, ServicioRealizadoInput, ServicioUpdateInput } from '../types/pbm';

export interface SyncQueueResult {
  synced: number;
  failed: number;
  remaining: number;
  message: string;
}

let activeSync: Promise<SyncQueueResult> | null = null;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function comparable(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(value);
  return String(value).trim();
}

function snapshotChanged(current: Record<string, unknown>, snapshot: Record<string, unknown>): boolean {
  return Object.entries(snapshot).some(([key, expected]) => comparable(current[key]) !== comparable(expected));
}

function getCurrentTarget(entry: OfflineQueueEntry, data: PbmData): Record<string, unknown> | null {
  if (!entry.context) return null;
  if (entry.context.targetType === 'historialServicio') {
    return data.historialServicios.find((item) => item.idHistorialServicio === entry.context?.targetId) as unknown as Record<string, unknown> | undefined ?? null;
  }
  return data.servicios.find((item) => item.idServicio === entry.context?.targetId) as unknown as Record<string, unknown> | undefined ?? null;
}

function validateConflict(entry: OfflineQueueEntry, data: PbmData): void {
  if (!entry.context) return;
  const current = getCurrentTarget(entry, data);
  if (!current) {
    throw new Error(`Conflicto: el registro ${entry.context.targetId} ya no existe o fue eliminado en Google Sheet. Revisa el historial antes de reintentar.`);
  }
  if (entry.context.snapshot && snapshotChanged(current, entry.context.snapshot)) {
    throw new Error(`Conflicto: el registro ${entry.context.targetId} cambio en Google Sheet antes de sincronizar. Revisa el dato actual y descarta o captura nuevamente.`);
  }
}

async function executeEntry(entry: OfflineQueueEntry): Promise<void> {
  if (entry.action === 'updateServicio') {
    await updateServicio(entry.payload as unknown as ServicioUpdateInput);
    return;
  }
  if (entry.action === 'markServicioRealizado') {
    const input = entry.payload as unknown as ServicioRealizadoInput;
    await markServicioRealizado(input);
    await deleteServicePhotoDraft(input.idServicio);
    return;
  }
  if (entry.action === 'markServicioDeleted') {
    await markServicioDeleted(String((entry.payload as { idServicio?: string }).idServicio ?? ''));
    return;
  }
  if (entry.action === 'markHistorialServicioDeleted') {
    await markHistorialServicioDeleted(String((entry.payload as { idHistorialServicio?: string }).idHistorialServicio ?? ''));
  }
}

async function runSync(): Promise<SyncQueueResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const entries = await getActiveOfflineQueueEntries();
    return {
      synced: 0,
      failed: 0,
      remaining: entries.length,
      message: 'Sin conexion. Las acciones quedan guardadas hasta que vuelva internet.'
    };
  }

  const entries = await getActiveOfflineQueueEntries();
  if (entries.length === 0) {
    return { synced: 0, failed: 0, remaining: 0, message: 'No hay acciones pendientes por sincronizar.' };
  }

  let currentData: PbmData;
  try {
    currentData = await fetchPbmData();
  } catch (error) {
    return {
      synced: 0,
      failed: entries.length,
      remaining: entries.length,
      message: `No se pudo leer Google Sheet para sincronizar. ${errorMessage(error)}`
    };
  }

  let synced = 0;
  let failed = 0;

  for (const entry of entries) {
    const syncingEntry: OfflineQueueEntry = {
      ...entry,
      status: 'sincronizando',
      attempts: entry.attempts + 1,
      error: undefined
    };
    await updateOfflineQueueEntry(syncingEntry);

    try {
      validateConflict(entry, currentData);
      await executeEntry(entry);
      await deleteOfflineQueueEntry(entry.id);
      synced += 1;
    } catch (error) {
      failed += 1;
      await updateOfflineQueueEntry({
        ...entry,
        attempts: entry.attempts + 1,
        status: 'error',
        error: errorMessage(error)
      });
    }
  }

  if (synced > 0) await setLastOfflineSyncAt();
  const remaining = (await getActiveOfflineQueueEntries()).length;
  return {
    synced,
    failed,
    remaining,
    message: failed > 0
      ? `Sincronizacion parcial: ${synced} accion(es) sincronizada(s), ${failed} con error.`
      : `Sincronizacion completada: ${synced} accion(es) aplicada(s).`
  };
}

export function syncOfflineQueue(): Promise<SyncQueueResult> {
  if (activeSync) return activeSync;
  activeSync = runSync().finally(() => {
    activeSync = null;
  });
  return activeSync;
}

import type { HistorialServicio, PbmData, Servicio } from '../types/pbm';

export type OfflineActionType =
  | 'updateServicio'
  | 'markServicioRealizado'
  | 'markServicioDeleted'
  | 'markHistorialServicioDeleted';

export type OfflineActionStatus = 'pendiente' | 'sincronizando' | 'error' | 'sincronizado';

export interface OfflineActionContext {
  targetType: 'servicio' | 'historialServicio';
  targetId: string;
  snapshot?: Record<string, unknown>;
}

export interface OfflineQueueEntry<TPayload = Record<string, unknown>> {
  id: string;
  dedupeKey: string;
  createdAt: string;
  updatedAt: string;
  user: string;
  action: OfflineActionType;
  payload: TPayload;
  status: OfflineActionStatus;
  attempts: number;
  error?: string;
  context?: OfflineActionContext;
}

export interface OfflineQueueSummary {
  pendingCount: number;
  syncingCount: number;
  errorCount: number;
  totalActive: number;
  lastSyncAt: string | null;
}

interface QueueMeta {
  key: string;
  value: string;
}

const DB_NAME = 'pbm-control-offline-v2';
const DB_VERSION = 1;
const QUEUE_STORE = 'queue';
const META_STORE = 'meta';
const LAST_SYNC_KEY = 'lastSyncAt';

export const OFFLINE_QUEUE_CHANGED_EVENT = 'pbm-offline-queue-changed';
export const OFFLINE_ACTION_QUEUED_MESSAGE = 'Acción guardada sin conexión. Se sincronizará cuando vuelva internet.';

let dbPromise: Promise<IDBDatabase> | null = null;

function canUseIndexedDb(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Error de IndexedDB'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Error de transaccion IndexedDB'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Transaccion IndexedDB abortada'));
  });
}

function openDb(): Promise<IDBDatabase> {
  if (!canUseIndexedDb()) return Promise.reject(new Error('IndexedDB no esta disponible en este navegador.'));
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const store = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('dedupeKey', 'dedupeKey', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('No se pudo abrir IndexedDB'));
  });

  return dbPromise;
}

function notifyQueueChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OFFLINE_QUEUE_CHANGED_EVENT));
}

function nowIso(): string {
  return new Date().toISOString();
}

function stablePayload(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return JSON.stringify(payload);
  const source = payload as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};
  Object.keys(source).sort().forEach((key) => {
    if (key === 'fotosServicio') {
      const photos = source[key] as Record<string, { capturedAt?: string; sizeBytes?: number } | undefined> | undefined;
      sanitized[key] = photos
        ? Object.entries(photos).map(([photoKey, value]) => `${photoKey}:${value?.capturedAt ?? ''}:${value?.sizeBytes ?? ''}`).join('|')
        : '';
      return;
    }
    sanitized[key] = source[key];
  });
  return JSON.stringify(sanitized);
}

function activeStatus(status: OfflineActionStatus): boolean {
  return status === 'pendiente' || status === 'sincronizando' || status === 'error';
}

function serviceSnapshot(servicio: Servicio): Record<string, unknown> {
  return {
    idServicio: servicio.idServicio,
    fechaProgramada: servicio.fechaProgramada,
    observacionesServicio: servicio.observacionesServicio ?? '',
    litrosUsados: servicio.litrosUsados ?? null,
    productoUsado: servicio.productoUsado ?? '',
    responsable: servicio.responsable ?? '',
    fechaRealizado: servicio.fechaRealizado ?? '',
    eliminado: servicio.eliminado ?? 'NO'
  };
}

function historialSnapshot(historial: HistorialServicio): Record<string, unknown> {
  return {
    idHistorialServicio: historial.idHistorialServicio,
    idServicio: historial.idServicio,
    fechaProgramada: historial.fechaProgramada,
    fechaRealizado: historial.fechaRealizado,
    productoUsado: historial.productoUsado ?? '',
    litrosUsados: historial.litrosUsados ?? null,
    responsable: historial.responsable ?? '',
    observacionesServicio: historial.observacionesServicio ?? '',
    fotosServicio: historial.fotosServicio ?? '',
    fotoAntes: historial.fotoAntes ?? '',
    fotoDespues: historial.fotoDespues ?? '',
    fotoEvidencia: historial.fotoEvidencia ?? '',
    carpetaDrive: historial.carpetaDrive ?? '',
    pdfServicio: historial.pdfServicio ?? '',
    eliminado: historial.eliminado ?? 'NO'
  };
}

export function buildOfflineActionContext(
  action: OfflineActionType,
  payload: Record<string, unknown>,
  data: PbmData | undefined
): OfflineActionContext | undefined {
  if (action === 'markHistorialServicioDeleted') {
    const targetId = String(payload.idHistorialServicio ?? '');
    if (!targetId) return undefined;
    const historial = data?.historialServicios.find((item) => item.idHistorialServicio === targetId);
    return {
      targetType: 'historialServicio',
      targetId,
      snapshot: historial ? historialSnapshot(historial) : undefined
    };
  }

  const targetId = String(payload.idServicio ?? '');
  if (!targetId) return undefined;
  const servicio = data?.servicios.find((item) => item.idServicio === targetId);
  return {
    targetType: 'servicio',
    targetId,
    snapshot: servicio ? serviceSnapshot(servicio) : undefined
  };
}

export function buildDedupeKey(action: OfflineActionType, payload: Record<string, unknown>): string {
  const id =
    payload.idServicio ??
    payload.idHistorialServicio ??
    payload.idMovimiento ??
    payload.idMovimientoProducto ??
    'sin-id';
  if (action === 'markServicioRealizado') {
    return `${action}:${String(id)}:${String(payload.fechaRealizado ?? '')}`;
  }
  return `${action}:${String(id)}:${stablePayload(payload)}`;
}

export async function getOfflineQueueEntries(): Promise<OfflineQueueEntry[]> {
  const db = await openDb();
  const transaction = db.transaction(QUEUE_STORE, 'readonly');
  const store = transaction.objectStore(QUEUE_STORE);
  const entries = await requestToPromise<OfflineQueueEntry[]>(store.getAll());
  return entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getActiveOfflineQueueEntries(): Promise<OfflineQueueEntry[]> {
  const entries = await getOfflineQueueEntries();
  return entries.filter((entry) => activeStatus(entry.status));
}

export async function enqueueOfflineAction<TPayload extends Record<string, unknown>>({
  action,
  payload,
  user,
  context,
  status = 'pendiente',
  error
}: {
  action: OfflineActionType;
  payload: TPayload;
  user: string;
  context?: OfflineActionContext;
  status?: OfflineActionStatus;
  error?: string;
}): Promise<{ entry: OfflineQueueEntry<TPayload>; duplicate: boolean }> {
  const db = await openDb();
  const dedupeKey = buildDedupeKey(action, payload);
  const existing = (await getOfflineQueueEntries()).find((entry) => activeStatus(entry.status) && entry.dedupeKey === dedupeKey);
  if (existing) return { entry: existing as OfflineQueueEntry<TPayload>, duplicate: true };

  const timestamp = nowIso();
  const entry: OfflineQueueEntry<TPayload> = {
    id: `oq-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    dedupeKey,
    createdAt: timestamp,
    updatedAt: timestamp,
    user,
    action,
    payload,
    status,
    attempts: 0,
    error,
    context
  };

  const transaction = db.transaction(QUEUE_STORE, 'readwrite');
  transaction.objectStore(QUEUE_STORE).put(entry);
  await transactionDone(transaction);
  notifyQueueChanged();
  return { entry, duplicate: false };
}

export async function updateOfflineQueueEntry(entry: OfflineQueueEntry): Promise<void> {
  const db = await openDb();
  const transaction = db.transaction(QUEUE_STORE, 'readwrite');
  transaction.objectStore(QUEUE_STORE).put({ ...entry, updatedAt: nowIso() });
  await transactionDone(transaction);
  notifyQueueChanged();
}

export async function deleteOfflineQueueEntry(id: string): Promise<void> {
  const db = await openDb();
  const transaction = db.transaction(QUEUE_STORE, 'readwrite');
  transaction.objectStore(QUEUE_STORE).delete(id);
  await transactionDone(transaction);
  notifyQueueChanged();
}

export async function setLastOfflineSyncAt(value = nowIso()): Promise<void> {
  const db = await openDb();
  const transaction = db.transaction(META_STORE, 'readwrite');
  transaction.objectStore(META_STORE).put({ key: LAST_SYNC_KEY, value } satisfies QueueMeta);
  await transactionDone(transaction);
  notifyQueueChanged();
}

export async function getLastOfflineSyncAt(): Promise<string | null> {
  const db = await openDb();
  const transaction = db.transaction(META_STORE, 'readonly');
  const result = await requestToPromise<QueueMeta | undefined>(transaction.objectStore(META_STORE).get(LAST_SYNC_KEY));
  return result?.value ?? null;
}

export async function getOfflineQueueSummary(): Promise<OfflineQueueSummary> {
  const [entries, lastSyncAt] = await Promise.all([getOfflineQueueEntries(), getLastOfflineSyncAt()]);
  const pendingCount = entries.filter((entry) => entry.status === 'pendiente').length;
  const syncingCount = entries.filter((entry) => entry.status === 'sincronizando').length;
  const errorCount = entries.filter((entry) => entry.status === 'error').length;
  return {
    pendingCount,
    syncingCount,
    errorCount,
    totalActive: pendingCount + syncingCount + errorCount,
    lastSyncAt
  };
}

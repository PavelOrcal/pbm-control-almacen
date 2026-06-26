export type ServicePhotoKind = 'antes' | 'despues' | 'evidencia';

export interface ServicePhotoDraft {
  kind: ServicePhotoKind;
  label: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  sizeBytes: number;
  capturedAt: string;
}

export type ServicePhotoDraftMap = Partial<Record<ServicePhotoKind, ServicePhotoDraft>>;

export const SERVICE_PHOTO_LABELS: Record<ServicePhotoKind, string> = {
  antes: 'Foto antes',
  despues: 'Foto despues',
  evidencia: 'Foto evidencia'
};

const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.78;
const PHOTO_DB_NAME = 'pbm-control-service-photo-drafts-v1';
const PHOTO_DB_VERSION = 1;
const PHOTO_STORE = 'servicePhotoDrafts';

interface ServicePhotoDraftRecord {
  idServicio: string;
  photos: ServicePhotoDraftMap;
  updatedAt: string;
}

let photoDbPromise: Promise<IDBDatabase> | null = null;

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

function openPhotoDb(): Promise<IDBDatabase> {
  if (!canUseIndexedDb()) return Promise.reject(new Error('IndexedDB no esta disponible para guardar fotos temporales.'));
  if (photoDbPromise) return photoDbPromise;

  photoDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(PHOTO_DB_NAME, PHOTO_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: 'idServicio' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('No se pudo abrir IndexedDB de fotos.'));
  });

  return photoDbPromise;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
    image.src = dataUrl;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo cargar el archivo de imagen.'));
    reader.readAsDataURL(file);
  });
}

function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.round((base64.length * 3) / 4);
}

export async function compressServicePhoto(file: File, kind: ServicePhotoKind): Promise<ServicePhotoDraft> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecciona un archivo de imagen valido.');
  }

  const sourceDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(sourceDataUrl);
  const scale = image.width > MAX_WIDTH ? MAX_WIDTH / image.width : 1;
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No se pudo preparar la compresion de imagen.');
  context.drawImage(image, 0, 0, width, height);

  const dataUrl = canvasToDataUrl(canvas);
  const safeStem = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 36) || kind;

  return {
    kind,
    label: SERVICE_PHOTO_LABELS[kind],
    fileName: `${safeStem}.jpg`,
    mimeType: 'image/jpeg',
    dataUrl,
    sizeBytes: dataUrlBytes(dataUrl),
    capturedAt: new Date().toISOString()
  };
}

export function hasServicePhotos(photos: ServicePhotoDraftMap | null | undefined): boolean {
  return Boolean(photos && Object.values(photos).some(Boolean));
}

export async function saveServicePhotoDraft(idServicio: string, photos: ServicePhotoDraftMap): Promise<void> {
  if (!idServicio) return;
  const db = await openPhotoDb();
  const transaction = db.transaction(PHOTO_STORE, 'readwrite');
  if (hasServicePhotos(photos)) {
    transaction.objectStore(PHOTO_STORE).put({
      idServicio,
      photos,
      updatedAt: new Date().toISOString()
    } satisfies ServicePhotoDraftRecord);
  } else {
    transaction.objectStore(PHOTO_STORE).delete(idServicio);
  }
  await transactionDone(transaction);
}

export async function loadServicePhotoDraft(idServicio: string): Promise<ServicePhotoDraftMap> {
  if (!idServicio) return {};
  const db = await openPhotoDb();
  const transaction = db.transaction(PHOTO_STORE, 'readonly');
  const result = await requestToPromise<ServicePhotoDraftRecord | undefined>(transaction.objectStore(PHOTO_STORE).get(idServicio));
  return result?.photos ?? {};
}

export async function deleteServicePhotoDraft(idServicio: string): Promise<void> {
  if (!idServicio) return;
  const db = await openPhotoDb();
  const transaction = db.transaction(PHOTO_STORE, 'readwrite');
  transaction.objectStore(PHOTO_STORE).delete(idServicio);
  await transactionDone(transaction);
}

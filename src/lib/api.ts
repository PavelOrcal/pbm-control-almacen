import { mockData } from './mockData';
import { toNumber } from './formatters';
import type {
  ArticuloBodega,
  Cliente,
  HistorialServicio,
  Maquina,
  MovimientoBodega,
  MovimientoBodegaInput,
  MovimientoProducto,
  MovimientoProductoInput,
  PbmData,
  Producto,
  ServicioRealizadoInput,
  ServicioCreateInput,
  Servicio,
  ServicioUpdateInput
} from '../types/pbm';
import { activeHistorialServicios, activeMovimientosBodega, activeMovimientosProducto, activeServicios } from './records';

const API_URL = import.meta.env.VITE_API_URL?.trim();
const JSONP_TIMEOUT_MS = 20000;

export interface PushTokenInput {
  usuario: string;
  rol: string;
  token: string;
  dispositivo: string;
  navegador: string;
  activo?: 'SI' | 'NO' | string;
}

export interface PushBackendRecentError {
  fechaHora?: string;
  usuario?: string;
  tipo?: string;
  cliente?: string;
  estado?: string;
  error?: string;
  actionUrl?: string;
}

export interface PushBackendStatus {
  pushTokensConfigured?: boolean;
  pushLogsConfigured?: boolean;
  activeTokens: number;
  lastSentAt: string;
  lastSentType: string;
  recentErrors: PushBackendRecentError[];
  recentLogCount: number;
}

let mockStore: PbmData = cloneData(mockData);

function cloneData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

function rowValue(row: Record<string, unknown>, header: string, key: string): string {
  const value = row[key] ?? row[header] ?? '';
  if (value === null || value === undefined) return '';
  return String(value);
}

function normalizeCliente(row: Record<string, unknown>): Cliente {
  return {
    idCliente: rowValue(row, 'ID Cliente', 'idCliente'),
    empresa: rowValue(row, 'Empresa', 'empresa'),
    ciudad: rowValue(row, 'Ciudad', 'ciudad'),
    activo: rowValue(row, 'Activo', 'activo'),
    frecuenciaDias: toNumber(row['frecuenciaDias'] ?? row['Frecuencia Dias']),
    logoCliente: rowValue(row, 'Logo Cliente', 'logoCliente'),
    tipoCliente: rowValue(row, 'Tipo Cliente', 'tipoCliente'),
    prioridad: rowValue(row, 'Prioridad', 'prioridad'),
    estadoCliente: rowValue(row, 'Estado Cliente', 'estadoCliente')
  };
}

function normalizeMaquina(row: Record<string, unknown>): Maquina {
  return {
    idMaquina: rowValue(row, 'ID Maquina', 'idMaquina'),
    idCliente: rowValue(row, 'ID Cliente', 'idCliente'),
    empresa: rowValue(row, 'Empresa', 'empresa'),
    modelo: rowValue(row, 'Modelo', 'modelo'),
    capacidadLitros: toNumber(row['capacidadLitros'] ?? row['Capacidad Litros']),
    idProducto: rowValue(row, 'ID Producto', 'idProducto'),
    producto: rowValue(row, 'Producto', 'producto'),
    estado: rowValue(row, 'Estado', 'estado'),
    observaciones: rowValue(row, 'Observaciones', 'observaciones'),
    fotoMaquina: rowValue(row, 'Foto Maquina', 'fotoMaquina'),
    ubicacionArea: rowValue(row, 'Ubicacion Area', 'ubicacionArea'),
    prioridadServicio: rowValue(row, 'Prioridad Servicio', 'prioridadServicio')
  };
}

function normalizeServicio(row: Record<string, unknown>): Servicio {
  return {
    idServicio: rowValue(row, 'ID Servicio', 'idServicio'),
    fechaProgramada: rowValue(row, 'Fecha Programada', 'fechaProgramada'),
    idCliente: rowValue(row, 'ID Cliente', 'idCliente'),
    cliente: rowValue(row, 'Cliente', 'cliente'),
    idMaquina: rowValue(row, 'ID Maquina', 'idMaquina'),
    modelo: rowValue(row, 'Modelo', 'modelo'),
    tipoServicio: rowValue(row, 'Tipo Servicio', 'tipoServicio') || 'Servicio maquina',
    idProducto: rowValue(row, 'ID Producto', 'idProducto'),
    producto: rowValue(row, 'Producto', 'producto'),
    litrosEstimados: toNumber(row['litrosEstimados'] ?? row['Litros Estimados']),
    litrosUsados: toNumber(row['litrosUsados'] ?? row['Litros Usados']),
    productoUsado: rowValue(row, 'Producto Usado', 'productoUsado'),
    responsable: rowValue(row, 'Responsable', 'responsable'),
    observacionesServicio: rowValue(row, 'Observaciones Servicio', 'observacionesServicio'),
    fechaRealizado: rowValue(row, 'Fecha Realizado', 'fechaRealizado'),
    eliminado: rowValue(row, 'Eliminado', 'eliminado') || 'NO'
  };
}

function normalizeHistorialServicio(row: Record<string, unknown>): HistorialServicio {
  return {
    idHistorialServicio: rowValue(row, 'ID Historial Servicio', 'idHistorialServicio'),
    idServicio: rowValue(row, 'ID Servicio', 'idServicio'),
    fechaProgramada: rowValue(row, 'Fecha Programada', 'fechaProgramada'),
    fechaRealizado: rowValue(row, 'Fecha Realizado', 'fechaRealizado'),
    idCliente: rowValue(row, 'ID Cliente', 'idCliente'),
    cliente: rowValue(row, 'Cliente', 'cliente'),
    idMaquina: rowValue(row, 'ID Maquina', 'idMaquina'),
    modelo: rowValue(row, 'Modelo', 'modelo'),
    tipoServicio: rowValue(row, 'Tipo Servicio', 'tipoServicio') || 'Servicio maquina',
    idProducto: rowValue(row, 'ID Producto', 'idProducto'),
    productoUsado: rowValue(row, 'Producto Usado', 'productoUsado'),
    litrosUsados: toNumber(row['litrosUsados'] ?? row['Litros Usados']),
    responsable: rowValue(row, 'Responsable', 'responsable'),
    observacionesServicio: rowValue(row, 'Observaciones Servicio', 'observacionesServicio'),
    fotosServicio: rowValue(row, 'Fotos Servicio', 'fotosServicio'),
    fotoAntes: rowValue(row, 'Foto Antes', 'fotoAntes'),
    fotoDespues: rowValue(row, 'Foto Después', 'fotoDespues') || rowValue(row, 'Foto Despues', 'fotoDespues'),
    fotoEvidencia: rowValue(row, 'Foto Evidencia', 'fotoEvidencia'),
    carpetaDrive: rowValue(row, 'Carpeta Drive', 'carpetaDrive'),
    pdfServicio: rowValue(row, 'PDF Servicio', 'pdfServicio'),
    eliminado: rowValue(row, 'Eliminado', 'eliminado') || 'NO'
  };
}

function normalizeProducto(row: Record<string, unknown>): Producto {
  return {
    idProducto: rowValue(row, 'ID Producto', 'idProducto'),
    producto: rowValue(row, 'Producto', 'producto'),
    unidad: rowValue(row, 'Unidad', 'unidad'),
    existenciaActualLitros: toNumber(row['existenciaActualLitros'] ?? row['Existencia Actual Litros']),
    cantidadMinimaLitros: toNumber(row['cantidadMinimaLitros'] ?? row['Cantidad Minima Litros']),
    activo: rowValue(row, 'Activo', 'activo')
  };
}

function normalizeMovimientoProducto(row: Record<string, unknown>): MovimientoProducto {
  return {
    idMovimientoProducto: rowValue(row, 'ID Movimiento Producto', 'idMovimientoProducto'),
    fecha: rowValue(row, 'Fecha', 'fecha'),
    tipoMovimiento: rowValue(row, 'Tipo Movimiento', 'tipoMovimiento'),
    idProducto: rowValue(row, 'ID Producto', 'idProducto'),
    litros: toNumber(row['litros'] ?? row['Litros']),
    idCliente: rowValue(row, 'ID Cliente', 'idCliente'),
    idMaquina: rowValue(row, 'ID Maquina', 'idMaquina'),
    idServicio: rowValue(row, 'ID Servicio', 'idServicio'),
    motivo: rowValue(row, 'Motivo', 'motivo'),
    responsable: rowValue(row, 'Responsable', 'responsable'),
    eliminado: rowValue(row, 'Eliminado', 'eliminado') || 'NO'
  };
}

function normalizeArticuloBodega(row: Record<string, unknown>): ArticuloBodega {
  return {
    idArticulo: rowValue(row, 'ID Articulo', 'idArticulo'),
    articulo: rowValue(row, 'Articulo', 'articulo'),
    categoria: rowValue(row, 'Categoria', 'categoria'),
    unidad: rowValue(row, 'Unidad', 'unidad'),
    stockMinimo: toNumber(row['stockMinimo'] ?? row['Stock Minimo']),
    ubicacion: rowValue(row, 'Ubicacion', 'ubicacion'),
    activo: rowValue(row, 'Activo', 'activo'),
    stockActual: toNumber(row['stockActual'] ?? row['Stock Actual']),
    fechaUltimaEntrada: rowValue(row, 'Fecha Ultima Entrada', 'fechaUltimaEntrada'),
    fechaUltimaSalida: rowValue(row, 'Fecha Ultima Salida', 'fechaUltimaSalida')
  };
}

function normalizeMovimientoBodega(row: Record<string, unknown>): MovimientoBodega {
  return {
    idMovimiento: rowValue(row, 'ID Movimiento', 'idMovimiento'),
    fecha: rowValue(row, 'Fecha', 'fecha'),
    tipoMovimiento: rowValue(row, 'Tipo Movimiento', 'tipoMovimiento'),
    idArticulo: rowValue(row, 'ID Articulo', 'idArticulo'),
    cantidad: toNumber(row['cantidad'] ?? row['Cantidad']),
    responsable: rowValue(row, 'Responsable', 'responsable'),
    motivo: rowValue(row, 'Motivo', 'motivo'),
    eliminado: rowValue(row, 'Eliminado', 'eliminado') || 'NO'
  };
}

function filterDeleted(data: PbmData): PbmData {
  return {
    ...data,
    servicios: activeServicios(data.servicios),
    historialServicios: activeHistorialServicios(data.historialServicios),
    movimientosProducto: activeMovimientosProducto(data.movimientosProducto),
    movimientosBodega: activeMovimientosBodega(data.movimientosBodega)
  };
}

function normalizePbmData(payload: unknown): PbmData {
  const container = payload as { data?: unknown };
  const root = (container.data ?? payload) as Record<string, unknown>;

  const clientes = ((root.clientes ?? root.Clientes ?? []) as Record<string, unknown>[]).map(normalizeCliente);
  const maquinas = ((root.maquinas ?? root.Maquinas ?? []) as Record<string, unknown>[]).map(normalizeMaquina);
  const servicios = ((root.servicios ?? root.Servicios ?? []) as Record<string, unknown>[]).map(normalizeServicio);
  const historialServicios = ((root.historialServicios ?? root['Historial Servicios'] ?? []) as Record<string, unknown>[]).map(
    normalizeHistorialServicio
  );
  const productos = ((root.productos ?? root.Productos ?? []) as Record<string, unknown>[]).map(normalizeProducto);
  const movimientosProducto = ((root.movimientosProducto ?? root['Movimientos Producto'] ?? []) as Record<string, unknown>[]).map(
    normalizeMovimientoProducto
  );
  const stockBodega = ((root.stockBodega ?? root['Stock Bodega'] ?? []) as Record<string, unknown>[]).map(normalizeArticuloBodega);
  const movimientosBodega = ((root.movimientosBodega ?? root['Movimientos Bodega'] ?? []) as Record<string, unknown>[]).map(
    normalizeMovimientoBodega
  );

  return filterDeleted({
    clientes,
    maquinas,
    servicios,
    historialServicios,
    productos,
    movimientosProducto,
    stockBodega,
    movimientosBodega,
    sync: {
      source: API_URL ? 'apps-script' : 'mock',
      loadedAt: new Date().toISOString(),
      apiUrlConfigured: Boolean(API_URL)
    }
  });
}

function apiErrorMessage(detail: string, url: string): string {
  const isPhotoError = /DRIVE_|PHOTO_|INVALID_PHOTO|HISTORIAL_NOT_CREATED|CORS_OR_POST_FAILED/i.test(detail);
  const title = isPhotoError ? 'Error al subir fotos a Drive. Revisa permisos de Apps Script o implementacion publicada.' : 'No se pudo conectar con Apps Script';
  return [
    title,
    `URL configurada: ${url}`,
    `Detalle: ${detail}`,
    'Sugerencia: revisa que la implementacion este publicada como aplicacion web, con permisos correctos, y que VITE_API_URL apunte al /exec vigente.'
  ].join('\n');
}

async function requestJson<T>(url: string, options?: RequestInit, logErrors = true): Promise<T> {
  const method = options?.method ?? 'GET';
  let response: Response;

  try {
    response = await fetch(url, options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (logErrors) console.error('[PBM API] Network error', { url, method, message, error });
    const detail = method === 'POST' ? `CORS_OR_POST_FAILED: ${message}` : message;
    throw new Error(apiErrorMessage(detail, url));
  }

  const text = await response.text();

  if (!response.ok) {
    if (logErrors) {
      console.error('[PBM API] HTTP error', {
        url,
        method,
        status: response.status,
        statusText: response.statusText,
        responseText: text
      });
    }
    throw new Error(apiErrorMessage(`HTTP ${response.status} ${response.statusText}. ${text.slice(0, 400)}`, url));
  }

  let payload: { ok?: boolean; error?: string };
  try {
    payload = JSON.parse(text) as { ok?: boolean; error?: string };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (logErrors) console.error('[PBM API] Invalid JSON response', { url, method, responseText: text, message });
    throw new Error(apiErrorMessage(`Respuesta no es JSON valido. ${message}`, url));
  }

  if (payload.ok === false) {
    if (logErrors) console.error('[PBM API] Apps Script returned ok=false', { url, method, payload });
    throw new Error(apiErrorMessage(payload.error ?? 'Apps Script devolvio ok=false', url));
  }

  return payload as T;
}

function supportsJsonp(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined' && Boolean(API_URL?.includes('script.google.com'));
}

function appendParams(url: string, params: Record<string, string>): string {
  const nextUrl = new URL(url);
  Object.entries(params).forEach(([key, value]) => nextUrl.searchParams.set(key, value));
  return nextUrl.toString();
}

function requestJsonp<T>(action = 'all', payload?: Record<string, unknown>): Promise<T> {
  if (!API_URL) return Promise.reject(new Error('API_URL is not configured'));

  return new Promise((resolve, reject) => {
    const callbackName = `__pbmJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const globalCallbacks = window as unknown as Record<string, unknown>;
    const script = document.createElement('script');
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error(apiErrorMessage('Tiempo de espera agotado usando JSONP con Apps Script', API_URL)));
    }, JSONP_TIMEOUT_MS);

    function cleanup() {
      window.clearTimeout(timeoutId);
      script.remove();
      delete globalCallbacks[callbackName];
    }

    globalCallbacks[callbackName] = (response: unknown) => {
      cleanup();
      const parsed = response as { ok?: boolean; error?: string };
      if (parsed?.ok === false) {
        reject(new Error(apiErrorMessage(parsed.error ?? 'Apps Script devolvio ok=false', API_URL)));
        return;
      }
      resolve(response as T);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error(apiErrorMessage('No se pudo cargar la respuesta JSONP de Apps Script', API_URL)));
    };

    script.src = appendParams(API_URL, {
      action,
      callback: callbackName,
      ...(payload ? { payload: JSON.stringify(payload) } : {})
    });
    document.head.appendChild(script);
  });
}

export async function fetchPbmData(): Promise<PbmData> {
  if (!API_URL) {
    return {
      ...filterDeleted(cloneData(mockStore)),
      sync: {
        source: 'mock',
        loadedAt: new Date().toISOString(),
        apiUrlConfigured: false
      }
    };
  }

  let payload: unknown;
  try {
    payload = await requestJson<unknown>(API_URL, undefined, !supportsJsonp());
  } catch (error) {
    if (!supportsJsonp()) throw error;
    payload = await requestJsonp<unknown>('all');
  }
  return normalizePbmData(payload);
}

function nextId(currentIds: string[], prefix: string): string {
  const max = currentIds.reduce((highest, id) => {
    const match = id.match(/(\d+)$/);
    if (!match) return highest;
    return Math.max(highest, Number(match[1]));
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

function updateMockProductStock(input: MovimientoProductoInput): void {
  const product = mockStore.productos.find((item) => item.idProducto === input.idProducto);
  if (!product) return;
  const current = product.existenciaActualLitros ?? 0;
  product.existenciaActualLitros = input.tipoMovimiento === 'Entrada' ? current + input.litros : current - input.litros;
}

function updateMockBodegaStock(input: MovimientoBodegaInput): void {
  const article = mockStore.stockBodega.find((item) => item.idArticulo === input.idArticulo);
  if (!article) return;
  const current = article.stockActual ?? 0;
  article.stockActual = input.tipoMovimiento === 'Entrada' ? current + input.cantidad : current - input.cantidad;
}

function containsServicePhotos(payload: Record<string, unknown>): boolean {
  const photos = payload.fotosServicio as Record<string, unknown> | undefined;
  return Boolean(photos && Object.values(photos).some(Boolean));
}

async function postAction(action: string, payload: Record<string, unknown>, options: { forcePost?: boolean } = {}): Promise<unknown> {
  if (!API_URL) return { ok: true, mock: true };

  if (supportsJsonp() && !options.forcePost) {
    return requestJsonp<unknown>(action, payload);
  }

  return requestJson<unknown>(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: JSON.stringify({ action, ...payload })
  });
}

export async function appendMovimientoProducto(input: MovimientoProductoInput): Promise<void> {
  if (!API_URL) {
    const idMovimientoProducto = nextId(
      mockStore.movimientosProducto.map((item) => item.idMovimientoProducto),
      'MP'
    );
    mockStore.movimientosProducto.unshift({
      idMovimientoProducto,
      fecha: input.fecha,
      tipoMovimiento: input.tipoMovimiento,
      idProducto: input.idProducto,
      litros: input.litros,
      idCliente: input.idCliente ?? '',
      idMaquina: input.idMaquina ?? '',
      idServicio: input.idServicio ?? '',
      motivo: input.motivo,
      responsable: input.responsable,
      eliminado: 'NO'
    });
    updateMockProductStock(input);
    return;
  }

  await postAction('appendMovimientoProducto', { row: input });
}

export async function appendMovimientoBodega(input: MovimientoBodegaInput): Promise<void> {
  if (!API_URL) {
    const idMovimiento = nextId(
      mockStore.movimientosBodega.map((item) => item.idMovimiento),
      'MB'
    );
    mockStore.movimientosBodega.unshift({
      idMovimiento,
      fecha: input.fecha,
      tipoMovimiento: input.tipoMovimiento,
      idArticulo: input.idArticulo,
      cantidad: input.cantidad,
      responsable: input.responsable,
      motivo: input.motivo,
      eliminado: 'NO'
    });
    updateMockBodegaStock(input);
    return;
  }

  await postAction('appendMovimientoBodega', { row: input });
}

export async function updateServicio(input: ServicioUpdateInput): Promise<void> {
  if (!API_URL) {
    mockStore.servicios = mockStore.servicios.map((servicio) =>
      servicio.idServicio === input.idServicio ? { ...servicio, ...input } : servicio
    );
    return;
  }

  await postAction('updateServicio', { ...input });
}

function resetServicioActivo(servicio: Servicio): Servicio {
  return {
    ...servicio,
    fechaProgramada: '',
    observacionesServicio: '',
    fechaRealizado: '',
    litrosUsados: null,
    productoUsado: ''
  };
}

export async function createServicio(input: ServicioCreateInput): Promise<void> {
  if (!API_URL) {
    const idServicio = nextId(
      mockStore.servicios.map((item) => item.idServicio),
      'SER'
    );
    mockStore.servicios.push({
      idServicio,
      fechaProgramada: input.fechaProgramada,
      idCliente: input.idCliente,
      cliente: input.cliente,
      idMaquina: input.idMaquina,
      modelo: input.modelo,
      tipoServicio: input.tipoServicio ?? 'Servicio maquina',
      idProducto: input.idProducto,
      producto: input.producto,
      litrosEstimados: input.litrosEstimados,
      litrosUsados: input.litrosUsados ?? null,
      productoUsado: input.productoUsado ?? '',
      responsable: input.responsable,
      observacionesServicio: input.observacionesServicio ?? '',
      fechaRealizado: input.fechaRealizado ?? '',
      eliminado: input.eliminado ?? 'NO'
    });
    return;
  }

  await postAction('createServicio', { row: input });
}

export async function markServicioRealizado(input: ServicioRealizadoInput): Promise<void> {
  if (!API_URL) {
    const servicio = mockStore.servicios.find((item) => item.idServicio === input.idServicio);
    if (!servicio) return;
    const idHistorialServicio = nextId(
      mockStore.historialServicios.map((item) => item.idHistorialServicio),
      'HS'
    );
    mockStore.historialServicios.unshift({
      idHistorialServicio,
      idServicio: servicio.idServicio,
      fechaProgramada: servicio.fechaProgramada,
      fechaRealizado: input.fechaRealizado,
      idCliente: servicio.idCliente,
      cliente: servicio.cliente,
      idMaquina: servicio.idMaquina,
      modelo: servicio.modelo,
      tipoServicio: servicio.tipoServicio || 'Servicio maquina',
      idProducto: servicio.idProducto,
      productoUsado: input.productoUsado,
      litrosUsados: input.litrosUsados,
      responsable: input.responsable,
      observacionesServicio: input.observacionesServicio,
      fotosServicio: input.fotosServicio ? Object.values(input.fotosServicio).filter(Boolean).map((photo) => photo?.dataUrl).join('\n') : '',
      fotoAntes: input.fotosServicio?.antes?.dataUrl ?? '',
      fotoDespues: input.fotosServicio?.despues?.dataUrl ?? '',
      fotoEvidencia: input.fotosServicio?.evidencia?.dataUrl ?? '',
      carpetaDrive: '',
      pdfServicio: '',
      eliminado: 'NO'
    });
    mockStore.servicios = mockStore.servicios.map((item) => (item.idServicio === input.idServicio ? resetServicioActivo(item) : item));
    return;
  }

  await postAction('markServicioRealizado', { ...input }, { forcePost: containsServicePhotos(input as unknown as Record<string, unknown>) });
}

export async function uploadServicePhotos(payload: Record<string, unknown>): Promise<void> {
  await postAction('uploadServicePhotos', payload, { forcePost: true });
}

export async function markServicioDeleted(idServicio: string): Promise<void> {
  await updateServicio({ idServicio, eliminado: 'SI' });
}

export async function markMovimientoProductoDeleted(idMovimientoProducto: string): Promise<void> {
  if (!API_URL) {
    mockStore.movimientosProducto = mockStore.movimientosProducto.map((movimiento) =>
      movimiento.idMovimientoProducto === idMovimientoProducto ? { ...movimiento, eliminado: 'SI' } : movimiento
    );
    return;
  }

  await postAction('markMovimientoProductoDeleted', { idMovimientoProducto });
}

export async function markMovimientoBodegaDeleted(idMovimiento: string): Promise<void> {
  if (!API_URL) {
    mockStore.movimientosBodega = mockStore.movimientosBodega.map((movimiento) =>
      movimiento.idMovimiento === idMovimiento ? { ...movimiento, eliminado: 'SI' } : movimiento
    );
    return;
  }

  await postAction('markMovimientoBodegaDeleted', { idMovimiento });
}

export async function markHistorialServicioDeleted(idHistorialServicio: string): Promise<void> {
  if (!API_URL) {
    mockStore.historialServicios = mockStore.historialServicios.map((servicio) =>
      servicio.idHistorialServicio === idHistorialServicio ? { ...servicio, eliminado: 'SI' } : servicio
    );
    return;
  }

  await postAction('markHistorialServicioDeleted', { idHistorialServicio });
}

export async function savePushToken(input: PushTokenInput): Promise<void> {
  if (!API_URL) return;
  await postAction('savePushToken', { row: input });
}

export async function disablePushToken(token: string): Promise<void> {
  if (!API_URL) return;
  await postAction('disablePushToken', { token });
}

export async function fetchPushStatus(): Promise<PushBackendStatus> {
  if (!API_URL) {
    return {
      pushTokensConfigured: false,
      pushLogsConfigured: false,
      activeTokens: 0,
      lastSentAt: '',
      lastSentType: '',
      recentErrors: [],
      recentLogCount: 0
    };
  }

  const response = await postAction('pushStatus', {});
  const payload = response as { data?: PushBackendStatus } & Partial<PushBackendStatus>;
  const data = payload.data ?? payload;
  return {
    pushTokensConfigured: Boolean(data.pushTokensConfigured),
    pushLogsConfigured: Boolean(data.pushLogsConfigured),
    activeTokens: Number(data.activeTokens ?? 0),
    lastSentAt: data.lastSentAt ?? '',
    lastSentType: data.lastSentType ?? '',
    recentErrors: Array.isArray(data.recentErrors) ? data.recentErrors : [],
    recentLogCount: Number(data.recentLogCount ?? 0)
  };
}

export function apiUrlConfigured(): boolean {
  return Boolean(API_URL);
}

import type {
  ArticuloBodega,
  Cliente,
  Maquina,
  MovimientoBodega,
  Producto,
  ServiceStatus,
  Servicio,
  StockStatus
} from '../types/pbm';

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function todayInputValue(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

export function toDateInputValue(value: string | null | undefined): string {
  const date = parseSheetDate(value);
  if (!date) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function parseSheetDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(value: string | null | undefined): string {
  const date = parseSheetDate(value);
  if (!date) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function getServiceStatus(servicio: Servicio, now = new Date()): ServiceStatus {
  if (servicio.fechaRealizado?.trim()) return 'Realizado';
  const programmed = parseSheetDate(servicio.fechaProgramada);
  if (!programmed) return 'Sin programar';
  void now;
  return 'Pendiente';
}

export function getStockStatus(actual: number | null, minimo: number | null): StockStatus {
  const current = actual ?? 0;
  const minimum = minimo ?? 0;
  if (current <= 0) return 'Critico';
  if (minimum > 0 && current <= minimum) return 'Bajo';
  return 'Suficiente';
}

export function productStockStatus(producto: Producto): StockStatus {
  return getStockStatus(producto.existenciaActualLitros, producto.cantidadMinimaLitros);
}

export function bodegaStockStatus(articulo: ArticuloBodega): StockStatus {
  return getStockStatus(articulo.stockActual, articulo.stockMinimo);
}

export function sortMovementsByDateDesc<T extends { fecha: string }>(movements: T[]): T[] {
  return [...movements].sort((a, b) => {
    const dateA = parseSheetDate(a.fecha)?.getTime() ?? 0;
    const dateB = parseSheetDate(b.fecha)?.getTime() ?? 0;
    return dateB - dateA;
  });
}

export function getBodegaMovementsForArticle(idArticulo: string, movimientos: MovimientoBodega[]): MovimientoBodega[] {
  return sortMovementsByDateDesc(movimientos.filter((movimiento) => movimiento.idArticulo === idArticulo));
}

export function getLastBodegaMovementDate(
  idArticulo: string,
  movimientos: MovimientoBodega[],
  tipoMovimiento: 'Entrada' | 'Salida'
): string | null {
  const movement = getBodegaMovementsForArticle(idArticulo, movimientos).find(
    (item) => item.tipoMovimiento === tipoMovimiento && Boolean(parseSheetDate(item.fecha))
  );
  return movement?.fecha ?? null;
}

export function getBodegaMovementDates(idArticulo: string, movimientos: MovimientoBodega[]) {
  return {
    ultimaEntrada: getLastBodegaMovementDate(idArticulo, movimientos, 'Entrada'),
    ultimaSalida: getLastBodegaMovementDate(idArticulo, movimientos, 'Salida')
  };
}

export function countClienteMaquinas(cliente: Cliente, maquinas: Maquina[]): number {
  return maquinas.filter((maquina) => maquina.idCliente === cliente.idCliente).length;
}

export function getClienteNextService(cliente: Cliente, servicios: Servicio[]): Servicio | null {
  const pending = servicios
    .filter((servicio) => servicio.idCliente === cliente.idCliente && !servicio.fechaRealizado)
    .map((servicio) => ({ servicio, date: parseSheetDate(servicio.fechaProgramada) }))
    .filter((item): item is { servicio: Servicio; date: Date } => Boolean(item.date))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return pending[0]?.servicio ?? null;
}

export function classNames(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

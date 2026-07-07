import type { HistorialServicio, IngresoFacturaProducto, MovimientoBodega, MovimientoProducto, Servicio } from '../types/pbm';
import { getServiceStatus, parseSheetDate } from './formatters';

export function isDeletedRecord(record: { eliminado?: string | null | undefined }): boolean {
  return String(record.eliminado ?? '').trim().toUpperCase() === 'SI';
}

export function activeServicios(servicios: Servicio[]): Servicio[] {
  return servicios.filter((servicio) => !isDeletedRecord(servicio));
}

export function activeMovimientosProducto(movimientos: MovimientoProducto[]): MovimientoProducto[] {
  return movimientos.filter((movimiento) => !isDeletedRecord(movimiento));
}

export function activeHistorialServicios(servicios: HistorialServicio[]): HistorialServicio[] {
  return servicios.filter((servicio) => !isDeletedRecord(servicio));
}

export function activeMovimientosBodega(movimientos: MovimientoBodega[]): MovimientoBodega[] {
  return movimientos.filter((movimiento) => !isDeletedRecord(movimiento));
}

export function activeIngresosFacturaProducto(ingresos: IngresoFacturaProducto[]): IngresoFacturaProducto[] {
  return ingresos.filter((ingreso) => !isDeletedRecord(ingreso));
}

export function visibleServiciosList(servicios: Servicio[]): Servicio[] {
  return activeServicios(servicios);
}

export function sortServiciosByProgrammedDate(servicios: Servicio[]): Servicio[] {
  return [...servicios].sort((a, b) => {
    const dateA = parseSheetDate(a.fechaProgramada)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const dateB = parseSheetDate(b.fechaProgramada)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (dateA !== dateB) return dateA - dateB;
    return a.idServicio.localeCompare(b.idServicio);
  });
}

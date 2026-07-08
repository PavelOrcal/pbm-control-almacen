import type { HistorialServicio, IngresoFacturaProducto, MovimientoBodega, MovimientoProducto, Servicio } from '../types/pbm';
import { parseSheetDate } from './formatters';

export function isDeletedRecord(record: { eliminado?: string | null | undefined }): boolean {
  return String(record.eliminado ?? '').trim().toUpperCase() === 'SI';
}

function normalizedServiceMachineId(servicio: Servicio): string {
  const value = String(servicio.idMaquina ?? '').trim();
  if (!value || value.toUpperCase() === 'N/A') return '';
  return value;
}

function serviceDatePriority(servicio: Servicio): { bucket: number; distance: number } {
  const date = parseSheetDate(servicio.fechaProgramada);
  if (!date) return { bucket: 2, distance: Number.MAX_SAFE_INTEGER };

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const serviceStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  if (serviceStart >= todayStart) {
    return { bucket: 0, distance: serviceStart - todayStart };
  }
  return { bucket: 1, distance: todayStart - serviceStart };
}

function shouldReplaceActiveServicio(current: Servicio, candidate: Servicio): boolean {
  const currentPriority = serviceDatePriority(current);
  const candidatePriority = serviceDatePriority(candidate);
  if (candidatePriority.bucket !== currentPriority.bucket) {
    return candidatePriority.bucket < currentPriority.bucket;
  }
  if (candidatePriority.distance !== currentPriority.distance) {
    return candidatePriority.distance < currentPriority.distance;
  }
  return false;
}

export function activeServicios(servicios: Servicio[]): Servicio[] {
  const active = servicios.filter((servicio) => !isDeletedRecord(servicio));
  const byMachine = new Map<string, Servicio>();
  const passthrough: Servicio[] = [];

  active.forEach((servicio) => {
    const idMaquina = normalizedServiceMachineId(servicio);
    if (!idMaquina) {
      passthrough.push(servicio);
      return;
    }

    const current = byMachine.get(idMaquina);
    if (!current || shouldReplaceActiveServicio(current, servicio)) {
      byMachine.set(idMaquina, servicio);
    }
  });

  return [...byMachine.values(), ...passthrough];
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

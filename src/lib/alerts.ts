import type { AuthUser } from './auth';
import { canSeeInventory } from './auth';
import { formatDate, getStockStatus, parseSheetDate, todayInputValue, toDateInputValue } from './formatters';
import type { HistorialServicio, PbmData, Servicio } from '../types/pbm';

export type SmartAlertLevel = 'critica' | 'advertencia' | 'informativa' | 'operativa';

export type SmartAlertCategory =
  | 'stock'
  | 'producto'
  | 'cliente'
  | 'maquina'
  | 'servicio'
  | 'evidencia'
  | 'pdf'
  | 'litros'
  | 'responsable'
  | 'push';

export interface SmartAlert {
  id: string;
  tipo: string;
  categoria: SmartAlertCategory;
  nivel: SmartAlertLevel;
  titulo: string;
  mensaje: string;
  accionSugerida: string;
  accionUrl?: string;
  usuarioObjetivo?: string;
  responsable?: string;
  cliente?: string;
  servicioId?: string;
  fecha?: string;
  detalles?: string[];
  restricted?: boolean;
}

export interface SmartAlertSummary {
  total: number;
  critica: number;
  advertencia: number;
  informativa: number;
  operativa: number;
  stockEnRiesgo: number;
  serviciosHoy: number;
  serviciosSinEvidencia: number;
}

const levelWeight: Record<SmartAlertLevel, number> = {
  critica: 0,
  advertencia: 1,
  operativa: 2,
  informativa: 3
};

function normalize(value: string | null | undefined): string {
  return String(value ?? '').trim();
}

function isYes(value: string | null | undefined): boolean {
  return normalize(value).toUpperCase() === 'SI';
}

function isActiveCliente(value: string | null | undefined): boolean {
  const text = normalize(value).toLowerCase();
  return text === 'activo' || text === 'si';
}

function isActiveMaquina(value: string | null | undefined): boolean {
  return normalize(value).toLowerCase() === 'activa';
}

function daysBetween(from: Date, to: Date): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((end - start) / 86_400_000);
}

function currentMonthBounds(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

function isInCurrentMonth(value: string, now = new Date()): boolean {
  const date = parseSheetDate(value);
  if (!date) return false;
  const { start, end } = currentMonthBounds(now);
  return date >= start && date <= end;
}

function historyDate(historial: HistorialServicio): string {
  return historial.fechaRealizado || historial.fechaProgramada;
}

function hasAnyPhoto(historial: HistorialServicio): boolean {
  return Boolean(normalize(historial.fotoAntes) || normalize(historial.fotoDespues) || normalize(historial.fotoEvidencia));
}

function hasNoLiters(historial: HistorialServicio): boolean {
  const product = normalize(historial.productoUsado).toLowerCase();
  if (product === 'indefinido / no aplica') return false;
  return historial.litrosUsados === null || historial.litrosUsados === undefined || historial.litrosUsados <= 0;
}

function addStockAlerts(alerts: SmartAlert[], data: PbmData, user: AuthUser | null) {
  const inventoryAllowed = canSeeInventory(user);
  const stockAlerts: SmartAlert[] = [];

  data.productos
    .filter((producto) => isYes(producto.activo))
    .forEach((producto) => {
      const status = getStockStatus(producto.existenciaActualLitros, producto.cantidadMinimaLitros);
      if (status === 'Suficiente') return;
      const critical = status === 'Critico';
      stockAlerts.push({
        id: `producto-${producto.idProducto}-${status}`,
        tipo: critical ? 'producto-critico' : 'stock-bajo',
        categoria: critical ? 'producto' : 'stock',
        nivel: critical ? 'critica' : 'advertencia',
        titulo: critical ? `${producto.producto} en nivel critico` : `${producto.producto} bajo minimo`,
        mensaje: inventoryAllowed
          ? `Stock actual: ${producto.existenciaActualLitros ?? 0} ${producto.unidad || 'L'} / minimo: ${producto.cantidadMinimaLitros ?? 0}.`
          : 'Inventario restringido para este rol.',
        accionSugerida: 'Revisar abastecimiento de producto',
        accionUrl: '/stock-productos',
        restricted: !inventoryAllowed,
        detalles: inventoryAllowed ? [`Actual: ${producto.existenciaActualLitros ?? 0}`, `Minimo: ${producto.cantidadMinimaLitros ?? 0}`] : undefined
      });
    });

  data.stockBodega
    .filter((articulo) => isYes(articulo.activo))
    .forEach((articulo) => {
      const status = getStockStatus(articulo.stockActual, articulo.stockMinimo);
      if (status === 'Suficiente') return;
      const critical = status === 'Critico';
      stockAlerts.push({
        id: `bodega-${articulo.idArticulo}-${status}`,
        tipo: critical ? 'producto-critico' : 'stock-bajo',
        categoria: critical ? 'producto' : 'stock',
        nivel: critical ? 'critica' : 'advertencia',
        titulo: critical ? `${articulo.articulo} agotado` : `${articulo.articulo} bajo minimo`,
        mensaje: inventoryAllowed
          ? `Stock actual: ${articulo.stockActual ?? 0} ${articulo.unidad} / minimo: ${articulo.stockMinimo ?? 0}. Ubicacion: ${articulo.ubicacion || 'Sin ubicacion'}.`
          : 'Inventario restringido para este rol.',
        accionSugerida: 'Revisar stock de bodega',
        accionUrl: `/stock-bodega/${articulo.idArticulo}`,
        restricted: !inventoryAllowed,
        detalles: inventoryAllowed ? [`Actual: ${articulo.stockActual ?? 0}`, `Minimo: ${articulo.stockMinimo ?? 0}`] : undefined
      });
    });

  if (inventoryAllowed) {
    alerts.push(...stockAlerts);
    return;
  }

  if (stockAlerts.length > 0) {
    alerts.push({
      id: 'inventario-restringido-operativo',
      tipo: 'stock-restringido',
      categoria: 'stock',
      nivel: 'informativa',
      titulo: 'Inventario restringido',
      mensaje: 'Existen alertas de inventario visibles solo para administradores.',
      accionSugerida: 'Solicitar revision a un administrador',
      restricted: true
    });
  }
}

function addClientAndMachineAlerts(alerts: SmartAlert[], data: PbmData, now: Date) {
  const activeServiciosWithDate = data.servicios.filter((servicio) => Boolean(parseSheetDate(servicio.fechaProgramada)));

  data.clientes
    .filter((cliente) => isYes(cliente.activo) || isActiveCliente(cliente.estadoCliente))
    .forEach((cliente) => {
      const hasProgrammedService = activeServiciosWithDate.some(
        (servicio) => servicio.idCliente === cliente.idCliente || normalize(servicio.cliente).toLowerCase() === normalize(cliente.empresa).toLowerCase()
      );
      if (hasProgrammedService) return;
      const machineCount = data.maquinas.filter((maquina) => maquina.idCliente === cliente.idCliente || maquina.empresa === cliente.empresa).length;
      alerts.push({
        id: `cliente-sin-servicio-${cliente.idCliente}`,
        tipo: 'cliente-sin-servicio-programado',
        categoria: 'cliente',
        nivel: 'advertencia',
        titulo: `${cliente.empresa} sin servicio programado`,
        mensaje: `${cliente.ciudad || 'Sin ciudad'} / ${machineCount} maquina(s) registradas.`,
        accionSugerida: 'Programar servicio',
        accionUrl: '/servicios',
        cliente: cliente.empresa,
        detalles: [`Maquinas: ${machineCount}`]
      });
    });

  data.maquinas
    .filter((maquina) => isActiveMaquina(maquina.estado))
    .forEach((maquina) => {
      const histories = data.historialServicios
        .filter((historial) => historial.idMaquina === maquina.idMaquina)
        .sort((a, b) => (parseSheetDate(historyDate(b))?.getTime() ?? 0) - (parseSheetDate(historyDate(a))?.getTime() ?? 0));
      const attendedThisMonth = histories.some((historial) => isInCurrentMonth(historyDate(historial), now));
      if (attendedThisMonth) return;
      const last = histories[0];
      alerts.push({
        id: `maquina-sin-atencion-${maquina.idMaquina}`,
        tipo: 'maquina-sin-atencion-mes',
        categoria: 'maquina',
        nivel: 'operativa',
        titulo: `${maquina.idMaquina} sin atencion este mes`,
        mensaje: `${maquina.empresa} / ${maquina.modelo}. Ultima atencion: ${last ? formatDate(historyDate(last)) : 'sin historial'}.`,
        accionSugerida: 'Revisar o programar servicio',
        accionUrl: `/maquinas/${maquina.idMaquina}`,
        cliente: maquina.empresa,
        detalles: [`Modelo: ${maquina.modelo}`, `Ultima atencion: ${last ? formatDate(historyDate(last)) : 'Sin historial'}`]
      });
    });
}

function addHistoryQualityAlerts(alerts: SmartAlert[], data: PbmData) {
  data.historialServicios.forEach((historial) => {
    if (!hasAnyPhoto(historial)) {
      alerts.push({
        id: `sin-fotos-${historial.idHistorialServicio}`,
        tipo: 'servicio-sin-fotos',
        categoria: 'evidencia',
        nivel: 'advertencia',
        titulo: `${historial.cliente} sin evidencia fotografica`,
        mensaje: `Realizado: ${formatDate(historial.fechaRealizado)} / responsable: ${historial.responsable || 'sin responsable'}.`,
        accionSugerida: 'Revisar evidencia',
        accionUrl: `/historial-servicios/${historial.idHistorialServicio}`,
        responsable: historial.responsable,
        cliente: historial.cliente,
        servicioId: historial.idServicio,
        fecha: historial.fechaRealizado
      });
    }

    if (!normalize(historial.pdfServicio)) {
      alerts.push({
        id: `sin-pdf-${historial.idHistorialServicio}`,
        tipo: 'servicio-sin-pdf',
        categoria: 'pdf',
        nivel: 'informativa',
        titulo: `${historial.cliente} sin PDF de servicio`,
        mensaje: 'Pendiente para generacion documental futura; no es error critico.',
        accionSugerida: 'Mantener en seguimiento V2 futura',
        accionUrl: `/historial-servicios/${historial.idHistorialServicio}`,
        responsable: historial.responsable,
        cliente: historial.cliente,
        servicioId: historial.idServicio,
        fecha: historial.fechaRealizado
      });
    }

    if (hasNoLiters(historial)) {
      alerts.push({
        id: `sin-litros-${historial.idHistorialServicio}`,
        tipo: 'servicio-sin-litros',
        categoria: 'litros',
        nivel: 'advertencia',
        titulo: `${historial.cliente} sin litros usados`,
        mensaje: `Realizado: ${formatDate(historial.fechaRealizado)} / producto: ${historial.productoUsado || 'sin producto'}.`,
        accionSugerida: 'Corregir registro realizado',
        accionUrl: `/historial-servicios/${historial.idHistorialServicio}`,
        responsable: historial.responsable,
        cliente: historial.cliente,
        servicioId: historial.idServicio,
        fecha: historial.fechaRealizado
      });
    }
  });
}

function pendingServices(servicios: Servicio[], now: Date) {
  return servicios
    .map((servicio) => ({ servicio, date: parseSheetDate(servicio.fechaProgramada) }))
    .filter((item): item is { servicio: Servicio; date: Date } => Boolean(item.date) && !normalize(item.servicio.fechaRealizado))
    .map((item) => ({ ...item, delta: daysBetween(now, item.date) }))
    .filter((item) => item.delta >= 0 && item.delta <= 7);
}

function addUpcomingAlerts(alerts: SmartAlert[], data: PbmData, now: Date) {
  const buckets = new Map<string, Array<{ servicio: Servicio; date: Date; delta: number }>>();

  pendingServices(data.servicios, now).forEach((item) => {
    const bucket = item.delta === 0 ? 'Hoy' : item.delta === 1 ? 'Mañana' : 'Proximos 7 dias';
    const responsible = normalize(item.servicio.responsable) || 'Sin responsable';
    const key = `${responsible}|${bucket}`;
    buckets.set(key, [...(buckets.get(key) ?? []), item]);
  });

  buckets.forEach((items, key) => {
    const [responsable, bucket] = key.split('|');
    const level: SmartAlertLevel = bucket === 'Hoy' ? 'operativa' : bucket === 'Mañana' ? 'operativa' : 'informativa';
    alerts.push({
      id: `responsable-${responsable}-${bucket}`,
      tipo: 'proximos-servicios-responsable',
      categoria: 'responsable',
      nivel: level,
      titulo: `${responsable}: ${items.length} servicio(s) ${bucket.toLowerCase()}`,
      mensaje: items.slice(0, 3).map((item) => `${item.servicio.cliente} / ${item.servicio.idMaquina || 'N/A'} (${formatDate(item.servicio.fechaProgramada)})`).join(' · '),
      accionSugerida: 'Revisar agenda de servicios',
      accionUrl: '/servicios',
      responsable,
      fecha: items[0]?.servicio.fechaProgramada,
      detalles: items.map((item) => `${item.servicio.cliente} / ${item.servicio.idMaquina || 'N/A'} / ${formatDate(item.servicio.fechaProgramada)}`)
    });
  });
}

export function buildSmartAlerts(data: PbmData, user: AuthUser | null, now = new Date()): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  addStockAlerts(alerts, data, user);
  addClientAndMachineAlerts(alerts, data, now);
  addHistoryQualityAlerts(alerts, data);
  addUpcomingAlerts(alerts, data, now);

  return alerts.sort((a, b) => {
    const weight = levelWeight[a.nivel] - levelWeight[b.nivel];
    if (weight !== 0) return weight;
    const dateA = parseSheetDate(a.fecha)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const dateB = parseSheetDate(b.fecha)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return dateA - dateB || a.titulo.localeCompare(b.titulo, 'es-MX');
  });
}

export function summarizeSmartAlerts(alerts: SmartAlert[]): SmartAlertSummary {
  return alerts.reduce(
    (summary, alert) => {
      summary.total += 1;
      summary[alert.nivel] += 1;
      if (alert.categoria === 'stock' || alert.categoria === 'producto') summary.stockEnRiesgo += 1;
      if (alert.categoria === 'evidencia') summary.serviciosSinEvidencia += 1;
      if (alert.categoria === 'responsable' && toDateInputValue(alert.fecha) === todayInputValue()) summary.serviciosHoy += 1;
      return summary;
    },
    { total: 0, critica: 0, advertencia: 0, informativa: 0, operativa: 0, stockEnRiesgo: 0, serviciosHoy: 0, serviciosSinEvidencia: 0 }
  );
}

export function alertLevelTone(level: SmartAlertLevel): 'red' | 'orange' | 'yellow' | 'blue' | 'green' {
  if (level === 'critica') return 'red';
  if (level === 'advertencia') return 'orange';
  if (level === 'informativa') return 'blue';
  return 'green';
}

export function dashboardAlerts(alerts: SmartAlert[], limit = 5): SmartAlert[] {
  const today = todayInputValue();
  const priorityScore = (alert: SmartAlert) => {
    if (alert.nivel === 'critica') return 0;
    if (alert.categoria === 'responsable' && toDateInputValue(alert.fecha) === today) return 1;
    if (alert.categoria === 'litros' || alert.categoria === 'evidencia') return 3;
    if (alert.nivel === 'advertencia') return 4;
    if (alert.categoria === 'responsable') return 5;
    return 6;
  };

  return [...alerts]
    .sort((a, b) => priorityScore(a) - priorityScore(b) || levelWeight[a.nivel] - levelWeight[b.nivel] || a.titulo.localeCompare(b.titulo, 'es-MX'))
    .slice(0, limit);
}

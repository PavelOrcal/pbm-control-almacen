import type { MovimientoBodega, MovimientoProducto, PbmData, TipoMovimiento } from '../types/pbm';
import { formatDate, parseSheetDate } from './formatters';
import { isDeletedRecord } from './records';

export type HistorialOrigen = 'Producto' | 'Bodega';
export type HistorialOrden = 'reciente' | 'antiguo';

export interface HistorialMovimiento {
  id: string;
  routeOrigen: 'producto' | 'bodega';
  origen: HistorialOrigen;
  fecha: string;
  fechaTime: number;
  fechaKey: string;
  tipoMovimiento: TipoMovimiento | string;
  itemId: string;
  itemNombre: string;
  categoria?: string;
  unidad: string;
  cantidad: number;
  cantidadLabel: string;
  responsable: string;
  motivo: string;
  idCliente?: string;
  cliente?: string;
  idMaquina?: string;
  maquina?: string;
  idServicio?: string;
  productoStockActual?: number | null;
  productoStockMinimo?: number | null;
  bodegaStockActual?: number | null;
  bodegaStockMinimo?: number | null;
  rawProducto?: MovimientoProducto;
  rawBodega?: MovimientoBodega;
}

function dateKey(value: string): string {
  const date = parseSheetDate(value);
  if (!date) return 'sin-fecha';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateTime(value: string): number {
  return parseSheetDate(value)?.getTime() ?? 0;
}

function compactLabel(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function buildHistorialMovimientos(data: PbmData): HistorialMovimiento[] {
  const productos = new Map(data.productos.map((producto) => [producto.idProducto, producto]));
  const articulos = new Map(data.stockBodega.map((articulo) => [articulo.idArticulo, articulo]));
  const clientes = new Map(data.clientes.map((cliente) => [cliente.idCliente, cliente]));
  const maquinas = new Map(data.maquinas.map((maquina) => [maquina.idMaquina, maquina]));
  const servicios = new Map(data.servicios.map((servicio) => [servicio.idServicio, servicio]));

  const movimientosProducto: HistorialMovimiento[] = data.movimientosProducto.filter((movimiento) => !isDeletedRecord(movimiento)).map((movimiento) => {
    const producto = productos.get(movimiento.idProducto);
    const cliente = clientes.get(movimiento.idCliente);
    const maquina = maquinas.get(movimiento.idMaquina);
    const servicio = servicios.get(movimiento.idServicio);
    const cantidad = movimiento.litros ?? 0;
    const clienteNombre = compactLabel(cliente?.empresa) ?? compactLabel(servicio?.cliente);
    const maquinaNombre = compactLabel(maquina?.modelo) ?? compactLabel(servicio?.modelo);

    return {
      id: movimiento.idMovimientoProducto,
      routeOrigen: 'producto',
      origen: 'Producto',
      fecha: movimiento.fecha,
      fechaTime: dateTime(movimiento.fecha),
      fechaKey: dateKey(movimiento.fecha),
      tipoMovimiento: movimiento.tipoMovimiento,
      itemId: movimiento.idProducto,
      itemNombre: producto?.producto ?? movimiento.idProducto,
      unidad: producto?.unidad ?? 'Litros',
      cantidad,
      cantidadLabel: `${cantidad} ${producto?.unidad ?? 'Litros'}`,
      responsable: movimiento.responsable,
      motivo: movimiento.motivo,
      idCliente: compactLabel(movimiento.idCliente),
      cliente: clienteNombre,
      idMaquina: compactLabel(movimiento.idMaquina),
      maquina: maquinaNombre,
      idServicio: compactLabel(movimiento.idServicio),
      productoStockActual: producto?.existenciaActualLitros,
      productoStockMinimo: producto?.cantidadMinimaLitros,
      rawProducto: movimiento
    };
  });

  const movimientosBodega: HistorialMovimiento[] = data.movimientosBodega.filter((movimiento) => !isDeletedRecord(movimiento)).map((movimiento) => {
    const articulo = articulos.get(movimiento.idArticulo);
    const cantidad = movimiento.cantidad ?? 0;

    return {
      id: movimiento.idMovimiento,
      routeOrigen: 'bodega',
      origen: 'Bodega',
      fecha: movimiento.fecha,
      fechaTime: dateTime(movimiento.fecha),
      fechaKey: dateKey(movimiento.fecha),
      tipoMovimiento: movimiento.tipoMovimiento,
      itemId: movimiento.idArticulo,
      itemNombre: articulo?.articulo ?? movimiento.idArticulo,
      categoria: articulo?.categoria,
      unidad: articulo?.unidad ?? 'Unidades',
      cantidad,
      cantidadLabel: `${cantidad} ${articulo?.unidad ?? 'Unidades'}`,
      responsable: movimiento.responsable,
      motivo: movimiento.motivo,
      bodegaStockActual: articulo?.stockActual,
      bodegaStockMinimo: articulo?.stockMinimo,
      rawBodega: movimiento
    };
  });

  return sortHistorialMovimientos([...movimientosProducto, ...movimientosBodega], 'reciente');
}

export function sortHistorialMovimientos(movimientos: HistorialMovimiento[], orden: HistorialOrden): HistorialMovimiento[] {
  return [...movimientos].sort((a, b) => {
    const diff = orden === 'reciente' ? b.fechaTime - a.fechaTime : a.fechaTime - b.fechaTime;
    if (diff !== 0) return diff;
    return orden === 'reciente' ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id);
  });
}

export function findHistorialMovimiento(data: PbmData, origen: string | undefined, id: string | undefined): HistorialMovimiento | null {
  if (!origen || !id) return null;
  return buildHistorialMovimientos(data).find((movimiento) => movimiento.routeOrigen === origen && movimiento.id === id) ?? null;
}

export function historialDateTitle(fechaKey: string, fecha: string): string {
  const date = parseSheetDate(fecha);
  if (!date || fechaKey === 'sin-fecha') return 'Sin fecha';

  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startToday.getTime() - startDate.getTime()) / 86_400_000);

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';

  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function monthKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthKeyFromSheetDate(value: string): string | null {
  const date = parseSheetDate(value);
  return date ? monthKeyFromDate(date) : null;
}

export function currentMonthKey(): string {
  return monthKeyFromDate(new Date());
}

export function previousMonthKey(): string {
  const now = new Date();
  return monthKeyFromDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
}

export function isHighImpactMovement(movimiento: HistorialMovimiento): boolean {
  if (movimiento.tipoMovimiento !== 'Salida') return false;
  return movimiento.origen === 'Producto' ? movimiento.cantidad >= 100 : movimiento.cantidad >= 10;
}

export function calculateHistorialSummary(movimientos: HistorialMovimiento[]) {
  const productoTotals = new Map<string, number>();
  const responsableTotals = new Map<string, number>();

  movimientos.forEach((movimiento) => {
    if (movimiento.origen === 'Producto') {
      productoTotals.set(movimiento.itemNombre, (productoTotals.get(movimiento.itemNombre) ?? 0) + movimiento.cantidad);
    }
    if (movimiento.responsable) {
      responsableTotals.set(movimiento.responsable, (responsableTotals.get(movimiento.responsable) ?? 0) + 1);
    }
  });

  const topProduct = [...productoTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Sin datos';
  const topResponsable = [...responsableTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Sin datos';

  return {
    total: movimientos.length,
    entradas: movimientos.filter((movimiento) => movimiento.tipoMovimiento === 'Entrada').length,
    salidas: movimientos.filter((movimiento) => movimiento.tipoMovimiento === 'Salida').length,
    litrosProducto: movimientos
      .filter((movimiento) => movimiento.origen === 'Producto')
      .reduce((sum, movimiento) => sum + movimiento.cantidad, 0),
    articulosBodega: movimientos
      .filter((movimiento) => movimiento.origen === 'Bodega')
      .reduce((sum, movimiento) => sum + movimiento.cantidad, 0),
    topProduct,
    topResponsable
  };
}

export function movimientoSearchText(movimiento: HistorialMovimiento): string {
  return [
    movimiento.id,
    movimiento.origen,
    movimiento.tipoMovimiento,
    movimiento.itemId,
    movimiento.itemNombre,
    movimiento.categoria,
    movimiento.responsable,
    movimiento.motivo,
    movimiento.idCliente,
    movimiento.cliente,
    movimiento.idMaquina,
    movimiento.maquina,
    movimiento.idServicio,
    formatDate(movimiento.fecha)
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

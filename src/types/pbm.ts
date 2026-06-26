export type SiNo = 'SI' | 'NO';
export type Prioridad = 'Baja' | 'Media' | 'Alta' | 'Critica';
export type TipoMovimiento = 'Entrada' | 'Salida';
export type EstadoCliente = 'Activo' | 'Pausado' | 'Prospecto' | 'Inactivo';
export type EstadoMaquina = 'Activa' | 'Mantenimiento' | 'Prueba' | 'Retirada';
export type Responsable = string;

export type ServiceStatus = 'Sin programar' | 'Pendiente' | 'Realizado';
export type StockStatus = 'Suficiente' | 'Bajo' | 'Critico';
export type ProductoUsadoServicio = 'Bio Metal 3000' | 'Ultragreen BA15' | 'Ultrared BA15' | 'Otro' | 'Indefinido / No aplica' | string;
export type ServicePhotoKind = 'antes' | 'despues' | 'evidencia';

export interface ServicePhotoUpload {
  kind: ServicePhotoKind;
  label: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  sizeBytes: number;
  capturedAt: string;
}

export type ServicePhotoUploadMap = Partial<Record<ServicePhotoKind, ServicePhotoUpload>>;

export type SheetTable =
  | 'Clientes'
  | 'Maquinas'
  | 'Servicios'
  | 'Historial Servicios'
  | 'Productos'
  | 'Movimientos Producto'
  | 'Stock Bodega'
  | 'Movimientos Bodega'
  | 'Push Tokens'
  | 'Push Logs';

export interface Cliente {
  idCliente: string;
  empresa: string;
  ciudad: string;
  activo: SiNo | string;
  frecuenciaDias: number | null;
  logoCliente: string;
  tipoCliente: string;
  prioridad: Prioridad | string;
  estadoCliente: EstadoCliente | string;
}

export interface Maquina {
  idMaquina: string;
  idCliente: string;
  empresa: string;
  modelo: string;
  capacidadLitros: number | null;
  idProducto: string;
  producto: string;
  estado: EstadoMaquina | string;
  observaciones?: string;
  fotoMaquina: string;
  ubicacionArea: string;
  prioridadServicio: Prioridad | string;
}

export interface Servicio {
  idServicio: string;
  fechaProgramada: string;
  idCliente: string;
  cliente: string;
  idMaquina: string;
  modelo: string;
  tipoServicio?: string;
  idProducto: string;
  producto: string;
  litrosEstimados: number | null;
  litrosUsados?: number | null;
  productoUsado?: ProductoUsadoServicio;
  responsable: Responsable;
  observacionesServicio?: string;
  fechaRealizado: string;
  eliminado?: SiNo | string;
}

export interface HistorialServicio {
  idHistorialServicio: string;
  idServicio: string;
  fechaProgramada: string;
  fechaRealizado: string;
  idCliente: string;
  cliente: string;
  idMaquina: string;
  modelo: string;
  tipoServicio: string;
  idProducto: string;
  productoUsado: ProductoUsadoServicio;
  litrosUsados: number | null;
  responsable: Responsable;
  observacionesServicio: string;
  fotosServicio?: string;
  fotoAntes?: string;
  fotoDespues?: string;
  fotoEvidencia?: string;
  carpetaDrive?: string;
  pdfServicio?: string;
  eliminado?: SiNo | string;
}

export interface Producto {
  idProducto: string;
  producto: string;
  unidad: string;
  existenciaActualLitros: number | null;
  cantidadMinimaLitros: number | null;
  activo: SiNo | string;
}

export interface MovimientoProducto {
  idMovimientoProducto: string;
  fecha: string;
  tipoMovimiento: TipoMovimiento | string;
  idProducto: string;
  litros: number | null;
  idCliente: string;
  idMaquina: string;
  idServicio: string;
  motivo: string;
  responsable: Responsable;
  eliminado?: SiNo | string;
}

export interface ArticuloBodega {
  idArticulo: string;
  articulo: string;
  categoria: string;
  unidad: string;
  stockMinimo: number | null;
  ubicacion: string;
  activo: SiNo | string;
  stockActual: number | null;
  fechaUltimaEntrada?: string;
  fechaUltimaSalida?: string;
}

export interface MovimientoBodega {
  idMovimiento: string;
  fecha: string;
  tipoMovimiento: TipoMovimiento | string;
  idArticulo: string;
  cantidad: number | null;
  responsable: Responsable;
  motivo: string;
  eliminado?: SiNo | string;
}

export interface PbmData {
  clientes: Cliente[];
  maquinas: Maquina[];
  servicios: Servicio[];
  historialServicios: HistorialServicio[];
  productos: Producto[];
  movimientosProducto: MovimientoProducto[];
  stockBodega: ArticuloBodega[];
  movimientosBodega: MovimientoBodega[];
  sync: SyncMeta;
}

export interface SyncMeta {
  source: 'mock' | 'apps-script';
  loadedAt: string;
  apiUrlConfigured: boolean;
}

export interface MovimientoProductoInput {
  fecha: string;
  tipoMovimiento: TipoMovimiento;
  idProducto: string;
  litros: number;
  idCliente?: string;
  idMaquina?: string;
  idServicio?: string;
  motivo: string;
  responsable: string;
}

export interface MovimientoBodegaInput {
  fecha: string;
  tipoMovimiento: TipoMovimiento;
  idArticulo: string;
  cantidad: number;
  responsable: string;
  motivo: string;
}

export interface ServicioUpdateInput {
  idServicio: string;
  fechaProgramada?: string;
  observacionesServicio?: string;
  fechaRealizado?: string;
  responsable?: string;
  litrosUsados?: number | null;
  productoUsado?: string;
  eliminado?: SiNo | string;
}

export interface ServicioCreateInput {
  fechaProgramada: string;
  idCliente: string;
  cliente: string;
  idMaquina: string;
  modelo: string;
  tipoServicio?: string;
  idProducto: string;
  producto: string;
  litrosEstimados: number | null;
  litrosUsados?: number | null;
  productoUsado?: string;
  responsable: string;
  observacionesServicio?: string;
  fechaRealizado?: string;
  eliminado?: SiNo | string;
}

export interface ServicioRealizadoInput {
  idServicio: string;
  fechaRealizado: string;
  observacionesServicio: string;
  litrosUsados: number | null;
  productoUsado: string;
  responsable: string;
  fotosServicio?: ServicePhotoUploadMap;
}

import type { SheetTable } from '../types/pbm';

export const SHEET_ID = '19e1jMJQJUd46aXYiG7mbHDpH4T1fObDkI5tjMbHdL9c';
export const SHEET_NAME = 'PBM Control - Base Normalizada V1';

export const SHEET_HEADERS: Record<SheetTable, string[]> = {
  Clientes: [
    'ID Cliente',
    'Empresa',
    'Ciudad',
    'Activo',
    'Frecuencia Dias',
    'Logo Cliente',
    'Tipo Cliente',
    'Prioridad',
    'Estado Cliente'
  ],
  Maquinas: [
    'ID Maquina',
    'ID Cliente',
    'Empresa',
    'Modelo',
    'Capacidad Litros',
    'ID Producto',
    'Producto',
    'Estado',
    'Observaciones',
    'Foto Maquina',
    'Ubicacion Area',
    'Prioridad Servicio'
  ],
  Servicios: [
    'ID Servicio',
    'Fecha Programada',
    'ID Cliente',
    'Cliente',
    'ID Maquina',
    'Modelo',
    'Tipo Servicio',
    'ID Producto',
    'Producto',
    'Litros Estimados',
    'Litros Usados',
    'Producto Usado',
    'Responsable',
    'Observaciones Servicio',
    'Fecha Realizado',
    'Eliminado'
  ],
  'Historial Servicios': [
    'ID Historial Servicio',
    'ID Servicio',
    'Fecha Programada',
    'Fecha Realizado',
    'ID Cliente',
    'Cliente',
    'ID Maquina',
    'Modelo',
    'Tipo Servicio',
    'ID Producto',
    'Producto Usado',
    'Litros Usados',
    'Responsable',
    'Observaciones Servicio',
    'Eliminado'
  ],
  Productos: [
    'ID Producto',
    'Producto',
    'Unidad',
    'Existencia Actual Litros',
    'Cantidad Minima Litros',
    'Activo'
  ],
  'Movimientos Producto': [
    'ID Movimiento Producto',
    'Fecha',
    'Tipo Movimiento',
    'ID Producto',
    'Litros',
    'ID Cliente',
    'ID Maquina',
    'ID Servicio',
    'Motivo',
    'Responsable',
    'Eliminado'
  ],
  'Stock Bodega': [
    'ID Articulo',
    'Articulo',
    'Categoria',
    'Unidad',
    'Stock Minimo',
    'Ubicacion',
    'Activo',
    'Stock Actual'
  ],
  'Movimientos Bodega': [
    'ID Movimiento',
    'Fecha',
    'Tipo Movimiento',
    'ID Articulo',
    'Cantidad',
    'Responsable',
    'Motivo',
    'Eliminado'
  ],
  'Ingreso Factura Producto': [
    'ID Ingreso Factura',
    'Fecha Registro',
    'ID Cliente',
    'Cliente',
    'Litros Entrada',
    'Litros Salida Manual',
    'Litros Servicios Realizados',
    'Saldo Informativo',
    'Factura PDF',
    'Comprobante Pago PDF',
    'Carpeta Drive',
    'Responsable',
    'Observaciones',
    'Eliminado'
  ],
  'Push Tokens': [
    'ID Token',
    'Usuario',
    'Rol',
    'Token',
    'Dispositivo',
    'Navegador',
    'Activo',
    'Fecha Registro',
    'Ultima Actualizacion'
  ],
  'Push Logs': [
    'ID Push Log',
    'Fecha Hora',
    'Tipo',
    'Usuario',
    'Rol',
    'Token',
    'ID Servicio',
    'Cliente',
    'Titulo',
    'Mensaje',
    'Action URL',
    'Estado',
    'Error',
    'Clave Unica'
  ]
};

export const TABLES: SheetTable[] = [
  'Clientes',
  'Maquinas',
  'Servicios',
  'Historial Servicios',
  'Productos',
  'Movimientos Producto',
  'Stock Bodega',
  'Movimientos Bodega',
  'Ingreso Factura Producto',
  'Push Tokens',
  'Push Logs'
];

export const ID_PREFIX_BY_TABLE: Partial<Record<SheetTable, string>> = {
  'Historial Servicios': 'HS',
  'Movimientos Producto': 'MP',
  'Movimientos Bodega': 'MB',
  'Ingreso Factura Producto': 'IFP',
  'Push Tokens': 'PT',
  'Push Logs': 'PLG'
};

export const SHEET_VALIDATIONS = {
  siNo: ['SI', 'NO'],
  prioridad: ['Baja', 'Media', 'Alta', 'Critica'],
  estadoCliente: ['Activo', 'Pausado', 'Prospecto', 'Inactivo'],
  estadoMaquina: ['Activa', 'Mantenimiento', 'Prueba', 'Retirada'],
  tipoMovimiento: ['Entrada', 'Salida'],
  categoriaBodega: ['Limpieza', 'Seguridad', 'Refacciones', 'Herramienta'],
  unidad: ['Litros', 'Piezas', 'Pares'],
  responsables: ['Anibal', 'Ruth', 'William', 'Francisco', 'Karen'],
  productoUsadoServicio: ['Bio Metal 3000', 'Ultragreen BA15', 'Ultrared BA15', 'Otro', 'Indefinido / No aplica'],
  tipoServicio: ['Servicio maquina', 'Ingreso de Material']
} as const;

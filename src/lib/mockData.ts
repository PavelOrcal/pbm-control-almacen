import type { PbmData } from '../types/pbm';

// Temporal mock for local UI work when VITE_API_URL is not configured.
// Values are limited to rows read from the real "PBM Control - Base Normalizada V1" sheet.
export const mockData: PbmData = {
  clientes: [
    { idCliente: 'C001', empresa: 'INTER MG', ciudad: 'Aguascalientes', activo: 'SI', frecuenciaDias: 30, logoCliente: '', tipoCliente: 'Cliente industrial', prioridad: 'Alta', estadoCliente: 'Activo' },
    { idCliente: 'C002', empresa: 'PROAN (HUEVO SAN JUAN)', ciudad: 'San Juan de los Lagos', activo: 'SI', frecuenciaDias: 30, logoCliente: '', tipoCliente: 'Cliente industrial', prioridad: 'Media', estadoCliente: 'Activo' },
    { idCliente: 'C003', empresa: 'FRIO EXPRESS', ciudad: 'Aguascalientes', activo: 'SI', frecuenciaDias: 30, logoCliente: '', tipoCliente: 'Cliente flotilla / refrigeracion', prioridad: 'Alta', estadoCliente: 'Activo' },
    { idCliente: 'C004', empresa: 'COCA COLA TROJES', ciudad: 'Aguascalientes ', activo: 'SI', frecuenciaDias: 30, logoCliente: '', tipoCliente: 'Cliente corporativo / transporte', prioridad: 'Alta', estadoCliente: 'Activo' },
    { idCliente: 'C005', empresa: 'COCA COLA COYOTES', ciudad: 'Aguascalientes', activo: 'SI', frecuenciaDias: 30, logoCliente: '', tipoCliente: 'Cliente corporativo / transporte', prioridad: 'Alta', estadoCliente: 'Activo' },
    { idCliente: 'C006', empresa: 'CAPSTONE COOPER', ciudad: 'Zacatecas', activo: 'SI', frecuenciaDias: 30, logoCliente: '', tipoCliente: 'Cliente minero / alto consumo', prioridad: 'Critica', estadoCliente: 'Activo' }
  ],
  maquinas: [
    { idMaquina: 'PGD-160-001', idCliente: 'C001', empresa: 'INTER MG', modelo: 'PL-200', capacidadLitros: 160, idProducto: 'PD-001', producto: 'Bio Metal 3000', estado: 'Activa', observaciones: 'INTER MG', fotoMaquina: '', ubicacionArea: 'INTER MG general', prioridadServicio: 'Alta' },
    { idMaquina: 'PCH-80-23', idCliente: 'C001', empresa: 'INTER MG', modelo: 'PL-100', capacidadLitros: 80, idProducto: 'PD-001', producto: 'Bio Metal 3000', estado: 'Activa', observaciones: 'INTER MG (CUERNAVACA)', fotoMaquina: '', ubicacionArea: 'INTER MG Cuernavaca', prioridadServicio: 'Media' },
    { idMaquina: 'PGD-160-27', idCliente: 'C001', empresa: 'INTER MG', modelo: 'PGD-200', capacidadLitros: 160, idProducto: 'PD-001', producto: 'Bio Metal 3000', estado: 'Activa', observaciones: 'INTER MG (MONOBLOCK DE MOTORES)', fotoMaquina: '', ubicacionArea: 'Monoblock de motores', prioridadServicio: 'Alta' },
    { idMaquina: 'PCH-80-008', idCliente: 'C002', empresa: 'PROAN (HUEVO SAN JUAN)', modelo: 'PBT-80', capacidadLitros: 40, idProducto: 'PD-001', producto: 'Bio Metal 3000', estado: 'Activa', observaciones: 'PROAN (HUEVO SAN JUAN)', fotoMaquina: '', ubicacionArea: 'Area general PROAN', prioridadServicio: 'Media' },
    { idMaquina: 'PGD-160-11', idCliente: 'C003', empresa: 'FRIO EXPRESS', modelo: 'PL-200', capacidadLitros: 160, idProducto: 'PD-001', producto: 'Bio Metal 3000', estado: 'Activa', observaciones: 'FRIO EXPRESS (REFRIGERACION)', fotoMaquina: '', ubicacionArea: 'Refrigeracion', prioridadServicio: 'Alta' },
    { idMaquina: 'PGD-160-20', idCliente: 'C003', empresa: 'FRIO EXPRESS', modelo: 'PL-200', capacidadLitros: 160, idProducto: 'PD-001', producto: 'Bio Metal 3000', estado: 'Activa', observaciones: 'FRIO EXPRESS (FRENOS)', fotoMaquina: '', ubicacionArea: 'Frenos', prioridadServicio: 'Alta' },
    { idMaquina: 'PGD-160-28', idCliente: 'C003', empresa: 'FRIO EXPRESS', modelo: 'PL-200', capacidadLitros: 160, idProducto: 'PD-001', producto: 'Bio Metal 3000', estado: 'Activa', observaciones: 'FRIO EXPRESS (MOTORES)', fotoMaquina: '', ubicacionArea: 'Motores', prioridadServicio: 'Alta' },
    { idMaquina: 'PCH-80-013', idCliente: 'C004', empresa: 'COCA COLA TROJES', modelo: 'PL-100', capacidadLitros: 90, idProducto: 'PD-001', producto: 'Bio Metal 3000', estado: 'Activa', observaciones: 'COCA COLA TROJES TRANSPORTES AGS (1)', fotoMaquina: '', ubicacionArea: 'Transportes AGS 1', prioridadServicio: 'Alta' },
    { idMaquina: 'PCH-80-014', idCliente: 'C004', empresa: 'COCA COLA TROJES', modelo: 'PL-100', capacidadLitros: 90, idProducto: 'PD-001', producto: 'Bio Metal 3000', estado: 'Activa', observaciones: 'COCA COLA TROJES TRANSPORTES AGS (2)', fotoMaquina: '', ubicacionArea: 'Transportes AGS 2', prioridadServicio: 'Alta' },
    { idMaquina: 'PCH-80-018', idCliente: 'C004', empresa: 'COCA COLA TROJES', modelo: 'PL-100', capacidadLitros: 90, idProducto: 'PD-001', producto: 'Bio Metal 3000', estado: 'Activa', observaciones: 'COCA COLA TROJES (PRODUCCION)', fotoMaquina: '', ubicacionArea: 'Produccion', prioridadServicio: 'Alta' },
    { idMaquina: 'PCH-80-015', idCliente: 'C005', empresa: 'COCA COLA COYOTES', modelo: 'PL-100', capacidadLitros: 90, idProducto: 'PD-001', producto: 'Bio Metal 3000', estado: 'Activa', observaciones: 'COCA COLA AGUASCALIENTES TRANSPORTES (COYOTES)', fotoMaquina: '', ubicacionArea: 'Transportes Coyotes', prioridadServicio: 'Alta' },
    { idMaquina: 'PGD-160-03', idCliente: 'C006', empresa: 'CAPSTONE COOPER', modelo: 'PL-200', capacidadLitros: 200, idProducto: 'PD-001', producto: 'Bio Metal 3000', estado: 'Activa', observaciones: 'Mina Capstone Gold: mantenimiento mina', fotoMaquina: '', ubicacionArea: 'Mantenimiento mina', prioridadServicio: 'Critica' },
    { idMaquina: 'PCH-80-004', idCliente: 'C006', empresa: 'CAPSTONE COOPER', modelo: 'PL-100', capacidadLitros: 100, idProducto: 'PD-001', producto: 'Bio Metal 3000', estado: 'Activa', observaciones: 'Mina Capstone Gold: tornero', fotoMaquina: '', ubicacionArea: 'Tornero', prioridadServicio: 'Alta' },
    { idMaquina: 'PCH-80-005', idCliente: 'C006', empresa: 'CAPSTONE COOPER', modelo: 'PL-100', capacidadLitros: 100, idProducto: 'PD-001', producto: 'Bio Metal 3000', estado: 'Activa', observaciones: 'Mina Capstone Gold: interior mina nivel 10.2', fotoMaquina: '', ubicacionArea: 'Interior mina nivel 10.2', prioridadServicio: 'Critica' },
    { idMaquina: 'PGD-160-06', idCliente: 'C006', empresa: 'CAPSTONE COOPER', modelo: 'PL-200', capacidadLitros: 200, idProducto: 'PD-001', producto: 'Bio Metal 3000', estado: 'Activa', observaciones: 'Mina Capstone Gold: interior mina 17.2', fotoMaquina: '', ubicacionArea: 'Interior mina 17.2', prioridadServicio: 'Critica' },
    { idMaquina: 'PGD-160-29', idCliente: 'C006', empresa: 'CAPSTONE COOPER', modelo: 'PL-200', capacidadLitros: 200, idProducto: 'PD-001', producto: 'Bio Metal 3000', estado: 'Activa', observaciones: 'CAPSTONE COOPER interior mina nivel 11', fotoMaquina: '', ubicacionArea: 'Interior mina nivel 11', prioridadServicio: 'Critica' },
    { idMaquina: 'PGD-160-30', idCliente: 'C006', empresa: 'CAPSTONE COOPER', modelo: 'PL-200', capacidadLitros: 200, idProducto: 'PD-001', producto: 'Bio Metal 3000', estado: 'Activa', observaciones: 'CAPSTONE COOPER interior taller de camionetas', fotoMaquina: '', ubicacionArea: 'Taller de camionetas', prioridadServicio: 'Critica' }
  ],
  servicios: [
    { idServicio: 'SER-001', fechaProgramada: '', idCliente: 'C001', cliente: 'INTER MG', idMaquina: 'PGD-160-001', modelo: 'PL-200', idProducto: 'PD-001', producto: 'Bio Metal 3000', litrosEstimados: 160, responsable: 'William', fechaRealizado: '' },
    { idServicio: 'SER-002', fechaProgramada: '', idCliente: 'C001', cliente: 'INTER MG', idMaquina: 'PCH-80-23', modelo: 'PL-100', idProducto: 'PD-001', producto: 'Bio Metal 3000', litrosEstimados: 80, responsable: 'William', fechaRealizado: '' },
    { idServicio: 'SER-003', fechaProgramada: '', idCliente: 'C001', cliente: 'INTER MG', idMaquina: 'PGD-160-27', modelo: 'PGD-200', idProducto: 'PD-001', producto: 'Bio Metal 3000', litrosEstimados: 160, responsable: 'William', fechaRealizado: '' },
    { idServicio: 'SER-004', fechaProgramada: '', idCliente: 'C002', cliente: 'PROAN (HUEVO SAN JUAN)', idMaquina: 'PCH-80-008', modelo: 'PBT-80', idProducto: 'PD-001', producto: 'Bio Metal 3000', litrosEstimados: 40, responsable: 'William', fechaRealizado: '' },
    { idServicio: 'SER-005', fechaProgramada: '', idCliente: 'C003', cliente: 'FRIO EXPRESS', idMaquina: 'PGD-160-11', modelo: 'PL-200', idProducto: 'PD-001', producto: 'Bio Metal 3000', litrosEstimados: 160, responsable: 'William', fechaRealizado: '' },
    { idServicio: 'SER-006', fechaProgramada: '', idCliente: 'C003', cliente: 'FRIO EXPRESS', idMaquina: 'PGD-160-20', modelo: 'PL-200', idProducto: 'PD-001', producto: 'Bio Metal 3000', litrosEstimados: 160, responsable: 'William', fechaRealizado: '' },
    { idServicio: 'SER-007', fechaProgramada: '', idCliente: 'C003', cliente: 'FRIO EXPRESS', idMaquina: 'PGD-160-28', modelo: 'PL-200', idProducto: 'PD-001', producto: 'Bio Metal 3000', litrosEstimados: 160, responsable: 'William', fechaRealizado: '' },
    { idServicio: 'SER-008', fechaProgramada: '', idCliente: 'C004', cliente: 'COCA COLA TROJES', idMaquina: 'PCH-80-013', modelo: 'PL-100', idProducto: 'PD-001', producto: 'Bio Metal 3000', litrosEstimados: 90, responsable: 'William', fechaRealizado: '' },
    { idServicio: 'SER-009', fechaProgramada: '', idCliente: 'C004', cliente: 'COCA COLA TROJES', idMaquina: 'PCH-80-014', modelo: 'PL-100', idProducto: 'PD-001', producto: 'Bio Metal 3000', litrosEstimados: 90, responsable: 'William', fechaRealizado: '' },
    { idServicio: 'SER-010', fechaProgramada: '', idCliente: 'C004', cliente: 'COCA COLA TROJES', idMaquina: 'PCH-80-018', modelo: 'PL-100', idProducto: 'PD-001', producto: 'Bio Metal 3000', litrosEstimados: 90, responsable: 'William', fechaRealizado: '' },
    { idServicio: 'SER-011', fechaProgramada: '', idCliente: 'C005', cliente: 'COCA COLA COYOTES', idMaquina: 'PCH-80-015', modelo: 'PL-100', idProducto: 'PD-001', producto: 'Bio Metal 3000', litrosEstimados: 90, responsable: 'William', fechaRealizado: '' },
    { idServicio: 'SER-012', fechaProgramada: '', idCliente: 'C006', cliente: 'CAPSTONE COOPER', idMaquina: 'PGD-160-03', modelo: 'PL-200', idProducto: 'PD-001', producto: 'Bio Metal 3000', litrosEstimados: 200, responsable: 'William', fechaRealizado: '' },
    { idServicio: 'SER-013', fechaProgramada: '', idCliente: 'C006', cliente: 'CAPSTONE COOPER', idMaquina: 'PCH-80-004', modelo: 'PL-100', idProducto: 'PD-001', producto: 'Bio Metal 3000', litrosEstimados: 100, responsable: 'William', fechaRealizado: '' },
    { idServicio: 'SER-014', fechaProgramada: '', idCliente: 'C006', cliente: 'CAPSTONE COOPER', idMaquina: 'PCH-80-005', modelo: 'PL-100', idProducto: 'PD-001', producto: 'Bio Metal 3000', litrosEstimados: 100, responsable: 'William', fechaRealizado: '' },
    { idServicio: 'SER-015', fechaProgramada: '', idCliente: 'C006', cliente: 'CAPSTONE COOPER', idMaquina: 'PGD-160-06', modelo: 'PL-200', idProducto: 'PD-001', producto: 'Bio Metal 3000', litrosEstimados: 200, responsable: 'William', fechaRealizado: '' },
    { idServicio: 'SER-016', fechaProgramada: '', idCliente: 'C006', cliente: 'CAPSTONE COOPER', idMaquina: 'PGD-160-29', modelo: 'PL-200', idProducto: 'PD-001', producto: 'Bio Metal 3000', litrosEstimados: 200, responsable: 'William', fechaRealizado: '' },
    { idServicio: 'SER-017', fechaProgramada: '', idCliente: 'C006', cliente: 'CAPSTONE COOPER', idMaquina: 'PGD-160-30', modelo: 'PL-200', idProducto: 'PD-001', producto: 'Bio Metal 3000', litrosEstimados: 200, responsable: 'William', fechaRealizado: '' }
  ],
  historialServicios: [],
  productos: [
    { idProducto: 'PD-001', producto: 'Bio Metal 3000', unidad: 'Litros', existenciaActualLitros: 80, cantidadMinimaLitros: 200, activo: 'SI' },
    { idProducto: 'PD-002', producto: 'Ultragreen BA15', unidad: 'Litros', existenciaActualLitros: 0, cantidadMinimaLitros: 0, activo: 'SI' },
    { idProducto: 'PD-003', producto: 'Ultrared BA15', unidad: 'Litros', existenciaActualLitros: 0, cantidadMinimaLitros: 0, activo: 'SI' }
  ],
  movimientosProducto: [
    { idMovimientoProducto: 'MP-001', fecha: '05/06/2026', tipoMovimiento: 'Entrada', idProducto: 'PD-001', litros: 200, idCliente: '', idMaquina: '', idServicio: '', motivo: 'Compra/Produccion', responsable: 'Omar' },
    { idMovimientoProducto: 'MP-002', fecha: '08/06/2026', tipoMovimiento: 'Salida', idProducto: 'PD-001', litros: 120, idCliente: 'C001', idMaquina: 'PGD-160-001', idServicio: 'SER-001', motivo: 'Servicio/Relleno', responsable: 'William' }
  ],
  stockBodega: [
    { idArticulo: 'ART-001', articulo: 'Estopas', categoria: 'Limpieza', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 16 },
    { idArticulo: 'ART-002', articulo: 'Guantes Cortos', categoria: 'Seguridad', unidad: 'Pares', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 3 },
    { idArticulo: 'ART-003', articulo: 'Guantes Largos', categoria: 'Seguridad', unidad: 'Pares', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 3 },
    { idArticulo: 'ART-004', articulo: 'Filtros de maquina', categoria: 'Refacciones', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 0 },
    { idArticulo: 'ART-005', articulo: 'Cepillo para desengrase', categoria: 'Herramienta', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 5 },
    { idArticulo: 'ART-006', articulo: 'Aspersor', categoria: 'Herramienta', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 1 },
    { idArticulo: 'ART-007', articulo: 'Bomba Little Giants', categoria: 'Herramienta', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 3 },
    { idArticulo: 'ART-008', articulo: 'Cartucho Tinta Impresora', categoria: 'Herramienta', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 1 },
    { idArticulo: 'ART-009', articulo: 'Mecate', categoria: 'Herramienta', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 1 },
    { idArticulo: 'ART-010', articulo: 'Cinta de Aislar Grande', categoria: 'Refacciones', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 4 },
    { idArticulo: 'ART-011', articulo: 'Cinta de Aislar Chica', categoria: 'Refacciones', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 2 },
    { idArticulo: 'ART-012', articulo: 'Contacto Duplex', categoria: 'Refacciones', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 6 },
    { idArticulo: 'ART-013', articulo: 'Silicon Azul', categoria: 'Refacciones', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 1 },
    { idArticulo: 'ART-014', articulo: 'Valvula 3/4', categoria: 'Refacciones', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 2 },
    { idArticulo: 'ART-015', articulo: 'Abrazadera 1/2', categoria: 'Refacciones', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 6 },
    { idArticulo: 'ART-016', articulo: 'Valvula 1/2', categoria: 'Refacciones', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 1 },
    { idArticulo: 'ART-017', articulo: 'Apartadores Cola de Rata', categoria: 'Refacciones', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 1 },
    { idArticulo: 'ART-018', articulo: 'Aerosol Azul', categoria: 'Refacciones', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 1 },
    { idArticulo: 'ART-019', articulo: 'Aerosol Tambos', categoria: 'Refacciones', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 1 },
    { idArticulo: 'ART-020', articulo: 'Auto Rescatador', categoria: 'Seguridad', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 2 },
    { idArticulo: 'ART-021', articulo: 'Lentes Proteccion', categoria: 'Seguridad', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 0 },
    { idArticulo: 'ART-022', articulo: 'Casco', categoria: 'Seguridad', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'NO', stockActual: 0 },
    { idArticulo: 'ART-023', articulo: 'Cono', categoria: 'Seguridad', unidad: 'Piezas', stockMinimo: 1, ubicacion: 'Oficina', activo: 'SI', stockActual: 1 }
  ],
  movimientosBodega: [
    { idMovimiento: 'MB-001', fecha: '07/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-001', cantidad: 16, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-002', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-002', cantidad: 3, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-003', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-003', cantidad: 3, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-004', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-004', cantidad: null, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-005', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-005', cantidad: 5, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-006', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-006', cantidad: 1, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-007', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-007', cantidad: 3, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-008', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-008', cantidad: 1, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-009', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-009', cantidad: 1, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-010', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-010', cantidad: 4, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-011', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-011', cantidad: 2, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-012', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-012', cantidad: 6, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-013', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-013', cantidad: 1, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-014', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-014', cantidad: 2, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-015', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-015', cantidad: 6, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-016', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-016', cantidad: 1, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-017', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-017', cantidad: 1, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-018', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-018', cantidad: 1, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-019', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-019', cantidad: 1, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-020', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-020', cantidad: 2, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-021', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-021', cantidad: null, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-022', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-022', cantidad: null, responsable: 'Omar', motivo: 'Compra inicial' },
    { idMovimiento: 'MB-023', fecha: '08/06/2026', tipoMovimiento: 'Entrada', idArticulo: 'ART-023', cantidad: 1, responsable: 'Omar', motivo: 'Compra inicial' }
  ],
  ingresoFacturaProducto: [],
  sync: {
    source: 'mock',
    loadedAt: new Date().toISOString(),
    apiUrlConfigured: false
  }
};

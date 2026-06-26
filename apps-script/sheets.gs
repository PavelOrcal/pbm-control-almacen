const SHEET_HEADERS = {
  'Clientes': ['ID Cliente', 'Empresa', 'Ciudad', 'Activo', 'Frecuencia Dias', 'Logo Cliente', 'Tipo Cliente', 'Prioridad', 'Estado Cliente'],
  'Maquinas': ['ID Maquina', 'ID Cliente', 'Empresa', 'Modelo', 'Capacidad Litros', 'ID Producto', 'Producto', 'Estado', 'Observaciones', 'Foto Maquina', 'Ubicacion Area', 'Prioridad Servicio'],
  'Servicios': ['ID Servicio', 'Fecha Programada', 'ID Cliente', 'Cliente', 'ID Maquina', 'Modelo', 'Tipo Servicio', 'ID Producto', 'Producto', 'Litros Estimados', 'Litros Usados', 'Producto Usado', 'Responsable', 'Observaciones Servicio', 'Fecha Realizado', 'Eliminado'],
  'Historial Servicios': ['ID Historial Servicio', 'ID Servicio', 'Fecha Programada', 'Fecha Realizado', 'ID Cliente', 'Cliente', 'ID Maquina', 'Modelo', 'Tipo Servicio', 'ID Producto', 'Producto Usado', 'Litros Usados', 'Responsable', 'Observaciones Servicio', 'Fotos Servicio', 'Foto Antes', 'Foto Después', 'Foto Evidencia', 'Carpeta Drive', 'PDF Servicio', 'Eliminado'],
  'Productos': ['ID Producto', 'Producto', 'Unidad', 'Existencia Actual Litros', 'Cantidad Minima Litros', 'Activo'],
  'Movimientos Producto': ['ID Movimiento Producto', 'Fecha', 'Tipo Movimiento', 'ID Producto', 'Litros', 'ID Cliente', 'ID Maquina', 'ID Servicio', 'Motivo', 'Responsable', 'Eliminado'],
  'Stock Bodega': ['ID Articulo', 'Articulo', 'Categoria', 'Unidad', 'Stock Minimo', 'Ubicacion', 'Activo', 'Stock Actual'],
  'Movimientos Bodega': ['ID Movimiento', 'Fecha', 'Tipo Movimiento', 'ID Articulo', 'Cantidad', 'Responsable', 'Motivo', 'Eliminado'],
  'Push Tokens': ['ID Token', 'Usuario', 'Rol', 'Token', 'Dispositivo', 'Navegador', 'Activo', 'Fecha Registro', 'Ultima Actualizacion'],
  'Push Logs': ['ID Push Log', 'Fecha Hora', 'Tipo', 'Usuario', 'Rol', 'Token', 'ID Servicio', 'Cliente', 'Titulo', 'Mensaje', 'Action URL', 'Estado', 'Error', 'Clave Unica']
};

const TABLE_NAMES = Object.keys(SHEET_HEADERS);
const OPTIONAL_TABLES = ['Historial Servicios', 'Push Tokens', 'Push Logs'];
const OPTIONAL_HEADERS = {
  'Servicios': ['Tipo Servicio', 'Litros Usados', 'Producto Usado', 'Eliminado'],
  'Historial Servicios': ['Fotos Servicio', 'Foto Antes', 'Foto Después', 'Foto Evidencia', 'Carpeta Drive', 'PDF Servicio', 'Eliminado'],
  'Movimientos Producto': ['Eliminado'],
  'Movimientos Bodega': ['Eliminado']
};

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function assertTable(tableName) {
  if (!tableName || TABLE_NAMES.indexOf(tableName) === -1) {
    throw new Error('Invalid table: ' + tableName);
  }
}

function getSheet(tableName) {
  assertTable(tableName);
  const sheet = getSpreadsheet().getSheetByName(tableName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + tableName);
  }
  return sheet;
}

function getLiveHeaders(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  return sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(String);
}

function readTable(tableName) {
  const sheet = getSheet(tableName);
  const headers = getLiveHeaders(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getDisplayValues();
  return values
    .filter(function(row) {
      return row.some(function(value) { return String(value).trim() !== ''; });
    })
    .map(function(row) {
      const item = {};
      headers.forEach(function(header, index) {
        if (header) item[header] = row[index];
      });
      return item;
    });
}

function readAllTables() {
  const data = {};
  TABLE_NAMES.forEach(function(tableName) {
    try {
      data[tableName] = readTable(tableName);
    } catch (error) {
      if (OPTIONAL_TABLES.indexOf(tableName) !== -1 && String(error.message || error).indexOf('Sheet not found') !== -1) {
        data[tableName] = [];
        return;
      }
      throw error;
    }
  });
  return data;
}

function requireHeaders(sheet, tableName, requiredHeaders) {
  const liveHeaders = getLiveHeaders(sheet);
  requiredHeaders.forEach(function(header) {
    if (liveHeaders.indexOf(header) === -1) {
      throw new Error('Missing required header "' + header + '" in ' + tableName);
    }
  });
  return liveHeaders;
}

function requiredExpectedHeaders(tableName) {
  const optional = OPTIONAL_HEADERS[tableName] || [];
  return SHEET_HEADERS[tableName].filter(function(header) {
    return optional.indexOf(header) === -1;
  });
}

function nextId(tableName, idHeader, prefix) {
  const rows = readTable(tableName);
  let max = 0;
  rows.forEach(function(row) {
    const id = String(row[idHeader] || '');
    const match = id.match(/(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  });
  return prefix + '-' + String(max + 1).padStart(3, '0');
}

function appendWithGeneratedId(tableName, idHeader, prefix, valuesByHeader) {
  const sheet = getSheet(tableName);
  const expectedHeaders = requiredExpectedHeaders(tableName);
  const headers = requireHeaders(sheet, tableName, expectedHeaders);
  const generatedId = nextId(tableName, idHeader, prefix);
  const rowObject = Object.assign({}, valuesByHeader);
  rowObject[idHeader] = generatedId;

  const row = headers.map(function(header) {
    return rowObject[header] === undefined ? '' : rowObject[header];
  });
  sheet.appendRow(row);
  return Object.assign({ id: generatedId }, rowObject);
}

function updateById(tableName, idHeader, idValue, updatesByHeader) {
  const sheet = getSheet(tableName);
  const headers = requireHeaders(sheet, tableName, Object.keys(updatesByHeader).concat([idHeader]));
  const idColumn = headers.indexOf(idHeader);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('No rows in ' + tableName);

  const ids = sheet.getRange(2, idColumn + 1, lastRow - 1, 1).getDisplayValues();
  let targetRow = -1;
  ids.forEach(function(row, index) {
    if (String(row[0]) === String(idValue)) {
      targetRow = index + 2;
    }
  });
  if (targetRow === -1) {
    throw new Error('ID not found: ' + idValue);
  }

  Object.keys(updatesByHeader).forEach(function(header) {
    const columnIndex = headers.indexOf(header);
    if (columnIndex === -1) throw new Error('Header not found: ' + header);
    sheet.getRange(targetRow, columnIndex + 1).setValue(updatesByHeader[header]);
  });
}

function findById(tableName, idHeader, idValue) {
  const rows = readTable(tableName);
  const match = rows.find(function(row) {
    return String(row[idHeader]) === String(idValue);
  });
  if (!match) {
    throw new Error('ID not found: ' + idValue);
  }
  return match;
}

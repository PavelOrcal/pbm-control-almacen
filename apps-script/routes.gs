function routeGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'all';
    const callback = e && e.parameter && e.parameter.callback;
    if (action === 'all') {
      return jsonResponse({ ok: true, data: readAllTables() }, callback);
    }
    if (action === 'table') {
      const table = e.parameter.table;
      assertTable(table);
      return jsonResponse({ ok: true, table, data: readTable(table) }, callback);
    }
    if (action === 'schema') {
      return jsonResponse({ ok: true, data: SHEET_HEADERS }, callback);
    }
    if (e && e.parameter && e.parameter.payload) {
      const body = JSON.parse(e.parameter.payload);
      body.action = action;
      return jsonResponse(handleMutation(body), callback);
    }
    return jsonResponse({ ok: false, error: 'Unknown GET action: ' + action }, callback);
  } catch (error) {
    const callback = e && e.parameter && e.parameter.callback;
    return jsonResponse({ ok: false, error: String(error.message || error) }, callback);
  }
}

function routePost(e) {
  try {
    const body = parseBody(e);
    return jsonResponse(handleMutation(body));
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error.message || error) });
  }
}

function handleMutation(body) {
  if (!body || !body.action) {
    return { ok: false, error: 'MISSING_ACTION: action is required' };
  }
  if (body.action === 'appendMovimientoProducto') {
    const result = appendMovimientoProducto(body.row || {});
    return { ok: true, data: result };
  }
  if (body.action === 'appendMovimientoBodega') {
    const result = appendMovimientoBodega(body.row || {});
    return { ok: true, data: result };
  }
  if (body.action === 'createIngresoFacturaProducto') {
    const result = createIngresoFacturaProducto(body.row || body);
    return { ok: true, data: result };
  }
  if (body.action === 'markIngresoFacturaProductoDeleted') {
    const result = markIngresoFacturaProductoDeleted(body.idIngresoFactura);
    return { ok: true, data: result };
  }
  if (body.action === 'createServicio') {
    const result = createServicio(body.row || {});
    return { ok: true, data: result };
  }
  if (body.action === 'markServicioRealizado') {
    const result = markServicioRealizado(body);
    return { ok: true, data: result };
  }
  if (body.action === 'updateServicio') {
    const result = updateServicio(body);
    return { ok: true, data: result };
  }
  if (body.action === 'markMovimientoProductoDeleted') {
    const result = markMovimientoProductoDeleted(body.idMovimientoProducto);
    return { ok: true, data: result };
  }
  if (body.action === 'markMovimientoBodegaDeleted') {
    const result = markMovimientoBodegaDeleted(body.idMovimiento);
    return { ok: true, data: result };
  }
  if (body.action === 'markHistorialServicioDeleted') {
    const result = markHistorialServicioDeleted(body.idHistorialServicio);
    return { ok: true, data: result };
  }
  if (body.action === 'uploadServicePhoto') {
    const result = uploadServicePhoto(body);
    return { ok: true, data: result };
  }
  if (body.action === 'uploadServicePhotos') {
    const result = uploadServicePhotos(body);
    return { ok: true, data: result };
  }
  if (body.action === 'createDriveServiceFolder') {
    const result = createDriveServiceFolder(body);
    return { ok: true, data: { folderId: result.folderId, folderUrl: result.folderUrl } };
  }
  if (body.action === 'updateHistorialServicioFotos') {
    const result = updateHistorialServicioFotos(body);
    return { ok: true, data: result };
  }
  if (body.action === 'savePushToken') {
    const result = savePushToken(body.row || body);
    return { ok: true, data: result };
  }
  if (body.action === 'disablePushToken') {
    const result = disablePushToken(body.token);
    return { ok: true, data: result };
  }
  if (body.action === 'appendPushLog') {
    const result = appendPushLog(body.row || body);
    return { ok: true, data: result };
  }
  if (body.action === 'pushStatus') {
    const result = getPushStatus();
    return { ok: true, data: result };
  }
  if (body.action === 'auditServiciosDuplicados') {
    const result = auditServiciosDuplicados();
    return { ok: true, data: result };
  }
  return { ok: false, error: 'Unknown action: ' + body.action };
}

function appendMovimientoProducto(row) {
  const litros = requirePositiveInteger(row.litros !== undefined ? row.litros : row['Litros'], 'Litros', true);
  const values = {
    'Fecha': row.fecha,
    'Tipo Movimiento': row.tipoMovimiento,
    'ID Producto': row.idProducto,
    'Litros': litros,
    'ID Cliente': row.idCliente || '',
    'ID Maquina': row.idMaquina || '',
    'ID Servicio': row.idServicio || '',
    'Motivo': row.motivo,
    'Responsable': row.responsable,
    'Eliminado': 'NO'
  };
  return appendWithGeneratedId('Movimientos Producto', 'ID Movimiento Producto', 'MP', values);
}

function appendMovimientoBodega(row) {
  const cantidad = requirePositiveInteger(row.cantidad !== undefined ? row.cantidad : row['Cantidad'], 'Cantidad', true);
  const values = {
    'Fecha': row.fecha,
    'Tipo Movimiento': row.tipoMovimiento,
    'ID Articulo': row.idArticulo,
    'Cantidad': cantidad,
    'Responsable': row.responsable,
    'Motivo': row.motivo,
    'Eliminado': 'NO'
  };
  return appendWithGeneratedId('Movimientos Bodega', 'ID Movimiento', 'MB', values);
}

function ingresoFacturaValue(row, key, header) {
  return row[key] !== undefined ? row[key] : row[header];
}

function requirePositiveInteger(value, label, required) {
  const text = String(value === null || value === undefined ? '' : value).trim();
  if (!text) {
    if (required) throw new Error(label + ' es obligatorio');
    return 0;
  }
  if (!/^[1-9]\d*$/.test(text)) {
    throw new Error(label + ' debe ser un numero entero positivo');
  }
  return Number(text);
}

function sumHistorialServiciosLitrosByCliente(idCliente) {
  return readTable('Historial Servicios').reduce(function(total, row) {
    if (normalizedText(row['Eliminado']).toUpperCase() === 'SI') return total;
    if (normalizedText(row['ID Cliente']) !== normalizedText(idCliente)) return total;
    const value = Number(String(row['Litros Usados'] || '0').replace(',', '.'));
    return total + (isFinite(value) ? value : 0);
  }, 0);
}

function sumIngresoFacturaByCliente(idCliente, header) {
  return readTable('Ingreso Factura Producto').reduce(function(total, row) {
    if (normalizedText(row['Eliminado']).toUpperCase() === 'SI') return total;
    if (normalizedText(row['ID Cliente']) !== normalizedText(idCliente)) return total;
    const value = Number(String(row[header] || '0').replace(',', '.'));
    return total + (isFinite(value) ? value : 0);
  }, 0);
}

function createIngresoFacturaProducto(row) {
  const idCliente = normalizedText(ingresoFacturaValue(row, 'idCliente', 'ID Cliente'));
  const cliente = normalizedText(ingresoFacturaValue(row, 'cliente', 'Cliente'));
  const fechaRegistro = normalizedText(ingresoFacturaValue(row, 'fechaRegistro', 'Fecha Registro')) || pushTimestamp();
  const responsable = normalizedText(ingresoFacturaValue(row, 'responsable', 'Responsable'));
  if (!idCliente) throw new Error('ID Cliente es obligatorio');
  if (!cliente) throw new Error('Cliente es obligatorio');
  if (!responsable) throw new Error('Responsable es obligatorio');
  if (!row.facturaPdf || !row.facturaPdf.dataUrl) throw new Error('Factura PDF es obligatoria');

  const litrosEntrada = requirePositiveInteger(ingresoFacturaValue(row, 'litrosEntrada', 'Litros Entrada'), 'Litros Entrada', true);
  const litrosSalidaManual = requirePositiveInteger(ingresoFacturaValue(row, 'litrosSalidaManual', 'Litros Salida Manual'), 'Litros Salida Manual', false);
  requireHeaders(
    getSheet('Ingreso Factura Producto'),
    'Ingreso Factura Producto',
    requiredExpectedHeaders('Ingreso Factura Producto')
  );
  const idIngresoFactura = nextId('Ingreso Factura Producto', 'ID Ingreso Factura', 'IFP');

  const uploadResult = uploadIngresoFacturaProductoPdfs({
    row: Object.assign({}, row, {
      idIngresoFactura: idIngresoFactura,
      fechaRegistro: fechaRegistro,
      idCliente: idCliente,
      cliente: cliente
    })
  });

  const litrosServiciosRealizados = sumHistorialServiciosLitrosByCliente(idCliente);
  const totalEntrada = sumIngresoFacturaByCliente(idCliente, 'Litros Entrada') + litrosEntrada;
  const totalSalidaManual = sumIngresoFacturaByCliente(idCliente, 'Litros Salida Manual') + litrosSalidaManual;
  const saldoInformativo = totalEntrada - totalSalidaManual - litrosServiciosRealizados;

  const values = {
    'Fecha Registro': fechaRegistro,
    'ID Cliente': idCliente,
    'Cliente': cliente,
    'Litros Entrada': litrosEntrada,
    'Litros Salida Manual': litrosSalidaManual,
    'Litros Servicios Realizados': litrosServiciosRealizados,
    'Saldo Informativo': saldoInformativo,
    'Factura PDF': uploadResult.facturaPdf,
    'Comprobante Pago PDF': uploadResult.comprobantePagoPdf,
    'Carpeta Drive': uploadResult.carpetaDrive,
    'Responsable': responsable,
    'Observaciones': ingresoFacturaValue(row, 'observaciones', 'Observaciones') || '',
    'Eliminado': 'NO'
  };

  return Object.assign(
    appendWithProvidedId('Ingreso Factura Producto', 'ID Ingreso Factura', idIngresoFactura, values),
    { sharedWithLink: uploadResult.sharedWithLink }
  );
}

function markIngresoFacturaProductoDeleted(idIngresoFactura) {
  if (!idIngresoFactura) throw new Error('idIngresoFactura is required');
  updateById('Ingreso Factura Producto', 'ID Ingreso Factura', idIngresoFactura, {
    'Eliminado': 'SI'
  });
  return { idIngresoFactura: idIngresoFactura, eliminado: 'SI' };
}

function findActiveServicioByMaquina(idMaquina) {
  const machineId = normalizedText(idMaquina);
  if (!machineId || machineId.toUpperCase() === 'N/A') return null;
  const rows = readTable('Servicios');
  return rows.find(function(row) {
    return normalizedText(row['ID Maquina']) === machineId &&
      normalizedText(row['Eliminado']).toUpperCase() !== 'SI';
  }) || null;
}

function optionalPositiveInteger(value, label) {
  const text = normalizedText(value);
  if (!text) return '';
  return requirePositiveInteger(text, label, false);
}

function createServicio(row) {
  const litrosEstimados = optionalPositiveInteger(row.litrosEstimados, 'Litros Estimados');
  const litrosUsados = optionalPositiveInteger(row.litrosUsados, 'Litros Usados');
  const values = {
    'Fecha Programada': row.fechaProgramada,
    'ID Cliente': row.idCliente,
    'Cliente': row.cliente,
    'ID Maquina': row.idMaquina,
    'Modelo': row.modelo,
    'Tipo Servicio': row.tipoServicio || 'Servicio maquina',
    'ID Producto': row.idProducto,
    'Producto': row.producto,
    'Litros Estimados': litrosEstimados,
    'Litros Usados': litrosUsados,
    'Producto Usado': row.productoUsado || '',
    'Responsable': row.responsable,
    'Observaciones Servicio': row.observacionesServicio || '',
    'Fecha Realizado': row.fechaRealizado || '',
    'Eliminado': row.eliminado || 'NO'
  };

  const existing = findActiveServicioByMaquina(row.idMaquina);
  if (existing) {
    const updates = {
      'Fecha Programada': values['Fecha Programada'],
      'ID Producto': values['ID Producto'],
      'Producto': values['Producto'],
      'Litros Estimados': values['Litros Estimados'],
      'Litros Usados': values['Litros Usados'],
      'Producto Usado': values['Producto Usado'],
      'Responsable': values['Responsable'],
      'Observaciones Servicio': values['Observaciones Servicio'],
      'Fecha Realizado': values['Fecha Realizado'],
      'Eliminado': values['Eliminado']
    };
    updateById('Servicios', 'ID Servicio', existing['ID Servicio'], updates);
    return Object.assign({ id: existing['ID Servicio'], idServicio: existing['ID Servicio'], reusedExisting: true }, updates);
  }

  return appendWithGeneratedId('Servicios', 'ID Servicio', 'SER', values);
}

function normalizedText(value) {
  return String(value === null || value === undefined ? '' : value).trim();
}

function normalizedLitrosUsadosValue(value) {
  if (value === null || value === undefined || normalizedText(value) === '') return '';
  return requirePositiveInteger(value, 'Litros Usados', true);
}

function findExistingHistorialRealizado(body, servicio) {
  const litrosUsados = normalizedLitrosUsadosValue(body.litrosUsados);
  const rows = readTable('Historial Servicios');
  return rows.find(function(row) {
    return normalizedText(row['Eliminado']).toUpperCase() !== 'SI' &&
      normalizedText(row['ID Servicio']) === normalizedText(body.idServicio) &&
      normalizedText(row['Fecha Realizado']) === normalizedText(body.fechaRealizado) &&
      normalizedText(row['Observaciones Servicio']) === normalizedText(body.observacionesServicio || servicio['Observaciones Servicio']) &&
      normalizedText(row['Producto Usado']) === normalizedText(body.productoUsado || servicio['Producto Usado'] || servicio['Producto']) &&
      normalizedText(row['Litros Usados']) === normalizedText(litrosUsados) &&
      normalizedText(row['Responsable']) === normalizedText(body.responsable || servicio['Responsable']);
  });
}

function existingHistorialHasPayloadPhotos(historial, fotos) {
  if (!hasPhotoPayload(fotos)) return true;
  return ['antes', 'despues', 'evidencia'].every(function(kind) {
    if (!fotos[kind] || !fotos[kind].dataUrl) return true;
    const definition = photoDefinition(kind);
    return Boolean(normalizedText(historial[definition.column]));
  });
}

function markServicioRealizado(body) {
  const idServicio = body.idServicio;
  const fechaRealizado = body.fechaRealizado;
  if (!idServicio) throw new Error('idServicio is required');
  if (!fechaRealizado) throw new Error('fechaRealizado is required');
  const litrosUsados = normalizedLitrosUsadosValue(body.litrosUsados);

  const servicio = findById('Servicios', 'ID Servicio', idServicio);
  const existingHistorial = findExistingHistorialRealizado(body, servicio);
  if (existingHistorial) {
    let photoUpdates = {};
    if (body.fotosServicio && !existingHistorialHasPayloadPhotos(existingHistorial, body.fotosServicio)) {
      photoUpdates = uploadServicePhotosToDrive({
        idServicio: idServicio,
        cliente: existingHistorial['Cliente'] || servicio['Cliente'],
        fechaProgramada: existingHistorial['Fecha Programada'] || servicio['Fecha Programada'],
        fechaRealizado: fechaRealizado,
        fotosServicio: body.fotosServicio
      });
      if (Object.keys(photoUpdates).length > 0) {
        updateHistorialServicioFotos(Object.assign({ idHistorialServicio: existingHistorial['ID Historial Servicio'] }, photoUpdates));
      }
    }
    updateById('Servicios', 'ID Servicio', idServicio, {
      'Fecha Programada': '',
      'Observaciones Servicio': '',
      'Fecha Realizado': '',
      'Litros Usados': '',
      'Producto Usado': ''
    });
    return {
      idServicio: idServicio,
      fechaRealizado: fechaRealizado,
      historial: { id: existingHistorial['ID Historial Servicio'] },
      fotos: photoUpdates,
      duplicate: true
    };
  }

  const photoUpdates = body.fotosServicio ? uploadServicePhotosToDrive({
    idServicio: idServicio,
    cliente: servicio['Cliente'],
    fechaProgramada: servicio['Fecha Programada'],
    fechaRealizado: fechaRealizado,
    fotosServicio: body.fotosServicio
  }) : {};

  const historial = {
    'ID Servicio': idServicio,
    'Fecha Programada': servicio['Fecha Programada'],
    'Fecha Realizado': fechaRealizado,
    'ID Cliente': servicio['ID Cliente'],
    'Cliente': servicio['Cliente'],
    'ID Maquina': servicio['ID Maquina'],
    'Modelo': servicio['Modelo'],
    'Tipo Servicio': servicio['Tipo Servicio'] || 'Servicio maquina',
    'ID Producto': servicio['ID Producto'],
    'Producto Usado': body.productoUsado || servicio['Producto Usado'] || servicio['Producto'],
    'Litros Usados': litrosUsados,
    'Responsable': body.responsable || servicio['Responsable'],
    'Observaciones Servicio': body.observacionesServicio || servicio['Observaciones Servicio'],
    'Fotos Servicio': '',
    'Foto Antes': '',
    'Foto Después': '',
    'Foto Evidencia': '',
    'Carpeta Drive': '',
    'PDF Servicio': '',
    'Eliminado': 'NO'
  };
  Object.keys(photoUpdates).forEach(function(header) {
    historial[header] = photoUpdates[header];
  });

  const result = appendWithGeneratedId('Historial Servicios', 'ID Historial Servicio', 'HS', historial);

  updateById('Servicios', 'ID Servicio', idServicio, {
    'Fecha Programada': '',
    'Observaciones Servicio': '',
    'Fecha Realizado': '',
    'Litros Usados': '',
    'Producto Usado': ''
  });
  return { idServicio: idServicio, fechaRealizado: fechaRealizado, historial: result, fotos: photoUpdates };
}

function updateServicio(body) {
  const idServicio = body.idServicio;
  if (!idServicio) throw new Error('idServicio is required');

  const updates = {};
  if (body.fechaProgramada !== undefined) updates['Fecha Programada'] = body.fechaProgramada;
  if (body.observacionesServicio !== undefined) updates['Observaciones Servicio'] = body.observacionesServicio;
  if (body.fechaRealizado !== undefined) updates['Fecha Realizado'] = body.fechaRealizado;
  if (body.responsable !== undefined) updates['Responsable'] = body.responsable;
  if (body.litrosUsados !== undefined) updates['Litros Usados'] = normalizedLitrosUsadosValue(body.litrosUsados);
  if (body.productoUsado !== undefined) updates['Producto Usado'] = body.productoUsado;
  if (body.eliminado !== undefined) updates['Eliminado'] = body.eliminado;
  if (Object.keys(updates).length === 0) throw new Error('No service fields to update');

  updateById('Servicios', 'ID Servicio', idServicio, updates);
  return Object.assign({ idServicio: idServicio }, updates);
}

function markMovimientoProductoDeleted(idMovimientoProducto) {
  if (!idMovimientoProducto) throw new Error('idMovimientoProducto is required');
  updateById('Movimientos Producto', 'ID Movimiento Producto', idMovimientoProducto, {
    'Eliminado': 'SI'
  });
  return { idMovimientoProducto: idMovimientoProducto, eliminado: 'SI' };
}

function markMovimientoBodegaDeleted(idMovimiento) {
  if (!idMovimiento) throw new Error('idMovimiento is required');
  updateById('Movimientos Bodega', 'ID Movimiento', idMovimiento, {
    'Eliminado': 'SI'
  });
  return { idMovimiento: idMovimiento, eliminado: 'SI' };
}

function markHistorialServicioDeleted(idHistorialServicio) {
  if (!idHistorialServicio) throw new Error('idHistorialServicio is required');
  updateById('Historial Servicios', 'ID Historial Servicio', idHistorialServicio, {
    'Eliminado': 'SI'
  });
  return { idHistorialServicio: idHistorialServicio, eliminado: 'SI' };
}

function auditServiciosDuplicados() {
  const groups = {};
  readTable('Servicios').forEach(function(row) {
    if (normalizedText(row['Eliminado']).toUpperCase() === 'SI') return;
    const idMaquina = normalizedText(row['ID Maquina']);
    if (!idMaquina || idMaquina.toUpperCase() === 'N/A') return;
    if (!groups[idMaquina]) groups[idMaquina] = [];
    groups[idMaquina].push(row);
  });

  const duplicates = [];
  Object.keys(groups).forEach(function(idMaquina) {
    if (groups[idMaquina].length <= 1) return;
    const ids = groups[idMaquina].map(function(row) {
      return row['ID Servicio'] + ' (' + (row['Fecha Programada'] || 'Sin fecha') + ')';
    });
    Logger.log('Duplicados Servicios / ID Maquina ' + idMaquina + ': ' + ids.join(', '));
    duplicates.push({
      idMaquina: idMaquina,
      total: groups[idMaquina].length,
      servicios: ids
    });
  });

  Logger.log('Auditoria de servicios duplicados terminada. Grupos duplicados: ' + duplicates.length);
  return duplicates;
}

function pushTimestamp() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

function findPushToken(token) {
  const rows = readTable('Push Tokens');
  return rows.find(function(row) {
    return normalizedText(row['Token']) === normalizedText(token);
  });
}

function savePushToken(row) {
  if (!row || !row.token) throw new Error('token is required');
  const now = pushTimestamp();
  const existing = findPushToken(row.token);
  const values = {
    'Usuario': row.usuario || row.Usuario || '',
    'Rol': row.rol || row.Rol || '',
    'Token': row.token,
    'Dispositivo': row.dispositivo || row.Dispositivo || '',
    'Navegador': row.navegador || row.Navegador || '',
    'Activo': row.activo || row.Activo || 'SI',
    'Ultima Actualizacion': now
  };

  if (existing) {
    updateById('Push Tokens', 'ID Token', existing['ID Token'], values);
    return Object.assign({ idToken: existing['ID Token'], updated: true }, values);
  }

  values['Fecha Registro'] = now;
  return appendWithGeneratedId('Push Tokens', 'ID Token', 'PT', values);
}

function disablePushToken(token) {
  if (!token) throw new Error('token is required');
  const existing = findPushToken(token);
  if (!existing) return { token: token, active: 'NO', found: false };
  updateById('Push Tokens', 'ID Token', existing['ID Token'], {
    'Activo': 'NO',
    'Ultima Actualizacion': pushTimestamp()
  });
  return { idToken: existing['ID Token'], active: 'NO', found: true };
}

function tokenPreview(token) {
  const text = normalizedText(token);
  if (!text) return '';
  return text.slice(0, 10) + '...';
}

function readOptionalPushTable(tableName) {
  try {
    return readTable(tableName);
  } catch (error) {
    if (String(error.message || error).indexOf('Sheet not found') !== -1) return [];
    throw error;
  }
}

function pushSheetExists(tableName) {
  return Boolean(getSpreadsheet().getSheetByName(tableName));
}

function appendPushLog(row) {
  const values = {
    'Fecha Hora': row.fechaHora || row['Fecha Hora'] || pushTimestamp(),
    'Tipo': row.tipo || row.Tipo || '',
    'Usuario': row.usuario || row.Usuario || '',
    'Rol': row.rol || row.Rol || '',
    'Token': tokenPreview(row.token || row.Token || ''),
    'ID Servicio': row.idServicio || row['ID Servicio'] || '',
    'Cliente': row.cliente || row.Cliente || '',
    'Titulo': row.titulo || row.Titulo || '',
    'Mensaje': row.mensaje || row.Mensaje || '',
    'Action URL': row.actionUrl || row['Action URL'] || '',
    'Estado': row.estado || row.Estado || '',
    'Error': row.error || row.Error || '',
    'Clave Unica': row.claveUnica || row['Clave Unica'] || ''
  };
  return appendWithGeneratedId('Push Logs', 'ID Push Log', 'PLG', values);
}

function getPushStatus() {
  const tokens = readOptionalPushTable('Push Tokens');
  const logs = readOptionalPushTable('Push Logs');
  const activeTokens = tokens.filter(function(row) {
    return normalizedText(row['Activo']).toUpperCase() !== 'NO' && normalizedText(row['Token']);
  });
  const sortedLogs = logs.slice().sort(function(a, b) {
    return normalizedText(b['Fecha Hora']).localeCompare(normalizedText(a['Fecha Hora']));
  });
  const lastSent = sortedLogs.find(function(row) {
    return normalizedText(row['Estado']).toUpperCase() === 'ENVIADO';
  });
  const recentErrors = sortedLogs.filter(function(row) {
    return normalizedText(row['Estado']).toUpperCase() === 'ERROR';
  }).slice(0, 5).map(function(row) {
    return {
      fechaHora: row['Fecha Hora'],
      usuario: row['Usuario'],
      tipo: row['Tipo'],
      cliente: row['Cliente'],
      estado: row['Estado'],
      error: row['Error'],
      actionUrl: row['Action URL']
    };
  });
  return {
    pushTokensConfigured: pushSheetExists('Push Tokens'),
    pushLogsConfigured: pushSheetExists('Push Logs'),
    activeTokens: activeTokens.length,
    lastSentAt: lastSent ? lastSent['Fecha Hora'] : '',
    lastSentType: lastSent ? lastSent['Tipo'] : '',
    recentErrors: recentErrors,
    recentLogCount: sortedLogs.length
  };
}

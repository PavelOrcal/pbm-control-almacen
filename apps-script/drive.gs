const DRIVE_EVIDENCE_FOLDER_ID = '1vS692cqzmcWAvy83LCLGU47fNTBgF2z_';

function appScriptError(code, message) {
  throw new Error(code + ': ' + message);
}

function sanitizeDriveName(value) {
  return String(value || 'SIN_DATO')
    .trim()
    .replace(/[\\/:*?"<>|#%{}~&]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 120) || 'SIN_DATO';
}

function dateForFile(value) {
  const text = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = text ? new Date(text) : new Date();
  if (isNaN(date.getTime())) {
    return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function rootEvidenceFolder() {
  try {
    return DriveApp.getFolderById(DRIVE_EVIDENCE_FOLDER_ID);
  } catch (error) {
    const message = String(error && error.message ? error.message : error);
    if (message.toLowerCase().indexOf('permission') !== -1 || message.toLowerCase().indexOf('access') !== -1) {
      appScriptError('DRIVE_PERMISSION_DENIED', 'Apps Script no tiene permiso para abrir la carpeta de evidencias. ' + message);
    }
    appScriptError('DRIVE_FOLDER_NOT_FOUND', 'No se encontro la carpeta raiz de evidencias: ' + DRIVE_EVIDENCE_FOLDER_ID + '. ' + message);
  }
}

function getOrCreateChildFolder(parent, name) {
  const safeName = sanitizeDriveName(name);
  try {
    const existing = parent.getFoldersByName(safeName);
    if (existing.hasNext()) return existing.next();
    return parent.createFolder(safeName);
  } catch (error) {
    appScriptError('DRIVE_PERMISSION_DENIED', 'No se pudo crear o abrir carpeta en Drive: ' + safeName + '. ' + String(error && error.message ? error.message : error));
  }
}

function tryShareWithLink_(driveItem) {
  try {
    driveItem.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return true;
  } catch (error) {
    const message = String(error && error.message ? error.message : error);
    Logger.log('WARNING: No se pudo compartir con enlace. Se continuara con archivo privado: ' + message);
    return false;
  }
}

function createDriveServiceFolder(body) {
  const root = rootEvidenceFolder();
  const cliente = sanitizeDriveName(body.cliente || body.Cliente || 'SIN_CLIENTE');
  const idServicio = sanitizeDriveName(body.idServicio || body['ID Servicio'] || 'SIN_SERVICIO');
  const fecha = dateForFile(body.fechaProgramada || body['Fecha Programada'] || body.fechaRealizado || body['Fecha Realizado']);
  const clienteFolder = getOrCreateChildFolder(root, cliente);
  const serviceFolder = getOrCreateChildFolder(clienteFolder, idServicio + '_' + fecha);
  return {
    folder: serviceFolder,
    folderId: serviceFolder.getId(),
    folderUrl: serviceFolder.getUrl(),
    fileDate: fecha,
    idServicio: idServicio
  };
}

function photoDefinition(kind) {
  if (kind === 'antes') return { prefix: 'antes', column: 'Foto Antes' };
  if (kind === 'despues') return { prefix: 'despues', column: 'Foto Después' };
  return { prefix: 'evidencia', column: 'Foto Evidencia' };
}

function photoToBlob(photo, fileName) {
  if (!photo || !photo.dataUrl) {
    appScriptError('INVALID_PHOTO_PAYLOAD', 'Foto sin dataUrl: ' + fileName);
  }
  const dataUrl = String(photo.dataUrl || '');
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    appScriptError('INVALID_PHOTO_PAYLOAD', 'La foto no viene en formato data URL base64: ' + fileName);
  }
  try {
    const mimeType = photo.mimeType || match[1] || 'image/jpeg';
    const bytes = Utilities.base64Decode(match[2]);
    return Utilities.newBlob(bytes, mimeType, fileName);
  } catch (error) {
    appScriptError('INVALID_PHOTO_PAYLOAD', 'No se pudo convertir la foto a Blob: ' + fileName + '. ' + String(error && error.message ? error.message : error));
  }
}

function hasPhotoPayload(fotos) {
  if (!fotos) return false;
  return ['antes', 'despues', 'evidencia'].some(function(kind) {
    return fotos[kind] && fotos[kind].dataUrl;
  });
}

function uploadServicePhotosToDrive(body) {
  const fotos = body.fotosServicio || {};
  if (!hasPhotoPayload(fotos)) {
    return {};
  }

  const folderInfo = createDriveServiceFolder(body);
  const updates = {
    'Carpeta Drive': folderInfo.folderUrl
  };
  const uploaded = [];
  const createdFiles = [];
  let sharedWithLink = true;

  try {
    ['antes', 'despues', 'evidencia'].forEach(function(kind) {
      const photo = fotos[kind];
      if (!photo || !photo.dataUrl) return;
      const definition = photoDefinition(kind);
      const fileName = definition.prefix + '_' + folderInfo.idServicio + '_' + folderInfo.fileDate + '.jpg';
      const blob = photoToBlob(photo, fileName);
      const file = folderInfo.folder.createFile(blob).setName(fileName);
      createdFiles.push(file);
      const shared = tryShareWithLink_(file);
      sharedWithLink = sharedWithLink && shared;
      const publicUrl = 'https://drive.google.com/uc?export=view&id=' + file.getId();
      updates[definition.column] = publicUrl;
      uploaded.push(definition.prefix + ': ' + publicUrl + (shared ? ' (compartido)' : ' (privado)'));
    });
  } catch (error) {
    createdFiles.forEach(function(file) {
      try {
        file.setTrashed(true);
      } catch (trashError) {
        // Best effort rollback: avoid leaving partial evidence when Drive accepts only part of a batch.
      }
    });
    const message = String(error && error.message ? error.message : error);
    if (message.indexOf('INVALID_PHOTO_PAYLOAD') !== -1) throw error;
    if (message.indexOf('DRIVE_') !== -1) throw error;
    appScriptError('PHOTO_UPLOAD_FAILED', 'Fallo al subir evidencia fotografica a Drive. ' + message);
  }

  if (uploaded.length > 0) {
    updates['Fotos Servicio'] = uploaded.join('\n');
    updates.sharedWithLink = sharedWithLink;
  }
  return updates;
}

function uploadServicePhotos(body) {
  const idHistorialServicio = body.idHistorialServicio || body['ID Historial Servicio'];
  if (!idHistorialServicio) appScriptError('HISTORIAL_NOT_CREATED', 'idHistorialServicio is required para asociar fotos.');

  const historial = findById('Historial Servicios', 'ID Historial Servicio', idHistorialServicio);
  const updates = uploadServicePhotosToDrive({
    cliente: body.cliente || historial['Cliente'],
    idServicio: body.idServicio || historial['ID Servicio'],
    fechaProgramada: body.fechaProgramada || historial['Fecha Programada'],
    fechaRealizado: body.fechaRealizado || historial['Fecha Realizado'],
    fotosServicio: body.fotosServicio
  });

  if (Object.keys(updates).length > 0) {
    updateHistorialServicioFotos(Object.assign({ idHistorialServicio: idHistorialServicio }, updates));
  }
  return {
    idHistorialServicio: idHistorialServicio,
    fotos: updates
  };
}

function uploadServicePhoto(body) {
  const kind = body.kind || 'evidencia';
  const fotosServicio = {};
  fotosServicio[kind] = body.photo || body.foto || {};
  return uploadServicePhotos(Object.assign({}, body, { fotosServicio: fotosServicio }));
}

function updateHistorialServicioFotos(body) {
  const idHistorialServicio = body.idHistorialServicio || body['ID Historial Servicio'];
  if (!idHistorialServicio) appScriptError('HISTORIAL_NOT_CREATED', 'idHistorialServicio is required');
  const updates = {};
  ['Fotos Servicio', 'Foto Antes', 'Foto Después', 'Foto Evidencia', 'Carpeta Drive', 'PDF Servicio'].forEach(function(header) {
    if (body[header] !== undefined) updates[header] = body[header];
  });
  if (body.fotosServicio !== undefined) updates['Fotos Servicio'] = body.fotosServicio;
  if (body.fotoAntes !== undefined) updates['Foto Antes'] = body.fotoAntes;
  if (body.fotoDespues !== undefined) updates['Foto Después'] = body.fotoDespues;
  if (body.fotoEvidencia !== undefined) updates['Foto Evidencia'] = body.fotoEvidencia;
  if (body.carpetaDrive !== undefined) updates['Carpeta Drive'] = body.carpetaDrive;
  if (body.pdfServicio !== undefined) updates['PDF Servicio'] = body.pdfServicio;
  if (Object.keys(updates).length === 0) appScriptError('INVALID_PHOTO_PAYLOAD', 'No photo fields to update');
  updateById('Historial Servicios', 'ID Historial Servicio', idHistorialServicio, updates);
  return Object.assign({ idHistorialServicio: idHistorialServicio }, updates);
}

function probarDriveCompletoPBM() {
  const root = rootEvidenceFolder();
  Logger.log('Carpeta raiz encontrada: ' + root.getName());

  const testFolder = root.createFolder('PRUEBA_COMPLETA_DRIVE_' + new Date().getTime());
  Logger.log('Subcarpeta creada: ' + testFolder.getName());

  const blob = Utilities.newBlob('Prueba PBM Control', 'text/plain', 'prueba_pbm.txt');
  const file = testFolder.createFile(blob);
  Logger.log('Archivo creado: ' + file.getName());

  const sharedWithLink = tryShareWithLink_(file);
  Logger.log(sharedWithLink ? 'Archivo compartido con enlace.' : 'Archivo privado; la prueba continua correctamente.');

  testFolder.setTrashed(true);
  Logger.log('Carpeta de prueba enviada a papelera');

  return {
    ok: true,
    folderId: testFolder.getId(),
    fileId: file.getId(),
    sharedWithLink: sharedWithLink
  };
}

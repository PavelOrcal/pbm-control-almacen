import crypto from 'node:crypto';

const TIME_ZONE = 'America/Mexico_City';
const ADMIN_USERS = new Set(['Anibal', 'Ruth', 'Karen']);
const SCOPES = 'https://www.googleapis.com/auth/firebase.messaging';

export const config = {
  schedule: '0 * * * *'
};

function env(name) {
  return process.env[name]?.trim() || '';
}

function jsonResponse(statusCode, body) {
  return new Response(JSON.stringify(body, null, 2), {
    status: statusCode,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

function localParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    hour: Number(map.hour),
    minute: Number(map.minute)
  };
}

function addDays(dateKey, days) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function parseDateKey(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) {
    const [day, month, year] = text.split('/').map(Number);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function value(row, ...keys) {
  for (const key of keys) {
    const next = row?.[key];
    if (next !== undefined && next !== null && String(next).trim() !== '') return String(next).trim();
  }
  return '';
}

function numberValue(row, ...keys) {
  const text = value(row, ...keys);
  if (!text) return null;
  const parsed = Number(text.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function isDeleted(row) {
  return value(row, 'Eliminado', 'eliminado').toUpperCase() === 'SI';
}

function isActiveToken(row) {
  return value(row, 'Activo', 'activo').toUpperCase() !== 'NO' && Boolean(value(row, 'Token', 'token'));
}

function activeTokensForUser(tokens, username) {
  return tokens.filter((token) => isActiveToken(token) && value(token, 'Usuario', 'usuario').toLowerCase() === username.toLowerCase());
}

function activeAdminTokens(tokens) {
  return tokens.filter((token) => isActiveToken(token) && ADMIN_USERS.has(value(token, 'Usuario', 'usuario')));
}

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function privateKey() {
  return env('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');
}

function createServiceAccountJwt() {
  const clientEmail = env('FIREBASE_CLIENT_EMAIL');
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: SCOPES,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(privateKey());
  return `${unsigned}.${base64url(signature)}`;
}

async function getAccessToken() {
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: createServiceAccountJwt()
  });
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    throw new Error(`No se pudo obtener access token FCM: ${JSON.stringify(payload).slice(0, 300)}`);
  }
  return payload.access_token;
}

function validateBackendConfig() {
  const required = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'APPS_SCRIPT_URL'];
  const missing = required.filter((key) => !env(key));
  return missing;
}

async function appsScriptPost(action, payload = {}) {
  const url = env('APPS_SCRIPT_URL');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: JSON.stringify({ action, ...payload })
  });
  const text = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Apps Script no devolvio JSON en ${action}: ${text.slice(0, 300)}`);
  }
  if (!response.ok || parsed.ok === false) {
    throw new Error(`Apps Script fallo en ${action}: ${(parsed.error || text).slice(0, 300)}`);
  }
  return parsed.data ?? parsed;
}

async function readSchedulerData() {
  const response = await fetch(env('APPS_SCRIPT_URL'));
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(`No se pudieron leer datos de Apps Script: ${payload.error || response.status}`);
  }
  const data = payload.data ?? payload;
  return {
    servicios: data.Servicios ?? data.servicios ?? [],
    productos: data.Productos ?? data.productos ?? [],
    stockBodega: data['Stock Bodega'] ?? data.stockBodega ?? [],
    pushTokens: data['Push Tokens'] ?? data.pushTokens ?? [],
    pushLogs: data['Push Logs'] ?? data.pushLogs ?? []
  };
}

function sentKeys(logs) {
  return new Set(
    logs
      .filter((log) => value(log, 'Estado', 'estado').toUpperCase() === 'ENVIADO')
      .map((log) => value(log, 'Clave Unica', 'claveUnica'))
      .filter(Boolean)
  );
}

function reminderMessage(servicio, slot) {
  const cliente = value(servicio, 'Cliente', 'cliente') || 'cliente sin nombre';
  const idServicio = value(servicio, 'ID Servicio', 'idServicio');
  if (slot === 'D-1-1600') {
    return {
      title: 'Servicio programado manana',
      body: `Manana tienes servicio en ${cliente}.`,
      actionUrl: `/servicios/${idServicio}`,
      type: 'service_reminder'
    };
  }
  if (slot === 'D-1-2000') {
    return {
      title: 'Recordatorio de servicio',
      body: `Recuerda preparar evidencia y producto para el servicio de manana en ${cliente}.`,
      actionUrl: `/servicios/${idServicio}`,
      type: 'service_reminder'
    };
  }
  return {
    title: 'Servicio programado hoy',
    body: `Hoy tienes servicio en ${cliente}. Revisa detalles antes de salir.`,
    actionUrl: `/servicios/${idServicio}`,
    type: 'service_reminder'
  };
}

function buildServiceReminderJobs(servicios, tokens, slot, targetDateKey, todayKey) {
  return servicios
    .filter((servicio) => !isDeleted(servicio))
    .filter((servicio) => !value(servicio, 'Fecha Realizado', 'fechaRealizado'))
    .filter((servicio) => parseDateKey(value(servicio, 'Fecha Programada', 'fechaProgramada')) === targetDateKey)
    .flatMap((servicio) => {
      const responsible = value(servicio, 'Responsable', 'responsable');
      const recipients = responsible ? activeTokensForUser(tokens, responsible) : activeAdminTokens(tokens);
      const message = reminderMessage(servicio, slot);
      return recipients.map((tokenRow) => {
        const usuario = value(tokenRow, 'Usuario', 'usuario');
        const token = value(tokenRow, 'Token', 'token');
        const idServicio = value(servicio, 'ID Servicio', 'idServicio');
        return {
          token,
          tokenRow,
          key: `service_reminder|${idServicio}|${usuario}|${todayKey}|${slot}|${crypto.createHash('sha1').update(token).digest('hex').slice(0, 8)}`,
          logBase: {
            tipo: 'service_reminder',
            usuario,
            rol: value(tokenRow, 'Rol', 'rol'),
            token,
            idServicio,
            cliente: value(servicio, 'Cliente', 'cliente'),
            titulo: message.title,
            mensaje: message.body,
            actionUrl: message.actionUrl
          },
          message: {
            ...message,
            serviceId: idServicio,
            clientId: value(servicio, 'ID Cliente', 'idCliente'),
            responsible: responsible || usuario,
            level: 'operativa'
          }
        };
      });
    });
}

function stockStatus(actual, minimo) {
  const current = actual ?? 0;
  const minimum = minimo ?? 0;
  if (current <= 0) return 'critica';
  if (minimum > 0 && current <= minimum) return 'advertencia';
  return 'ok';
}

function buildStockJobs(productos, stockBodega, tokens, todayKey) {
  const admins = activeAdminTokens(tokens);
  const stockItems = [
    ...productos.map((row) => ({
      name: value(row, 'Producto', 'producto'),
      actual: numberValue(row, 'Existencia Actual Litros', 'existenciaActualLitros'),
      minimo: numberValue(row, 'Cantidad Minima Litros', 'cantidadMinimaLitros')
    })),
    ...stockBodega.map((row) => ({
      name: value(row, 'Articulo', 'articulo'),
      actual: numberValue(row, 'Stock Actual', 'stockActual'),
      minimo: numberValue(row, 'Stock Minimo', 'stockMinimo')
    }))
  ].filter((item) => stockStatus(item.actual, item.minimo) === 'critica');

  return stockItems.flatMap((item) =>
    admins.map((tokenRow) => {
      const usuario = value(tokenRow, 'Usuario', 'usuario');
      const token = value(tokenRow, 'Token', 'token');
      return {
        token,
        tokenRow,
        key: `stock_alert|${item.name}|${usuario}|${todayKey}|STOCK-CRITICAL-DAY|${crypto.createHash('sha1').update(token).digest('hex').slice(0, 8)}`,
        logBase: {
          tipo: 'stock_alert',
          usuario,
          rol: value(tokenRow, 'Rol', 'rol'),
          token,
          idServicio: '',
          cliente: '',
          titulo: 'Stock critico',
          mensaje: `${item.name} esta en nivel critico. Revisar abastecimiento.`,
          actionUrl: '/alertas'
        },
        message: {
          title: 'Stock critico',
          body: `${item.name} esta en nivel critico. Revisar abastecimiento.`,
          actionUrl: '/alertas',
          type: 'stock_alert',
          level: 'critica'
        }
      };
    })
  );
}

function buildUpcomingSummaryJobs(servicios, tokens, todayKey) {
  const upcoming = servicios
    .filter((servicio) => !isDeleted(servicio))
    .filter((servicio) => !value(servicio, 'Fecha Realizado', 'fechaRealizado'))
    .map((servicio) => ({ servicio, dateKey: parseDateKey(value(servicio, 'Fecha Programada', 'fechaProgramada')) }))
    .filter((item) => item.dateKey >= todayKey && item.dateKey <= addDays(todayKey, 7));

  const byResponsible = new Map();
  upcoming.forEach((item) => {
    const responsible = value(item.servicio, 'Responsable', 'responsable') || 'ADMIN';
    byResponsible.set(responsible, [...(byResponsible.get(responsible) ?? []), item]);
  });

  const jobs = [];
  byResponsible.forEach((items, responsible) => {
    const recipients = responsible === 'ADMIN' ? activeAdminTokens(tokens) : activeTokensForUser(tokens, responsible);
    recipients.forEach((tokenRow) => {
      const usuario = value(tokenRow, 'Usuario', 'usuario');
      const token = value(tokenRow, 'Token', 'token');
      const first = items[0]?.servicio;
      jobs.push({
        token,
        tokenRow,
        key: `smart_alert|upcoming|${usuario}|${todayKey}|UPCOMING-7D-DAY|${crypto.createHash('sha1').update(token).digest('hex').slice(0, 8)}`,
        logBase: {
          tipo: 'smart_alert',
          usuario,
          rol: value(tokenRow, 'Rol', 'rol'),
          token,
          idServicio: first ? value(first, 'ID Servicio', 'idServicio') : '',
          cliente: first ? value(first, 'Cliente', 'cliente') : '',
          titulo: 'Agenda de servicios',
          mensaje: `${items.length} servicio(s) programados en los proximos 7 dias.`,
          actionUrl: '/servicios'
        },
        message: {
          title: 'Agenda de servicios',
          body: `${items.length} servicio(s) programados en los proximos 7 dias.`,
          actionUrl: '/servicios',
          type: 'smart_alert',
          responsible: responsible === 'ADMIN' ? usuario : responsible,
          level: 'operativa'
        }
      });
    });
  });
  return jobs;
}

function scheduledSlots(parts, mode, forcedSlot) {
  if (forcedSlot) return [forcedSlot];
  if (mode === 'testTomorrow1600') return ['D-1-1600'];
  if (mode === 'testTomorrow2000') return ['D-1-2000'];
  if (mode === 'testToday0700') return ['D0-0700'];
  if (mode === 'testStockCritical') return ['STOCK-CRITICAL-DAY'];
  if (mode === 'testUpcoming') return ['UPCOMING-7D-DAY'];
  if (parts.hour === 16) return ['D-1-1600'];
  if (parts.hour === 20) return ['D-1-2000'];
  if (parts.hour === 7) return ['D0-0700', 'STOCK-CRITICAL-DAY', 'UPCOMING-7D-DAY'];
  return [];
}

function buildJobs(data, slots, todayKey) {
  const tomorrowKey = addDays(todayKey, 1);
  const jobs = [];
  if (slots.includes('D-1-1600')) jobs.push(...buildServiceReminderJobs(data.servicios, data.pushTokens, 'D-1-1600', tomorrowKey, todayKey));
  if (slots.includes('D-1-2000')) jobs.push(...buildServiceReminderJobs(data.servicios, data.pushTokens, 'D-1-2000', tomorrowKey, todayKey));
  if (slots.includes('D0-0700')) jobs.push(...buildServiceReminderJobs(data.servicios, data.pushTokens, 'D0-0700', todayKey, todayKey));
  if (slots.includes('STOCK-CRITICAL-DAY')) jobs.push(...buildStockJobs(data.productos, data.stockBodega, data.pushTokens, todayKey));
  if (slots.includes('UPCOMING-7D-DAY')) jobs.push(...buildUpcomingSummaryJobs(data.servicios, data.pushTokens, todayKey));
  return jobs;
}

async function sendFcm(accessToken, job) {
  const projectId = env('FIREBASE_PROJECT_ID');
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      message: {
        token: job.token,
        notification: {
          title: job.message.title,
          body: job.message.body
        },
        data: Object.fromEntries(
          Object.entries({
            actionUrl: job.message.actionUrl,
            type: job.message.type,
            serviceId: job.message.serviceId,
            clientId: job.message.clientId,
            responsible: job.message.responsible,
            level: job.message.level
          }).filter(([, next]) => next !== undefined && next !== null).map(([key, next]) => [key, String(next)])
        )
      }
    })
  });
  const payload = await response.json();
  if (!response.ok) {
    const detail = JSON.stringify(payload).slice(0, 500);
    const inactive = /UNREGISTERED|INVALID_ARGUMENT|registration-token-not-registered/i.test(detail);
    const error = new Error(detail);
    error.inactiveToken = inactive;
    throw error;
  }
  return payload;
}

async function logJob(job, estado, error = '') {
  await appsScriptPost('appendPushLog', {
    row: {
      ...job.logBase,
      estado,
      error,
      claveUnica: job.key
    }
  });
}

function isTestAuthorized(request) {
  const secret = env('PUSH_SCHEDULER_TEST_SECRET');
  if (!secret) return false;
  const url = new URL(request.url);
  return url.searchParams.get('secret') === secret || request.headers.get('x-pbm-push-test-secret') === secret;
}

async function isScheduledInvocation(request) {
  try {
    const payload = await request.clone().json();
    return Boolean(payload?.next_run || payload?.nextRun);
  } catch {
    return false;
  }
}

async function readPushDiagnostics() {
  try {
    return await appsScriptPost('pushStatus');
  } catch (error) {
    return {
      pushLogsConfigured: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function runPushScheduler(request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') || '';
  const forcedSlot = url.searchParams.get('slot') || '';
  const isManualTest = Boolean(mode || forcedSlot || url.searchParams.has('dryRun') || url.searchParams.has('user'));
  const scheduledRun = await isScheduledInvocation(request);
  const dryRun = isManualTest ? url.searchParams.get('dryRun') !== 'false' : false;

  if (!scheduledRun && !isManualTest) {
    return jsonResponse(403, {
      ok: false,
      error: 'Esta funcion solo acepta ejecuciones programadas de Netlify o pruebas manuales con secreto.'
    });
  }

  if (isManualTest && !isTestAuthorized(request)) {
    return jsonResponse(401, { ok: false, error: 'PUSH_SCHEDULER_TEST_SECRET requerido para pruebas manuales.' });
  }

  const missing = validateBackendConfig();
  if (missing.length > 0) {
    return jsonResponse(200, {
      ok: false,
      status: 'CONFIG_REQUIRED',
      missing,
      message: 'Backend push pendiente/configuracion requerida.'
    });
  }

  const diagnostics = await readPushDiagnostics();
  if (!dryRun && diagnostics.pushLogsConfigured === false) {
    return jsonResponse(200, {
      ok: false,
      status: 'PUSH_LOGS_REQUIRED',
      message: 'Crea la hoja Push Logs y actualiza Apps Script antes de enviar push automaticos.',
      detail: diagnostics.error || ''
    });
  }

  const parts = localParts();
  const slots = scheduledSlots(parts, mode, forcedSlot);
  if (slots.length === 0) {
    return jsonResponse(200, {
      ok: true,
      status: 'NO_WINDOW',
      localTime: parts,
      message: 'Sin ventana de envio en esta ejecucion.'
    });
  }

  const data = await readSchedulerData();
  const alreadySent = sentKeys(data.pushLogs);
  const todayKey = parts.date;
  const jobs = buildJobs(data, slots, todayKey)
    .filter((job) => !alreadySent.has(job.key))
    .filter((job) => {
      const targetUser = url.searchParams.get('user');
      return targetUser ? job.logBase.usuario.toLowerCase() === targetUser.toLowerCase() : true;
    });

  if (dryRun) {
    return jsonResponse(200, {
      ok: true,
      dryRun: true,
      slots,
      localTime: parts,
      jobs: jobs.map((job) => ({
        claveUnica: job.key,
        usuario: job.logBase.usuario,
        tipo: job.logBase.tipo,
        titulo: job.logBase.titulo,
        mensaje: job.logBase.mensaje,
        actionUrl: job.logBase.actionUrl
      }))
    });
  }

  const accessToken = await getAccessToken();
  const results = [];
  for (const job of jobs) {
    try {
      await sendFcm(accessToken, job);
      await logJob(job, 'ENVIADO');
      results.push({ key: job.key, usuario: job.logBase.usuario, estado: 'ENVIADO' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (error.inactiveToken) {
        await appsScriptPost('disablePushToken', { token: job.token });
        await logJob(job, 'TOKEN_INACTIVO', message);
        results.push({ key: job.key, usuario: job.logBase.usuario, estado: 'TOKEN_INACTIVO' });
      } else {
        await logJob(job, 'ERROR', message);
        results.push({ key: job.key, usuario: job.logBase.usuario, estado: 'ERROR', error: message });
      }
    }
  }

  return jsonResponse(200, {
    ok: true,
    dryRun: false,
    slots,
    localTime: parts,
    sent: results.filter((result) => result.estado === 'ENVIADO').length,
    errors: results.filter((result) => result.estado === 'ERROR').length,
    inactive: results.filter((result) => result.estado === 'TOKEN_INACTIVO').length,
    results
  });
}

export default async function handler(request) {
  return runPushScheduler(request);
}

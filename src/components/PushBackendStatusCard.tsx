import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RadioTower, ServerCog } from 'lucide-react';
import { apiUrlConfigured, fetchPushStatus, type PushBackendStatus } from '../lib/api';
import { classNames } from '../lib/formatters';
import { StatusBadge } from './StatusBadge';

const backendFlag = import.meta.env.VITE_PUSH_BACKEND_CONFIGURED?.trim().toLowerCase() === 'true';

function emptyStatus(): PushBackendStatus {
  return {
    pushTokensConfigured: false,
    pushLogsConfigured: false,
    activeTokens: 0,
    lastSentAt: '',
    lastSentType: '',
    recentErrors: [],
    recentLogCount: 0
  };
}

export function PushBackendStatusCard() {
  const [status, setStatus] = useState<PushBackendStatus>(() => emptyStatus());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchPushStatus()
      .then((nextStatus) => {
        if (cancelled) return;
        setStatus(nextStatus);
        setError('');
      })
      .catch((nextError) => {
        if (cancelled) return;
        setStatus(emptyStatus());
        setError(nextError instanceof Error ? nextError.message : String(nextError));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = backendFlag && status.pushTokensConfigured && status.pushLogsConfigured && apiUrlConfigured();
  const hasErrors = status.recentErrors.length > 0 || Boolean(error);
  const Icon = ready ? CheckCircle2 : hasErrors ? AlertTriangle : ServerCog;
  const friendlyError = /Unknown action: pushStatus/i.test(error)
    ? 'Copia routes.gs y sheets.gs actualizados para activar el diagnostico.'
    : 'No se pudo leer el estado del backend push. Revisa Apps Script.';

  return (
    <section className="premium-card rounded-lg p-3" data-accent={ready ? 'green' : hasErrors ? 'orange' : 'blue'}>
      <div className="flex items-start gap-3">
        <div
          className={classNames(
            'rounded-lg border p-2 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]',
            ready
              ? 'border-pbm-green/40 bg-pbm-green/10 text-pbm-green'
              : hasErrors
                ? 'border-pbm-orange/40 bg-pbm-orange/10 text-pbm-orange'
                : 'border-pbm-blue/40 bg-pbm-blue/10 text-pbm-glow'
          )}
        >
          <Icon size={19} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-pbm-muted">Backend push</p>
          <h3 className="mt-1 text-base font-black text-pbm-text">
            {ready ? 'Programado activo' : backendFlag ? 'Pendiente Apps Script' : 'Pendiente Netlify'}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-pbm-muted">
            {ready
              ? 'Scheduler y bitacora listos para envios automaticos.'
              : 'Configura Netlify y copia Apps Script actualizado para activar envios automaticos.'}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge tone={ready ? 'green' : 'yellow'}>{backendFlag ? 'Netlify configurado' : 'Netlify pendiente'}</StatusBadge>
        <StatusBadge tone={status.pushLogsConfigured ? 'green' : 'orange'}>{status.pushLogsConfigured ? 'Push Logs listo' : 'Push Logs pendiente'}</StatusBadge>
        <StatusBadge tone="blue">{isLoading ? 'Leyendo...' : `${status.activeTokens} tokens activos`}</StatusBadge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md border border-pbm-border/70 bg-pbm-bg/40 p-2">
          <p className="font-black uppercase text-pbm-muted">Ultimo envio</p>
          <p className="mt-1 truncate font-semibold text-pbm-text">{status.lastSentAt || 'Sin envios'}</p>
        </div>
        <div className="rounded-md border border-pbm-border/70 bg-pbm-bg/40 p-2">
          <p className="font-black uppercase text-pbm-muted">Errores</p>
          <p className={classNames('mt-1 font-semibold', hasErrors ? 'text-pbm-orange' : 'text-pbm-text')}>
            {status.recentErrors.length}
          </p>
        </div>
      </div>

      {status.recentErrors[0] ? (
        <p className="mt-3 line-clamp-2 rounded-md border border-pbm-orange/35 bg-pbm-orange/10 px-2 py-1.5 text-xs text-pbm-orange">
          {status.recentErrors[0].usuario || 'Sin usuario'}: {status.recentErrors[0].error || 'Error reciente'}
        </p>
      ) : error ? (
        <p className="mt-3 line-clamp-2 rounded-md border border-pbm-orange/35 bg-pbm-orange/10 px-2 py-1.5 text-xs text-pbm-orange">
          Apps Script pendiente: {friendlyError}
        </p>
      ) : (
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-pbm-muted">
          <RadioTower size={14} aria-hidden="true" />
          No se muestran tokens completos en esta vista.
        </div>
      )}
    </section>
  );
}

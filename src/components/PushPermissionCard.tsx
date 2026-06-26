import { BellRing, CheckCircle2, RadioTower, ShieldAlert } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { classNames, formatDate } from '../lib/formatters';
import { StatusBadge } from './StatusBadge';

type PushCardVariant = 'dashboard' | 'settings' | 'full';

function pushLabel(status: string, registered: boolean): string {
  if (registered) return 'Push activo';
  if (status === 'not-configured') return 'Push no configurado';
  if (status === 'denied') return 'Push bloqueado';
  if (status === 'error') return 'Error';
  return 'Push pendiente';
}

function buttonLabel(isRegistering: boolean, registered: boolean): string {
  if (isRegistering) return 'Activando...';
  if (registered) return 'Actualizar';
  return 'Activar';
}

export function PushPermissionCard({
  compact = false,
  variant,
  showDebugToken = false
}: {
  compact?: boolean;
  variant?: PushCardVariant;
  showDebugToken?: boolean;
}) {
  const { result, status, localRegistration, isRegistering, registerDevice } = usePushNotifications();
  const mode = variant ?? (compact ? 'settings' : 'full');
  const registered = Boolean((result.status === 'registered' && result.token) || localRegistration);
  const currentStatus = registered ? 'registered' : result.status !== status.status ? result.status : status.status;
  const blocked = currentStatus === 'denied' || currentStatus === 'unsupported' || currentStatus === 'not-configured';
  const label = pushLabel(currentStatus, registered);
  const message = registered
    ? 'Dispositivo registrado'
    : currentStatus === 'not-configured'
      ? 'Push real no configurado'
      : currentStatus === 'denied'
        ? 'Notificaciones bloqueadas'
        : 'Listo para activar';
  const Icon = registered ? CheckCircle2 : currentStatus === 'not-configured' ? ShieldAlert : RadioTower;
  const accent = registered ? 'green' : currentStatus === 'error' || currentStatus === 'denied' ? 'orange' : 'blue';
  const lastUpdated = localRegistration?.updatedAt ? formatDate(localRegistration.updatedAt) : '';

  if (mode === 'dashboard') {
    return (
      <section className="panel-card rounded-lg px-3 py-2.5" data-accent={accent}>
        <div className="flex items-center gap-3">
          <div className={classNames('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', registered ? 'border-pbm-green/40 bg-pbm-green/10 text-pbm-green' : 'border-pbm-blue/40 bg-pbm-blue/10 text-pbm-glow')}>
            <Icon size={18} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-pbm-text">{label}</p>
            <p className="truncate text-[0.7rem] font-semibold text-pbm-muted">{message}</p>
          </div>
          <button
            type="button"
            disabled={isRegistering || blocked}
            onClick={registerDevice}
            className="pressable inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-pbm-orange/50 bg-pbm-orange/10 px-3 text-xs font-black text-pbm-orange disabled:cursor-not-allowed disabled:opacity-50"
          >
            {buttonLabel(isRegistering, registered)}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={classNames('premium-card rounded-lg', mode === 'settings' ? 'p-3' : 'p-4')} data-accent={accent}>
      <div className="flex items-start gap-3">
        <div className="rounded-lg border border-pbm-blue/35 bg-pbm-blue/10 p-2 text-pbm-glow shadow-glow">
          <Icon size={20} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-pbm-muted">Notificaciones</p>
          <h3 className="mt-1 text-lg font-black text-pbm-text">{label}</h3>
          <p className="mt-1 text-sm leading-relaxed text-pbm-muted">
            {registered ? 'Dispositivo registrado para recibir avisos push.' : status.message}
          </p>
          {mode === 'settings' ? (
            <p className="mt-2 text-xs leading-relaxed text-pbm-muted">
              Los avisos automaticos se enviaran cuando quede activo el backend programado.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge tone={registered ? 'green' : blocked ? 'orange' : 'blue'}>{message}</StatusBadge>
        {lastUpdated ? <StatusBadge tone="blue">Actualizado {lastUpdated}</StatusBadge> : null}
      </div>

      {showDebugToken && result.token ? (
        <p className="mt-3 truncate rounded-md border border-pbm-border/70 bg-pbm-bg/45 px-2 py-1 text-xs font-mono text-pbm-muted">
          Token: {result.token}
        </p>
      ) : localRegistration?.tokenPreview ? (
        <p className="mt-3 truncate rounded-md border border-pbm-border/70 bg-pbm-bg/45 px-2 py-1 text-xs font-mono text-pbm-muted">
          Token: {localRegistration.tokenPreview}
        </p>
      ) : null}

      <button
        type="button"
        disabled={isRegistering || blocked}
        onClick={registerDevice}
        className="pressable mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-pbm-orange/55 bg-pbm-orange/10 px-3 text-sm font-black text-pbm-orange disabled:cursor-not-allowed disabled:opacity-50"
      >
        <BellRing size={16} aria-hidden="true" />
        {buttonLabel(isRegistering, registered)} notificaciones push
      </button>
    </section>
  );
}

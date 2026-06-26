import { AlertTriangle, ArrowRight, BellRing, Camera, FileWarning, Gauge, LockKeyhole, PackageSearch, UsersRound, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { alertLevelTone, dashboardAlerts, summarizeSmartAlerts, type SmartAlert, type SmartAlertCategory, type SmartAlertLevel } from '../lib/alerts';
import { classNames } from '../lib/formatters';
import { StatusBadge } from './StatusBadge';

const levelLabels: Record<SmartAlertLevel, string> = {
  critica: 'Critica',
  advertencia: 'Advertencia',
  informativa: 'Informativa',
  operativa: 'Operativa'
};

const categoryIcons: Record<SmartAlertCategory, typeof AlertTriangle> = {
  stock: PackageSearch,
  producto: AlertTriangle,
  cliente: UsersRound,
  maquina: Wrench,
  servicio: BellRing,
  evidencia: Camera,
  pdf: FileWarning,
  litros: Gauge,
  responsable: BellRing,
  push: BellRing
};

const toneClasses = {
  red: 'border-pbm-red/45 bg-pbm-red/10 text-pbm-red',
  orange: 'border-pbm-orange/45 bg-pbm-orange/10 text-pbm-orange',
  yellow: 'border-pbm-yellow/45 bg-pbm-yellow/10 text-pbm-yellow',
  blue: 'border-pbm-blue/45 bg-pbm-blue/10 text-pbm-glow',
  green: 'border-pbm-green/45 bg-pbm-green/10 text-pbm-green'
};

export function SmartAlertCard({ alert, compact = false }: { alert: SmartAlert; compact?: boolean }) {
  const tone = alertLevelTone(alert.nivel);
  const Icon = alert.restricted ? LockKeyhole : categoryIcons[alert.categoria];
  const content = (
    <article className={classNames('premium-card rounded-lg border-l-4 p-4', compact ? 'min-h-0' : 'animate-card-in', tone === 'red' ? 'border-l-pbm-red' : tone === 'orange' ? 'border-l-pbm-orange' : tone === 'green' ? 'border-l-pbm-green' : 'border-l-pbm-blue')}>
      <div className="flex items-start gap-3">
        <div className={classNames('shrink-0 rounded-lg border p-2 shadow-glow', toneClasses[tone])}>
          <Icon size={compact ? 18 : 21} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={tone === 'red' ? 'red' : tone === 'orange' ? 'orange' : tone === 'green' ? 'green' : 'blue'} className={compact ? 'min-h-6 px-2 py-0.5 text-[0.65rem]' : undefined}>
              {levelLabels[alert.nivel]}
            </StatusBadge>
            {alert.responsable && !compact ? <StatusBadge tone="neutral">{alert.responsable}</StatusBadge> : null}
          </div>
          <h3 className={classNames('font-black leading-tight text-pbm-text', compact ? 'mt-2 text-sm' : 'mt-3 text-base')}>{alert.titulo}</h3>
          <p className={classNames('mt-1 leading-relaxed text-pbm-muted', compact ? 'line-clamp-2 text-xs' : 'text-sm')}>{alert.mensaje}</p>
          {!compact && alert.detalles?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {alert.detalles.slice(0, 4).map((detail) => (
                <span key={detail} className="rounded-md border border-pbm-border/70 bg-pbm-bg/45 px-2 py-1 text-xs font-bold text-pbm-muted">
                  {detail}
                </span>
              ))}
            </div>
          ) : null}
          {!compact ? <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-pbm-glow">{alert.accionSugerida}</p> : null}
        </div>
        {alert.accionUrl ? <ArrowRight className="mt-2 shrink-0 text-pbm-muted" size={17} aria-hidden="true" /> : null}
      </div>
    </article>
  );

  if (!alert.accionUrl) return content;
  return (
    <Link to={alert.accionUrl} className="pressable block">
      {content}
    </Link>
  );
}

export function SmartAlertsPanel({ alerts, compact = false, limit = 5 }: { alerts: SmartAlert[]; compact?: boolean; limit?: number }) {
  const summary = summarizeSmartAlerts(alerts);
  const visible = compact ? dashboardAlerts(alerts, limit) : alerts.slice(0, limit);
  const remaining = Math.max(alerts.length - visible.length, 0);

  return (
    <section className={classNames('premium-card rounded-lg', compact ? 'p-3' : 'p-4')} data-accent={summary.critica > 0 ? 'red' : summary.advertencia > 0 ? 'orange' : 'blue'}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-pbm-muted">Centro de mando</p>
          <h2 className={classNames('mt-1 font-black text-pbm-text', compact ? 'text-lg' : 'text-xl')}>Alertas inteligentes</h2>
          {!compact ? <p className="mt-2 text-sm text-pbm-muted">Prioridades operativas calculadas desde Google Sheet.</p> : null}
        </div>
        <div className={classNames('rounded-lg border border-pbm-blue/35 bg-pbm-blue/10 text-pbm-glow shadow-glow', compact ? 'p-2' : 'p-3')}>
          <BellRing size={compact ? 18 : 22} aria-hidden="true" />
        </div>
      </div>

      <div className={classNames('grid grid-cols-4 gap-2 text-center', compact ? 'mt-3' : 'mt-4')}>
        <div className="rounded-md border border-pbm-red/25 bg-pbm-red/10 p-2">
          <p className={classNames('metric-value font-black text-pbm-red', compact ? 'text-lg' : 'text-xl')}>{summary.critica}</p>
          <p className="text-[0.62rem] text-pbm-muted">Criticas</p>
        </div>
        <div className="rounded-md border border-pbm-orange/25 bg-pbm-orange/10 p-2">
          <p className={classNames('metric-value font-black text-pbm-orange', compact ? 'text-lg' : 'text-xl')}>{summary.advertencia}</p>
          <p className="text-[0.62rem] text-pbm-muted">Avisos</p>
        </div>
        <div className="rounded-md border border-pbm-green/25 bg-pbm-green/10 p-2">
          <p className={classNames('metric-value font-black text-pbm-green', compact ? 'text-lg' : 'text-xl')}>{summary.operativa}</p>
          <p className="text-[0.62rem] text-pbm-muted">Hoy</p>
        </div>
        <div className="rounded-md border border-pbm-blue/25 bg-pbm-blue/10 p-2">
          <p className={classNames('metric-value font-black text-pbm-glow', compact ? 'text-lg' : 'text-xl')}>{summary.total}</p>
          <p className="text-[0.62rem] text-pbm-muted">Total</p>
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="mt-4 space-y-3">
          {visible.map((alert) => (
            <SmartAlertCard key={alert.id} alert={alert} compact={compact} />
          ))}
          {compact && remaining > 0 ? (
            <p className="rounded-lg border border-pbm-border/70 bg-pbm-bg/45 px-3 py-2 text-center text-xs font-black text-pbm-muted">
              + {remaining} alertas mas
            </p>
          ) : null}
        </div>
      ) : (
        <div className="empty-premium mt-4 rounded-lg p-4 text-sm text-pbm-muted">
          Sin alertas activas. La operacion no presenta puntos criticos con los datos actuales.
        </div>
      )}

      {compact ? (
        <Link to="/alertas" className="pressable mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-pbm-blue/40 bg-pbm-blue/10 px-4 text-sm font-black text-pbm-glow">
          Ver todas las alertas
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      ) : null}
    </section>
  );
}

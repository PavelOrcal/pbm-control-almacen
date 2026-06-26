import { AlertTriangle, Inbox, WifiOff } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export function LoadingState({ label = 'Cargando datos operativos' }: { label?: string }) {
  return (
    <div className="panel-card flex min-h-72 flex-col items-center justify-center rounded-lg p-6 text-center shadow-glow">
      <BrandLogo className="h-20 w-44" imageClassName="h-14" />
      <div className="mt-6 w-full max-w-56 space-y-3">
        <div className="h-3 rounded-full shimmer" />
        <div className="mx-auto h-3 w-3/4 rounded-full shimmer" />
      </div>
      <p className="mt-5 text-sm font-semibold text-pbm-text">{label}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  const lines = message.split('\n').filter(Boolean);
  const isAppsScriptConnection = lines[0] === 'No se pudo conectar con Apps Script';
  const title = isAppsScriptConnection ? lines[0] : 'No se pudieron cargar los datos';
  const detail = isAppsScriptConnection ? lines.slice(1).join('\n') : message;

  return (
    <div className="error-panel animate-card-in rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg border border-pbm-red/40 bg-pbm-red/10 p-2 text-pbm-red">
          <AlertTriangle size={20} aria-hidden="true" />
        </div>
        <div>
          <p className="font-bold text-pbm-text">{title}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-pbm-muted">{detail}</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-pbm-border bg-pbm-bg/60 px-2.5 py-1 text-xs font-bold text-pbm-muted">
            <WifiOff size={14} aria-hidden="true" />
            Revisar conexion API
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="empty-premium animate-card-in rounded-lg p-5 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-pbm-blue/30 bg-pbm-blue/10 text-pbm-glow shadow-glow">
        <Inbox size={20} aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm font-bold text-pbm-text">{label}</p>
      <p className="mt-1 text-xs text-pbm-muted">La vista se actualiza cuando existan datos coincidentes.</p>
    </div>
  );
}

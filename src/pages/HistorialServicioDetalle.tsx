import { Camera, CheckCircle2, ClipboardList, ExternalLink, FolderOpen, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ClientLogo } from '../components/ClientLogo';
import { SecondaryButton } from '../components/FormControls';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { StatusBadge } from '../components/StatusBadge';
import { useHistorialServicioDeleteMutation, usePbmData } from '../hooks/usePbmData';
import { formatDate } from '../lib/formatters';

function DetailLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-b border-pbm-border/60 py-3 last:border-b-0">
      <p className="text-xs font-bold uppercase tracking-normal text-pbm-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-pbm-text">{value || 'Sin dato'}</p>
    </div>
  );
}

function integerLiters(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
  return Math.trunc(value);
}

function photoItems(historial: {
  fotoAntes?: string;
  fotoDespues?: string;
  fotoEvidencia?: string;
}) {
  return [
    { label: 'Foto antes', url: historial.fotoAntes },
    { label: 'Foto despues', url: historial.fotoDespues },
    { label: 'Foto evidencia', url: historial.fotoEvidencia }
  ].filter((item): item is { label: string; url: string } => Boolean(item.url));
}

function PhotoEvidenceCard({ label, url }: { label: string; url: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <a href={url} target="_blank" rel="noreferrer" className="pressable block overflow-hidden rounded-lg border border-pbm-border/80 bg-pbm-bg/45">
      {imageFailed ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-2 bg-pbm-bg/70 p-5 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-pbm-blue/30 bg-pbm-blue/10 text-pbm-glow shadow-glow">
            <Camera size={20} aria-hidden="true" />
          </div>
          <p className="text-sm font-black text-pbm-text">Foto guardada en Drive</p>
          <p className="text-xs font-bold leading-relaxed text-pbm-muted">Puede requerir permiso para verla. Abre el enlace para revisar la evidencia.</p>
        </div>
      ) : (
        <img src={url} alt={label} className="h-48 w-full object-cover" onError={() => setImageFailed(true)} />
      )}
      <div className="flex items-center justify-between gap-3 p-3">
        <p className="text-sm font-black text-pbm-text">{label}</p>
        <span className="inline-flex items-center gap-1 text-xs font-black text-pbm-glow">
          Abrir
          <ExternalLink size={13} aria-hidden="true" />
        </span>
      </div>
    </a>
  );
}

export default function HistorialServicioDetalle() {
  const { idHistorialServicio } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = usePbmData();
  const deleteMutation = useHistorialServicioDeleteMutation();
  const [feedback, setFeedback] = useState('');

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Error desconocido'} />;

  const historial = data.historialServicios.find((item) => item.idHistorialServicio === idHistorialServicio);
  if (!historial) return <EmptyState label="Registro realizado no encontrado." />;

  const currentHistorial = historial;
  const cliente = data.clientes.find((item) => item.idCliente === currentHistorial.idCliente || item.empresa === currentHistorial.cliente);
  const photos = photoItems(currentHistorial);

  function deleteHistory() {
    const confirmed = window.confirm('Esta accion marcara el servicio realizado como Eliminado = SI. Desaparecera de Historial, Calendario y litros mensuales.');
    if (!confirmed) return;
    deleteMutation.mutate(currentHistorial.idHistorialServicio, {
      onSuccess: (result) => {
        if (result.queued) {
          setFeedback(result.message);
          return;
        }
        navigate('/historial');
      }
    });
  }

  return (
    <div className="screen-fade space-y-5">
      <section className="premium-card rounded-lg p-4" data-accent="green">
        <div className="flex items-start gap-4">
          <ClientLogo empresa={currentHistorial.cliente} logoCliente={cliente?.logoCliente} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-pbm-glow">{currentHistorial.idHistorialServicio}</p>
            <h2 className="mt-1 text-2xl font-black text-pbm-text">{currentHistorial.cliente}</h2>
            <p className="mt-2 text-sm text-pbm-muted">{currentHistorial.idMaquina || 'Sin maquina'} / {currentHistorial.modelo || currentHistorial.tipoServicio}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge tone="green">Realizado</StatusBadge>
          <StatusBadge tone="blue">{currentHistorial.tipoServicio}</StatusBadge>
          <StatusBadge tone="yellow">{currentHistorial.responsable || 'Sin responsable'}</StatusBadge>
        </div>
      </section>

      <section className="panel-card rounded-lg px-4">
        <DetailLine label="ID Servicio activo" value={currentHistorial.idServicio} />
        <DetailLine label="Fecha Programada" value={formatDate(currentHistorial.fechaProgramada)} />
        <DetailLine label="Fecha Realizado" value={formatDate(currentHistorial.fechaRealizado)} />
        <DetailLine label="Producto usado" value={currentHistorial.productoUsado || 'Sin dato'} />
        <DetailLine label="Litros usados" value={integerLiters(currentHistorial.litrosUsados) === null ? 'Indefinido / No aplica' : `${integerLiters(currentHistorial.litrosUsados)} L`} />
        <DetailLine label="Responsable" value={currentHistorial.responsable} />
      </section>

      <section className="premium-card rounded-lg p-4" data-accent="blue">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-pbm-blue/40 bg-pbm-blue/10 p-2 text-pbm-glow">
            <ClipboardList size={20} aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-black text-pbm-text">Observaciones</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-pbm-muted">{currentHistorial.observacionesServicio || 'Sin observaciones capturadas.'}</p>
          </div>
        </div>
      </section>

      <section className="premium-card rounded-lg p-4" data-accent={photos.length > 0 ? 'blue' : 'yellow'}>
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-pbm-blue/40 bg-pbm-blue/10 p-2 text-pbm-glow shadow-glow">
            <Camera size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-pbm-text">Evidencia fotografica</h3>
            <p className="mt-1 text-sm text-pbm-muted">{photos.length > 0 ? `${photos.length} foto(s) vinculadas a este servicio.` : 'Este servicio realizado no tiene fotos vinculadas.'}</p>
          </div>
        </div>

        {photos.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-3">
            {photos.map((photo) => (
              <PhotoEvidenceCard key={photo.label} label={photo.label} url={photo.url} />
            ))}
          </div>
        ) : (
          <div className="empty-premium mt-4 rounded-lg p-5 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-pbm-blue/30 bg-pbm-blue/10 text-pbm-glow shadow-glow">
              <Camera size={20} aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-bold text-pbm-text">Sin evidencia fotografica</p>
            <p className="mt-1 text-xs text-pbm-muted">Las fotos apareceran aqui cuando se capturen al cerrar el servicio.</p>
          </div>
        )}

        {currentHistorial.carpetaDrive ? (
          <a href={currentHistorial.carpetaDrive} target="_blank" rel="noreferrer" className="pressable mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-pbm-blue/40 bg-pbm-blue/10 px-4 text-sm font-black text-pbm-glow">
            <FolderOpen size={17} aria-hidden="true" />
            Abrir carpeta Drive
          </a>
        ) : null}
      </section>

      <section className="premium-card rounded-lg p-4" data-accent="green">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-pbm-green/40 bg-pbm-green/10 p-2 text-pbm-green">
            <CheckCircle2 size={20} aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-black text-pbm-text">Registro historico</h3>
            <p className="mt-1 text-sm text-pbm-muted">Este registro alimenta calendario, historial y litros mensuales mientras `Eliminado` sea NO.</p>
          </div>
        </div>
      </section>

      <section className="premium-card rounded-lg p-4" data-accent="red">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-pbm-red/40 bg-pbm-red/10 p-2 text-pbm-red">
            <Trash2 size={20} aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-black text-pbm-text">Eliminar realizado erroneo</h3>
            <p className="mt-1 text-sm text-pbm-muted">Disponible para usuarios autenticados. No borra fisicamente; marca `Eliminado = SI`.</p>
          </div>
        </div>
        <SecondaryButton type="button" onClick={deleteHistory} disabled={deleteMutation.isPending} className="mt-4 gap-2 border-pbm-red/50 text-pbm-red">
          <Trash2 size={17} aria-hidden="true" />
          {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar registro realizado'}
        </SecondaryButton>
        {feedback ? <p className="success-panel mt-3 rounded-lg p-3 text-sm font-bold text-pbm-green">{feedback}</p> : null}
        {deleteMutation.isError ? <p className="error-panel mt-3 rounded-lg p-3 text-sm font-bold text-pbm-red">{deleteMutation.error.message}</p> : null}
      </section>
    </div>
  );
}

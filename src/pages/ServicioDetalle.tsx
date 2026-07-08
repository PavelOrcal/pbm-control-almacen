import { CalendarClock, CheckCircle2, ClipboardList, History, Save, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ClientLogo } from '../components/ClientLogo';
import { Field, inputClassName, PrimaryButton, SecondaryButton } from '../components/FormControls';
import { ServicePhotoCapture } from '../components/ServicePhotoCapture';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { ServiceStatusBadge, StatusBadge } from '../components/StatusBadge';
import { usePbmData, useServicioDeleteMutation, useServicioRealizadoMutation, useServicioUpdateMutation } from '../hooks/usePbmData';
import { canSeeInventory, useAuth } from '../lib/auth';
import { formatDate, getServiceStatus, parseSheetDate, todayInputValue, toDateInputValue } from '../lib/formatters';
import { canEditPositiveIntegerInput, parsePositiveIntegerInput, POSITIVE_INTEGER_ERROR } from '../lib/positiveInteger';
import { isDeletedRecord } from '../lib/records';
import { cancelServiceReminders, scheduleServiceReminders } from '../lib/reminders';
import { deleteServicePhotoDraft, loadServicePhotoDraft, saveServicePhotoDraft, type ServicePhotoDraftMap } from '../lib/servicePhotos';
import { SHEET_VALIDATIONS } from '../lib/sheetSchema';
import type { ServiceStatus } from '../types/pbm';

function DetailLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-b border-pbm-border/60 py-3 last:border-b-0">
      <p className="text-xs font-bold uppercase tracking-normal text-pbm-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-pbm-text">{value || 'Sin dato'}</p>
    </div>
  );
}

function serviceAccent(status: ServiceStatus): 'green' | 'yellow' | 'blue' {
  if (status === 'Realizado') return 'green';
  if (status === 'Pendiente') return 'yellow';
  return 'blue';
}

function isIndefinite(productoUsado: string): boolean {
  return productoUsado === 'Indefinido / No aplica';
}

function inputValueFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function firstDayNextMonthInput(date: Date): string {
  return inputValueFromDate(new Date(date.getFullYear(), date.getMonth() + 1, 1));
}

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(date);
}

export default function ServicioDetalle() {
  const { idServicio } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = usePbmData();
  const { user } = useAuth();
  const programmingMutation = useServicioUpdateMutation();
  const draftMutation = useServicioUpdateMutation();
  const closeMutation = useServicioRealizadoMutation();
  const deleteMutation = useServicioDeleteMutation();
  const inventoryUnlocked = canSeeInventory(user);
  const servicio = data?.servicios.find((item) => item.idServicio === idServicio);
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [observacionesServicio, setObservacionesServicio] = useState('');
  const [litrosUsados, setLitrosUsados] = useState('');
  const [productoUsado, setProductoUsado] = useState('Bio Metal 3000');
  const [responsable, setResponsable] = useState('Anibal');
  const [fotosServicio, setFotosServicio] = useState<ServicePhotoDraftMap>({});
  const [feedback, setFeedback] = useState('');
  const [closeError, setCloseError] = useState('');
  const historialRelacionado = useMemo(() => {
    if (!data || !servicio) return [];
    return data.historialServicios.filter((historial) => {
      if (isDeletedRecord(historial)) return false;
      if (historial.idServicio && historial.idServicio === servicio.idServicio) return true;
      if (servicio.idMaquina && historial.idMaquina && historial.idMaquina === servicio.idMaquina) return true;
      return false;
    });
  }, [data, servicio]);
  const ultimaFechaRealizada = useMemo(() => {
    const fechas = historialRelacionado
      .map((historial) => parseSheetDate(historial.fechaRealizado || historial.fechaProgramada))
      .filter((date): date is Date => Boolean(date))
      .sort((a, b) => b.getTime() - a.getTime());
    return fechas[0] ?? null;
  }, [historialRelacionado]);
  const minFechaProgramada = ultimaFechaRealizada ? firstDayNextMonthInput(ultimaFechaRealizada) : '';
  const mesBloqueado = ultimaFechaRealizada ? monthLabel(ultimaFechaRealizada) : '';

  useEffect(() => {
    if (!servicio) return;
    let cancelled = false;
    setFechaProgramada(toDateInputValue(servicio.fechaProgramada));
    setObservacionesServicio(servicio.observacionesServicio ?? '');
    setLitrosUsados(servicio.litrosUsados === null || servicio.litrosUsados === undefined ? '' : String(servicio.litrosUsados));
    setProductoUsado(servicio.productoUsado || servicio.producto || 'Bio Metal 3000');
    const allowedResponsables = SHEET_VALIDATIONS.responsables as readonly string[];
    setResponsable(allowedResponsables.includes(servicio.responsable) ? servicio.responsable : 'Anibal');
    setFotosServicio({});
    loadServicePhotoDraft(servicio.idServicio)
      .then((draft) => {
        if (!cancelled) setFotosServicio(draft);
      })
      .catch(() => {
        if (!cancelled) setFotosServicio({});
      });
    setFeedback('');
    setCloseError('');
    return () => {
      cancelled = true;
    };
  }, [servicio?.idServicio, servicio?.fechaProgramada, servicio?.observacionesServicio, servicio?.litrosUsados, servicio?.productoUsado, servicio?.responsable, servicio?.producto]);

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Error desconocido'} />;
  if (!servicio) return <EmptyState label="Servicio no encontrado." />;

  const currentServicio = servicio;
  const status = getServiceStatus(currentServicio);
  const accent = serviceAccent(status);
  const cliente = data.clientes.find((item) => item.idCliente === currentServicio.idCliente);
  const maquina = data.maquinas.find((item) => item.idMaquina === currentServicio.idMaquina);
  const tipoServicio = currentServicio.tipoServicio || (currentServicio.modelo.toLowerCase().includes('ingreso') ? 'Ingreso de Material' : 'Servicio maquina');
  const canCloseService = status === 'Pendiente';
  const canDeleteService = Boolean(user);

  function saveProgramming(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedDate = parseSheetDate(fechaProgramada);
    const minDate = parseSheetDate(minFechaProgramada);
    if (selectedDate && minDate && selectedDate.getTime() < minDate.getTime()) {
      setCloseError(`Este servicio ya tiene un realizado en ${mesBloqueado}. Programa desde ${formatDate(minFechaProgramada)} para no duplicar el mes.`);
      return;
    }
    programmingMutation.mutate(
      { idServicio: currentServicio.idServicio, fechaProgramada },
      {
        onSuccess: (result) => {
          setFeedback(result.queued ? result.message : 'Fecha Programada actualizada. El servicio se mueve a esa fecha sin crear duplicados.');
          setCloseError('');
          scheduleServiceReminders({ ...currentServicio, fechaProgramada, fechaRealizado: '' });
        }
      }
    );
  }

  function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let litros: number | null = null;
    try {
      litros = parsePositiveIntegerInput(litrosUsados, 'Litros usados', false);
    } catch (validationError) {
      setCloseError(validationError instanceof Error ? validationError.message : POSITIVE_INTEGER_ERROR);
      return;
    }
    draftMutation.mutate(
      {
        idServicio: currentServicio.idServicio,
        observacionesServicio,
        litrosUsados: litros,
        productoUsado,
        responsable
      },
      {
        onSuccess: async (result) => {
          await saveServicePhotoDraft(currentServicio.idServicio, fotosServicio);
          setFeedback(result.queued ? `${result.message} Fotos temporales guardadas en este dispositivo.` : 'Datos de cierre y fotos temporales guardados como avance del servicio.');
          setCloseError('');
        }
      }
    );
  }

  function markAsDone() {
    const cleanObservaciones = observacionesServicio.trim();
    const cleanProducto = productoUsado.trim();
    let litros: number | null = null;
    try {
      litros = parsePositiveIntegerInput(litrosUsados, 'Litros usados', false);
    } catch (validationError) {
      setCloseError(validationError instanceof Error ? validationError.message : POSITIVE_INTEGER_ERROR);
      return;
    }

    if (!fechaProgramada) {
      setCloseError('Captura Fecha Programada antes de marcar el servicio como realizado.');
      return;
    }
    if (!cleanObservaciones) {
      setCloseError('Agrega Observaciones Servicio antes de marcarlo como realizado.');
      return;
    }
    if (!cleanProducto) {
      setCloseError('Selecciona Producto usado antes de cerrar el servicio.');
      return;
    }
    if (!isIndefinite(cleanProducto) && litros === null) {
      setCloseError(`Litros usados: ${POSITIVE_INTEGER_ERROR}`);
      return;
    }
    if (!responsable) {
      setCloseError('Selecciona Responsable antes de cerrar el servicio.');
      return;
    }
    if (!canCloseService) {
      setCloseError('Este servicio no esta pendiente. Programa una fecha activa antes de cerrarlo.');
      return;
    }

    closeMutation.mutate(
      {
        idServicio: currentServicio.idServicio,
        fechaRealizado: todayInputValue(),
        observacionesServicio: cleanObservaciones,
        litrosUsados: isIndefinite(cleanProducto) ? null : litros,
        productoUsado: cleanProducto,
        responsable,
        fotosServicio
      },
      {
        onSuccess: (result) => {
          setFeedback(result.queued ? result.message : 'Servicio realizado guardado en Historial Servicios. La fila activa quedo lista para programarse otra vez.');
          setCloseError('');
          if (!result.queued) {
            setFotosServicio({});
            void deleteServicePhotoDraft(currentServicio.idServicio);
          }
          cancelServiceReminders(currentServicio.idServicio);
        }
      }
    );
  }

  function deleteService() {
    const confirmed = window.confirm('Esta accion eliminara el servicio activo del listado y calendario. El historico realizado no se borra desde aqui.');
    if (!confirmed) return;
    deleteMutation.mutate(currentServicio.idServicio, {
      onSuccess: (result) => {
        cancelServiceReminders(currentServicio.idServicio);
        if (result.queued) {
          setFeedback(result.message);
          setCloseError('');
          return;
        }
        navigate('/servicios');
      }
    });
  }

  return (
    <div className="screen-fade space-y-5">
      <section className="premium-card rounded-lg p-4" data-accent={accent}>
        <div className="flex items-start gap-4">
          <ClientLogo empresa={currentServicio.cliente} logoCliente={cliente?.logoCliente} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-pbm-glow">{currentServicio.idServicio}</p>
            <h2 className="mt-1 text-2xl font-black text-pbm-text">{currentServicio.cliente}</h2>
            <p className="mt-2 text-sm text-pbm-muted">{currentServicio.idMaquina || 'Sin maquina'} / {currentServicio.modelo || tipoServicio}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ServiceStatusBadge status={status} />
          <StatusBadge tone="blue">{tipoServicio}</StatusBadge>
          <StatusBadge tone="green">{responsable || 'Sin responsable'}</StatusBadge>
        </div>
      </section>

      <section className="panel-card rounded-lg px-4">
        <DetailLine label="Cliente" value={cliente ? `${cliente.idCliente} / ${cliente.empresa}` : currentServicio.idCliente} />
        <DetailLine label="Maquina" value={maquina ? `${maquina.idMaquina} / ${maquina.ubicacionArea}` : currentServicio.idMaquina || 'N/A'} />
        <DetailLine label="Tipo servicio" value={tipoServicio} />
        <DetailLine label="Producto base" value={inventoryUnlocked || tipoServicio === 'Ingreso de Material' ? `${currentServicio.idProducto} / ${currentServicio.producto}` : 'Protegido'} />
        <DetailLine label="Litros estimados" value={inventoryUnlocked ? `${currentServicio.litrosEstimados ?? 0} L` : tipoServicio === 'Ingreso de Material' ? 'Indefinido permitido' : 'Protegido'} />
      </section>

      <form onSubmit={saveProgramming} className="premium-card rounded-lg p-4" data-accent="yellow">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-pbm-yellow/40 bg-pbm-yellow/10 p-2 text-pbm-yellow">
            <CalendarClock size={20} aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-black text-pbm-text">Programacion activa</h3>
            <p className="text-sm text-pbm-muted">Editar la fecha mueve el servicio en calendario sin crear otro registro.</p>
          </div>
        </div>
        <div className="mt-4">
          <Field label="Fecha Programada">
            <input type="date" min={minFechaProgramada || undefined} value={fechaProgramada} onChange={(event) => setFechaProgramada(event.target.value)} className={inputClassName} />
          </Field>
          {minFechaProgramada ? (
            <p className="mt-2 rounded-lg border border-pbm-yellow/30 bg-pbm-yellow/10 p-3 text-xs font-bold leading-relaxed text-pbm-muted">
              Ya existe un servicio realizado en {mesBloqueado}. La siguiente fecha permitida es {formatDate(minFechaProgramada)}.
            </p>
          ) : null}
        </div>
        <PrimaryButton type="submit" disabled={programmingMutation.isPending} className="mt-4 gap-2">
          <Save size={18} aria-hidden="true" />
          {programmingMutation.isPending ? 'Guardando...' : 'Guardar fecha'}
        </PrimaryButton>
      </form>

      <form onSubmit={saveDraft} className="premium-card rounded-lg p-4" data-accent="blue">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-pbm-blue/40 bg-pbm-blue/10 p-2 text-pbm-glow">
            <ClipboardList size={20} aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-black text-pbm-text">Observaciones y cierre</h3>
            <p className="text-sm text-pbm-muted">Estos datos se guardan en Historial Servicios al marcar realizado.</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <Field label="Observaciones Servicio">
            <textarea
              value={observacionesServicio}
              onChange={(event) => {
                setObservacionesServicio(event.target.value);
                setCloseError('');
              }}
              className={`${inputClassName} min-h-32 resize-y py-3`}
              placeholder="Describe el trabajo realizado, condiciones encontradas y seguimiento necesario."
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Litros usados">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={litrosUsados}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  if (!canEditPositiveIntegerInput(nextValue)) {
                    setCloseError(POSITIVE_INTEGER_ERROR);
                    return;
                  }
                  setLitrosUsados(nextValue);
                  setCloseError('');
                }}
                className={inputClassName}
                placeholder="Ej. 80"
                disabled={isIndefinite(productoUsado)}
              />
            </Field>
            <Field label="Producto usado">
              <select
                value={productoUsado}
                onChange={(event) => {
                  setProductoUsado(event.target.value);
                  if (isIndefinite(event.target.value)) setLitrosUsados('');
                  setCloseError('');
                }}
                className={inputClassName}
              >
                {SHEET_VALIDATIONS.productoUsadoServicio.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Responsable">
            <select value={responsable} onChange={(event) => setResponsable(event.target.value)} className={inputClassName}>
              {SHEET_VALIDATIONS.responsables.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </Field>
        </div>

        <SecondaryButton type="submit" disabled={draftMutation.isPending} className="mt-4 gap-2">
          <Save size={18} aria-hidden="true" />
          {draftMutation.isPending ? 'Guardando...' : 'Guardar avance'}
        </SecondaryButton>
      </form>

      <ServicePhotoCapture photos={fotosServicio} onChange={setFotosServicio} />

      <section className="premium-card rounded-lg p-4" data-accent="green">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-pbm-green/40 bg-pbm-green/10 p-2 text-pbm-green">
            <CheckCircle2 size={20} aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-black text-pbm-text">Marcar realizado</h3>
            <p className="text-sm text-pbm-muted">Crea historial realizado y limpia el servicio activo para la siguiente programacion.</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md border border-pbm-border/70 bg-pbm-bg/45 p-3">
            <p className="text-pbm-muted">Programada</p>
            <p className="font-black text-pbm-text">{fechaProgramada ? formatDate(fechaProgramada) : 'Sin programar'}</p>
          </div>
          <div className="rounded-md border border-pbm-border/70 bg-pbm-bg/45 p-3">
            <p className="text-pbm-muted">Cierre</p>
            <p className="font-black text-pbm-text">{formatDate(todayInputValue())}</p>
          </div>
        </div>

        <PrimaryButton
          type="button"
          disabled={closeMutation.isPending || !canCloseService}
          className="mt-4 gap-2 border-pbm-green/60 bg-[linear-gradient(135deg,#22C55E,#38BDF8)]"
          onClick={markAsDone}
        >
          <CheckCircle2 size={18} aria-hidden="true" />
          {closeMutation.isPending ? 'Guardando historial...' : status === 'Sin programar' ? 'Programa fecha primero' : 'Marcar como realizado'}
        </PrimaryButton>

        {feedback ? <p className="success-panel mt-3 rounded-lg p-3 text-sm font-bold text-pbm-green">{feedback}</p> : null}
        {closeError ? <p className="error-panel mt-3 rounded-lg p-3 text-sm font-bold text-pbm-red">{closeError}</p> : null}
        {programmingMutation.isError ? <p className="error-panel mt-3 rounded-lg p-3 text-sm font-bold text-pbm-red">{programmingMutation.error.message}</p> : null}
        {draftMutation.isError ? <p className="error-panel mt-3 rounded-lg p-3 text-sm font-bold text-pbm-red">{draftMutation.error.message}</p> : null}
        {closeMutation.isError ? <p className="error-panel mt-3 rounded-lg p-3 text-sm font-bold text-pbm-red">{closeMutation.error.message}</p> : null}
      </section>

      {canDeleteService ? (
        <section className="premium-card rounded-lg p-4" data-accent="red">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-pbm-red/40 bg-pbm-red/10 p-2 text-pbm-red">
              <Trash2 size={20} aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-black text-pbm-text">Eliminar servicio activo erroneo</h3>
              <p className="mt-1 text-sm text-pbm-muted">Disponible para usuarios autenticados. Usa esta accion solo por error de captura o duplicado.</p>
            </div>
          </div>
          <SecondaryButton type="button" onClick={deleteService} disabled={deleteMutation.isPending} className="mt-4 gap-2 border-pbm-red/50 text-pbm-red">
            <Trash2 size={17} aria-hidden="true" />
            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar servicio activo'}
          </SecondaryButton>
          {deleteMutation.isError ? <p className="error-panel mt-3 rounded-lg p-3 text-sm font-bold text-pbm-red">{deleteMutation.error.message}</p> : null}
        </section>
      ) : null}

      <section className="panel-card rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-pbm-blue/35 bg-pbm-blue/10 p-2 text-pbm-glow">
            <History size={19} aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-black text-pbm-text">Nueva regla operativa</h3>
            <p className="text-sm text-pbm-muted">Los realizados se consultan en Historial Servicios. Esta fila queda como servicio activo reutilizable.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

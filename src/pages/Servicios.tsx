import { CalendarDays, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ClientLogo } from '../components/ClientLogo';
import { DataCard } from '../components/DataCard';
import { inputClassName } from '../components/FormControls';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { ServiceStatusBadge, StatusBadge } from '../components/StatusBadge';
import { usePbmData } from '../hooks/usePbmData';
import { classNames, formatDate, getServiceStatus, parseSheetDate } from '../lib/formatters';
import { canSeeInventory, useAuth } from '../lib/auth';
import { activeHistorialServicios, activeServicios, visibleServiciosList } from '../lib/records';
import { getServiceReminders, reminderText } from '../lib/reminders';
import type { Cliente, HistorialServicio, Servicio } from '../types/pbm';

type Filter = 'Activos' | 'Sin programar' | 'Pendiente';
type ViewMode = 'Lista' | 'Calendario';
type CalendarEntry =
  | { kind: 'Pendiente'; id: string; fecha: string; servicio: Servicio }
  | { kind: 'Realizado'; id: string; fecha: string; historial: HistorialServicio };

const filters: Filter[] = ['Activos', 'Sin programar', 'Pendiente'];

function keyFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateKey(value: string): string | null {
  const date = parseSheetDate(value);
  return date ? keyFromDate(date) : null;
}

function monthTitle(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(date);
}

function calendarDays(cursor: Date): Array<Date | null> {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const days: Array<Date | null> = Array.from({ length: first.getDay() }, () => null);
  for (let day = 1; day <= last.getDate(); day += 1) days.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function entryDateKey(entry: CalendarEntry): string | null {
  return dateKey(entry.fecha);
}

function integerLiters(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
  return Math.trunc(value);
}

function entrySearchText(entry: CalendarEntry): string {
  const item = entry.kind === 'Pendiente' ? entry.servicio : entry.historial;
  return [
    item.idServicio,
    entry.kind === 'Realizado' ? entry.historial.idHistorialServicio : '',
    item.cliente,
    item.idCliente,
    item.idMaquina,
    item.modelo,
    item.responsable,
    item.observacionesServicio
  ].join(' ').toLowerCase();
}

export default function Servicios() {
  const { data, isLoading, error } = usePbmData();
  const { user } = useAuth();
  const inventoryUnlocked = canSeeInventory(user);
  const [filter, setFilter] = useState<Filter>('Activos');
  const [viewMode, setViewMode] = useState<ViewMode>('Lista');
  const [query, setQuery] = useState('');
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => keyFromDate(new Date()));

  const reminders = useMemo(() => (data ? getServiceReminders(data.servicios) : []), [data]);
  const todayReminders = reminders.filter((item) => item.kind === 'today');
  const tomorrowReminders = reminders.filter((item) => item.kind === 'tomorrow');

  const clientByIdOrName = useMemo(() => {
    const map = new Map<string, Cliente>();
    data?.clientes.forEach((cliente) => {
      map.set(cliente.idCliente, cliente);
      map.set(cliente.empresa, cliente);
    });
    return map;
  }, [data]);

  const servicios = useMemo(() => {
    if (!data) return [];
    const activeList = visibleServiciosList(data.servicios);
    const search = query.trim().toLowerCase();
    return activeList.filter((servicio) => {
      const status = getServiceStatus(servicio);
      const matchesFilter = filter === 'Activos' || status === filter;
      const matchesSearch = [
        servicio.idServicio,
        servicio.cliente,
        servicio.idMaquina,
        servicio.modelo,
        servicio.tipoServicio,
        inventoryUnlocked ? servicio.producto : '',
        servicio.responsable
      ].join(' ').toLowerCase().includes(search);
      return matchesFilter && matchesSearch;
    });
  }, [data, filter, inventoryUnlocked, query]);

  const calendarEntries = useMemo<CalendarEntry[]>(() => {
    if (!data) return [];
    const pending = activeServicios(data.servicios)
      .filter((servicio) => getServiceStatus(servicio) === 'Pendiente')
      .map((servicio) => ({ kind: 'Pendiente' as const, id: servicio.idServicio, fecha: servicio.fechaProgramada, servicio }));
    const done = activeHistorialServicios(data.historialServicios).map((historial) => ({
      kind: 'Realizado' as const,
      id: historial.idHistorialServicio,
      fecha: historial.fechaRealizado || historial.fechaProgramada,
      historial
    }));
    return [...pending, ...done].filter((entry) => Boolean(entryDateKey(entry)));
  }, [data]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    calendarEntries.forEach((entry) => {
      const key = entryDateKey(entry);
      if (!key) return;
      map.set(key, [...(map.get(key) ?? []), entry]);
    });
    return map;
  }, [calendarEntries]);

  const selectedDayEntries = entriesByDate.get(selectedDateKey) ?? [];
  const monthEntries = calendarEntries.filter((entry) => {
    const date = parseSheetDate(entry.fecha);
    return date && date.getFullYear() === monthCursor.getFullYear() && date.getMonth() === monthCursor.getMonth();
  });
  const monthRealizados = monthEntries.filter((entry): entry is Extract<CalendarEntry, { kind: 'Realizado' }> => entry.kind === 'Realizado');
  const litrosMes = monthRealizados.reduce((sum, entry) => sum + (integerLiters(entry.historial.litrosUsados) ?? 0), 0);
  const serviciosSinLitraje = monthRealizados.filter((entry) => integerLiters(entry.historial.litrosUsados) === null).length;
  const monthDays = calendarDays(monthCursor);

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Error desconocido'} />;

  function logoFor(cliente: string, idCliente: string) {
    return clientByIdOrName.get(idCliente)?.logoCliente ?? clientByIdOrName.get(cliente)?.logoCliente;
  }

  return (
    <div className="screen-fade space-y-5">
      <section className="hero-panel rounded-2xl p-5 lg:p-6">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-pbm-glow">Agenda operativa</p>
            <h2 className="mt-2 text-3xl font-black text-pbm-text lg:text-5xl">Servicios</h2>
            <p className="mt-2 max-w-2xl text-sm text-pbm-muted">Calendario, pendientes activos y cierres realizados sin estado vencido.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center lg:w-[26rem]">
            <div className="rounded-xl border border-pbm-yellow/30 bg-pbm-yellow/10 p-3">
              <p className="text-2xl font-black text-pbm-yellow">{servicios.filter((servicio) => getServiceStatus(servicio) === 'Pendiente').length}</p>
              <p className="text-[0.62rem] text-pbm-muted">Pendientes</p>
            </div>
            <div className="rounded-xl border border-pbm-blue/30 bg-pbm-blue/10 p-3">
              <p className="text-2xl font-black text-pbm-glow">{servicios.filter((servicio) => getServiceStatus(servicio) === 'Sin programar').length}</p>
              <p className="text-[0.62rem] text-pbm-muted">Sin fecha</p>
            </div>
            <div className="rounded-xl border border-pbm-green/30 bg-pbm-green/10 p-3">
              <p className="text-2xl font-black text-pbm-green">{monthRealizados.length}</p>
              <p className="text-[0.62rem] text-pbm-muted">Mes</p>
            </div>
          </div>
        </div>
      </section>

      {reminders.length > 0 ? (
        <section className="premium-card rounded-2xl p-4" data-accent={todayReminders.length > 0 ? 'orange' : 'yellow'}>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-pbm-muted">Recordatorios activos</p>
          <h2 className="mt-1 text-xl font-black text-pbm-text">
            {todayReminders.length > 0 ? `${todayReminders.length} servicio(s) hoy` : `${tomorrowReminders.length} servicio(s) manana`}
          </h2>
          <p className="mt-2 text-sm text-pbm-muted">{todayReminders.length > 0 ? reminderText('today') : reminderText('tomorrow')}</p>
        </section>
      ) : null}

      <div className="panel-card grid grid-cols-2 gap-2 rounded-2xl p-1">
        {(['Lista', 'Calendario'] as ViewMode[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setViewMode(item)}
            className={classNames('pressable min-h-10 rounded-md text-sm font-black transition', viewMode === item ? 'bg-pbm-blue/15 text-pbm-glow shadow-glow' : 'text-pbm-muted')}
          >
            {item}
          </button>
        ))}
      </div>

      {viewMode === 'Calendario' ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
          <div className="panel-card rounded-2xl p-4 shadow-glow">
            <div className="flex items-center justify-between gap-3">
              <button type="button" className="pressable rounded-lg border border-pbm-border bg-pbm-panel/80 p-2 text-pbm-text" onClick={() => setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} aria-label="Mes anterior">
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-pbm-muted">Calendario operativo</p>
                <h2 className="text-lg font-black capitalize text-pbm-text">{monthTitle(monthCursor)}</h2>
                <p className="mt-1 text-xs font-black text-pbm-glow">Litros usados: {litrosMes} L</p>
                {serviciosSinLitraje > 0 ? <p className="text-xs text-pbm-muted">Servicios sin litraje: {serviciosSinLitraje}</p> : null}
              </div>
              <button type="button" className="pressable rounded-lg border border-pbm-border bg-pbm-panel/80 p-2 text-pbm-text" onClick={() => setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} aria-label="Mes siguiente">
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>

            {calendarEntries.length === 0 ? (
              <div className="empty-premium mt-4 rounded-lg p-4 text-sm text-pbm-muted">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 shrink-0 text-pbm-yellow" size={20} aria-hidden="true" />
                  <p>No hay servicios pendientes con Fecha Programada ni realizados en Historial Servicios.</p>
                </div>
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[0.68rem] font-bold uppercase text-pbm-muted">
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {monthDays.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className="aspect-square" />;
                const key = keyFromDate(day);
                const entries = entriesByDate.get(key) ?? [];
                const selected = selectedDateKey === key;
                const hasPending = entries.some((entry) => entry.kind === 'Pendiente');
                const hasDone = entries.some((entry) => entry.kind === 'Realizado');
                const toneClass = hasDone
                    ? 'border-pbm-green/50 bg-pbm-green/15 text-pbm-green'
                    : hasPending
                      ? 'border-pbm-yellow/50 bg-pbm-yellow/15 text-pbm-yellow'
                    : 'border-pbm-border bg-pbm-panel text-pbm-muted';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDateKey(key)}
                    className={classNames('pressable relative aspect-square rounded-md border text-xs font-black transition', toneClass, entries.length > 0 && 'shadow-[0_0_18px_rgba(56,189,248,.12)]', selected && 'ring-2 ring-pbm-blue ring-offset-2 ring-offset-pbm-card')}
                  >
                    {day.getDate()}
                    {entries.length > 0 ? <span className="absolute bottom-1 left-1/2 min-w-5 -translate-x-1/2 rounded-full border border-white/10 bg-pbm-bg/85 px-1 text-[0.62rem] text-pbm-text shadow-glow">{entries.length}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div key={selectedDateKey} className="screen-fade space-y-3 xl:sticky xl:top-28">
            <h3 className="text-sm font-black uppercase tracking-[0.14em] text-pbm-muted">Servicios del dia {formatDate(selectedDateKey)}</h3>
            {selectedDayEntries.length === 0 ? <EmptyState label="No hay servicios programados o realizados para este dia." /> : null}
            {selectedDayEntries.map((entry) => {
              if (entry.kind === 'Pendiente') {
                const servicio = entry.servicio;
                return (
                  <DataCard
                    key={`pendiente-${servicio.idServicio}`}
                    title={`${servicio.idServicio} / ${servicio.cliente}`}
                    subtitle={`${servicio.idMaquina || 'N/A'} / ${servicio.modelo || servicio.tipoServicio}`}
                    leading={<ClientLogo empresa={servicio.cliente} logoCliente={logoFor(servicio.cliente, servicio.idCliente)} size="sm" />}
                    to={`/servicios/${servicio.idServicio}`}
                    accent="yellow"
                    meta={<ServiceStatusBadge status="Pendiente" />}
                  />
                );
              }
              const historial = entry.historial;
              return (
                <DataCard
                  key={`realizado-${historial.idHistorialServicio}`}
                  title={`${historial.idHistorialServicio} / ${historial.cliente}`}
                  subtitle={`${historial.idMaquina || 'N/A'} / ${historial.modelo || historial.tipoServicio}`}
                  leading={<ClientLogo empresa={historial.cliente} logoCliente={logoFor(historial.cliente, historial.idCliente)} size="sm" />}
                  to={`/historial-servicios/${historial.idHistorialServicio}`}
                  accent="green"
                  meta={
                    <>
                      <ServiceStatusBadge status="Realizado" />
                      <StatusBadge tone="blue">{integerLiters(historial.litrosUsados) === null ? 'Sin litraje' : `${integerLiters(historial.litrosUsados)} L`}</StatusBadge>
                    </>
                  }
                />
              );
            })}
          </div>
        </section>
      ) : (
        <>
          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={classNames('pressable min-h-10 shrink-0 rounded-lg border px-4 text-sm font-bold transition', filter === item ? 'border-pbm-blue bg-pbm-blue/15 text-pbm-glow shadow-glow' : 'border-pbm-border bg-pbm-card/90 text-pbm-muted')}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pbm-muted" size={18} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClassName} pl-10`} placeholder="Buscar servicio activo" />
          </div>

          {servicios.length === 0 ? <EmptyState label="No hay servicios para este filtro." /> : null}

          <section className="grid gap-3 xl:grid-cols-2">
            {servicios.map((servicio) => {
              const status = getServiceStatus(servicio);
              return (
                <DataCard
                  key={servicio.idServicio}
                  title={`${servicio.idServicio} / ${servicio.cliente}`}
                  subtitle={`${servicio.idMaquina || 'N/A'} / ${servicio.modelo || servicio.tipoServicio || 'Servicio'}`}
                  leading={<ClientLogo empresa={servicio.cliente} logoCliente={logoFor(servicio.cliente, servicio.idCliente)} size="md" />}
                  to={`/servicios/${servicio.idServicio}`}
                  accent={status === 'Pendiente' ? 'yellow' : 'blue'}
                  meta={
                    <>
                      <ServiceStatusBadge status={status} />
                      <StatusBadge tone="blue">{servicio.tipoServicio || 'Servicio maquina'}</StatusBadge>
                      <StatusBadge tone="green">{servicio.responsable || 'Sin responsable'}</StatusBadge>
                    </>
                  }
                >
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-pbm-muted">Fecha programada</p>
                      <p className="font-black text-pbm-text">{status === 'Sin programar' ? 'Sin programar' : formatDate(servicio.fechaProgramada)}</p>
                    </div>
                    <div>
                      <p className="text-pbm-muted">Litros estimados</p>
                      <p className="font-black text-pbm-text">{inventoryUnlocked ? `${servicio.litrosEstimados ?? 0} L` : 'Protegido'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-pbm-muted">Producto base</p>
                      <p className="font-black text-pbm-text">{inventoryUnlocked || servicio.tipoServicio === 'Ingreso de Material' ? servicio.producto : 'Protegido'}</p>
                    </div>
                  </div>
                </DataCard>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}

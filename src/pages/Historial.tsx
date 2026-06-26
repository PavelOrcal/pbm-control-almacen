import { CalendarDays, CheckCircle2, Filter, LockKeyhole, Package, Search, Warehouse, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClientLogo } from '../components/ClientLogo';
import { DataCard } from '../components/DataCard';
import { inputClassName, SecondaryButton } from '../components/FormControls';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { StatusBadge } from '../components/StatusBadge';
import { usePbmData } from '../hooks/usePbmData';
import { classNames, formatDate, toDateInputValue } from '../lib/formatters';
import {
  buildHistorialMovimientos,
  currentMonthKey,
  historialDateTitle,
  monthKeyFromSheetDate,
  movimientoSearchText,
  previousMonthKey,
  sortHistorialMovimientos,
  type HistorialMovimiento,
  type HistorialOrigen
} from '../lib/history';
import { canSeeInventory, useAuth } from '../lib/auth';
import { protectedInventoryLabel } from '../lib/inventoryAccess';
import type { Cliente, HistorialServicio } from '../types/pbm';

type CategoryFilter = 'Todos' | 'Servicios realizados' | 'Movimientos producto' | 'Movimientos bodega';
type MonthFilter = 'Todos' | 'Mes actual' | 'Mes anterior' | 'Personalizado';
type TipoFilter = 'Todos' | 'Entrada' | 'Salida';
type OrigenFilter = 'Todos' | HistorialOrigen;

function historyDate(servicio: HistorialServicio): string {
  return servicio.fechaRealizado || servicio.fechaProgramada;
}

function historyDateKey(servicio: HistorialServicio): string {
  return toDateInputValue(historyDate(servicio)) || 'sin-fecha';
}

function integerLiters(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
  return Math.trunc(value);
}

function serviceMonthMatches(servicio: HistorialServicio, monthFilter: MonthFilter, customMonth: string): boolean {
  if (monthFilter === 'Todos') return true;
  const key = monthKeyFromSheetDate(historyDate(servicio));
  if (!key) return false;
  if (monthFilter === 'Mes actual') return key === currentMonthKey();
  if (monthFilter === 'Mes anterior') return key === previousMonthKey();
  return Boolean(customMonth) && key === customMonth;
}

function movementMonthMatches(movimiento: HistorialMovimiento, monthFilter: MonthFilter, customMonth: string): boolean {
  if (monthFilter === 'Todos') return true;
  const key = monthKeyFromSheetDate(movimiento.fecha);
  if (!key) return false;
  if (monthFilter === 'Mes actual') return key === currentMonthKey();
  if (monthFilter === 'Mes anterior') return key === previousMonthKey();
  return Boolean(customMonth) && key === customMonth;
}

function serviceSearchText(servicio: HistorialServicio): string {
  return [
    servicio.idHistorialServicio,
    servicio.idServicio,
    servicio.cliente,
    servicio.idCliente,
    servicio.idMaquina,
    servicio.modelo,
    servicio.tipoServicio,
    servicio.productoUsado,
    servicio.responsable,
    servicio.observacionesServicio,
    formatDate(servicio.fechaProgramada),
    formatDate(servicio.fechaRealizado)
  ].join(' ').toLowerCase();
}

function MovementIcon({ movimiento }: { movimiento: HistorialMovimiento }) {
  const Icon = movimiento.origen === 'Producto' ? Package : Warehouse;
  const isEntrada = movimiento.tipoMovimiento === 'Entrada';
  return (
    <div className={classNames('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border shadow-glow', isEntrada ? 'border-pbm-green/35 bg-pbm-green/10 text-pbm-green' : 'border-pbm-orange/35 bg-pbm-orange/10 text-pbm-orange')}>
      <Icon size={21} aria-hidden="true" />
    </div>
  );
}

function MovimientoCard({ movimiento, inventoryUnlocked, logoCliente }: { movimiento: HistorialMovimiento; inventoryUnlocked: boolean; logoCliente?: string }) {
  const isEntrada = movimiento.tipoMovimiento === 'Entrada';
  return (
    <Link to={`/historial/${movimiento.routeOrigen}/${movimiento.id}`} className="pressable block">
      <article data-accent={isEntrada ? 'green' : 'orange'} className={classNames('premium-card animate-card-in rounded-lg border-l-4 p-4', isEntrada ? 'border-l-pbm-green' : 'border-l-pbm-orange')}>
        <div className="flex gap-3">
          {movimiento.cliente ? <ClientLogo empresa={movimiento.cliente} logoCliente={logoCliente} size="sm" /> : <MovementIcon movimiento={movimiento} />}
          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-pbm-muted">{movimiento.id} / {formatDate(movimiento.fecha)}</p>
            <h3 className="mt-1 break-words text-base font-black leading-tight text-pbm-text">{inventoryUnlocked ? movimiento.itemNombre : 'Datos de inventario protegidos'}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge tone={isEntrada ? 'green' : 'orange'}>{movimiento.tipoMovimiento}</StatusBadge>
              <StatusBadge tone={movimiento.origen === 'Producto' ? 'blue' : 'yellow'}>{movimiento.origen}</StatusBadge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md border border-pbm-border/70 bg-pbm-bg/45 p-2">
                <p className="text-pbm-muted">Responsable</p>
                <p className="truncate font-black text-pbm-text">{movimiento.responsable || 'Sin dato'}</p>
              </div>
              <div className="rounded-md border border-pbm-border/70 bg-pbm-bg/45 p-2">
                <p className="text-pbm-muted">Cantidad</p>
                <p className="truncate font-black text-pbm-text">{protectedInventoryLabel(inventoryUnlocked, movimiento.cantidadLabel)}</p>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function Historial() {
  const { data, isLoading, error } = usePbmData();
  const { user } = useAuth();
  const inventoryUnlocked = canSeeInventory(user);
  const [categoria, setCategoria] = useState<CategoryFilter>('Todos');
  const [origen, setOrigen] = useState<OrigenFilter>('Todos');
  const [tipo, setTipo] = useState<TipoFilter>('Todos');
  const [monthFilter, setMonthFilter] = useState<MonthFilter>('Todos');
  const [customMonth, setCustomMonth] = useState(currentMonthKey());
  const [specificDate, setSpecificDate] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [maquinaId, setMaquinaId] = useState('');
  const [responsable, setResponsable] = useState('');
  const [query, setQuery] = useState('');

  const movimientos = useMemo(() => (data && inventoryUnlocked ? buildHistorialMovimientos(data) : []), [data, inventoryUnlocked]);
  const movimientosMesActual = useMemo(
    () => movimientos.filter((movimiento) => monthKeyFromSheetDate(movimiento.fecha) === currentMonthKey()).length,
    [movimientos]
  );
  const servicios = useMemo(() => {
    if (!data) return [];
    const search = query.trim().toLowerCase();
    return data.historialServicios.filter((servicio) => {
      if (categoria === 'Movimientos producto' || categoria === 'Movimientos bodega') return false;
      if (clienteId && servicio.idCliente !== clienteId) return false;
      if (maquinaId && servicio.idMaquina !== maquinaId) return false;
      if (responsable && servicio.responsable !== responsable) return false;
      if (specificDate && historyDateKey(servicio) !== specificDate) return false;
      if (!specificDate && !serviceMonthMatches(servicio, monthFilter, customMonth)) return false;
      if (search && !serviceSearchText(servicio).includes(search)) return false;
      return true;
    });
  }, [data, categoria, clienteId, maquinaId, responsable, specificDate, monthFilter, customMonth, query]);

  const filteredMovimientos = useMemo(() => {
    if (!inventoryUnlocked) return [];
    const search = query.trim().toLowerCase();
    const next = movimientos.filter((movimiento) => {
      if (categoria === 'Servicios realizados') return false;
      if (categoria === 'Movimientos producto' && movimiento.origen !== 'Producto') return false;
      if (categoria === 'Movimientos bodega' && movimiento.origen !== 'Bodega') return false;
      if (origen !== 'Todos' && movimiento.origen !== origen) return false;
      if (tipo !== 'Todos' && movimiento.tipoMovimiento !== tipo) return false;
      if (specificDate && movimiento.fechaKey !== specificDate) return false;
      if (!specificDate && !movementMonthMatches(movimiento, monthFilter, customMonth)) return false;
      if (clienteId && movimiento.idCliente !== clienteId) return false;
      if (maquinaId && movimiento.idMaquina !== maquinaId) return false;
      if (responsable && movimiento.responsable !== responsable) return false;
      if (search && !movimientoSearchText(movimiento).includes(search)) return false;
      return true;
    });
    return sortHistorialMovimientos(next, 'reciente');
  }, [inventoryUnlocked, movimientos, categoria, origen, tipo, specificDate, monthFilter, customMonth, clienteId, maquinaId, responsable, query]);

  const responsables = useMemo(
    () => [...new Set([...(data?.historialServicios.map((servicio) => servicio.responsable) ?? []), ...movimientos.map((movimiento) => movimiento.responsable)].filter(Boolean))].sort(),
    [data, movimientos]
  );

  const serviceGroups = useMemo(() => {
    const map = new Map<string, HistorialServicio[]>();
    servicios.forEach((servicio) => {
      const key = historyDateKey(servicio);
      map.set(key, [...(map.get(key) ?? []), servicio]);
    });
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([fechaKey, items]) => ({ fechaKey, title: historialDateTitle(fechaKey, historyDate(items[0]) || ''), items }));
  }, [servicios]);

  const movementGroups = useMemo(() => {
    const map = new Map<string, HistorialMovimiento[]>();
    filteredMovimientos.forEach((movimiento) => {
      map.set(movimiento.fechaKey, [...(map.get(movimiento.fechaKey) ?? []), movimiento]);
    });
    return [...map.entries()].map(([fechaKey, items]) => ({ fechaKey, title: historialDateTitle(fechaKey, items[0]?.fecha ?? ''), items }));
  }, [filteredMovimientos]);

  const clientByName = useMemo(() => {
    const map = new Map<string, Cliente>();
    data?.clientes.forEach((cliente) => {
      map.set(cliente.empresa, cliente);
      map.set(cliente.idCliente, cliente);
    });
    return map;
  }, [data]);

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Error desconocido'} />;

  function clearFilters() {
    setCategoria('Todos');
    setOrigen('Todos');
    setTipo('Todos');
    setMonthFilter('Todos');
    setCustomMonth(currentMonthKey());
    setSpecificDate('');
    setClienteId('');
    setMaquinaId('');
    setResponsable('');
    setQuery('');
  }

  return (
    <div className="screen-fade space-y-5">
      <section className="hero-panel rounded-lg p-5">
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-pbm-glow">Auditoria operativa</p>
              <h2 className="mt-2 text-3xl font-black leading-none text-pbm-text">Historial</h2>
              <p className="mt-3 text-sm leading-relaxed text-pbm-muted">Servicios realizados desde Historial Servicios y movimientos de inventario solo para admin.</p>
            </div>
            <div className="rounded-lg border border-pbm-green/35 bg-pbm-green/10 p-3 text-pbm-green shadow-glow">
              <CheckCircle2 size={24} aria-hidden="true" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="metric-card rounded-lg p-3">
              <p className="text-xs font-bold uppercase text-pbm-muted">Realizados</p>
              <p className="metric-value mt-1 text-xl font-black text-pbm-text">{servicios.length}</p>
            </div>
            <div className="metric-card rounded-lg p-3">
              <p className="text-xs font-bold uppercase text-pbm-muted">{inventoryUnlocked ? 'Movimientos del mes' : 'Inventario restringido'}</p>
              <p className="metric-value mt-1 text-xl font-black text-pbm-text">{inventoryUnlocked ? movimientosMesActual : 'Solo admin'}</p>
            </div>
          </div>
          {!inventoryUnlocked ? (
            <div className="mt-4 rounded-lg border border-pbm-orange/30 bg-pbm-orange/10 p-3 text-sm text-pbm-muted">
              <div className="flex gap-2">
                <LockKeyhole className="mt-0.5 shrink-0 text-pbm-orange" size={17} aria-hidden="true" />
                <p>Tu rol operativo ve servicios realizados. Movimientos y cantidades de almacen quedan reservados para admin.</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="panel-card rounded-lg p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-pbm-muted">Filtros</p>
            <h3 className="text-lg font-black text-pbm-text">Revision rapida</h3>
          </div>
          <Filter className="text-pbm-glow" size={20} aria-hidden="true" />
        </div>
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pbm-muted" size={18} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClassName} pl-10`} placeholder="Buscar cliente, maquina, servicio o movimiento" />
          </div>
          <select value={categoria} onChange={(event) => setCategoria(event.target.value as CategoryFilter)} className={inputClassName} aria-label="Categoria historial">
            <option value="Todos">Todo permitido</option>
            <option value="Servicios realizados">Servicios realizados</option>
            {inventoryUnlocked ? <option value="Movimientos producto">Movimientos producto</option> : null}
            {inventoryUnlocked ? <option value="Movimientos bodega">Movimientos bodega</option> : null}
          </select>
          {inventoryUnlocked ? (
            <div className="grid grid-cols-2 gap-3">
              <select value={origen} onChange={(event) => setOrigen(event.target.value as OrigenFilter)} className={inputClassName} aria-label="Origen">
                <option value="Todos">Todos los origenes</option>
                <option value="Producto">Producto</option>
                <option value="Bodega">Bodega</option>
              </select>
              <select value={tipo} onChange={(event) => setTipo(event.target.value as TipoFilter)} className={inputClassName} aria-label="Tipo movimiento">
                <option value="Todos">Entrada y salida</option>
                <option value="Entrada">Entrada</option>
                <option value="Salida">Salida</option>
              </select>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value as MonthFilter)} className={inputClassName} aria-label="Filtro mes">
              <option value="Todos">Todos los meses</option>
              <option value="Mes actual">Mes actual</option>
              <option value="Mes anterior">Mes anterior</option>
              <option value="Personalizado">Mes personalizado</option>
            </select>
            <input type="month" value={customMonth} onChange={(event) => setCustomMonth(event.target.value)} className={inputClassName} disabled={monthFilter !== 'Personalizado'} aria-label="Mes personalizado" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={specificDate} onChange={(event) => setSpecificDate(event.target.value)} className={inputClassName} aria-label="Fecha especifica" />
            <select value={responsable} onChange={(event) => setResponsable(event.target.value)} className={inputClassName} aria-label="Responsable">
              <option value="">Todos responsables</option>
              {responsables.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={clienteId} onChange={(event) => { setClienteId(event.target.value); setMaquinaId(''); }} className={inputClassName} aria-label="Cliente">
              <option value="">Todos clientes</option>
              {data.clientes.map((cliente) => <option key={cliente.idCliente} value={cliente.idCliente}>{cliente.empresa}</option>)}
            </select>
            <select value={maquinaId} onChange={(event) => setMaquinaId(event.target.value)} className={inputClassName} aria-label="Maquina">
              <option value="">Todas maquinas</option>
              {data.maquinas.filter((maquina) => !clienteId || maquina.idCliente === clienteId).map((maquina) => <option key={maquina.idMaquina} value={maquina.idMaquina}>{maquina.idMaquina} / {maquina.modelo}</option>)}
            </select>
          </div>
          <button type="button" onClick={clearFilters} className="pressable inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-pbm-border bg-pbm-card/80 px-4 text-sm font-black text-pbm-text">
            <X size={16} aria-hidden="true" />
            Limpiar filtros
          </button>
        </div>
      </section>

      {(categoria === 'Todos' || categoria === 'Servicios realizados') ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-pbm-muted">Servicios realizados</p>
              <h3 className="text-lg font-black text-pbm-text">{servicios.length} registros</h3>
            </div>
            <CheckCircle2 size={18} className="text-pbm-green" aria-hidden="true" />
          </div>
          {servicios.length === 0 ? <EmptyState label="No hay servicios realizados con estos filtros." /> : null}
          <div className="space-y-5">
            {serviceGroups.map((group) => (
              <div key={`servicios-${group.fechaKey}`} className="space-y-3">
                <div className="sticky top-[4.6rem] z-20 rounded-lg border border-pbm-border/80 bg-pbm-bg/85 px-3 py-2 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-black capitalize text-pbm-text">{group.title}</h4>
                    <span className="rounded-full border border-pbm-green/30 bg-pbm-green/10 px-2 py-0.5 text-xs font-black text-pbm-green">{group.items.length}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {group.items.map((servicio) => {
                    const cliente = clientByName.get(servicio.idCliente) ?? clientByName.get(servicio.cliente);
                    return (
                      <DataCard
                        key={servicio.idHistorialServicio}
                        title={`${servicio.idHistorialServicio} / ${servicio.cliente}`}
                        subtitle={`${servicio.idMaquina || 'N/A'} / ${servicio.modelo || servicio.tipoServicio}`}
                        leading={<ClientLogo empresa={servicio.cliente} logoCliente={cliente?.logoCliente} size="sm" />}
                        to={`/historial-servicios/${servicio.idHistorialServicio}`}
                        accent="green"
                        meta={
                          <>
                            <StatusBadge tone="green">Realizado</StatusBadge>
                            <StatusBadge tone="blue">{integerLiters(servicio.litrosUsados) === null ? 'Sin litraje' : `${integerLiters(servicio.litrosUsados)} L`}</StatusBadge>
                          </>
                        }
                      >
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="rounded-md border border-pbm-border/70 bg-pbm-bg/45 p-2">
                            <p className="text-pbm-muted">Programada</p>
                            <p className="font-black text-pbm-text">{formatDate(servicio.fechaProgramada)}</p>
                          </div>
                          <div className="rounded-md border border-pbm-border/70 bg-pbm-bg/45 p-2">
                            <p className="text-pbm-muted">Realizada</p>
                            <p className="font-black text-pbm-text">{formatDate(servicio.fechaRealizado)}</p>
                          </div>
                          <div className="col-span-2 rounded-md border border-pbm-border/70 bg-pbm-bg/45 p-2">
                            <p className="text-pbm-muted">Producto usado</p>
                            <p className="font-black text-pbm-text">{servicio.productoUsado || 'Sin dato'}</p>
                          </div>
                        </div>
                      </DataCard>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {inventoryUnlocked && (categoria === 'Todos' || categoria === 'Movimientos producto' || categoria === 'Movimientos bodega') ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-pbm-muted">Movimientos admin</p>
              <h3 className="text-lg font-black text-pbm-text">{filteredMovimientos.length} movimientos</h3>
            </div>
            <CalendarDays size={18} className="text-pbm-glow" aria-hidden="true" />
          </div>
          {filteredMovimientos.length === 0 ? (
            <div className="empty-premium rounded-lg p-5 text-center">
              <p className="text-sm font-bold text-pbm-text">No hay movimientos con estos filtros.</p>
              <div className="mt-4"><SecondaryButton onClick={clearFilters} className="gap-2"><X size={16} aria-hidden="true" />Limpiar filtros</SecondaryButton></div>
            </div>
          ) : null}
          <div className="space-y-5">
            {movementGroups.map((group) => (
              <div key={group.fechaKey} className="space-y-3">
                <div className="sticky top-[4.6rem] z-20 rounded-lg border border-pbm-border/80 bg-pbm-bg/85 px-3 py-2 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-black capitalize text-pbm-text">{group.title}</h4>
                    <span className="rounded-full border border-pbm-blue/30 bg-pbm-blue/10 px-2 py-0.5 text-xs font-black text-pbm-glow">{group.items.length}</span>
                  </div>
                </div>
                <div className="timeline space-y-3">
                  {group.items.map((movimiento) => (
                    <div key={`${movimiento.routeOrigen}-${movimiento.id}`} className="timeline-item">
                      <span className={classNames('timeline-dot', movimiento.tipoMovimiento === 'Entrada' ? 'bg-pbm-green shadow-[0_0_18px_rgba(34,197,94,.38)]' : 'bg-pbm-orange shadow-[0_0_18px_rgba(245,158,11,.38)]')} />
                      <MovimientoCard movimiento={movimiento} inventoryUnlocked={inventoryUnlocked} logoCliente={clientByName.get(movimiento.cliente ?? '')?.logoCliente ?? clientByName.get(movimiento.idCliente ?? '')?.logoCliente} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

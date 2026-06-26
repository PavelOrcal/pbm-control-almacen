import {
  ArrowRight,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Factory,
  History,
  BellRing,
  LockKeyhole,
  PackageSearch,
  PackagePlus,
  Warehouse,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClientLogo } from '../components/ClientLogo';
import { CountUp } from '../components/CountUp';
import { DataCard } from '../components/DataCard';
import { OfflineSyncCard } from '../components/OfflineSyncCard';
import { PushPermissionCard } from '../components/PushPermissionCard';
import { ErrorState, LoadingState } from '../components/States';
import { StatCard } from '../components/StatCard';
import { ServiceStatusBadge } from '../components/StatusBadge';
import { usePbmData } from '../hooks/usePbmData';
import { useSmartAlerts } from '../hooks/useSmartAlerts';
import { BrandLogo } from '../components/BrandLogo';
import { SmartAlertsPanel } from '../components/SmartAlertsPanel';
import {
  formatDate,
  getServiceStatus,
  parseSheetDate
} from '../lib/formatters';
import { canSeeInventory, useAuth } from '../lib/auth';

export default function Dashboard() {
  const { data, isLoading, error } = usePbmData();
  const { user } = useAuth();
  const { alerts: smartAlerts } = useSmartAlerts(data);
  const inventoryUnlocked = canSeeInventory(user);

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Error desconocido'} />;

  const clientesActivos = data.clientes.filter((cliente) => cliente.activo === 'SI').length;
  const clientesDestacados = data.clientes.filter((cliente) => cliente.activo === 'SI').slice(0, 3);
  const maquinasActivas = data.maquinas.filter((maquina) => maquina.estado === 'Activa').length;
  const serviciosByStatus = data.servicios.reduce(
    (acc, servicio) => {
      acc[getServiceStatus(servicio)] += 1;
      return acc;
    },
    { 'Sin programar': 0, Pendiente: 0, Realizado: 0 }
  );
  const bioMetal = data.productos.find((producto) => producto.producto === 'Bio Metal 3000');
  const proximoServicio =
    data.servicios
      .map((servicio) => ({ servicio, date: parseSheetDate(servicio.fechaProgramada) }))
      .filter((item): item is { servicio: (typeof data.servicios)[number]; date: Date } => Boolean(item.date) && !item.servicio.fechaRealizado)
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0]?.servicio ?? null;
  const proximoCliente = proximoServicio ? data.clientes.find((cliente) => cliente.idCliente === proximoServicio.idCliente || cliente.empresa === proximoServicio.cliente) : null;
  const servicioSinProgramar = data.servicios.find((servicio) => getServiceStatus(servicio) === 'Sin programar') ?? null;
  const clienteSinProgramar = servicioSinProgramar ? data.clientes.find((cliente) => cliente.idCliente === servicioSinProgramar.idCliente || cliente.empresa === servicioSinProgramar.cliente) : null;
  const accesosOperativos = [
    {
      to: '/alertas',
      label: 'Centro de mando',
      detail: 'Alertas inteligentes y prioridades',
      icon: BellRing,
      tone: 'orange'
    },
    {
      to: '/movimiento-producto',
      label: 'Registrar movimiento producto',
      detail: 'Entradas y salidas de producto',
      icon: PackagePlus,
      tone: 'orange'
    },
    {
      to: '/movimiento-bodega',
      label: 'Registrar movimiento bodega',
      detail: 'Control de articulos y refacciones',
      icon: Warehouse,
      tone: 'orange'
    },
    {
      to: '/stock-productos',
      label: 'Stock productos',
      detail: 'Niveles y existencias criticas',
      icon: PackageSearch,
      tone: 'blue'
    },
    {
      to: '/stock-bodega',
      label: 'Stock bodega',
      detail: 'Inventario, minimos y ubicacion',
      icon: Boxes,
      tone: 'green'
    },
    {
      to: '/servicios',
      label: 'Ver servicios',
      detail: 'Lista, calendario y estados',
      icon: ClipboardList,
      tone: 'yellow'
    },
    {
      to: '/historial',
      label: 'Historial operativo',
      detail: 'Movimientos y auditoria interna',
      icon: History,
      tone: 'blue'
    },
    {
      to: '/maquinas',
      label: 'Ver maquinas',
      detail: 'Fichas tecnicas por cliente',
      icon: Factory,
      tone: 'green'
    },
    {
      to: '/clientes',
      label: 'Ver clientes',
      detail: 'Cartera operativa activa',
      icon: UsersRound,
      tone: 'blue'
    }
  ] as const;
  const accessToneClass = {
    blue: 'border-pbm-blue/35 bg-pbm-blue/10 text-pbm-glow shadow-blue',
    green: 'border-pbm-green/30 bg-pbm-green/10 text-pbm-green',
    yellow: 'border-pbm-yellow/30 bg-pbm-yellow/10 text-pbm-yellow',
    orange: 'border-pbm-orange/35 bg-pbm-orange/10 text-pbm-orange shadow-orange'
  } as const;
  const protectedRoutes = new Set(['/movimiento-producto', '/movimiento-bodega', '/stock-productos', '/stock-bodega']);
  const visibleAccesses = inventoryUnlocked ? accesosOperativos : accesosOperativos.filter((acceso) => !protectedRoutes.has(acceso.to));

  return (
    <div className="screen-fade space-y-5">
      <section className="hero-panel rounded-2xl p-5 lg:p-7">
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-4">
            <BrandLogo className="h-16 w-40 px-4 lg:h-20 lg:w-56" imageClassName="h-12 lg:h-14" />
            <div className="rounded-lg border border-pbm-orange/40 bg-pbm-orange/10 px-3 py-2 text-right shadow-orange">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-pbm-orange">Fuente</p>
              <p className="text-xs font-black text-pbm-text">{data.sync.source === 'mock' ? 'Mock temporal' : 'Google Sheet'}</p>
            </div>
          </div>
          <div className="mt-6 max-w-xl">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-pbm-glow">Paradigm Bio Metal</p>
            <h2 className="mt-2 text-4xl font-black leading-none text-pbm-text lg:text-6xl">PBM Control</h2>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-pbm-muted lg:max-w-2xl lg:text-base">
              Centro ejecutivo industrial para clientes, maquinas, servicios, alertas y control operativo.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 text-center sm:grid-cols-4 lg:gap-3">
            <div className="rounded-xl border border-pbm-blue/25 bg-pbm-bg/70 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
              <p className="metric-value text-2xl font-black text-pbm-text"><CountUp value={clientesActivos} /></p>
              <p className="text-[0.65rem] text-pbm-muted">Clientes</p>
            </div>
            <div className="rounded-xl border border-pbm-blue/25 bg-pbm-bg/70 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
              <p className="metric-value text-2xl font-black text-pbm-text"><CountUp value={maquinasActivas} /></p>
              <p className="text-[0.65rem] text-pbm-muted">Maquinas</p>
            </div>
            <div className="rounded-xl border border-pbm-blue/25 bg-pbm-bg/70 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
              <p className="metric-value text-2xl font-black text-pbm-text"><CountUp value={data.servicios.length} /></p>
              <p className="text-[0.65rem] text-pbm-muted">Servicios</p>
            </div>
            <div className="rounded-xl border border-pbm-blue/25 bg-pbm-bg/70 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
              <p className="metric-value text-2xl font-black text-pbm-text">{inventoryUnlocked ? <CountUp value={data.stockBodega.length} /> : 'Bloq.'}</p>
              <p className="text-[0.65rem] text-pbm-muted">{inventoryUnlocked ? 'Bodega' : 'Inventario'}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="desktop-dashboard-grid">
        <div className="space-y-5">
          <SmartAlertsPanel alerts={smartAlerts} compact limit={2} />
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Clientes activos" value={clientesActivos} icon={UsersRound} tone="blue" />
        <StatCard label="Maquinas activas" value={maquinasActivas} icon={Factory} tone="green" />
        <StatCard label="Pendientes" value={serviciosByStatus.Pendiente} icon={CalendarClock} tone="yellow" />
        <StatCard label="Realizados" value={data.historialServicios.length} icon={CheckCircle2} tone="green" />
        <StatCard label="Sin programar" value={serviciosByStatus['Sin programar']} icon={CalendarClock} tone="blue" />
        {inventoryUnlocked ? (
          <StatCard label="Bio Metal 3000" value={bioMetal?.existenciaActualLitros ?? 0} icon={Boxes} tone="orange" detail="Litros actuales" />
        ) : (
          <StatCard label="Inventario protegido" value="Bloqueado" icon={LockKeyhole} tone="orange" detail="Stock y litraje ocultos" />
        )}
          </section>
        </div>
        <aside className="space-y-4">
          <OfflineSyncCard />
          <PushPermissionCard variant="dashboard" />
        </aside>
      </div>

      {!inventoryUnlocked ? (
        <section className="premium-card rounded-lg p-4" data-accent="orange">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-pbm-orange/40 bg-pbm-orange/10 p-3 text-pbm-orange shadow-orange">
              <LockKeyhole size={24} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-pbm-orange">Rol operativo</p>
              <h3 className="mt-1 text-xl font-black text-pbm-text">Inventario protegido</h3>
              <p className="mt-2 text-sm leading-relaxed text-pbm-muted">
                Tu sesión de {user?.username} permite operar servicios, clientes y máquinas. Stock, litros y movimientos de almacén quedan reservados para administradores.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="panel-card rounded-2xl p-4 lg:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-pbm-muted">Operacion del dia</p>
            <h2 className="mt-1 text-xl font-black text-pbm-text">Estado ejecutivo</h2>
          </div>
          <div className="rounded-lg border border-pbm-red/30 bg-pbm-red/10 p-2 text-pbm-red">
            <CalendarClock size={20} aria-hidden="true" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md border border-pbm-yellow/25 bg-pbm-yellow/10 p-3">
            <p className="metric-value text-2xl font-black text-pbm-yellow">{serviciosByStatus.Pendiente}</p>
            <p className="text-[0.65rem] font-bold uppercase text-pbm-muted">Pendientes</p>
          </div>
          <div className="rounded-md border border-pbm-green/25 bg-pbm-green/10 p-3">
            <p className="metric-value text-2xl font-black text-pbm-green">{data.historialServicios.length}</p>
            <p className="text-[0.65rem] font-bold uppercase text-pbm-muted">Realizados</p>
          </div>
          <div className="rounded-md border border-pbm-blue/25 bg-pbm-blue/10 p-3">
            <p className="metric-value text-2xl font-black text-pbm-glow">{serviciosByStatus['Sin programar']}</p>
            <p className="text-[0.65rem] font-bold uppercase text-pbm-muted">Sin fecha</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-[0.14em] text-pbm-muted">Proximo servicio</h2>
          <CalendarClock size={17} className="text-pbm-glow" aria-hidden="true" />
        </div>
        <DataCard
          title={proximoServicio ? proximoServicio.cliente : 'Sin fecha programada'}
          subtitle={proximoServicio ? `${proximoServicio.idMaquina} / ${proximoServicio.modelo}` : 'No hay servicios con Fecha Programada capturada'}
          leading={proximoServicio ? <ClientLogo empresa={proximoServicio.cliente} logoCliente={proximoCliente?.logoCliente} size="md" /> : undefined}
          to={proximoServicio ? `/servicios/${proximoServicio.idServicio}` : '/servicios'}
          accent="yellow"
          meta={
            <>
              <ServiceStatusBadge status={proximoServicio ? getServiceStatus(proximoServicio) : 'Sin programar'} />
              <span className="text-sm text-pbm-muted">{formatDate(proximoServicio?.fechaProgramada)}</span>
            </>
          }
        />
        {servicioSinProgramar ? (
          <DataCard
            title={`Sin programar / ${servicioSinProgramar.cliente}`}
            subtitle={`${servicioSinProgramar.idMaquina} / ${servicioSinProgramar.modelo}`}
            leading={<ClientLogo empresa={servicioSinProgramar.cliente} logoCliente={clienteSinProgramar?.logoCliente} size="md" />}
            to={`/servicios/${servicioSinProgramar.idServicio}`}
            accent="blue"
            meta={<ServiceStatusBadge status="Sin programar" />}
          />
        ) : null}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-[0.14em] text-pbm-muted">Clientes activos</h2>
          <UsersRound size={17} className="text-pbm-glow" aria-hidden="true" />
        </div>
        <div className="section-grid">
          {clientesDestacados.map((cliente) => (
            <DataCard
              key={cliente.idCliente}
              title={cliente.empresa}
              subtitle={`${cliente.ciudad} / ${cliente.tipoCliente}`}
              leading={<ClientLogo empresa={cliente.empresa} logoCliente={cliente.logoCliente} size="md" />}
              to={`/clientes/${cliente.idCliente}`}
              accent={cliente.prioridad === 'Critica' ? 'red' : cliente.prioridad === 'Alta' ? 'orange' : 'blue'}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-pbm-muted">Accesos operativos</p>
            <h2 className="mt-1 text-xl font-black text-pbm-text">Accesos operativos</h2>
          </div>
          <div className="rounded-lg border border-pbm-blue/30 bg-pbm-blue/10 p-2 text-pbm-glow">
            <ArrowRight size={19} aria-hidden="true" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 xl:grid-cols-4">
          {visibleAccesses.map((acceso, index) => {
            const Icon = acceso.icon;
            return (
              <Link
                key={acceso.to}
                to={acceso.to}
                className="quick-action pressable card-enter group flex min-h-32 flex-col justify-between rounded-lg p-4 text-pbm-text"
                style={{ animationDelay: `${index * 35}ms` }}
              >
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <span className={`rounded-lg border p-2 ${accessToneClass[acceso.tone]}`}>
                    <Icon size={21} aria-hidden="true" />
                  </span>
                  <ArrowRight size={16} className="mt-1 text-pbm-muted transition group-hover:translate-x-0.5 group-hover:text-pbm-glow" aria-hidden="true" />
                </div>
                <div className="relative z-10 mt-5">
                  <h3 className="text-sm font-black leading-tight text-pbm-text">{acceso.label}</h3>
                  <p className="mt-1 text-[0.68rem] font-semibold leading-snug text-pbm-muted">{acceso.detail}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

import { Link, useParams } from 'react-router-dom';
import { ClipboardList, Factory } from 'lucide-react';
import { ClientLogo } from '../components/ClientLogo';
import { DataCard } from '../components/DataCard';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { PriorityBadge, ServiceStatusBadge, StatusBadge } from '../components/StatusBadge';
import { usePbmData } from '../hooks/usePbmData';
import { formatDate, getServiceStatus } from '../lib/formatters';
import { hasInventoryAccess } from '../lib/inventoryAccess';
import type { ServiceStatus } from '../types/pbm';

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric-card rounded-lg p-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-pbm-muted">{label}</p>
      <p className="metric-value mt-1 text-xl font-black text-pbm-text">{value}</p>
    </div>
  );
}

function serviceAccent(status: ServiceStatus): 'green' | 'yellow' | 'red' | 'blue' {
  if (status === 'Realizado') return 'green';
  if (status === 'Pendiente') return 'yellow';
  return 'blue';
}

export default function ClienteDetalle() {
  const { idCliente } = useParams();
  const { data, isLoading, error } = usePbmData();
  const inventoryUnlocked = hasInventoryAccess();

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Error desconocido'} />;

  const cliente = data.clientes.find((item) => item.idCliente === idCliente);
  if (!cliente) return <EmptyState label="Cliente no encontrado." />;

  const maquinas = data.maquinas.filter((maquina) => maquina.idCliente === cliente.idCliente);
  const servicios = data.servicios.filter((servicio) => servicio.idCliente === cliente.idCliente);
  const pendientes = servicios.filter((servicio) => getServiceStatus(servicio) === 'Pendiente').length;
  const litros = servicios.reduce((sum, servicio) => sum + (servicio.litrosEstimados ?? 0), 0);

  return (
    <div className="screen-fade space-y-5">
      <section className="premium-card rounded-lg p-4" data-accent={cliente.prioridad === 'Critica' ? 'red' : cliente.prioridad === 'Alta' ? 'orange' : 'blue'}>
        <div className="flex items-start gap-4">
          <ClientLogo empresa={cliente.empresa} logoCliente={cliente.logoCliente} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-pbm-glow">{cliente.idCliente}</p>
            <h2 className="mt-1 text-2xl font-black leading-tight text-pbm-text">{cliente.empresa}</h2>
            <p className="mt-2 text-sm text-pbm-muted">{cliente.ciudad}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <PriorityBadge priority={cliente.prioridad} />
          <StatusBadge tone={cliente.estadoCliente === 'Activo' ? 'green' : 'neutral'}>{cliente.estadoCliente}</StatusBadge>
          <StatusBadge tone={cliente.activo === 'SI' ? 'green' : 'red'}>Activo {cliente.activo}</StatusBadge>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Metric label="Maquinas" value={maquinas.length} />
        <Metric label="Servicios" value={servicios.length} />
        <Metric label="Pendientes" value={pendientes} />
        <Metric label="Realizados" value={data.historialServicios.filter((item) => item.idCliente === cliente.idCliente).length} />
        <Metric label="Litros estimados" value={inventoryUnlocked ? litros : 'Protegido'} />
        <Metric label="Frecuencia" value={`${cliente.frecuenciaDias ?? 0} dias`} />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link
          to="/maquinas"
          className="quick-action pressable flex min-h-20 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black text-pbm-text"
        >
          <Factory size={18} className="text-pbm-glow" aria-hidden="true" />
          Ver maquinas
        </Link>
        <Link
          to="/servicios"
          className="quick-action pressable flex min-h-20 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black text-pbm-text"
        >
          <ClipboardList size={18} className="text-pbm-orange" aria-hidden="true" />
          Ver servicios
        </Link>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-normal text-pbm-muted">Maquinas asociadas</h3>
        {maquinas.length === 0 ? <EmptyState label="Este cliente no tiene maquinas asociadas." /> : null}
        {maquinas.map((maquina) => (
          <DataCard
            key={maquina.idMaquina}
            title={maquina.idMaquina}
            subtitle={`${maquina.modelo} / ${maquina.ubicacionArea}`}
            to={`/maquinas/${maquina.idMaquina}`}
            meta={
              <>
                <StatusBadge tone={maquina.estado === 'Activa' ? 'green' : 'yellow'}>{maquina.estado}</StatusBadge>
                <PriorityBadge priority={maquina.prioridadServicio} />
              </>
            }
          />
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-normal text-pbm-muted">Servicios asociados</h3>
        {servicios.length === 0 ? <EmptyState label="Este cliente no tiene servicios asociados." /> : null}
        {servicios.map((servicio) => {
          const status = getServiceStatus(servicio);
          return (
            <DataCard
            key={servicio.idServicio}
            title={servicio.idServicio}
            subtitle={`${servicio.idMaquina} / ${servicio.modelo}`}
            leading={<ClientLogo empresa={cliente.empresa} logoCliente={cliente.logoCliente} size="sm" />}
            to={`/servicios/${servicio.idServicio}`}
              accent={serviceAccent(status)}
              meta={
                <>
                  <ServiceStatusBadge status={status} />
                  <span className="text-sm text-pbm-muted">{status === 'Sin programar' ? 'Sin programar' : formatDate(servicio.fechaProgramada)}</span>
                </>
              }
            />
          );
        })}
      </section>
    </div>
  );
}

import { useParams } from 'react-router-dom';
import { DataCard } from '../components/DataCard';
import { MachineVisual } from '../components/MachineVisual';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { PriorityBadge, ServiceStatusBadge, StatusBadge } from '../components/StatusBadge';
import { usePbmData } from '../hooks/usePbmData';
import { formatDate, getServiceStatus } from '../lib/formatters';
import { hasInventoryAccess } from '../lib/inventoryAccess';
import type { ServiceStatus } from '../types/pbm';

function DetailLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-b border-pbm-border/60 py-3 last:border-b-0">
      <p className="text-xs font-bold uppercase tracking-normal text-pbm-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-pbm-text">{value || 'Sin dato'}</p>
    </div>
  );
}

function serviceAccent(status: ServiceStatus): 'green' | 'yellow' | 'red' | 'blue' {
  if (status === 'Realizado') return 'green';
  if (status === 'Pendiente') return 'yellow';
  return 'blue';
}

export default function MaquinaDetalle() {
  const { idMaquina } = useParams();
  const { data, isLoading, error } = usePbmData();
  const inventoryUnlocked = hasInventoryAccess();

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Error desconocido'} />;

  const maquina = data.maquinas.find((item) => item.idMaquina === idMaquina);
  if (!maquina) return <EmptyState label="Maquina no encontrada." />;

  const cliente = data.clientes.find((item) => item.idCliente === maquina.idCliente);
  const producto = data.productos.find((item) => item.idProducto === maquina.idProducto);
  const servicios = data.servicios.filter((servicio) => servicio.idMaquina === maquina.idMaquina);
  const movimientos = data.movimientosProducto.filter((movimiento) => movimiento.idMaquina === maquina.idMaquina);

  return (
    <div className="screen-fade space-y-5">
      <section className="premium-card rounded-lg p-4" data-accent={maquina.prioridadServicio === 'Critica' ? 'red' : maquina.prioridadServicio === 'Alta' ? 'orange' : 'blue'}>
        <MachineVisual model={maquina.modelo} fotoMaquina={maquina.fotoMaquina} variant="detail" />
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-pbm-glow">{maquina.idMaquina}</p>
        <h2 className="mt-1 text-3xl font-black leading-none text-pbm-text">{maquina.modelo}</h2>
        <p className="mt-2 text-sm text-pbm-muted">{maquina.empresa}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge tone={maquina.estado === 'Activa' ? 'green' : 'yellow'}>{maquina.estado}</StatusBadge>
          <PriorityBadge priority={maquina.prioridadServicio} />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="metric-card rounded-lg p-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-pbm-muted">Capacidad</p>
          <p className="metric-value mt-1 text-2xl font-black text-pbm-text">{inventoryUnlocked ? maquina.capacidadLitros ?? 0 : 'Protegido'}</p>
          <p className="text-sm text-pbm-muted">{inventoryUnlocked ? 'Litros' : 'Inventario'}</p>
        </div>
        <div className="metric-card rounded-lg p-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-pbm-muted">Servicios</p>
          <p className="metric-value mt-1 text-2xl font-black text-pbm-text">{servicios.length}</p>
          <p className="text-sm text-pbm-muted">Relacionados</p>
        </div>
      </section>

      <section className="panel-card rounded-lg px-4">
        <DetailLine label="Cliente asociado" value={cliente ? `${cliente.idCliente} / ${cliente.empresa}` : maquina.idCliente} />
        <DetailLine label="Producto asociado" value={inventoryUnlocked ? (producto ? `${producto.idProducto} / ${producto.producto}` : maquina.idProducto) : 'Protegido'} />
        <DetailLine label="Capacidad litros" value={inventoryUnlocked ? `${maquina.capacidadLitros ?? 0} L` : 'Protegido'} />
        <DetailLine label="Modelo" value={maquina.modelo} />
        <DetailLine label="Estado" value={maquina.estado} />
        <DetailLine label="Prioridad servicio" value={maquina.prioridadServicio} />
        <DetailLine label="Ubicacion area" value={maquina.ubicacionArea} />
        <DetailLine label="Foto maquina" value={maquina.fotoMaquina || 'Sin archivo'} />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-[0.14em] text-pbm-muted">Servicios de esta maquina</h3>
        {servicios.length === 0 ? <EmptyState label="No hay servicios para esta maquina." /> : null}
        {servicios.map((servicio) => {
          const status = getServiceStatus(servicio);
          return (
            <DataCard
              key={servicio.idServicio}
              title={servicio.idServicio}
              subtitle={inventoryUnlocked ? `${servicio.producto} / ${servicio.litrosEstimados ?? 0} L` : 'Inventario protegido'}
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

      {inventoryUnlocked ? (
        <section className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-[0.14em] text-pbm-muted">Movimientos producto</h3>
          {movimientos.length === 0 ? <EmptyState label="No hay movimientos de producto ligados." /> : null}
          {movimientos.map((movimiento) => (
            <DataCard
              key={movimiento.idMovimientoProducto}
              title={movimiento.idMovimientoProducto}
              subtitle={`${movimiento.tipoMovimiento} / ${movimiento.litros ?? 0} L / ${movimiento.fecha}`}
              accent={movimiento.tipoMovimiento === 'Salida' ? 'orange' : 'green'}
              meta={<StatusBadge tone={movimiento.tipoMovimiento === 'Salida' ? 'orange' : 'green'}>{movimiento.motivo}</StatusBadge>}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}

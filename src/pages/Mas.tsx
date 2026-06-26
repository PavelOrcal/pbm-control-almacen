import { BellRing, Boxes, Database, Factory, History, PackagePlus, Warehouse } from 'lucide-react';
import { DataCard } from '../components/DataCard';
import { PushBackendStatusCard } from '../components/PushBackendStatusCard';
import { PushPermissionCard } from '../components/PushPermissionCard';
import { StatusBadge } from '../components/StatusBadge';
import { usePbmData } from '../hooks/usePbmData';
import { canAccessWarehouse, useAuth } from '../lib/auth';

export default function Mas() {
  const { data } = usePbmData();
  const { user } = useAuth();
  const isAdmin = canAccessWarehouse(user);

  return (
    <div className="screen-fade space-y-4">
      <section className="premium-card rounded-lg p-4" data-accent="blue">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-pbm-glow">Modulos V1</p>
        <h2 className="mt-1 text-xl font-black text-pbm-text">Operacion extendida</h2>
        <p className="mt-2 text-sm text-pbm-muted">
          {isAdmin ? 'Accesos a inventarios, movimientos y sincronizacion.' : 'Accesos operativos sin datos sensibles de almacen.'}
        </p>
        <div className="mt-4">
          <StatusBadge tone={data?.sync.source === 'apps-script' ? 'green' : 'yellow'}>
            {data?.sync.source === 'apps-script' ? 'Google Sheet conectado' : 'Mock temporal'}
          </StatusBadge>
        </div>
      </section>

      <PushPermissionCard variant="settings" />
      {isAdmin ? <PushBackendStatusCard /> : null}

      <section className="space-y-3">
        <DataCard title="Centro de mando" subtitle="Alertas inteligentes y prioridades" to="/alertas" accent="orange" meta={<BellRing size={18} className="text-pbm-orange" />} />
        <DataCard title="Historial de movimientos" subtitle="Producto y bodega en linea de tiempo" to="/historial" accent="blue" meta={<History size={18} className="text-pbm-glow" />} />
        <DataCard title="Maquinas" subtitle="Lista y detalle operativo" to="/maquinas" accent="blue" meta={<Factory size={18} className="text-pbm-glow" />} />
        {isAdmin ? (
          <>
            <DataCard title="Stock bodega" subtitle="Articulos, stock minimo y estado" to="/stock-bodega" accent="green" meta={<Warehouse size={18} className="text-pbm-green" />} />
            <DataCard title="Movimiento producto" subtitle="Entrada o salida de producto" to="/movimiento-producto" accent="orange" meta={<PackagePlus size={18} className="text-pbm-orange" />} />
            <DataCard title="Movimiento bodega" subtitle="Entrada o salida de articulos" to="/movimiento-bodega" accent="orange" meta={<Boxes size={18} className="text-pbm-orange" />} />
          </>
        ) : null}
        <DataCard title="Estado de sincronizacion" subtitle="Conexion, fuente y conteos" to="/sync" accent="yellow" meta={<Database size={18} className="text-pbm-yellow" />} />
      </section>
    </div>
  );
}

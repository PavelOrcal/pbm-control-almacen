import { BellRing, Boxes, Database, Factory, History, PackagePlus, ShieldCheck, UserRound, Warehouse } from 'lucide-react';
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
    <div className="screen-fade space-y-5">
      <section className="hero-panel rounded-2xl p-5 lg:p-6">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-pbm-glow">Configuracion operativa</p>
            <h2 className="mt-2 text-3xl font-black text-pbm-text lg:text-5xl">Mas</h2>
            <p className="mt-2 max-w-2xl text-sm text-pbm-muted">
              {isAdmin ? 'Administracion, sincronizacion, notificaciones y modulos extendidos.' : 'Perfil operativo y accesos permitidos por rol.'}
            </p>
          </div>
          <div className="rounded-2xl border border-pbm-blue/30 bg-pbm-bg/65 p-4 lg:w-80">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-pbm-blue/30 bg-pbm-blue/10 p-3 text-pbm-glow">
                <UserRound size={22} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-pbm-muted">Usuario activo</p>
                <h3 className="text-lg font-black text-pbm-text">{user?.username}</h3>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge tone={isAdmin ? 'green' : 'blue'}>{user?.role}</StatusBadge>
              <StatusBadge tone={data?.sync.source === 'apps-script' ? 'green' : 'yellow'}>
                {data?.sync.source === 'apps-script' ? 'Google Sheet conectado' : 'Mock temporal'}
              </StatusBadge>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <PushPermissionCard variant="settings" />
        {isAdmin ? <PushBackendStatusCard /> : (
          <section className="premium-card rounded-lg p-4" data-accent="blue">
            <div className="flex items-start gap-3">
              <div className="rounded-lg border border-pbm-blue/35 bg-pbm-blue/10 p-2 text-pbm-glow">
                <ShieldCheck size={20} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-pbm-muted">Rol operativo</p>
                <h3 className="mt-1 text-lg font-black text-pbm-text">Vista sin datos sensibles</h3>
                <p className="mt-1 text-sm text-pbm-muted">Stock y movimientos quedan reservados para administradores.</p>
              </div>
            </div>
          </section>
        )}
      </section>

      <section className="section-grid">
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

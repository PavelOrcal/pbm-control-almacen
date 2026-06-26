import { Droplets, Gauge, PackagePlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/States';
import { StatusBadge, StockStatusBadge } from '../components/StatusBadge';
import { usePbmData } from '../hooks/usePbmData';
import { classNames, productStockStatus } from '../lib/formatters';

function productVisual(producto: string) {
  const name = producto.toLowerCase();
  if (name.includes('ultragreen')) {
    return {
      accent: 'green',
      fill: 'stock-fill-green',
      icon: 'text-pbm-green',
      surface: 'from-pbm-green/15'
    };
  }
  if (name.includes('ultrared')) {
    return {
      accent: 'red',
      fill: 'stock-fill-red',
      icon: 'text-pbm-red',
      surface: 'from-pbm-red/15'
    };
  }
  return {
    accent: 'blue',
    fill: 'stock-fill-blue',
    icon: 'text-pbm-glow',
    surface: 'from-pbm-blue/15'
  };
}

function stockPercent(actual: number, minimo: number) {
  if (minimo <= 0) return actual > 0 ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round((actual / minimo) * 100)));
}

export default function StockProductos() {
  const { data, isLoading, error } = usePbmData();

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Error desconocido'} />;

  return (
    <div className="screen-fade space-y-5">
      <section className="hero-panel rounded-2xl p-5 lg:p-6">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-pbm-glow">Inventario sensible</p>
            <h2 className="mt-2 text-3xl font-black text-pbm-text lg:text-5xl">Stock productos</h2>
            <p className="mt-2 max-w-2xl text-sm text-pbm-muted">Niveles de producto con lectura visual, minimo operativo y estado critico.</p>
          </div>
          <div className="rounded-xl border border-pbm-blue/30 bg-pbm-bg/65 p-4 text-right">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-pbm-muted">Productos activos</p>
            <p className="mt-1 text-3xl font-black text-pbm-text">{data.productos.filter((producto) => producto.activo === 'SI').length}</p>
          </div>
        </div>
      </section>

      <Link
        to="/movimiento-producto"
        className="quick-action pressable flex min-h-14 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black text-pbm-text"
      >
        <PackagePlus className="text-pbm-orange" size={18} aria-hidden="true" />
        Registrar movimiento producto
      </Link>

      <section className="section-grid">
        {data.productos.map((producto) => {
          const status = productStockStatus(producto);
          const visual = productVisual(producto.producto);
          const actual = producto.existenciaActualLitros ?? 0;
          const minimo = producto.cantidadMinimaLitros ?? 0;
          const percent = stockPercent(actual, minimo);
          return (
            <article
              key={producto.idProducto}
              className={classNames(
                'premium-card animate-card-in rounded-lg p-4',
                'bg-gradient-to-br',
                visual.surface
              )}
              data-accent={status === 'Critico' ? 'red' : status === 'Bajo' ? 'yellow' : visual.accent}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-pbm-muted">{producto.idProducto} / {producto.unidad}</p>
                  <h3 className="mt-1 text-xl font-black leading-tight text-pbm-text">{producto.producto}</h3>
                </div>
                <div className={classNames('rounded-lg border border-white/10 bg-white/5 p-2 shadow-glow', visual.icon)}>
                  <Droplets size={22} aria-hidden="true" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <StockStatusBadge status={status} />
                <StatusBadge tone={producto.activo === 'SI' ? 'green' : 'red'}>Activo {producto.activo}</StatusBadge>
              </div>
              <div className="mt-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-pbm-muted">Existencia</p>
                    <p className="metric-value mt-1 text-3xl font-black leading-none text-pbm-text">{actual}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-pbm-muted">Minimo</p>
                    <p className="mt-1 text-lg font-black text-pbm-text">{minimo} L</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Gauge size={16} className={visual.icon} aria-hidden="true" />
                  <div className="stock-bar flex-1">
                    <div className={classNames('stock-fill', visual.fill)} style={{ width: `${percent}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs font-black text-pbm-muted">{percent}%</span>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

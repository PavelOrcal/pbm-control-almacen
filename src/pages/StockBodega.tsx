import { Download, MapPin, PackagePlus, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DataCard } from '../components/DataCard';
import { ErrorState, LoadingState } from '../components/States';
import { StatusBadge, StockStatusBadge } from '../components/StatusBadge';
import { usePbmData } from '../hooks/usePbmData';
import { bodegaStockStatus, formatDate, getBodegaMovementDates } from '../lib/formatters';

export default function StockBodega() {
  const { data, isLoading, error } = usePbmData();

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Error desconocido'} />;

  return (
    <div className="screen-fade space-y-5">
      <section className="hero-panel rounded-2xl p-5 lg:p-6">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-pbm-glow">Almacen operativo</p>
            <h2 className="mt-2 text-3xl font-black text-pbm-text lg:text-5xl">Stock bodega</h2>
            <p className="mt-2 max-w-2xl text-sm text-pbm-muted">Articulos, ubicacion, minimo y fechas calculadas desde movimientos.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center lg:w-80">
            <div className="rounded-xl border border-pbm-blue/30 bg-pbm-bg/65 p-3">
              <p className="text-3xl font-black text-pbm-text">{data.stockBodega.length}</p>
              <p className="text-[0.65rem] text-pbm-muted">Articulos</p>
            </div>
            <div className="rounded-xl border border-pbm-yellow/30 bg-pbm-yellow/10 p-3">
              <p className="text-3xl font-black text-pbm-yellow">{data.stockBodega.filter((articulo) => bodegaStockStatus(articulo) !== 'Suficiente').length}</p>
              <p className="text-[0.65rem] text-pbm-muted">En riesgo</p>
            </div>
          </div>
        </div>
      </section>

      <Link
        to="/movimiento-bodega"
        className="quick-action pressable flex min-h-14 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black text-pbm-text"
      >
        <PackagePlus className="text-pbm-orange" size={18} aria-hidden="true" />
        Registrar movimiento bodega
      </Link>

      <section className="section-grid">
        {data.stockBodega.map((articulo) => {
          const status = bodegaStockStatus(articulo);
          const dates = getBodegaMovementDates(articulo.idArticulo, data.movimientosBodega);
          return (
            <DataCard
              key={articulo.idArticulo}
              title={articulo.articulo}
              subtitle={`${articulo.idArticulo} / ${articulo.categoria}`}
              to={`/stock-bodega/${articulo.idArticulo}`}
              accent={status === 'Critico' ? 'red' : status === 'Bajo' ? 'yellow' : 'green'}
              meta={
                <>
                  <StockStatusBadge status={status} />
                  <StatusBadge tone={articulo.activo === 'SI' ? 'green' : 'red'}>Activo {articulo.activo}</StatusBadge>
                </>
              }
            >
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-pbm-border/70 bg-pbm-bg/45 p-3">
                  <p className="text-pbm-muted">Stock actual</p>
                  <p className="text-xl font-black text-pbm-text">{articulo.stockActual ?? 0} {articulo.unidad}</p>
                </div>
                <div className="rounded-lg border border-pbm-border/70 bg-pbm-bg/45 p-3">
                  <p className="text-pbm-muted">Stock minimo</p>
                  <p className="text-xl font-black text-pbm-text">{articulo.stockMinimo ?? 0} {articulo.unidad}</p>
                </div>
                <div className="col-span-2 flex items-center gap-2 rounded-lg border border-pbm-border/70 bg-pbm-bg/45 p-3">
                  <MapPin size={16} className="shrink-0 text-pbm-glow" aria-hidden="true" />
                  <div>
                    <p className="text-pbm-muted">Ubicacion</p>
                    <p className="font-black text-pbm-text">{articulo.ubicacion || 'Sin dato'}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-pbm-green/30 bg-pbm-green/10 p-3">
                  <div className="flex items-center gap-2 text-pbm-green">
                    <Download size={15} aria-hidden="true" />
                    <p className="text-pbm-muted">Ultima entrada</p>
                  </div>
                  <p className="mt-1 font-black text-pbm-text">{dates.ultimaEntrada ? formatDate(dates.ultimaEntrada) : 'Sin entradas'}</p>
                </div>
                <div className="rounded-lg border border-pbm-orange/30 bg-pbm-orange/10 p-3">
                  <div className="flex items-center gap-2 text-pbm-orange">
                    <Upload size={15} aria-hidden="true" />
                    <p className="text-pbm-muted">Ultima salida</p>
                  </div>
                  <p className="mt-1 font-black text-pbm-text">{dates.ultimaSalida ? formatDate(dates.ultimaSalida) : 'Sin salidas'}</p>
                </div>
              </div>
            </DataCard>
          );
        })}
      </section>
    </div>
  );
}

import { Download, PackagePlus, Upload } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { DataCard } from '../components/DataCard';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { StatusBadge, StockStatusBadge } from '../components/StatusBadge';
import { usePbmData } from '../hooks/usePbmData';
import {
  bodegaStockStatus,
  formatDate,
  getBodegaMovementDates,
  getBodegaMovementsForArticle
} from '../lib/formatters';

function DetailLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-b border-pbm-border/60 py-3 last:border-b-0">
      <p className="text-xs font-bold uppercase tracking-normal text-pbm-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-pbm-text">{value || 'Sin dato'}</p>
    </div>
  );
}

export default function ArticuloBodegaDetalle() {
  const { idArticulo } = useParams();
  const { data, isLoading, error } = usePbmData();

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Error desconocido'} />;

  const articulo = data.stockBodega.find((item) => item.idArticulo === idArticulo);
  if (!articulo) return <EmptyState label="Articulo no encontrado." />;

  const status = bodegaStockStatus(articulo);
  const movements = getBodegaMovementsForArticle(articulo.idArticulo, data.movimientosBodega);
  const dates = getBodegaMovementDates(articulo.idArticulo, data.movimientosBodega);

  return (
    <div className="screen-fade space-y-5">
      <section className="premium-card rounded-lg p-4 shadow-glow" data-accent={status === 'Critico' ? 'red' : status === 'Bajo' ? 'yellow' : 'green'}>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-pbm-glow">{articulo.idArticulo}</p>
        <h2 className="mt-1 text-2xl font-black leading-tight text-pbm-text">{articulo.articulo}</h2>
        <p className="mt-2 text-sm text-pbm-muted">{articulo.categoria} / {articulo.unidad}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <StockStatusBadge status={status} />
          <StatusBadge tone={articulo.activo === 'SI' ? 'green' : 'red'}>Activo {articulo.activo}</StatusBadge>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="metric-card rounded-lg p-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-pbm-muted">Stock actual</p>
          <p className="metric-value mt-1 text-2xl font-black text-pbm-text">{articulo.stockActual ?? 0}</p>
          <p className="text-sm text-pbm-muted">{articulo.unidad}</p>
        </div>
        <div className="metric-card rounded-lg p-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-pbm-muted">Stock minimo</p>
          <p className="metric-value mt-1 text-2xl font-black text-pbm-text">{articulo.stockMinimo ?? 0}</p>
          <p className="text-sm text-pbm-muted">{articulo.unidad}</p>
        </div>
        <div className="rounded-lg border border-pbm-green/30 bg-pbm-green/10 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
          <div className="flex items-center gap-2 text-pbm-green">
            <Download size={15} aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-pbm-muted">Ultima entrada</p>
          </div>
          <p className="mt-1 text-base font-black text-pbm-text">{dates.ultimaEntrada ? formatDate(dates.ultimaEntrada) : 'Sin entradas'}</p>
        </div>
        <div className="rounded-lg border border-pbm-orange/30 bg-pbm-orange/10 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
          <div className="flex items-center gap-2 text-pbm-orange">
            <Upload size={15} aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-pbm-muted">Ultima salida</p>
          </div>
          <p className="mt-1 text-base font-black text-pbm-text">{dates.ultimaSalida ? formatDate(dates.ultimaSalida) : 'Sin salidas'}</p>
        </div>
      </section>

      <section className="panel-card rounded-lg px-4">
        <DetailLine label="Ubicacion" value={articulo.ubicacion} />
        <DetailLine label="Categoria" value={articulo.categoria} />
        <DetailLine label="Unidad" value={articulo.unidad} />
      </section>

      <Link
        to="/movimiento-bodega"
        className="quick-action pressable flex min-h-14 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black text-pbm-text"
      >
        <PackagePlus className="text-pbm-orange" size={18} aria-hidden="true" />
        Registrar movimiento
      </Link>

      <section className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-[0.14em] text-pbm-muted">Historial reciente</h3>
        {movements.length === 0 ? <EmptyState label="No hay movimientos registrados para este articulo." /> : null}
        <div className="timeline space-y-3">
          {movements.slice(0, 8).map((movement) => (
            <div key={movement.idMovimiento} className="timeline-item">
              <span className={`timeline-dot ${movement.tipoMovimiento === 'Salida' ? 'bg-pbm-orange shadow-[0_0_18px_rgba(245,158,11,.38)]' : 'bg-pbm-green shadow-[0_0_18px_rgba(34,197,94,.38)]'}`} />
              <DataCard
                title={movement.idMovimiento}
                subtitle={`${formatDate(movement.fecha)} / ${movement.responsable}`}
                accent={movement.tipoMovimiento === 'Salida' ? 'orange' : 'green'}
                meta={
                  <>
                    <StatusBadge tone={movement.tipoMovimiento === 'Salida' ? 'orange' : 'green'}>{movement.tipoMovimiento}</StatusBadge>
                    <StatusBadge tone="blue">{movement.cantidad ?? 0} {articulo.unidad}</StatusBadge>
                  </>
                }
              >
                <p className="text-sm font-semibold text-pbm-text">{movement.motivo || 'Sin motivo'}</p>
              </DataCard>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

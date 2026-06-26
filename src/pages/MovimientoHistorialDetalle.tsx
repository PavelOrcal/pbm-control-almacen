import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  Factory,
  LockKeyhole,
  Package,
  Trash2,
  UserRound,
  Warehouse
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SecondaryButton } from '../components/FormControls';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { StatusBadge } from '../components/StatusBadge';
import { useMovimientoBodegaDeleteMutation, useMovimientoProductoDeleteMutation, usePbmData } from '../hooks/usePbmData';
import { canDeleteRecords, useAuth } from '../lib/auth';
import { classNames, formatDate } from '../lib/formatters';
import { findHistorialMovimiento, isHighImpactMovement } from '../lib/history';
import { hasInventoryAccess } from '../lib/inventoryAccess';

function DetailLine({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="border-b border-pbm-border/60 py-3 last:border-b-0">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-pbm-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-pbm-text">{value || 'Sin dato'}</p>
    </div>
  );
}

function RelationCard({
  icon: Icon,
  label,
  value,
  tone = 'blue'
}: {
  icon: typeof Package;
  label: string;
  value?: string | number | null;
  tone?: 'blue' | 'green' | 'orange' | 'yellow';
}) {
  const toneClass = {
    blue: 'border-pbm-blue/30 bg-pbm-blue/10 text-pbm-glow',
    green: 'border-pbm-green/30 bg-pbm-green/10 text-pbm-green',
    orange: 'border-pbm-orange/30 bg-pbm-orange/10 text-pbm-orange',
    yellow: 'border-pbm-yellow/30 bg-pbm-yellow/10 text-pbm-yellow'
  }[tone];

  return (
    <div className={classNames('rounded-lg border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]', toneClass)}>
      <Icon size={18} aria-hidden="true" />
      <p className="mt-2 text-[0.65rem] font-black uppercase tracking-[0.12em] text-pbm-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-pbm-text">{value || 'Sin dato'}</p>
    </div>
  );
}

export default function MovimientoHistorialDetalle() {
  const { origen, idMovimiento } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = usePbmData();
  const { user } = useAuth();
  const deleteProductoMutation = useMovimientoProductoDeleteMutation();
  const deleteBodegaMutation = useMovimientoBodegaDeleteMutation();

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Error desconocido'} />;

  const movimiento = findHistorialMovimiento(data, origen, idMovimiento);
  if (!movimiento) return <EmptyState label="Movimiento no encontrado." />;

  const currentMovimiento = movimiento;
  const inventoryUnlocked = hasInventoryAccess();
  const isEntrada = currentMovimiento.tipoMovimiento === 'Entrada';
  const highImpact = inventoryUnlocked && isHighImpactMovement(currentMovimiento);
  const OriginIcon = currentMovimiento.origen === 'Producto' ? Package : Warehouse;
  const TypeIcon = isEntrada ? ArrowDownToLine : ArrowUpFromLine;
  const protectedLabel = 'Protegido';
  const itemValue = inventoryUnlocked ? `${currentMovimiento.itemId} / ${currentMovimiento.itemNombre}` : protectedLabel;
  const quantityValue = inventoryUnlocked ? currentMovimiento.cantidadLabel : protectedLabel;
  const deleteMutation = currentMovimiento.origen === 'Producto' ? deleteProductoMutation : deleteBodegaMutation;

  function deleteMovement() {
    const confirmed = window.confirm('Esta acción eliminará el movimiento del módulo correspondiente y del historial.');
    if (!confirmed) return;
    const onSuccess = () => navigate('/historial');
    if (currentMovimiento.origen === 'Producto') {
      deleteProductoMutation.mutate(currentMovimiento.id, { onSuccess });
      return;
    }
    deleteBodegaMutation.mutate(currentMovimiento.id, { onSuccess });
  }

  return (
    <div className="screen-fade space-y-5">
      <Link
        to="/historial"
        className="pressable inline-flex min-h-11 items-center gap-2 rounded-lg border border-pbm-border bg-pbm-card/80 px-3 text-sm font-black text-pbm-text"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Volver al historial
      </Link>

      <section
        className="premium-card rounded-lg p-5"
        data-accent={highImpact ? 'red' : isEntrada ? 'green' : 'orange'}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-pbm-glow">Ficha de auditoria</p>
            <h2 className="mt-2 break-words text-3xl font-black leading-none text-pbm-text">{movimiento.id}</h2>
            <p className="mt-2 text-sm text-pbm-muted">{formatDate(movimiento.fecha)}</p>
          </div>
          <div
            className={classNames(
              'rounded-lg border p-3 shadow-glow',
              isEntrada ? 'border-pbm-green/35 bg-pbm-green/10 text-pbm-green' : 'border-pbm-orange/35 bg-pbm-orange/10 text-pbm-orange'
            )}
          >
            <TypeIcon size={24} aria-hidden="true" />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <StatusBadge tone={isEntrada ? 'green' : 'orange'}>{movimiento.tipoMovimiento}</StatusBadge>
          <StatusBadge tone={movimiento.origen === 'Producto' ? 'blue' : 'yellow'}>{movimiento.origen}</StatusBadge>
          {highImpact ? <StatusBadge tone="red">Salida alta</StatusBadge> : null}
          {!inventoryUnlocked ? <StatusBadge tone="orange">Inventario protegido</StatusBadge> : null}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <RelationCard icon={inventoryUnlocked ? OriginIcon : LockKeyhole} label={movimiento.origen === 'Producto' ? 'Producto' : 'Articulo'} value={itemValue} tone={movimiento.origen === 'Producto' ? 'blue' : 'yellow'} />
          <RelationCard icon={inventoryUnlocked ? TypeIcon : LockKeyhole} label="Cantidad" value={quantityValue} tone={isEntrada ? 'green' : 'orange'} />
          <RelationCard icon={UserRound} label="Responsable" value={movimiento.responsable} tone="green" />
          <RelationCard icon={ClipboardList} label="Motivo" value={movimiento.motivo} tone="blue" />
        </div>
      </section>

      <section className="panel-card rounded-lg px-4">
        <DetailLine label="Fecha" value={formatDate(movimiento.fecha)} />
        <DetailLine label="Origen" value={movimiento.origen} />
        <DetailLine label="Tipo" value={movimiento.tipoMovimiento} />
        <DetailLine label={movimiento.origen === 'Producto' ? 'Producto' : 'Articulo'} value={itemValue} />
        <DetailLine label="Categoria" value={inventoryUnlocked ? movimiento.categoria : protectedLabel} />
        <DetailLine label="Cantidad" value={quantityValue} />
        <DetailLine label="Responsable" value={movimiento.responsable} />
        <DetailLine label="Motivo" value={movimiento.motivo} />
        <DetailLine label="ID Movimiento" value={movimiento.id} />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-[0.14em] text-pbm-muted">Relacion operativa</h3>
        <div className="grid grid-cols-2 gap-3">
          <RelationCard icon={UserRound} label="Cliente" value={movimiento.cliente ?? movimiento.idCliente} tone="blue" />
          <RelationCard icon={Factory} label="Maquina" value={movimiento.idMaquina ? `${movimiento.idMaquina}${movimiento.maquina ? ` / ${movimiento.maquina}` : ''}` : undefined} tone="yellow" />
          <RelationCard icon={ClipboardList} label="Servicio" value={movimiento.idServicio} tone="green" />
          <RelationCard
            icon={inventoryUnlocked ? (movimiento.origen === 'Producto' ? Package : Warehouse) : LockKeyhole}
            label="Relacion con stock"
            value={
              !inventoryUnlocked
                ? protectedLabel
                : movimiento.origen === 'Producto'
                ? `Actual ${movimiento.productoStockActual ?? 0} / Minimo ${movimiento.productoStockMinimo ?? 0}`
                : `Actual ${movimiento.bodegaStockActual ?? 0} / Minimo ${movimiento.bodegaStockMinimo ?? 0}`
            }
            tone={movimiento.origen === 'Producto' ? 'blue' : 'yellow'}
          />
        </div>
      </section>

      <section className="rounded-lg border border-pbm-blue/30 bg-pbm-blue/10 p-4 text-sm text-pbm-muted">
        <p className="font-black text-pbm-text">Consulta solamente</p>
        <p className="mt-1">El registro original sigue en su tabla de origen. Solo administradores pueden eliminar capturas erróneas.</p>
      </section>

      {canDeleteRecords(user) ? (
        <section className="premium-card rounded-lg p-4" data-accent="red">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-pbm-red/40 bg-pbm-red/10 p-2 text-pbm-red">
              <Trash2 size={20} aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-black text-pbm-text">Eliminar movimiento erróneo</h3>
              <p className="mt-1 text-sm text-pbm-muted">Se marcará como Eliminado = SI y desaparecerá del historial.</p>
            </div>
          </div>
          <SecondaryButton type="button" onClick={deleteMovement} disabled={deleteMutation.isPending} className="mt-4 gap-2 border-pbm-red/50 text-pbm-red">
            <Trash2 size={17} aria-hidden="true" />
            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar movimiento'}
          </SecondaryButton>
          {deleteMutation.isError ? <p className="error-panel mt-3 rounded-lg p-3 text-sm font-bold text-pbm-red">{deleteMutation.error.message}</p> : null}
        </section>
      ) : null}
    </div>
  );
}

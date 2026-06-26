import { FormEvent, useState } from 'react';
import { Field, inputClassName, PrimaryButton } from '../components/FormControls';
import { ErrorState, LoadingState } from '../components/States';
import { useMovimientoBodegaMutation, usePbmData } from '../hooks/usePbmData';
import { todayInputValue } from '../lib/formatters';
import { SHEET_VALIDATIONS } from '../lib/sheetSchema';
import type { TipoMovimiento } from '../types/pbm';

export default function MovimientoBodega() {
  const { data, isLoading, error } = usePbmData();
  const mutation = useMovimientoBodegaMutation();
  const [fecha, setFecha] = useState(todayInputValue());
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento>('Entrada');
  const [idArticulo, setIdArticulo] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [responsable, setResponsable] = useState('Anibal');
  const [motivo, setMotivo] = useState('');

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Error desconocido'} />;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate({
      fecha,
      tipoMovimiento,
      idArticulo,
      cantidad: Number(cantidad),
      responsable,
      motivo
    });
  }

  return (
    <form onSubmit={onSubmit} className="form-shell space-y-4">
      <section className="premium-card rounded-lg p-4" data-accent={tipoMovimiento === 'Salida' ? 'orange' : 'green'}>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-pbm-glow">Movimientos Bodega</p>
        <h2 className="mt-1 text-xl font-black text-pbm-text">Registrar entrada o salida</h2>
        <p className="mt-2 text-sm text-pbm-muted">El stock actual y las ultimas fechas se calculan desde Movimientos Bodega.</p>
      </section>

      <Field label="Fecha">
        <input type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} className={inputClassName} required />
      </Field>

      <Field label="Tipo Movimiento">
        <select value={tipoMovimiento} onChange={(event) => setTipoMovimiento(event.target.value as TipoMovimiento)} className={inputClassName}>
          {SHEET_VALIDATIONS.tipoMovimiento.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </Field>

      <Field label="ID Articulo">
        <select value={idArticulo} onChange={(event) => setIdArticulo(event.target.value)} className={inputClassName} required>
          <option value="">Seleccionar articulo</option>
          {data.stockBodega.map((articulo) => (
            <option key={articulo.idArticulo} value={articulo.idArticulo}>
              {articulo.idArticulo} / {articulo.articulo}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Cantidad">
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={cantidad}
          onChange={(event) => setCantidad(event.target.value)}
          className={inputClassName}
          required
        />
      </Field>

      <Field label="Responsable">
        <select value={responsable} onChange={(event) => setResponsable(event.target.value)} className={inputClassName}>
          {SHEET_VALIDATIONS.responsables.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </Field>

      <Field label="Motivo">
        <input value={motivo} onChange={(event) => setMotivo(event.target.value)} className={inputClassName} required />
      </Field>

      <PrimaryButton type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Guardando...' : 'Registrar movimiento'}
      </PrimaryButton>
      {mutation.isSuccess ? (
        <p className="success-panel animate-card-in rounded-lg p-3 text-sm font-bold text-pbm-green">
          Movimiento registrado. Esta fecha ya alimenta la ultima entrada o salida del articulo.
        </p>
      ) : null}
      {mutation.isError ? <p className="error-panel animate-card-in rounded-lg p-3 text-sm font-bold text-pbm-red">{mutation.error.message}</p> : null}
    </form>
  );
}

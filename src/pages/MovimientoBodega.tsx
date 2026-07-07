import { FormEvent, useRef, useState } from 'react';
import { Field, inputClassName, PrimaryButton } from '../components/FormControls';
import { ErrorState, LoadingState } from '../components/States';
import { useMovimientoBodegaMutation, usePbmData } from '../hooks/usePbmData';
import { todayInputValue } from '../lib/formatters';
import { SHEET_VALIDATIONS } from '../lib/sheetSchema';
import type { TipoMovimiento } from '../types/pbm';

export default function MovimientoBodega() {
  const { data, isLoading, error } = usePbmData();
  const [submitStage, setSubmitStage] = useState<'idle' | 'registrando' | 'verificando'>('idle');
  const submitLockRef = useRef(false);
  const mutation = useMovimientoBodegaMutation({ onVerifyTimeout: () => setSubmitStage('verificando') });
  const [fecha, setFecha] = useState(todayInputValue());
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento>('Entrada');
  const [idArticulo, setIdArticulo] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [responsable, setResponsable] = useState('Anibal');
  const [motivo, setMotivo] = useState('');

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Error desconocido'} />;

  const isSubmitting = mutation.isPending || submitStage !== 'idle';
  const submitLabel = submitStage === 'verificando' ? 'Verificando registro...' : isSubmitting ? 'Registrando...' : 'Registrar movimiento';

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLockRef.current || isSubmitting) return;
    submitLockRef.current = true;
    setSubmitStage('registrando');
    try {
      await mutation.mutateAsync({
        fecha,
        tipoMovimiento,
        idArticulo,
        cantidad: Number(cantidad),
        responsable,
        motivo
      });
    } catch {
      // React Query keeps the visible error state; this prevents an unhandled promise rejection.
    } finally {
      submitLockRef.current = false;
      setSubmitStage('idle');
    }
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

      <PrimaryButton type="submit" disabled={isSubmitting}>
        {submitLabel}
      </PrimaryButton>
      {mutation.isSuccess ? (
        <p className="success-panel animate-card-in rounded-lg p-3 text-sm font-bold text-pbm-green">
          {mutation.data?.verifiedAfterTimeout
            ? 'Movimiento confirmado en Google Sheet despues de verificar. Esta fecha ya alimenta la ultima entrada o salida del articulo.'
            : 'Movimiento registrado. Esta fecha ya alimenta la ultima entrada o salida del articulo.'}
        </p>
      ) : null}
      {mutation.isError ? <p className="error-panel animate-card-in rounded-lg p-3 text-sm font-bold text-pbm-red">{mutation.error.message}</p> : null}
    </form>
  );
}

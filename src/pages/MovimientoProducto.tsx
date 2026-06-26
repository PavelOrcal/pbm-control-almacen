import { FormEvent, useMemo, useState } from 'react';
import { Field, inputClassName, PrimaryButton } from '../components/FormControls';
import { ErrorState, LoadingState } from '../components/States';
import { useMovimientoProductoMutation, usePbmData } from '../hooks/usePbmData';
import { SHEET_VALIDATIONS } from '../lib/sheetSchema';
import { todayInputValue } from '../lib/formatters';
import type { TipoMovimiento } from '../types/pbm';

export default function MovimientoProducto() {
  const { data, isLoading, error } = usePbmData();
  const mutation = useMovimientoProductoMutation();
  const [fecha, setFecha] = useState(todayInputValue());
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento>('Entrada');
  const [idProducto, setIdProducto] = useState('');
  const [litros, setLitros] = useState('');
  const [idCliente, setIdCliente] = useState('');
  const [idMaquina, setIdMaquina] = useState('');
  const [idServicio, setIdServicio] = useState('');
  const [motivo, setMotivo] = useState('');
  const [responsable, setResponsable] = useState('Anibal');

  const maquinas = useMemo(() => {
    if (!data) return [];
    return idCliente ? data.maquinas.filter((maquina) => maquina.idCliente === idCliente) : data.maquinas;
  }, [data, idCliente]);

  const servicios = useMemo(() => {
    if (!data) return [];
    return data.servicios.filter((servicio) => {
      if (idCliente && servicio.idCliente !== idCliente) return false;
      if (idMaquina && servicio.idMaquina !== idMaquina) return false;
      return true;
    });
  }, [data, idCliente, idMaquina]);

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Error desconocido'} />;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate({
      fecha,
      tipoMovimiento,
      idProducto,
      litros: Number(litros),
      idCliente,
      idMaquina,
      idServicio,
      motivo,
      responsable
    });
  }

  return (
    <form onSubmit={onSubmit} className="form-shell space-y-4">
      <section className="premium-card rounded-lg p-4" data-accent={tipoMovimiento === 'Salida' ? 'orange' : 'green'}>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-pbm-glow">Movimientos Producto</p>
        <h2 className="mt-1 text-xl font-black text-pbm-text">Registrar entrada o salida</h2>
        <p className="mt-2 text-sm text-pbm-muted">La existencia se calcula en el Sheet desde esta tabla.</p>
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

      <Field label="ID Producto">
        <select value={idProducto} onChange={(event) => setIdProducto(event.target.value)} className={inputClassName} required>
          <option value="">Seleccionar producto</option>
          {data.productos.map((producto) => (
            <option key={producto.idProducto} value={producto.idProducto}>
              {producto.idProducto} / {producto.producto}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Litros">
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={litros}
          onChange={(event) => setLitros(event.target.value)}
          className={inputClassName}
          required
        />
      </Field>

      <Field label="ID Cliente" hint="Opcional para entradas generales.">
        <select
          value={idCliente}
          onChange={(event) => {
            setIdCliente(event.target.value);
            setIdMaquina('');
            setIdServicio('');
          }}
          className={inputClassName}
        >
          <option value="">Sin cliente</option>
          {data.clientes.map((cliente) => (
            <option key={cliente.idCliente} value={cliente.idCliente}>
              {cliente.idCliente} / {cliente.empresa}
            </option>
          ))}
        </select>
      </Field>

      <Field label="ID Maquina" hint="Se filtra por cliente cuando aplica.">
        <select
          value={idMaquina}
          onChange={(event) => {
            setIdMaquina(event.target.value);
            setIdServicio('');
          }}
          className={inputClassName}
        >
          <option value="">Sin maquina</option>
          {maquinas.map((maquina) => (
            <option key={maquina.idMaquina} value={maquina.idMaquina}>
              {maquina.idMaquina} / {maquina.modelo}
            </option>
          ))}
        </select>
      </Field>

      <Field label="ID Servicio" hint="Se filtra por cliente y maquina.">
        <select value={idServicio} onChange={(event) => setIdServicio(event.target.value)} className={inputClassName}>
          <option value="">Sin servicio</option>
          {servicios.map((servicio) => (
            <option key={servicio.idServicio} value={servicio.idServicio}>
              {servicio.idServicio} / {servicio.idMaquina}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Motivo">
        <input value={motivo} onChange={(event) => setMotivo(event.target.value)} className={inputClassName} required />
      </Field>

      <Field label="Responsable">
        <select value={responsable} onChange={(event) => setResponsable(event.target.value)} className={inputClassName}>
          {SHEET_VALIDATIONS.responsables.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </Field>

      <PrimaryButton type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Guardando...' : 'Registrar movimiento'}
      </PrimaryButton>
      {mutation.isSuccess ? <p className="success-panel animate-card-in rounded-lg p-3 text-sm font-bold text-pbm-green">Movimiento registrado.</p> : null}
      {mutation.isError ? <p className="error-panel animate-card-in rounded-lg p-3 text-sm font-bold text-pbm-red">{mutation.error.message}</p> : null}
    </form>
  );
}

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react';
import { Calculator, ExternalLink, FileText, ReceiptText, Trash2, Upload, X } from 'lucide-react';
import { Field, inputClassName, PrimaryButton, SecondaryButton } from '../components/FormControls';
import { ErrorState, LoadingState } from '../components/States';
import { StatusBadge } from '../components/StatusBadge';
import { useIngresoFacturaProductoDeleteMutation, useIngresoFacturaProductoMutation, usePbmData } from '../hooks/usePbmData';
import { formatDate, parseSheetDate, todayInputValue } from '../lib/formatters';
import { canEditPositiveIntegerInput, parsePositiveIntegerInput, POSITIVE_INTEGER_ERROR } from '../lib/positiveInteger';
import { SHEET_VALIDATIONS } from '../lib/sheetSchema';
import type { Cliente, IngresoFacturaProducto, PdfUploadPayload } from '../types/pbm';

interface PdfSelection {
  file: File;
}

interface ClientSummary {
  cliente: Cliente;
  ingresos: IngresoFacturaProducto[];
  totalEntrada: number;
  totalSalidaManual: number;
  litrosServiciosRealizados: number;
  saldoInformativo: number;
  ultimaFactura: IngresoFacturaProducto | null;
  ultimoComprobante: IngresoFacturaProducto | null;
}

function isCapstone(cliente: Cliente | null): boolean {
  return /CAPSTONE\s+COO?PER/i.test(cliente?.empresa ?? '');
}

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

function fileToDataUrl(file: File): Promise<PdfUploadPayload> {
  return new Promise((resolve, reject) => {
    if (!isPdfFile(file)) {
      reject(new Error('Solo se permiten archivos PDF.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      if (!dataUrl.startsWith('data:')) {
        reject(new Error('No se pudo leer el PDF seleccionado.'));
        return;
      }
      resolve({
        fileName: file.name,
        mimeType: 'application/pdf',
        dataUrl,
        sizeBytes: file.size
      });
    };
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el PDF seleccionado.'));
    reader.readAsDataURL(file);
  });
}

function fileSizeLabel(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function PdfPicker({
  id,
  label,
  selection,
  onChange,
  onRemove,
  required = false
}: {
  id: string;
  label: string;
  selection: PdfSelection | null;
  onChange: (selection: PdfSelection | null, error?: string) => void;
  onRemove: () => void;
  required?: boolean;
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!isPdfFile(file)) {
      onChange(null, 'Solo se permiten archivos PDF.');
      return;
    }
    onChange({ file });
  }

  return (
    <div className="rounded-lg border border-pbm-border/80 bg-pbm-card/65 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-pbm-muted">{label}</p>
          <p className="mt-1 text-xs text-pbm-muted">{required ? 'PDF obligatorio.' : 'PDF opcional.'}</p>
        </div>
        <FileText className="shrink-0 text-pbm-glow" size={20} aria-hidden="true" />
      </div>

      {selection ? (
        <div className="mt-3 rounded-lg border border-pbm-blue/30 bg-pbm-blue/10 p-3">
          <p className="break-all text-sm font-bold text-pbm-text">{selection.file.name}</p>
          <p className="mt-1 text-xs text-pbm-muted">{fileSizeLabel(selection.file.size)}</p>
        </div>
      ) : null}

      <div className="mt-3 flex gap-2">
        <label
          htmlFor={id}
          className="pressable inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-pbm-blue/45 bg-pbm-blue/10 px-3 text-sm font-black text-pbm-glow transition hover:border-pbm-blue/70"
        >
          <Upload size={16} aria-hidden="true" />
          Subir PDF
        </label>
        <input id={id} type="file" accept="application/pdf,.pdf" onChange={handleChange} className="hidden" />
        {selection ? (
          <button
            type="button"
            onClick={onRemove}
            className="pressable inline-flex min-h-11 items-center justify-center rounded-lg border border-pbm-red/40 bg-pbm-red/10 px-3 text-sm font-bold text-pbm-red"
            aria-label={`Quitar ${label}`}
          >
            <X size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function buildClientSummary(cliente: Cliente, ingresos: IngresoFacturaProducto[], data: ReturnType<typeof usePbmData>['data']): ClientSummary {
  const clientIngresos = ingresos.filter((ingreso) => ingreso.idCliente === cliente.idCliente);
  const totalEntrada = clientIngresos.reduce((total, ingreso) => total + (ingreso.litrosEntrada ?? 0), 0);
  const totalSalidaManual = clientIngresos.reduce((total, ingreso) => total + (ingreso.litrosSalidaManual ?? 0), 0);
  const litrosServiciosRealizados = (data?.historialServicios ?? [])
    .filter((servicio) => servicio.idCliente === cliente.idCliente)
    .reduce((total, servicio) => total + (servicio.litrosUsados ?? 0), 0);
  const sortedIngresos = [...clientIngresos].sort((a, b) => {
    const dateA = parseSheetDate(a.fechaRegistro)?.getTime() ?? 0;
    const dateB = parseSheetDate(b.fechaRegistro)?.getTime() ?? 0;
    return dateB - dateA;
  });
  return {
    cliente,
    ingresos: sortedIngresos,
    totalEntrada,
    totalSalidaManual,
    litrosServiciosRealizados,
    saldoInformativo: totalEntrada - totalSalidaManual - litrosServiciosRealizados,
    ultimaFactura: sortedIngresos.find((ingreso) => Boolean(ingreso.facturaPdf)) ?? null,
    ultimoComprobante: sortedIngresos.find((ingreso) => Boolean(ingreso.comprobantePagoPdf)) ?? null
  };
}

export default function IngresoFacturaProducto() {
  const { data, isLoading, error } = usePbmData();
  const mutation = useIngresoFacturaProductoMutation();
  const deleteMutation = useIngresoFacturaProductoDeleteMutation();
  const submitLockRef = useRef(false);
  const [fechaRegistro, setFechaRegistro] = useState(todayInputValue());
  const [idCliente, setIdCliente] = useState('');
  const [litrosEntrada, setLitrosEntrada] = useState('');
  const [litrosSalidaManual, setLitrosSalidaManual] = useState('');
  const [responsable, setResponsable] = useState('Anibal');
  const [observaciones, setObservaciones] = useState('');
  const [facturaPdf, setFacturaPdf] = useState<PdfSelection | null>(null);
  const [comprobantePdf, setComprobantePdf] = useState<PdfSelection | null>(null);
  const [formError, setFormError] = useState('');

  const selectedCliente = useMemo(
    () => data?.clientes.find((cliente) => cliente.idCliente === idCliente) ?? null,
    [data, idCliente]
  );

  const summaries = useMemo(() => {
    if (!data) return [];
    return data.clientes.map((cliente) => buildClientSummary(cliente, data.ingresoFacturaProducto, data));
  }, [data]);

  const selectedSummary = useMemo(
    () => summaries.find((summary) => summary.cliente.idCliente === idCliente) ?? null,
    [summaries, idCliente]
  );

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Error desconocido'} />;

  const isSubmitting = mutation.isPending;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLockRef.current || isSubmitting) return;
    setFormError('');

    try {
      if (!selectedCliente) throw new Error('Selecciona un cliente.');
      const entrada = parsePositiveIntegerInput(litrosEntrada, 'Litros entrada', true);
      if (entrada === null) throw new Error(`Litros entrada: ${POSITIVE_INTEGER_ERROR}`);
      const salidaManual = parsePositiveIntegerInput(litrosSalidaManual, 'Litros salida manual', false) ?? 0;
      if (!facturaPdf) throw new Error('Sube el PDF de factura.');

      submitLockRef.current = true;
      const facturaPayload = await fileToDataUrl(facturaPdf.file);
      const comprobantePayload = comprobantePdf ? await fileToDataUrl(comprobantePdf.file) : null;

      await mutation.mutateAsync({
        fechaRegistro,
        idCliente: selectedCliente.idCliente,
        cliente: selectedCliente.empresa,
        litrosEntrada: entrada,
        litrosSalidaManual: salidaManual,
        responsable,
        observaciones,
        facturaPdf: facturaPayload,
        comprobantePagoPdf: comprobantePayload
      });

      setLitrosEntrada('');
      setLitrosSalidaManual('');
      setObservaciones('');
      setFacturaPdf(null);
      setComprobantePdf(null);
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'No se pudo guardar el registro.');
    } finally {
      submitLockRef.current = false;
    }
  }

  async function onDelete(idIngresoFactura: string) {
    const confirmed = window.confirm('Este registro se marcara como eliminado y dejara de aparecer en el historial de facturas. No afecta stock ni movimientos.');
    if (!confirmed) return;
    await deleteMutation.mutateAsync(idIngresoFactura);
  }

  return (
    <div className="screen-fade space-y-5">
      <section className="hero-panel rounded-2xl p-5 lg:p-6">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-pbm-glow">Modulo admin aislado</p>
            <h2 className="mt-2 text-3xl font-black leading-none text-pbm-text lg:text-5xl">Ingreso Factura Producto</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-pbm-muted">
              Registro informativo de facturas, comprobantes y litros por cliente. No modifica Stock Productos, Movimientos Producto, bodega ni servicios activos.
            </p>
          </div>
          <div className="rounded-2xl border border-pbm-orange/35 bg-pbm-orange/10 p-4 text-pbm-orange lg:w-80">
            <div className="flex items-center gap-3">
              <Calculator size={24} aria-hidden="true" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em]">Saldo informativo</p>
                <p className="text-sm text-pbm-muted">Entradas menos salidas manuales y servicios realizados.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)]">
        <form onSubmit={onSubmit} className="premium-card rounded-lg p-4 lg:p-5" data-accent="blue">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-pbm-glow">Nuevo registro</p>
              <h3 className="mt-1 text-xl font-black text-pbm-text">Factura y litros informativos</h3>
            </div>
            <StatusBadge tone="orange">Admin</StatusBadge>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Fecha registro">
              <input type="date" value={fechaRegistro} onChange={(event) => setFechaRegistro(event.target.value)} className={inputClassName} required />
            </Field>

            <Field label="Cliente">
              <select value={idCliente} onChange={(event) => setIdCliente(event.target.value)} className={inputClassName} required>
                <option value="">Seleccionar cliente</option>
                {data.clientes.map((cliente) => (
                  <option key={cliente.idCliente} value={cliente.idCliente}>
                    {cliente.idCliente} / {cliente.empresa}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Litros entrada">
              <input
                value={litrosEntrada}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  if (!canEditPositiveIntegerInput(nextValue)) {
                    setFormError(POSITIVE_INTEGER_ERROR);
                    return;
                  }
                  setLitrosEntrada(nextValue);
                  setFormError('');
                }}
                className={inputClassName}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Ej. 370"
                required
              />
            </Field>

            <Field label="Litros salida manual" hint="Opcional. Si capturas un valor debe ser entero positivo.">
              <input
                value={litrosSalidaManual}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  if (!canEditPositiveIntegerInput(nextValue)) {
                    setFormError(POSITIVE_INTEGER_ERROR);
                    return;
                  }
                  setLitrosSalidaManual(nextValue);
                  setFormError('');
                }}
                className={inputClassName}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Sin salida manual"
              />
            </Field>

            <Field label="Responsable">
              <select value={responsable} onChange={(event) => setResponsable(event.target.value)} className={inputClassName}>
                {SHEET_VALIDATIONS.responsables.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </Field>

            <Field label="Observaciones">
              <input value={observaciones} onChange={(event) => setObservaciones(event.target.value)} className={inputClassName} placeholder="Detalle interno" />
            </Field>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <PdfPicker
              id="factura-pdf"
              label="Factura PDF"
              selection={facturaPdf}
              onChange={(selection, pdfError) => {
                setFacturaPdf(selection);
                if (pdfError) setFormError(pdfError);
              }}
              onRemove={() => setFacturaPdf(null)}
              required
            />
            <PdfPicker
              id="comprobante-pago-pdf"
              label="Comprobante pago PDF"
              selection={comprobantePdf}
              onChange={(selection, pdfError) => {
                setComprobantePdf(selection);
                if (pdfError) setFormError(pdfError);
              }}
              onRemove={() => setComprobantePdf(null)}
            />
          </div>

          {selectedCliente && isCapstone(selectedCliente) ? (
            <p className="mt-3 rounded-lg border border-pbm-blue/30 bg-pbm-blue/10 p-3 text-sm text-pbm-muted">
              Capstone detectado: el comprobante de pago se guardara en la carpeta <span className="font-black text-pbm-text">Evidencia</span> del cliente.
            </p>
          ) : null}

          {formError ? <p className="error-panel mt-4 rounded-lg p-3 text-sm font-bold text-pbm-red">{formError}</p> : null}
          {mutation.isError ? <p className="error-panel mt-4 rounded-lg p-3 text-sm font-bold text-pbm-red">{mutation.error.message}</p> : null}
          {mutation.isSuccess ? <p className="success-panel mt-4 rounded-lg p-3 text-sm font-bold text-pbm-green">Registro guardado y PDFs enviados a Drive.</p> : null}

          <PrimaryButton type="submit" disabled={isSubmitting} className="mt-4">
            {isSubmitting ? 'Guardando registro...' : 'Guardar registro'}
          </PrimaryButton>
        </form>

        <aside className="premium-card rounded-lg p-4 lg:p-5" data-accent="orange">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-pbm-muted">Resumen del cliente</p>
          {selectedSummary ? (
            <div className="mt-4 space-y-3">
              <h3 className="text-2xl font-black text-pbm-text">{selectedSummary.cliente.empresa}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-pbm-border/70 bg-pbm-bg/45 p-3">
                  <p className="text-xs text-pbm-muted">Entradas</p>
                  <p className="text-xl font-black text-pbm-green">{selectedSummary.totalEntrada} L</p>
                </div>
                <div className="rounded-lg border border-pbm-border/70 bg-pbm-bg/45 p-3">
                  <p className="text-xs text-pbm-muted">Salidas manuales</p>
                  <p className="text-xl font-black text-pbm-orange">{selectedSummary.totalSalidaManual} L</p>
                </div>
                <div className="rounded-lg border border-pbm-border/70 bg-pbm-bg/45 p-3">
                  <p className="text-xs text-pbm-muted">Servicios realizados</p>
                  <p className="text-xl font-black text-pbm-yellow">{selectedSummary.litrosServiciosRealizados} L</p>
                </div>
                <div className="rounded-lg border border-pbm-blue/40 bg-pbm-blue/10 p-3">
                  <p className="text-xs text-pbm-muted">Saldo</p>
                  <p className="text-xl font-black text-pbm-glow">{selectedSummary.saldoInformativo} L</p>
                </div>
              </div>
              <div className="rounded-lg border border-pbm-border/70 bg-pbm-bg/45 p-3 text-sm text-pbm-muted">
                <p>Ultima factura: <span className="font-bold text-pbm-text">{selectedSummary.ultimaFactura ? formatDate(selectedSummary.ultimaFactura.fechaRegistro) : 'Sin facturas'}</span></p>
                <p className="mt-1">Ultimo comprobante: <span className="font-bold text-pbm-text">{selectedSummary.ultimoComprobante ? formatDate(selectedSummary.ultimoComprobante.fechaRegistro) : 'Sin comprobantes'}</span></p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-pbm-muted">Selecciona un cliente para ver su saldo informativo.</p>
          )}
        </aside>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-pbm-muted">Historial por cliente</p>
            <h3 className="text-xl font-black text-pbm-text">{selectedSummary ? selectedSummary.cliente.empresa : 'Selecciona cliente'}</h3>
          </div>
          <StatusBadge tone="blue">{selectedSummary?.ingresos.length ?? 0} registros</StatusBadge>
        </div>

        {selectedSummary && selectedSummary.ingresos.length > 0 ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {selectedSummary.ingresos.map((ingreso) => (
              <article key={ingreso.idIngresoFactura} className="premium-card rounded-lg p-4" data-accent="blue">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-pbm-muted">{ingreso.idIngresoFactura}</p>
                    <h4 className="mt-1 text-lg font-black text-pbm-text">{formatDate(ingreso.fechaRegistro)}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onDelete(ingreso.idIngresoFactura)}
                    disabled={deleteMutation.isPending}
                    className="pressable rounded-lg border border-pbm-red/35 bg-pbm-red/10 p-2 text-pbm-red disabled:opacity-50"
                    aria-label="Eliminar registro"
                    title="Eliminar registro"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-pbm-bg/40 p-2">
                    <p className="text-xs text-pbm-muted">Entrada</p>
                    <p className="font-black text-pbm-green">{ingreso.litrosEntrada ?? 0} L</p>
                  </div>
                  <div className="rounded-lg bg-pbm-bg/40 p-2">
                    <p className="text-xs text-pbm-muted">Salida manual</p>
                    <p className="font-black text-pbm-orange">{ingreso.litrosSalidaManual ?? 0} L</p>
                  </div>
                  <div className="rounded-lg bg-pbm-bg/40 p-2">
                    <p className="text-xs text-pbm-muted">Servicios</p>
                    <p className="font-black text-pbm-yellow">{ingreso.litrosServiciosRealizados ?? 0} L</p>
                  </div>
                  <div className="rounded-lg bg-pbm-bg/40 p-2">
                    <p className="text-xs text-pbm-muted">Saldo snapshot</p>
                    <p className="font-black text-pbm-glow">{ingreso.saldoInformativo ?? 0} L</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ingreso.facturaPdf ? (
                    <a href={ingreso.facturaPdf} target="_blank" rel="noreferrer" className="pressable inline-flex items-center gap-1 rounded-lg border border-pbm-blue/40 bg-pbm-blue/10 px-3 py-2 text-xs font-bold text-pbm-glow">
                      <ReceiptText size={14} aria-hidden="true" />
                      Factura
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  ) : null}
                  {ingreso.comprobantePagoPdf ? (
                    <a href={ingreso.comprobantePagoPdf} target="_blank" rel="noreferrer" className="pressable inline-flex items-center gap-1 rounded-lg border border-pbm-green/40 bg-pbm-green/10 px-3 py-2 text-xs font-bold text-pbm-green">
                      <FileText size={14} aria-hidden="true" />
                      Comprobante
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
                <p className="mt-3 text-xs text-pbm-muted">Responsable: <span className="font-bold text-pbm-text">{ingreso.responsable || 'Sin responsable'}</span></p>
                {ingreso.observaciones ? <p className="mt-2 text-sm text-pbm-muted">{ingreso.observaciones}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <section className="premium-card rounded-lg p-5 text-center" data-accent="blue">
            <FileText className="mx-auto text-pbm-glow" size={28} aria-hidden="true" />
            <h4 className="mt-3 text-lg font-black text-pbm-text">Sin facturas registradas</h4>
            <p className="mt-1 text-sm text-pbm-muted">El historial aparecera aqui cuando guardes registros para el cliente seleccionado.</p>
          </section>
        )}
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {summaries.map((summary) => (
          <button
            key={summary.cliente.idCliente}
            type="button"
            onClick={() => setIdCliente(summary.cliente.idCliente)}
            className="premium-card pressable rounded-lg p-4 text-left"
            data-accent={summary.saldoInformativo < 0 ? 'orange' : 'green'}
          >
            <p className="text-xs font-black uppercase tracking-[0.14em] text-pbm-muted">{summary.cliente.idCliente}</p>
            <h4 className="mt-1 text-base font-black text-pbm-text">{summary.cliente.empresa}</h4>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm text-pbm-muted">Saldo</span>
              <span className="text-lg font-black text-pbm-glow">{summary.saldoInformativo} L</span>
            </div>
            <p className="mt-1 text-xs text-pbm-muted">{summary.ingresos.length} registros informativos</p>
          </button>
        ))}
      </section>
    </div>
  );
}

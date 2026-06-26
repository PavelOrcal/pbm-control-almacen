import { BellRing, Filter, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SmartAlertCard } from '../components/SmartAlertsPanel';
import { inputClassName } from '../components/FormControls';
import { ErrorState, LoadingState } from '../components/States';
import { StatusBadge } from '../components/StatusBadge';
import { usePbmData } from '../hooks/usePbmData';
import { useSmartAlerts } from '../hooks/useSmartAlerts';
import { alertLevelTone, summarizeSmartAlerts, type SmartAlertCategory, type SmartAlertLevel } from '../lib/alerts';
import { classNames } from '../lib/formatters';

type LevelFilter = 'Todos' | SmartAlertLevel;
type CategoryFilter = 'Todas' | SmartAlertCategory;

const levelFilters: LevelFilter[] = ['Todos', 'critica', 'advertencia', 'operativa', 'informativa'];
const categoryFilters: CategoryFilter[] = ['Todas', 'stock', 'producto', 'cliente', 'maquina', 'evidencia', 'pdf', 'litros', 'responsable'];

const categoryLabels: Record<SmartAlertCategory, string> = {
  stock: 'Stock',
  producto: 'Producto critico',
  cliente: 'Clientes',
  maquina: 'Maquinas',
  servicio: 'Servicios',
  evidencia: 'Sin fotos',
  pdf: 'Sin PDF',
  litros: 'Sin litros',
  responsable: 'Responsables',
  push: 'Push'
};

const levelLabels: Record<SmartAlertLevel, string> = {
  critica: 'Critica',
  advertencia: 'Advertencia',
  operativa: 'Operativa',
  informativa: 'Informativa'
};

function alertSearchText(alert: ReturnType<typeof useSmartAlerts>['alerts'][number]): string {
  return [
    alert.titulo,
    alert.mensaje,
    alert.tipo,
    alert.categoria,
    alert.nivel,
    alert.cliente,
    alert.responsable,
    alert.servicioId,
    alert.accionSugerida,
    ...(alert.detalles ?? [])
  ].join(' ').toLowerCase();
}

export default function Alertas() {
  const { data, isLoading, error } = usePbmData();
  const { alerts } = useSmartAlerts(data);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('Todos');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('Todas');
  const [query, setQuery] = useState('');

  const filteredAlerts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return alerts.filter((alert) => {
      if (levelFilter !== 'Todos' && alert.nivel !== levelFilter) return false;
      if (categoryFilter !== 'Todas' && alert.categoria !== categoryFilter) return false;
      if (search && !alertSearchText(alert).includes(search)) return false;
      return true;
    });
  }, [alerts, categoryFilter, levelFilter, query]);

  const summary = summarizeSmartAlerts(alerts);
  const grouped = useMemo(() => {
    const map = new Map<SmartAlertCategory, typeof filteredAlerts>();
    filteredAlerts.forEach((alert) => map.set(alert.categoria, [...(map.get(alert.categoria) ?? []), alert]));
    return Array.from(map.entries());
  }, [filteredAlerts]);

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Error desconocido'} />;

  return (
    <div className="screen-fade space-y-5">
      <section className="hero-panel rounded-lg p-5">
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-pbm-glow">V2.6 Alertas inteligentes</p>
              <h1 className="mt-2 text-4xl font-black leading-none text-pbm-text">Centro de mando</h1>
              <p className="mt-3 text-sm leading-relaxed text-pbm-muted">Prioriza stock, servicios, evidencia y responsables sin saturar el dashboard.</p>
            </div>
            <div className="rounded-lg border border-pbm-blue/40 bg-pbm-blue/10 p-3 text-pbm-glow shadow-glow">
              <BellRing size={24} aria-hidden="true" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2 text-center">
            <div className="rounded-md border border-pbm-red/25 bg-pbm-red/10 p-2">
              <p className="metric-value text-xl font-black text-pbm-red">{summary.critica}</p>
              <p className="text-[0.62rem] text-pbm-muted">Criticas</p>
            </div>
            <div className="rounded-md border border-pbm-orange/25 bg-pbm-orange/10 p-2">
              <p className="metric-value text-xl font-black text-pbm-orange">{summary.advertencia}</p>
              <p className="text-[0.62rem] text-pbm-muted">Avisos</p>
            </div>
            <div className="rounded-md border border-pbm-green/25 bg-pbm-green/10 p-2">
              <p className="metric-value text-xl font-black text-pbm-green">{summary.operativa}</p>
              <p className="text-[0.62rem] text-pbm-muted">Operacion</p>
            </div>
            <div className="rounded-md border border-pbm-blue/25 bg-pbm-blue/10 p-2">
              <p className="metric-value text-xl font-black text-pbm-glow">{summary.total}</p>
              <p className="text-[0.62rem] text-pbm-muted">Total</p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel-card rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-pbm-blue/30 bg-pbm-blue/10 p-2 text-pbm-glow">
            <Filter size={19} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-pbm-muted">Filtros</p>
            <h2 className="mt-1 text-lg font-black text-pbm-text">{filteredAlerts.length} alerta(s) visibles</h2>
          </div>
        </div>

        <label className="mt-4 block">
          <span className="sr-only">Buscar alerta</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pbm-muted" size={17} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className={classNames(inputClassName, 'pl-10')} placeholder="Buscar cliente, responsable, maquina o tipo" />
          </div>
        </label>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {levelFilters.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setLevelFilter(level)}
              className={classNames('pressable shrink-0 rounded-lg border px-3 py-2 text-xs font-black uppercase', levelFilter === level ? 'border-pbm-blue/60 bg-pbm-blue/15 text-pbm-glow' : 'border-pbm-border bg-pbm-card/70 text-pbm-muted')}
            >
              {level === 'Todos' ? 'Todos' : levelLabels[level]}
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {categoryFilters.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category)}
              className={classNames('pressable shrink-0 rounded-lg border px-3 py-2 text-xs font-black uppercase', categoryFilter === category ? 'border-pbm-orange/60 bg-pbm-orange/15 text-pbm-orange' : 'border-pbm-border bg-pbm-card/70 text-pbm-muted')}
            >
              {category === 'Todas' ? 'Todas' : categoryLabels[category]}
            </button>
          ))}
        </div>
      </section>

      {grouped.length > 0 ? (
        <section className="space-y-5">
          {grouped.map(([category, items]) => (
            <div key={category} className="space-y-3">
              <div className="sticky top-[4.6rem] z-20 rounded-lg border border-pbm-border/80 bg-pbm-bg/85 px-3 py-2 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black uppercase tracking-[0.12em] text-pbm-muted">{categoryLabels[category]}</h3>
                  <StatusBadge tone={alertLevelTone(items[0].nivel)}>{items.length}</StatusBadge>
                </div>
              </div>
              <div className="space-y-3">
                {items.map((alert) => (
                  <SmartAlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="empty-premium rounded-lg p-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-pbm-blue/30 bg-pbm-blue/10 text-pbm-glow shadow-glow">
            <BellRing size={22} aria-hidden="true" />
          </div>
          <h2 className="mt-3 text-lg font-black text-pbm-text">Sin alertas para estos filtros</h2>
          <p className="mt-1 text-sm text-pbm-muted">Ajusta busqueda, nivel o categoria para revisar el resto del centro de mando.</p>
        </section>
      )}
    </div>
  );
}

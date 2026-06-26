import {
  BellRing,
  Boxes,
  ClipboardList,
  Factory,
  History,
  Home,
  PackageSearch,
  Settings,
  UsersRound,
  Wifi
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { classNames } from '../lib/formatters';
import { canAccessWarehouse, useAuth, UserSessionBadge } from '../lib/auth';

const navItems = [
  { to: '/', label: 'Centro de control', icon: Home },
  { to: '/clientes', label: 'Clientes', icon: UsersRound },
  { to: '/maquinas', label: 'Maquinas', icon: Factory },
  { to: '/servicios', label: 'Servicios', icon: ClipboardList },
  { to: '/alertas', label: 'Alertas', icon: BellRing },
  { to: '/historial', label: 'Historial', icon: History },
  { to: '/stock-productos', label: 'Stock productos', icon: PackageSearch, adminOnly: true },
  { to: '/stock-bodega', label: 'Stock bodega', icon: Boxes, adminOnly: true },
  { to: '/sync', label: 'Sincronizacion', icon: Wifi },
  { to: '/mas', label: 'Mas modulos', icon: Settings }
];

export function DesktopSidebar() {
  const { user } = useAuth();
  const items = navItems.filter((item) => !item.adminOnly || canAccessWarehouse(user));

  return (
    <aside className="desktop-sidebar fixed inset-y-0 left-0 z-50 hidden w-[17.5rem] flex-col border-r border-pbm-border/80 p-4 lg:flex">
      <BrandLogo className="h-20 w-full px-6" imageClassName="max-h-14" />
      <div className="mt-5 rounded-xl border border-pbm-blue/25 bg-pbm-bg/35 p-4">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-pbm-glow">Paradigm Bio Metal</p>
        <h2 className="mt-2 text-2xl font-black leading-none text-pbm-text">PBM Control</h2>
        <p className="mt-2 text-xs leading-relaxed text-pbm-muted">Sistema interno de control operativo.</p>
      </div>

      <nav className="mt-5 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              classNames(
                'desktop-nav-link pressable group flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm font-bold transition',
                isActive
                  ? 'border-pbm-blue/55 bg-pbm-blue/15 text-pbm-text shadow-glow'
                  : 'border-transparent text-pbm-muted hover:border-pbm-blue/25 hover:bg-white/[0.04] hover:text-pbm-text'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={classNames('rounded-lg border p-2 transition', isActive ? 'border-pbm-blue/40 bg-pbm-blue/15 text-pbm-glow' : 'border-pbm-border/60 bg-pbm-bg/30 text-pbm-muted group-hover:text-pbm-glow')}>
                  <item.icon size={17} aria-hidden="true" />
                </span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 rounded-xl border border-pbm-border/70 bg-pbm-card/50 p-3">
        <p className="mb-2 text-[0.65rem] font-black uppercase tracking-[0.14em] text-pbm-muted">Sesion activa</p>
        <UserSessionBadge />
      </div>
    </aside>
  );
}

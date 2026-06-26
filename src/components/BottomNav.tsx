import { ClipboardList, Factory, History, Home, PackageSearch, UsersRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { classNames } from '../lib/formatters';
import { canAccessWarehouse, useAuth } from '../lib/auth';

const navItems = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/clientes', label: 'Clientes', icon: UsersRound },
  { to: '/servicios', label: 'Servicios', icon: ClipboardList },
  { to: '/stock-productos', label: 'Stock', icon: PackageSearch, adminOnly: true },
  { to: '/maquinas', label: 'Maquinas', icon: Factory, operativeOnly: true },
  { to: '/historial', label: 'Historial', icon: History }
];

export function BottomNav() {
  const { user } = useAuth();
  const items = navItems.filter((item) => {
    if (item.adminOnly) return canAccessWarehouse(user);
    if (item.operativeOnly) return !canAccessWarehouse(user);
    return true;
  });

  return (
    <nav className="bottom-nav-shell fixed inset-x-0 bottom-0 z-50 border-t border-pbm-border/80 px-2 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              classNames(
                'pressable flex min-h-14 flex-col items-center justify-center rounded-lg px-1 text-[0.68rem] font-semibold transition',
                isActive ? 'nav-item-active' : 'text-pbm-muted hover:bg-white/5 hover:text-pbm-text'
              )
            }
          >
            <item.icon size={20} aria-hidden="true" />
            <span className="mt-1 leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

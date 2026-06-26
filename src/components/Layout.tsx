import { Outlet, useLocation } from 'react-router-dom';
import { BellRing, RadioTower, Search } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { BrandLogo } from './BrandLogo';
import { DesktopSidebar } from './DesktopSidebar';
import { OfflineSyncManager } from './OfflineSyncCard';
import { UserSessionBadge } from '../lib/auth';

const titles: Record<string, string> = {
  '/': 'Centro de control',
  '/clientes': 'Clientes',
  '/maquinas': 'Maquinas',
  '/servicios': 'Servicios',
  '/stock-productos': 'Stock productos',
  '/stock-bodega': 'Stock bodega',
  '/movimiento-producto': 'Movimiento producto',
  '/movimiento-bodega': 'Movimiento bodega',
  '/historial': 'Historial',
  '/alertas': 'Alertas',
  '/sync': 'Sincronizacion',
  '/mas': 'Mas modulos'
};

export function Layout() {
  const { pathname } = useLocation();
  const title =
    titles[pathname] ??
    (pathname.startsWith('/clientes/') ? 'Detalle cliente' :
      pathname.startsWith('/maquinas/') ? 'Detalle maquina' :
        pathname.startsWith('/servicios/') ? 'Detalle servicio' :
          pathname.startsWith('/historial-servicios/') ? 'Servicio realizado' :
            pathname.startsWith('/stock-bodega/') ? 'Detalle articulo' :
              pathname.startsWith('/historial/') ? 'Detalle movimiento' : 'PBM Control');

  return (
    <div className="app-shell min-h-screen industrial-grid">
      <OfflineSyncManager />
      <DesktopSidebar />
      <header className="premium-header app-content sticky top-0 z-40 border-b border-pbm-border/80 px-3 py-2.5 backdrop-blur-xl min-[390px]:px-4 min-[390px]:py-3 lg:ml-72 lg:px-8 lg:py-4">
        <div className="mx-auto grid max-w-md grid-cols-[auto,minmax(0,1fr),auto] items-center gap-2 lg:max-w-[1480px] lg:grid-cols-[minmax(0,1fr)_minmax(16rem,28rem)_auto] lg:gap-5">
          <BrandLogo className="h-10 w-12 shrink-0 px-1.5 min-[390px]:w-28 min-[430px]:w-[7.25rem] lg:hidden" imageClassName="max-h-7 min-[390px]:max-h-8" />
          <div key={pathname} className="screen-fade min-w-0">
            <p className="truncate text-[0.58rem] font-black uppercase tracking-[0.12em] text-pbm-glow min-[390px]:text-[0.66rem]">PBM Control</p>
            <h1 className="truncate text-sm font-black leading-tight text-pbm-text min-[390px]:text-base min-[430px]:text-lg">{title}</h1>
          </div>
          <div className="hidden min-w-0 rounded-xl border border-pbm-border/70 bg-pbm-bg/35 px-3 py-2 text-sm text-pbm-muted lg:flex lg:w-[28rem] lg:items-center lg:gap-2">
            <Search size={16} className="text-pbm-glow" aria-hidden="true" />
            <span className="truncate">Busqueda global preparada para V2.8.x</span>
          </div>
          <div className="flex min-w-0 shrink-0 items-center justify-end gap-1.5 lg:gap-3">
            <button type="button" className="pressable hidden h-10 w-10 items-center justify-center rounded-xl border border-pbm-blue/30 bg-pbm-blue/10 text-pbm-glow shadow-glow lg:inline-flex" aria-label="Notificaciones">
              <BellRing size={18} aria-hidden="true" />
            </button>
            <div className="sync-indicator hidden items-center gap-1.5 rounded-full px-2.5 py-2 text-pbm-glow min-[430px]:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-pbm-green shadow-[0_0_12px_rgba(34,197,94,.8)]" />
              <RadioTower size={15} aria-hidden="true" />
            </div>
            <div className="lg:hidden">
              <UserSessionBadge compact />
            </div>
          </div>
        </div>
      </header>
      <main className="app-content safe-bottom mx-auto w-full max-w-md px-4 py-5 lg:ml-72 lg:max-w-none lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-[1480px]">
        <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

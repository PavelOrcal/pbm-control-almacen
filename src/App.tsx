import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AppLockedScreen } from './components/AppLockedScreen';
import { Layout } from './components/Layout';
import { PremiumSplash } from './components/PremiumSplash';
import { ProtectedModule } from './components/ProtectedModule';
import { RequireAuth } from './lib/auth';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import ClienteDetalle from './pages/ClienteDetalle';
import Maquinas from './pages/Maquinas';
import MaquinaDetalle from './pages/MaquinaDetalle';
import Servicios from './pages/Servicios';
import ServicioDetalle from './pages/ServicioDetalle';
import StockProductos from './pages/StockProductos';
import MovimientoProducto from './pages/MovimientoProducto';
import StockBodega from './pages/StockBodega';
import ArticuloBodegaDetalle from './pages/ArticuloBodegaDetalle';
import MovimientoBodega from './pages/MovimientoBodega';
import IngresoFacturaProducto from './pages/IngresoFacturaProducto';
import Historial from './pages/Historial';
import MovimientoHistorialDetalle from './pages/MovimientoHistorialDetalle';
import HistorialServicioDetalle from './pages/HistorialServicioDetalle';
import Alertas from './pages/Alertas';
import Mas from './pages/Mas';
import SyncStatus from './pages/SyncStatus';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashExiting, setSplashExiting] = useState(false);
  const appLocked = import.meta.env.VITE_APP_LOCKED === 'true';

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setSplashExiting(true), 1350);
    const hideTimer = window.setTimeout(() => setShowSplash(false), 1750);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      {showSplash ? <PremiumSplash exiting={splashExiting} /> : null}
      {appLocked ? (
        <AppLockedScreen />
      ) : (
        <Routes>
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/:idCliente" element={<ClienteDetalle />} />
            <Route path="maquinas" element={<Maquinas />} />
            <Route path="maquinas/:idMaquina" element={<MaquinaDetalle />} />
            <Route path="servicios" element={<Servicios />} />
            <Route path="servicios/:idServicio" element={<ServicioDetalle />} />
            <Route path="stock-productos" element={<ProtectedModule><StockProductos /></ProtectedModule>} />
            <Route path="movimiento-producto" element={<ProtectedModule><MovimientoProducto /></ProtectedModule>} />
            <Route path="stock-bodega" element={<ProtectedModule><StockBodega /></ProtectedModule>} />
            <Route path="stock-bodega/:idArticulo" element={<ProtectedModule><ArticuloBodegaDetalle /></ProtectedModule>} />
            <Route path="movimiento-bodega" element={<ProtectedModule><MovimientoBodega /></ProtectedModule>} />
            <Route path="ingreso-factura-producto" element={<ProtectedModule><IngresoFacturaProducto /></ProtectedModule>} />
            <Route path="historial" element={<Historial />} />
            <Route path="historial-servicios/:idHistorialServicio" element={<HistorialServicioDetalle />} />
            <Route path="historial/:origen/:idMovimiento" element={<MovimientoHistorialDetalle />} />
            <Route path="alertas" element={<Alertas />} />
            <Route path="sync" element={<SyncStatus />} />
            <Route path="mas" element={<Mas />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )}
    </>
  );
}

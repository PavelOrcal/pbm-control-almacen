import { ReactNode } from 'react';
import { canAccessWarehouse, RestrictedPanel, useAuth } from '../lib/auth';

export function ProtectedModule({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (canAccessWarehouse(user)) return <>{children}</>;

  return (
    <RestrictedPanel
      title="Acceso restringido"
      message="Este apartado pertenece a Almacen e inventario. Tu rol operativo puede consultar clientes, maquinas, servicios, calendario e historial limitado."
    />
  );
}

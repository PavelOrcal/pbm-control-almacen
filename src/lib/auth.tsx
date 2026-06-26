import { createContext, FormEvent, ReactNode, useContext, useMemo, useState } from 'react';
import { LogIn, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { Field, inputClassName, PrimaryButton, SecondaryButton } from '../components/FormControls';
import { BrandLogo } from '../components/BrandLogo';

export type UserRole = 'admin' | 'operativo';

export interface AuthUser {
  username: string;
  role: UserRole;
  sessionVersion?: string;
}

interface InternalUser extends AuthUser {
  loginId: string;
  password: string;
}

export const AUTH_SESSION_KEY = 'pbm-control-active-user';
const AUTH_SESSION_VERSION = '2026-06-security-refresh';

export const INTERNAL_USERS: InternalUser[] = [
  { loginId: 'An7#bL2!qR', username: 'Anibal', password: 'P9&mK2@zQ!', role: 'admin' },
  { loginId: 'Ru4@tH8#xL', username: 'Ruth', password: 'B7!rV3$qN@', role: 'admin' },
  { loginId: 'Ka6#rN1!pZ', username: 'Karen', password: 'M4@kT8#sL!', role: 'admin' },
  { loginId: 'Wi9!lM5@cQ', username: 'William', password: 'X2#wP7!nR@', role: 'operativo' },
  { loginId: 'Fr3@cS6!vT', username: 'Francisco', password: 'L8$qF1@zM#', role: 'operativo' }
];

function publicUser(user: InternalUser): AuthUser {
  return { username: user.username, role: user.role, sessionVersion: AUTH_SESSION_VERSION };
}

export function getUserDisplayName(user: AuthUser | null | undefined): string {
  if (!user) return '';
  return user.username;
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    const exists = INTERNAL_USERS.some(
      (user) => user.username === parsed.username && user.role === parsed.role && parsed.sessionVersion === AUTH_SESSION_VERSION
    );
    return exists ? parsed : null;
  } catch {
    return null;
  }
}

export function isAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === 'admin';
}

export function canSeeInventory(user: AuthUser | null | undefined): boolean {
  return isAdmin(user);
}

export function canDeleteRecords(user: AuthUser | null | undefined): boolean {
  return isAdmin(user);
}

export function canAccessWarehouse(user: AuthUser | null | undefined): boolean {
  return isAdmin(user);
}

type AuthContextValue = {
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());

  const value = useMemo<AuthContextValue>(() => ({
    user,
    login(username, password) {
      const candidate = INTERNAL_USERS.find(
        (item) => item.loginId.toLowerCase() === username.trim().toLowerCase() && item.password === password
      );
      if (!candidate) return false;
      const nextUser = publicUser(candidate);
      try {
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextUser));
      } catch {
        // Session storage is best-effort; state still keeps the session while the app is open.
      }
      setUser(nextUser);
      return true;
    },
    logout() {
      try {
        sessionStorage.removeItem(AUTH_SESSION_KEY);
        sessionStorage.removeItem('pbm-control-inventory-unlocked');
      } catch {
        // Ignore storage failures.
      }
      setUser(null);
    }
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (login(username, password)) return;
    setError('Usuario o contraseña incorrectos. Revisa tus credenciales de PBM Control.');
  }

  return (
    <div className="app-shell min-h-screen industrial-grid px-4 py-8">
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <section className="hero-panel rounded-lg p-5">
          <div className="relative z-10">
            <BrandLogo className="h-20 w-48 px-4" imageClassName="max-h-14" />
            <p className="mt-6 text-[0.68rem] font-black uppercase tracking-[0.22em] text-pbm-glow">PBM Control Almacen</p>
            <h1 className="mt-2 text-4xl font-black leading-none text-pbm-text">Acceso interno</h1>
            <p className="mt-3 text-sm leading-relaxed text-pbm-muted">
              Ingresa con tu usuario para cargar permisos por rol y mantener el control operativo protegido.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <Field label="Usuario">
                <input
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setError('');
                  }}
                  className={inputClassName}
                  placeholder="Solicita tus accesos al administrador"
                  autoComplete="username"
                  autoFocus
                  required
                />
              </Field>

              <Field label="Contraseña">
                <input
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError('');
                  }}
                  className={inputClassName}
                  placeholder="Contraseña asignada"
                  autoComplete="current-password"
                  required
                />
              </Field>

              {error ? <p className="error-panel rounded-lg p-3 text-sm font-bold text-pbm-red">{error}</p> : null}

              <PrimaryButton type="submit" className="gap-2">
                <LogIn size={18} aria-hidden="true" />
                Ingresar
              </PrimaryButton>
            </form>
          </div>
        </section>

        <section className="mt-4 rounded-lg border border-pbm-blue/30 bg-pbm-blue/10 p-4 text-sm text-pbm-muted">
          <div className="flex gap-3">
            <ShieldCheck className="shrink-0 text-pbm-glow" size={20} aria-hidden="true" />
            <p><span className="font-black text-pbm-text">Seguridad interna básica.</span> La sesión se guarda solo en este navegador durante la sesión actual.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <LoginScreen />;
  return <>{children}</>;
}

export function UserSessionBadge({ compact = false }: { compact?: boolean }) {
  const { user, logout } = useAuth();
  if (!user) return null;
  const displayName = getUserDisplayName(user);

  return (
    <div className={compact ? 'flex min-w-0 items-center gap-1.5' : 'flex items-center gap-2'}>
      {!compact ? (
        <div className="hidden min-[390px]:block text-right">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-pbm-muted">{user.role}</p>
          <p className="max-w-24 truncate text-xs font-black text-pbm-text">{displayName}</p>
        </div>
      ) : null}
      <div className={compact ? 'sync-indicator flex max-w-[5.3rem] items-center gap-1 rounded-lg px-1.5 py-1.5 text-pbm-glow' : 'sync-indicator hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-pbm-glow min-[360px]:flex'}>
        <UserRound size={compact ? 12 : 14} aria-hidden="true" />
        <span className={compact ? 'truncate text-[0.62rem] font-black' : 'text-[0.68rem] font-black'}>{displayName}</span>
      </div>
      <button
        type="button"
        onClick={logout}
        className="pressable rounded-lg border border-pbm-border bg-pbm-card/80 p-2 text-pbm-muted hover:text-pbm-text"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <LogOut size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function RestrictedPanel({ title = 'Acceso restringido', message = 'Este módulo requiere permisos de administrador.' }: { title?: string; message?: string }) {
  return (
    <div className="screen-fade space-y-5">
      <section className="hero-panel rounded-lg p-5">
        <div className="relative z-10">
          <div className="rounded-lg border border-pbm-orange/40 bg-pbm-orange/10 p-3 text-pbm-orange shadow-orange w-fit">
            <ShieldCheck size={26} aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-3xl font-black leading-none text-pbm-text">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-pbm-muted">{message}</p>
        </div>
      </section>
      <SecondaryButton type="button" onClick={() => window.history.back()}>
        Volver
      </SecondaryButton>
    </div>
  );
}

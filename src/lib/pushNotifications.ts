import type { AuthUser } from './auth';
import { savePushToken } from './api';
import { getFirebaseApp, getFirebaseConfig, getFirebaseVapidKey, isFirebaseConfigured } from './firebase';

export type PushRegistrationStatus = 'not-configured' | 'unsupported' | 'denied' | 'registered' | 'error';

export interface PushRegistrationResult {
  status: PushRegistrationStatus;
  message: string;
  token?: string;
}

function browserLabel(): string {
  if (typeof navigator === 'undefined') return 'Servidor';
  const userAgent = navigator.userAgent;
  if (/Edg\//i.test(userAgent)) return 'Microsoft Edge';
  if (/Chrome\//i.test(userAgent)) return 'Chrome';
  if (/Firefox\//i.test(userAgent)) return 'Firefox';
  if (/Safari\//i.test(userAgent)) return 'Safari';
  return 'Navegador';
}

function deviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Dispositivo desconocido';
  const nav = navigator as Navigator & { userAgentData?: { platform?: string; mobile?: boolean } };
  const platform = nav.userAgentData?.platform || navigator.platform || 'Web';
  const mobile = nav.userAgentData?.mobile ? ' movil' : '';
  return `${platform}${mobile}`;
}

function serviceWorkerUrl(): string {
  const config = getFirebaseConfig();
  const params = new URLSearchParams({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId
  });
  return `/firebase-messaging-sw.js?${params.toString()}`;
}

async function registerFirebaseMessagingWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Este navegador no soporta service workers.');
  }
  return navigator.serviceWorker.register(serviceWorkerUrl(), {
    scope: '/firebase-cloud-messaging-push-scope'
  });
}

export function pushRuntimeStatus(): PushRegistrationResult {
  if (!isFirebaseConfigured()) {
    return {
      status: 'not-configured',
      message: 'Push real no configurado. Las alertas internas y recordatorios locales siguen activos.'
    };
  }
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return {
      status: 'unsupported',
      message: 'Este navegador no soporta notificaciones push web completas.'
    };
  }
  if (Notification.permission === 'denied') {
    return {
      status: 'denied',
      message: 'Las notificaciones estan bloqueadas en este navegador. Activalas desde configuracion del sitio.'
    };
  }
  return {
    status: 'registered',
    message: Notification.permission === 'granted' ? 'Permiso concedido. Puedes registrar este dispositivo.' : 'Listo para solicitar permiso de notificaciones push.'
  };
}

export async function registerPushDevice(user: AuthUser): Promise<PushRegistrationResult> {
  if (!isFirebaseConfigured()) return pushRuntimeStatus();
  if (typeof window === 'undefined' || !('Notification' in window)) return pushRuntimeStatus();

  const { isSupported, getMessaging, getToken } = await import('firebase/messaging');
  const supported = await isSupported();
  if (!supported) {
    return {
      status: 'unsupported',
      message: 'Firebase Messaging no esta soportado en este navegador.'
    };
  }

  const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
  if (permission === 'denied') {
    return {
      status: 'denied',
      message: 'Las notificaciones estan bloqueadas en este navegador. Activalas desde configuracion del sitio.'
    };
  }
  if (permission !== 'granted') {
    return {
      status: 'denied',
      message: 'Permiso de notificaciones no concedido.'
    };
  }

  try {
    const app = await getFirebaseApp();
    if (!app) return pushRuntimeStatus();
    const serviceWorkerRegistration = await registerFirebaseMessagingWorker();
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: getFirebaseVapidKey(),
      serviceWorkerRegistration
    });

    if (!token) {
      return {
        status: 'error',
        message: 'Firebase no devolvio token para este dispositivo.'
      };
    }

    await savePushToken({
      usuario: user.username,
      rol: user.role,
      token,
      dispositivo: deviceLabel(),
      navegador: browserLabel(),
      activo: 'SI'
    });

    return {
      status: 'registered',
      message: 'Dispositivo registrado para push real.',
      token
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

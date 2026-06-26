import type { FirebaseApp } from 'firebase/app';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const firebaseConfig: FirebaseClientConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim() ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() ?? ''
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim() ?? '';

let appPromise: Promise<FirebaseApp | null> | null = null;

export function getFirebaseConfig(): FirebaseClientConfig {
  return firebaseConfig;
}

export function getFirebaseVapidKey(): string {
  return vapidKey;
}

export function isFirebaseConfigured(): boolean {
  return Object.values(firebaseConfig).every(Boolean) && Boolean(vapidKey);
}

export async function getFirebaseApp(): Promise<FirebaseApp | null> {
  if (!isFirebaseConfigured()) return null;
  if (!appPromise) {
    appPromise = import('firebase/app').then(({ getApp, getApps, initializeApp }) => {
      const apps = getApps();
      return apps.length > 0 ? getApp() : initializeApp(firebaseConfig);
    });
  }
  return appPromise;
}

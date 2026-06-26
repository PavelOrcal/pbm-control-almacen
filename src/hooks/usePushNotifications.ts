import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../lib/auth';
import { pushRuntimeStatus, registerPushDevice, type PushRegistrationResult } from '../lib/pushNotifications';

interface LocalPushRegistration {
  tokenPreview: string;
  updatedAt: string;
}

function registrationKey(username: string): string {
  return `pbm-control-push-registration-${username}`;
}

function readLocalRegistration(username: string | undefined): LocalPushRegistration | null {
  if (!username) return null;
  try {
    const raw = localStorage.getItem(registrationKey(username));
    return raw ? JSON.parse(raw) as LocalPushRegistration : null;
  } catch {
    return null;
  }
}

function writeLocalRegistration(username: string, token: string): LocalPushRegistration {
  const registration = {
    tokenPreview: `${token.slice(0, 10)}...${token.slice(-6)}`,
    updatedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem(registrationKey(username), JSON.stringify(registration));
  } catch {
    // Local storage is best-effort; Apps Script still receives the token.
  }
  return registration;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [result, setResult] = useState<PushRegistrationResult>(() => pushRuntimeStatus());
  const [isRegistering, setIsRegistering] = useState(false);
  const [localRegistration, setLocalRegistration] = useState<LocalPushRegistration | null>(() => readLocalRegistration(user?.username));

  useEffect(() => {
    setLocalRegistration(readLocalRegistration(user?.username));
  }, [user?.username]);

  const status = useMemo(() => pushRuntimeStatus(), []);

  const registerDevice = useCallback(async () => {
    if (!user) return;
    setIsRegistering(true);
    const nextResult = await registerPushDevice(user);
    if (nextResult.status === 'registered' && nextResult.token) {
      setLocalRegistration(writeLocalRegistration(user.username, nextResult.token));
    }
    setResult(nextResult);
    setIsRegistering(false);
  }, [user]);

  return {
    user,
    status,
    result,
    localRegistration,
    isRegistering,
    registerDevice
  };
}

import { useMemo } from 'react';
import { buildSmartAlerts, summarizeSmartAlerts } from '../lib/alerts';
import { useAuth } from '../lib/auth';
import type { PbmData } from '../types/pbm';

export function useSmartAlerts(data: PbmData | undefined) {
  const { user } = useAuth();

  const alerts = useMemo(() => (data ? buildSmartAlerts(data, user) : []), [data, user]);
  const summary = useMemo(() => summarizeSmartAlerts(alerts), [alerts]);

  return { alerts, summary };
}

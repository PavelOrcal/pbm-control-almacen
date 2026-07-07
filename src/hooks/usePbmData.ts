import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  appendMovimientoBodega,
  appendMovimientoProducto,
  createServicio,
  fetchPbmData,
  isAppsScriptJsonpTimeoutError,
  markHistorialServicioDeleted,
  markMovimientoBodegaDeleted,
  markMovimientoProductoDeleted,
  markServicioDeleted,
  markServicioRealizado,
  updateServicio
} from '../lib/api';
import { getCurrentUser } from '../lib/auth';
import {
  buildOfflineActionContext,
  enqueueOfflineAction,
  OFFLINE_ACTION_QUEUED_MESSAGE,
  type OfflineActionType
} from '../lib/offlineQueue';
import type { MovimientoBodegaInput, MovimientoProductoInput, PbmData, ServicioCreateInput, ServicioRealizadoInput, ServicioUpdateInput } from '../types/pbm';

export const PBM_DATA_QUERY_KEY = ['pbm-data'];

export interface OfflineAwareMutationResult {
  queued: boolean;
  duplicate?: boolean;
  entryId?: string;
  message: string;
}

interface MovementMutationOptions {
  onVerifyTimeout?: () => void;
}

export interface MovementMutationResult {
  verifiedAfterTimeout: boolean;
}

function onlineMutationResult(message = 'Accion sincronizada con Google Sheet.'): OfflineAwareMutationResult {
  return { queued: false, message };
}

function isBrowserOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

function shouldQueueAfterFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('No se pudo conectar con Apps Script') ||
    message.includes('Error al subir fotos a Drive') ||
    message.includes('Failed to fetch') ||
    message.includes('NetworkError');
}

function currentUserLabel(): string {
  const user = getCurrentUser();
  return user ? `${user.username} / ${user.role}` : 'Sin sesion';
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function sameText(left: unknown, right: unknown): boolean {
  return String(left ?? '').trim() === String(right ?? '').trim();
}

function sameNumber(left: unknown, right: unknown): boolean {
  return Math.abs(Number(left ?? 0) - Number(right ?? 0)) < 0.000001;
}

function countMatchingMovimientoProducto(data: PbmData | undefined, input: MovimientoProductoInput): number {
  if (!data) return 0;
  return data.movimientosProducto.filter((movimiento) =>
    sameText(movimiento.fecha, input.fecha) &&
    sameText(movimiento.tipoMovimiento, input.tipoMovimiento) &&
    sameText(movimiento.idProducto, input.idProducto) &&
    sameNumber(movimiento.litros, input.litros) &&
    sameText(movimiento.idCliente, input.idCliente) &&
    sameText(movimiento.idMaquina, input.idMaquina) &&
    sameText(movimiento.idServicio, input.idServicio) &&
    sameText(movimiento.motivo, input.motivo) &&
    sameText(movimiento.responsable, input.responsable)
  ).length;
}

function countMatchingMovimientoBodega(data: PbmData | undefined, input: MovimientoBodegaInput): number {
  if (!data) return 0;
  return data.movimientosBodega.filter((movimiento) =>
    sameText(movimiento.fecha, input.fecha) &&
    sameText(movimiento.tipoMovimiento, input.tipoMovimiento) &&
    sameText(movimiento.idArticulo, input.idArticulo) &&
    sameNumber(movimiento.cantidad, input.cantidad) &&
    sameText(movimiento.responsable, input.responsable) &&
    sameText(movimiento.motivo, input.motivo)
  ).length;
}

async function refetchDataAfterWriteTimeout(
  queryClient: QueryClient,
  onVerifyTimeout?: () => void
): Promise<PbmData> {
  onVerifyTimeout?.();
  await wait(2500);
  const latestData = await fetchPbmData();
  queryClient.setQueryData(PBM_DATA_QUERY_KEY, latestData);
  return latestData;
}

async function runMovimientoProductoWithTimeoutVerification(
  queryClient: QueryClient,
  input: MovimientoProductoInput,
  options: MovementMutationOptions = {}
): Promise<MovementMutationResult> {
  const previousData = queryClient.getQueryData<PbmData>(PBM_DATA_QUERY_KEY);
  const previousCount = countMatchingMovimientoProducto(previousData, input);

  try {
    await appendMovimientoProducto(input);
    return { verifiedAfterTimeout: false };
  } catch (error) {
    if (!isAppsScriptJsonpTimeoutError(error)) throw error;

    try {
      const latestData = await refetchDataAfterWriteTimeout(queryClient, options.onVerifyTimeout);
      if (countMatchingMovimientoProducto(latestData, input) > previousCount) {
        return { verifiedAfterTimeout: true };
      }
    } catch (verificationError) {
      const message = verificationError instanceof Error ? verificationError.message : String(verificationError);
      throw new Error(`Apps Script tardo demasiado y no se pudo verificar el registro. Detalle: ${message}`);
    }

    throw new Error('Apps Script tardo demasiado y el movimiento no aparecio despues de verificar. Revisa Historial antes de intentar registrarlo de nuevo.');
  }
}

async function runMovimientoBodegaWithTimeoutVerification(
  queryClient: QueryClient,
  input: MovimientoBodegaInput,
  options: MovementMutationOptions = {}
): Promise<MovementMutationResult> {
  const previousData = queryClient.getQueryData<PbmData>(PBM_DATA_QUERY_KEY);
  const previousCount = countMatchingMovimientoBodega(previousData, input);

  try {
    await appendMovimientoBodega(input);
    return { verifiedAfterTimeout: false };
  } catch (error) {
    if (!isAppsScriptJsonpTimeoutError(error)) throw error;

    try {
      const latestData = await refetchDataAfterWriteTimeout(queryClient, options.onVerifyTimeout);
      if (countMatchingMovimientoBodega(latestData, input) > previousCount) {
        return { verifiedAfterTimeout: true };
      }
    } catch (verificationError) {
      const message = verificationError instanceof Error ? verificationError.message : String(verificationError);
      throw new Error(`Apps Script tardo demasiado y no se pudo verificar el registro. Detalle: ${message}`);
    }

    throw new Error('Apps Script tardo demasiado y el movimiento no aparecio despues de verificar. Revisa Historial antes de intentar registrarlo de nuevo.');
  }
}

async function queueOfflineAction(
  queryClient: QueryClient,
  action: OfflineActionType,
  payload: Record<string, unknown>,
  options: { error?: string; status?: 'pendiente' | 'error' } = {}
): Promise<OfflineAwareMutationResult> {
  const data = queryClient.getQueryData<PbmData>(PBM_DATA_QUERY_KEY);
  const { entry, duplicate } = await enqueueOfflineAction({
    action,
    payload,
    user: currentUserLabel(),
    context: buildOfflineActionContext(action, payload, data),
    status: options.status ?? 'pendiente',
    error: options.error
  });
  return {
    queued: true,
    duplicate,
    entryId: entry.id,
    message: options.error ? `${OFFLINE_ACTION_QUEUED_MESSAGE} Error: ${options.error}` : OFFLINE_ACTION_QUEUED_MESSAGE
  };
}

async function runOfflineAwareServiceAction(
  queryClient: QueryClient,
  action: OfflineActionType,
  payload: Record<string, unknown>,
  onlineAction: () => Promise<void>
): Promise<OfflineAwareMutationResult> {
  if (isBrowserOffline()) {
    return queueOfflineAction(queryClient, action, payload);
  }
  try {
    await onlineAction();
    return onlineMutationResult();
  } catch (error) {
    if (isBrowserOffline() || shouldQueueAfterFailure(error)) {
      const message = error instanceof Error ? error.message : String(error);
      return queueOfflineAction(queryClient, action, payload, {
        status: isBrowserOffline() ? 'pendiente' : 'error',
        error: message
      });
    }
    throw error;
  }
}

export function usePbmData() {
  return useQuery({
    queryKey: PBM_DATA_QUERY_KEY,
    queryFn: fetchPbmData,
    staleTime: 30_000
  });
}

export function useMovimientoProductoMutation(options: MovementMutationOptions = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MovimientoProductoInput) => runMovimientoProductoWithTimeoutVerification(queryClient, input, options),
    onSuccess: (result) => {
      if (!result.verifiedAfterTimeout) void queryClient.invalidateQueries({ queryKey: PBM_DATA_QUERY_KEY });
    }
  });
}

export function useMovimientoBodegaMutation(options: MovementMutationOptions = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MovimientoBodegaInput) => runMovimientoBodegaWithTimeoutVerification(queryClient, input, options),
    onSuccess: (result) => {
      if (!result.verifiedAfterTimeout) void queryClient.invalidateQueries({ queryKey: PBM_DATA_QUERY_KEY });
    }
  });
}

export function useServicioRealizadoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ServicioRealizadoInput) =>
      runOfflineAwareServiceAction(
        queryClient,
        'markServicioRealizado',
        input as unknown as Record<string, unknown>,
        () => markServicioRealizado(input)
      ),
    onSuccess: (result) => {
      if (!result.queued) void queryClient.invalidateQueries({ queryKey: PBM_DATA_QUERY_KEY });
    }
  });
}

export function useHistorialServicioDeleteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idHistorialServicio: string) =>
      runOfflineAwareServiceAction(
        queryClient,
        'markHistorialServicioDeleted',
        { idHistorialServicio },
        () => markHistorialServicioDeleted(idHistorialServicio)
      ),
    onSuccess: (result) => {
      if (!result.queued) void queryClient.invalidateQueries({ queryKey: PBM_DATA_QUERY_KEY });
    }
  });
}

export function useServicioUpdateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ServicioUpdateInput) =>
      runOfflineAwareServiceAction(
        queryClient,
        'updateServicio',
        input as unknown as Record<string, unknown>,
        () => updateServicio(input)
      ),
    onSuccess: (result) => {
      if (!result.queued) void queryClient.invalidateQueries({ queryKey: PBM_DATA_QUERY_KEY });
    }
  });
}

export function useServicioCreateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ServicioCreateInput) => createServicio(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PBM_DATA_QUERY_KEY })
  });
}

export function useServicioDeleteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idServicio: string) =>
      runOfflineAwareServiceAction(
        queryClient,
        'markServicioDeleted',
        { idServicio },
        () => markServicioDeleted(idServicio)
      ),
    onSuccess: (result) => {
      if (!result.queued) void queryClient.invalidateQueries({ queryKey: PBM_DATA_QUERY_KEY });
    }
  });
}

export function useMovimientoProductoDeleteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idMovimientoProducto: string) => markMovimientoProductoDeleted(idMovimientoProducto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PBM_DATA_QUERY_KEY })
  });
}

export function useMovimientoBodegaDeleteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idMovimiento: string) => markMovimientoBodegaDeleted(idMovimiento),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PBM_DATA_QUERY_KEY })
  });
}

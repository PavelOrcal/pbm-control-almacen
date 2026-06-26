import type { Servicio } from '../types/pbm';
import { formatDate, getServiceStatus, parseSheetDate } from './formatters';
import { isDeletedRecord } from './records';

export type ReminderKind = 'today' | 'tomorrow';

export interface ServiceReminder {
  kind: ReminderKind;
  servicio: Servicio;
}

type ScheduledReminderKind = 'previous-1600' | 'previous-2000' | 'same-0700';

interface ReminderSlot {
  kind: ScheduledReminderKind;
  offsetDays: number;
  hour: number;
  minute: number;
}

const MAX_TIMEOUT_DELAY = 2_147_000_000;
const scheduledTimers = new Map<string, number[]>();

const reminderSlots: ReminderSlot[] = [
  { kind: 'previous-1600', offsetDays: -1, hour: 16, minute: 0 },
  { kind: 'previous-2000', offsetDays: -1, hour: 20, minute: 0 },
  { kind: 'same-0700', offsetDays: 0, hour: 7, minute: 0 }
];

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function serviceMachineLabel(servicio: Servicio): string {
  return servicio.idMaquina || servicio.modelo || 'N/A';
}

function reminderDateFor(serviceDate: Date, slot: ReminderSlot): Date {
  return new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate() + slot.offsetDays, slot.hour, slot.minute, 0, 0);
}

export function getServiceReminders(servicios: Servicio[], now = new Date()): ServiceReminder[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const todayKey = dateKey(today);
  const tomorrowKey = dateKey(tomorrow);

  return servicios
    .filter((servicio) => !isDeletedRecord(servicio) && getServiceStatus(servicio, now) === 'Pendiente')
    .map((servicio) => {
      const date = parseSheetDate(servicio.fechaProgramada);
      if (!date) return null;
      const key = dateKey(date);
      if (key === todayKey) return { kind: 'today' as const, servicio };
      if (key === tomorrowKey) return { kind: 'tomorrow' as const, servicio };
      return null;
    })
    .filter((item): item is ServiceReminder => Boolean(item));
}

export function reminderTitle(kind: ReminderKind): string {
  return kind === 'today' ? 'Servicio programado para hoy' : 'Recordatorio de servicio para manana';
}

export function reminderText(kind: ReminderKind): string {
  if (kind === 'today') {
    return 'Servicio programado para hoy. Al finalizar, registra las observaciones, captura los litros utilizados y deja programada la siguiente fecha.';
  }
  return 'Recordatorio de servicio: manana tienes un servicio programado. Al concluir, registra las observaciones, captura los litros utilizados y programa la siguiente fecha.';
}

export function serviceNotificationTitle(servicio: Servicio): string {
  return `Servicio programado: ${servicio.cliente || 'Cliente'} / ${serviceMachineLabel(servicio)}`;
}

export function serviceNotificationBody(servicio: Servicio): string {
  return `Servicio programado para ${formatDate(servicio.fechaProgramada)}. Al finalizar, registra observaciones, captura los litros utilizados y deja programada la siguiente fecha.`;
}

export function cancelServiceReminders(idServicio: string): void {
  if (typeof window === 'undefined') return;
  const timers = scheduledTimers.get(idServicio) ?? [];
  timers.forEach((timer) => window.clearTimeout(timer));
  scheduledTimers.delete(idServicio);
}

export function cancelAllServiceReminders(): void {
  if (typeof window === 'undefined') return;
  scheduledTimers.forEach((timers) => timers.forEach((timer) => window.clearTimeout(timer)));
  scheduledTimers.clear();
}

export function scheduleServiceReminders(servicio: Servicio, now = new Date()): number {
  if (typeof window === 'undefined') return 0;
  cancelServiceReminders(servicio.idServicio);
  if (!('Notification' in window) || Notification.permission !== 'granted') return 0;
  if (isDeletedRecord(servicio) || getServiceStatus(servicio, now) !== 'Pendiente') return 0;

  const serviceDate = parseSheetDate(servicio.fechaProgramada);
  if (!serviceDate) return 0;

  const timers: number[] = [];
  reminderSlots.forEach((slot) => {
    const reminderAt = reminderDateFor(serviceDate, slot);
    const delay = reminderAt.getTime() - now.getTime();
    if (delay <= 0 || delay > MAX_TIMEOUT_DELAY) return;

    const timer = window.setTimeout(() => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      new Notification(serviceNotificationTitle(servicio), {
        body: serviceNotificationBody(servicio),
        tag: `pbm-service-${servicio.idServicio}-${slot.kind}`
      });
    }, delay);
    timers.push(timer);
  });

  if (timers.length > 0) scheduledTimers.set(servicio.idServicio, timers);
  return timers.length;
}

export function scheduleServiceRemindersBatch(servicios: Servicio[], now = new Date()): number {
  return servicios.reduce((total, servicio) => total + scheduleServiceReminders(servicio, now), 0);
}

import { canSeeInventory, getCurrentUser } from './auth';

export function hasInventoryAccess(): boolean {
  return canSeeInventory(getCurrentUser());
}

export function protectedInventoryLabel(unlocked: boolean, value: string | number, fallback = 'Protegido'): string | number {
  return unlocked ? value : fallback;
}

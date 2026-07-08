export const POSITIVE_INTEGER_ERROR = 'Ingresa unicamente numeros enteros positivos, sin puntos ni decimales.';

export function isPositiveIntegerInput(value: string): boolean {
  return /^[1-9]\d*$/.test(value.trim());
}

export function canEditPositiveIntegerInput(value: string): boolean {
  return value === '' || /^[1-9]\d*$/.test(value);
}

export function parsePositiveIntegerInput(value: string, label: string, required = true): number | null {
  const clean = value.trim();
  if (!clean) {
    if (required) throw new Error(`${label}: ${POSITIVE_INTEGER_ERROR}`);
    return null;
  }
  if (!isPositiveIntegerInput(clean)) {
    throw new Error(`${label}: ${POSITIVE_INTEGER_ERROR}`);
  }
  return Number(clean);
}

export const BRAND_LOGO_SRC = '/logo_app.png';

export const EQUIPMENT_IMAGE_BY_MODEL: Record<string, string> = {
  'PBT-40': '/equipos/PBT-40.jpg',
  'PBT-80': '/equipos/PBT-80.jpg',
  'PL-100': '/equipos/PL-100.jpg',
  'PL-200': '/equipos/PL-200.jpg',
  'PGD-200': '/equipos/PGD-200.jpg'
};

export function isValidImageUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return /^https?:\/\/.+\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(trimmed);
}

function isPublicImagePath(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^\/.+\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(value.trim());
}

function isImageFileName(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^[^/\\]+\.(png|jpe?g|webp|gif|svg)$/i.test(value.trim());
}

export function normalizeAssetKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export function clientInitials(name: string): string {
  const words = name
    .replace(/\([^)]*\)/g, '')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
  if (words.length === 0) return 'PBM';
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
}

export const CUSTOMER_LOGO_BY_KEY: Record<string, string> = {};

export function resolveCustomerLogo(empresa: string, logoCliente?: string): string | null {
  const logo = logoCliente?.trim();
  if (isValidImageUrl(logo) || isPublicImagePath(logo)) return logo!;
  if (isImageFileName(logo)) return `/clientes/${logo}`;

  const key = normalizeAssetKey(empresa);
  return CUSTOMER_LOGO_BY_KEY[key] ?? null;
}

function normalizeModel(model: string): string {
  return model.toUpperCase().replace(/\s+/g, '-');
}

export function resolveEquipmentImage(model: string, fotoMaquina?: string): string | null {
  if (isValidImageUrl(fotoMaquina)) return fotoMaquina!.trim();

  const normalized = normalizeModel(model);
  if (normalized.includes('PBT-40')) return EQUIPMENT_IMAGE_BY_MODEL['PBT-40'];
  if (normalized.includes('PBT-80')) return EQUIPMENT_IMAGE_BY_MODEL['PBT-80'];
  if (normalized.includes('PL-100')) return EQUIPMENT_IMAGE_BY_MODEL['PL-100'];
  if (normalized.includes('PL-200')) return EQUIPMENT_IMAGE_BY_MODEL['PL-200'];
  if (normalized.includes('PGD-200')) return EQUIPMENT_IMAGE_BY_MODEL['PGD-200'];

  return null;
}

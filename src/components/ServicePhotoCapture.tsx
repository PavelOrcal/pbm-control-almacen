import { Camera, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  compressServicePhoto,
  SERVICE_PHOTO_LABELS,
  type ServicePhotoDraftMap,
  type ServicePhotoKind
} from '../lib/servicePhotos';

const photoKinds: ServicePhotoKind[] = ['antes', 'despues', 'evidencia'];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ServicePhotoCapture({
  photos,
  onChange
}: {
  photos: ServicePhotoDraftMap;
  onChange: (photos: ServicePhotoDraftMap) => void;
}) {
  const cameraInputRefs = useRef<Record<ServicePhotoKind, HTMLInputElement | null>>({
    antes: null,
    despues: null,
    evidencia: null
  });
  const galleryInputRefs = useRef<Record<ServicePhotoKind, HTMLInputElement | null>>({
    antes: null,
    despues: null,
    evidencia: null
  });
  const [loadingKind, setLoadingKind] = useState<ServicePhotoKind | null>(null);
  const [error, setError] = useState('');

  async function handleFile(kind: ServicePhotoKind, file: File | undefined) {
    if (!file) return;
    setLoadingKind(kind);
    setError('');
    try {
      const photo = await compressServicePhoto(file, kind);
      onChange({ ...photos, [kind]: photo });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'No se pudo procesar la foto.');
    } finally {
      setLoadingKind(null);
      const cameraInput = cameraInputRefs.current[kind];
      const galleryInput = galleryInputRefs.current[kind];
      if (cameraInput) cameraInput.value = '';
      if (galleryInput) galleryInput.value = '';
    }
  }

  function removePhoto(kind: ServicePhotoKind) {
    const next = { ...photos };
    delete next[kind];
    onChange(next);
  }

  return (
    <section className="premium-card rounded-lg p-4" data-accent="blue">
      <div className="flex items-start gap-3">
        <div className="rounded-lg border border-pbm-blue/40 bg-pbm-blue/10 p-2 text-pbm-glow shadow-glow">
          <Camera size={20} aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-black text-pbm-text">Evidencia fotografica</h3>
          <p className="mt-1 text-sm leading-relaxed text-pbm-muted">Toma fotos desde camara o selecciona desde galeria. Se comprimen antes de guardar.</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        {photoKinds.map((kind) => {
          const photo = photos[kind];
          const isLoading = loadingKind === kind;
          return (
            <div key={kind} className="rounded-lg border border-pbm-border/80 bg-pbm-bg/45 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-pbm-text">{SERVICE_PHOTO_LABELS[kind]}</p>
                  <p className="text-xs text-pbm-muted">{photo ? `${formatBytes(photo.sizeBytes)} / JPG optimizado` : 'Sin foto capturada'}</p>
                </div>
                {photo ? (
                  <button
                    type="button"
                    onClick={() => removePhoto(kind)}
                    className="pressable inline-flex items-center gap-1.5 rounded-lg border border-pbm-red/40 bg-pbm-red/10 px-2 py-2 text-xs font-black text-pbm-red"
                    aria-label={`Eliminar ${SERVICE_PHOTO_LABELS[kind]}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Quitar
                  </button>
                ) : null}
              </div>

              {photo ? (
                <div className="mt-3 overflow-hidden rounded-lg border border-pbm-blue/25 bg-pbm-card">
                  <img src={photo.dataUrl} alt={photo.label} className="h-44 w-full object-cover" />
                </div>
              ) : (
                <div className="mt-3 flex min-h-28 items-center justify-center rounded-lg border border-dashed border-pbm-border/80 bg-pbm-card/50 text-pbm-muted">
                  {isLoading ? <Loader2 className="animate-spin text-pbm-glow" size={24} aria-hidden="true" /> : <ImagePlus size={24} aria-hidden="true" />}
                </div>
              )}

              <input
                ref={(node) => {
                  cameraInputRefs.current[kind] = node;
                }}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(event) => void handleFile(kind, event.target.files?.[0])}
              />
              <input
                ref={(node) => {
                  galleryInputRefs.current[kind] = node;
                }}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => void handleFile(kind, event.target.files?.[0])}
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => cameraInputRefs.current[kind]?.click()}
                  className="pressable inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-pbm-blue/40 bg-pbm-blue/10 px-3 text-sm font-black text-pbm-glow disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}
                  Camara
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => galleryInputRefs.current[kind]?.click()}
                  className="pressable inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-pbm-border bg-pbm-card/80 px-3 text-sm font-black text-pbm-text disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <ImagePlus size={16} aria-hidden="true" />}
                  Galeria
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {error ? <p className="error-panel mt-3 rounded-lg p-3 text-sm font-bold text-pbm-red">{error}</p> : null}
    </section>
  );
}

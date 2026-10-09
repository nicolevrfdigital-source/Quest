import { ImagePlus, LoaderCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useData } from '../data/context';
import { PHOTO_BUCKET, supabase } from '../lib/supabase';

/** Short-lived signed URL for a private photo, renewed before it expires. */
function useSignedUrl(path: string | null): { url: string | null; error: boolean } {
  const [state, setState] = useState<{ url: string | null; error: boolean }>({ url: null, error: false });
  useEffect(() => {
    if (!path) {
      setState({ url: null, error: false });
      return;
    }
    if (path.startsWith('blob:') || path.startsWith('data:')) {
      setState({ url: path, error: false }); // demo mode
      return;
    }
    let cancelled = false;
    const sign = async () => {
      const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 60 * 60);
      if (!cancelled) setState({ url: data?.signedUrl ?? null, error: Boolean(error) });
    };
    void sign();
    const id = setInterval(sign, 50 * 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [path]);
  return state;
}

export function PhotoWidget() {
  const { settings, uploadPhoto, removePhoto } = useData();
  const { url, error: loadError } = useSignedUrl(settings.photo_path);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<false | 'upload' | 'remove'>(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => input.current?.click();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy('upload');
    try {
      await uploadPhoto(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const onRemove = async () => {
    if (!window.confirm('Remove this photo?')) return;
    setError(null);
    setBusy('remove');
    try {
      await removePhoto();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t remove the photo');
    } finally {
      setBusy(false);
    }
  };

  const hasPhoto = Boolean(settings.photo_path);

  return (
    <section aria-label="Photo" className="relative flex min-h-64 items-stretch justify-center lg:min-h-0">
      <figure className="relative flex w-full max-w-sm flex-col rounded-[10px] bg-white p-3 pb-2 shadow-[var(--shadow-lift)] lg:max-w-none lg:rotate-[1.2deg]">
        <span aria-hidden className="tape bg-lavender" />
        <div className="relative min-h-40 flex-1 overflow-hidden rounded-[4px] bg-cream">
          {hasPhoto && url && <img src={url} alt="My photo" className="absolute inset-0 size-full object-cover" />}
          {hasPhoto && !url && !loadError && (
            <div className="absolute inset-0 grid place-items-center text-muted">
              <LoaderCircle className="size-6 animate-spin" />
            </div>
          )}
          {!hasPhoto && (
            <button
              onClick={pick}
              disabled={Boolean(busy)}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted transition hover:bg-lavender-soft"
            >
              {busy ? <LoaderCircle className="size-7 animate-spin" /> : <ImagePlus className="size-8 text-lavender-deep" />}
              <span className="text-sm font-bold">{busy ? 'Uploading…' : 'Add a photo that makes you smile'}</span>
            </button>
          )}
          {hasPhoto && loadError && (
            <div className="absolute inset-0 grid place-items-center p-3 text-center text-sm font-bold text-muted">Couldn’t load your photo</div>
          )}
          {hasPhoto && (
            <div className="absolute right-2 bottom-2 flex gap-1.5">
              <button
                onClick={pick}
                disabled={Boolean(busy)}
                className="grid size-10 place-items-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition hover:bg-white"
                aria-label="Replace photo"
              >
                {busy === 'upload' ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              </button>
              <button
                onClick={onRemove}
                disabled={Boolean(busy)}
                className="grid size-10 place-items-center rounded-full bg-white/90 text-peach-deep shadow-sm backdrop-blur transition hover:bg-white"
                aria-label="Remove photo"
              >
                {busy === 'remove' ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </button>
            </div>
          )}
        </div>
        <figcaption className="pt-1.5 text-center text-xs font-bold text-muted">
          {error ? <span className="text-peach-deep">{error}</span> : 'my happy place ♡'}
        </figcaption>
        <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
      </figure>
    </section>
  );
}

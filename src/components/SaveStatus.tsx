import { Check, CloudOff, LoaderCircle, RotateCw } from 'lucide-react';
import { useData } from '../data/context';

/** `compact` shows just an icon unless something needs attention. */
export function SaveStatus({ compact = false }: { compact?: boolean }) {
  const { sync, retrySync } = useData();

  if (sync.state === 'error') {
    return (
      <button
        onClick={retrySync}
        className="inline-flex items-center gap-1.5 rounded-full bg-peach-soft px-2.5 py-1 text-xs font-bold text-peach-deep"
        title={sync.error}
      >
        <CloudOff className="size-3.5" />
        {sync.pending} unsaved · {sync.error ?? 'retrying'}
        <RotateCw className="size-3.5" />
        <span className="sr-only">Retry now</span>
      </button>
    );
  }
  if (compact) {
    const saving = sync.state === 'saving';
    return (
      <span
        role="status"
        title={saving ? 'Saving…' : 'All saved'}
        className={`grid size-4 place-items-center rounded-full ${saving ? 'bg-butter-soft text-butter-deep' : 'bg-sage-soft text-sage-deep'}`}
      >
        {saving ? <LoaderCircle className="size-3 animate-spin" /> : <Check className="size-2.5" strokeWidth={3.5} />}
        <span className="sr-only">{saving ? 'Saving…' : 'All saved'}</span>
      </span>
    );
  }
  if (sync.state === 'saving') {
    return (
      <span role="status" className="inline-flex items-center gap-1.5 rounded-full bg-butter-soft px-2.5 py-1 text-xs font-bold text-butter-deep">
        <LoaderCircle className="size-3.5 animate-spin" /> Saving…
      </span>
    );
  }
  return (
    <span role="status" className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-2.5 py-1 text-xs font-bold text-sage-deep">
      <Check className="size-3.5" strokeWidth={3} /> {sync.state === 'saved' ? 'Saved' : 'Synced'}
    </span>
  );
}

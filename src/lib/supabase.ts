import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isConfigured = Boolean(url && key);

export const PHOTO_BUCKET = 'photos';

// Only the public URL and publishable key ever reach the browser; RLS keeps data private.
export const supabase: SupabaseClient = createClient(url || 'http://localhost', key || 'missing-key', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/** Where magic links should land: the app's own URL (works for GitHub Pages project sites). */
export function appUrl(): string {
  return new URL(import.meta.env.BASE_URL, window.location.href).href;
}

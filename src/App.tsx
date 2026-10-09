import type { Session } from '@supabase/supabase-js';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AuthScreen, SetNewPassword } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { DataProvider } from './data/DataProvider';
import { isConfigured, supabase } from './lib/supabase';

export function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (!isConfigured) return;
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      // Arrived via a "reset password" email link.
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!isConfigured) return <NotConfigured />;
  if (session === undefined) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <LoaderCircle className="size-8 animate-spin text-sage-deep" />
      </div>
    );
  }
  if (!session) return <AuthScreen />;
  if (recovering) return <SetNewPassword onDone={() => setRecovering(false)} />;

  return (
    <DataProvider key={session.user.id} userId={session.user.id}>
      <Dashboard email={session.user.email ?? null} onSignOut={() => void supabase.auth.signOut()} />
    </DataProvider>
  );
}

function NotConfigured() {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="card max-w-md p-6">
        <h1 className="text-xl font-extrabold">Almost there ✿</h1>
        <p className="mt-2 text-sm text-muted">
          Quest HQ can’t find valid Supabase settings. Check <code>VITE_SUPABASE_URL</code> (a full address like{' '}
          <code>https://xxxx.supabase.co</code>) and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> — in <code>.env.local</code> locally,
          or in the GitHub repository variables for the published site. Enter only the value, not the name.
        </p>
        {import.meta.env.DEV && (
          <a href="?demo" className="btn mt-4 bg-sage-deep text-white">
            Open the demo preview
          </a>
        )}
      </div>
    </main>
  );
}

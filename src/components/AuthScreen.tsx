import { ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { appUrl, supabase } from '../lib/supabase';
import { Sparkle } from './Card';

type Mode = 'signin' | 'signup' | 'link' | 'reset';

function friendly(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'That email and password don’t match.';
  if (/email not confirmed/i.test(message)) return 'Please confirm your email first — check your inbox for the link.';
  if (/rate limit/i.test(message)) return 'Too many emails sent for now. Please wait a little and try again.';
  return message;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center p-5">
      <div className="card relative w-full max-w-sm p-7 text-center">
        <span aria-hidden className="tape bg-peach" />
        <Sparkle className="mx-auto size-9 text-butter-deep/70" />
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Quest HQ</h1>
        <p className="mt-1 text-sm font-semibold text-muted">Your cozy little headquarters.</p>
        {children}
      </div>
    </main>
  );
}

function Message({ kind, children }: { kind: 'error' | 'info'; children: ReactNode }) {
  return (
    <p
      role={kind === 'error' ? 'alert' : 'status'}
      className={`mt-3 rounded-xl px-3 py-2 text-sm font-bold ${kind === 'error' ? 'bg-peach-soft text-peach-deep' : 'bg-sage-soft text-sage-deep'}`}
    >
      {children}
    </p>
  );
}

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const switchTo = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const addr = email.trim();
    let err: { message: string } | null = null;

    if (mode === 'signin') {
      ({ error: err } = await supabase.auth.signInWithPassword({ email: addr, password }));
    } else if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email: addr, password, options: { emailRedirectTo: appUrl() } });
      err = error;
      if (!error && !data.session) setInfo('Almost there! Check your email and tap the confirmation link, then sign in here.');
    } else if (mode === 'link') {
      ({ error: err } = await supabase.auth.signInWithOtp({ email: addr, options: { emailRedirectTo: appUrl(), shouldCreateUser: false } }));
      if (!err) setInfo('Check your email and tap the link to sign in on this device.');
    } else {
      ({ error: err } = await supabase.auth.resetPasswordForEmail(addr, { redirectTo: appUrl() }));
      if (!err) setInfo('Check your email for a link to choose a new password.');
    }

    setBusy(false);
    if (err) setError(friendly(err.message));
  };

  const needsPassword = mode === 'signin' || mode === 'signup';
  const submitLabel = {
    signin: busy ? 'Signing in…' : 'Sign in',
    signup: busy ? 'Creating…' : 'Create account',
    link: busy ? 'Sending…' : 'Email me a sign-in link',
    reset: busy ? 'Sending…' : 'Send reset link',
  }[mode];

  return (
    <Shell>
      {mode !== 'signin' && (
        <p className="mt-5 text-sm font-extrabold">
          {{ signup: 'Create your account', link: 'Sign in with an email link', reset: 'Reset your password' }[mode]}
        </p>
      )}
      <form onSubmit={submit} className="mt-5 text-left">
        <label htmlFor="email" className="label">Email</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className="field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        {needsPassword && (
          <>
            <label htmlFor="password" className="label mt-3">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={mode === 'signup' ? 8 : undefined}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === 'signup' && <p className="mt-1 text-xs font-semibold text-muted">At least 8 characters.</p>}
          </>
        )}
        <button type="submit" disabled={busy} className="btn mt-4 w-full bg-sage-deep text-white">
          {needsPassword ? <KeyRound className="size-4" /> : <Mail className="size-4" />} {submitLabel}
        </button>
      </form>

      {error && <Message kind="error">{error}</Message>}
      {info && <Message kind="info">{info}</Message>}

      <div className="mt-4 flex flex-col items-center gap-1 text-sm font-bold text-muted">
        {mode === 'signin' ? (
          <>
            <button onClick={() => switchTo('reset')} className="min-h-9 hover:text-ink">Forgot your password?</button>
            <button onClick={() => switchTo('link')} className="min-h-9 hover:text-ink">Email me a sign-in link instead</button>
            <button onClick={() => switchTo('signup')} className="min-h-9 text-sage-deep hover:text-ink">First time here? Create an account</button>
          </>
        ) : (
          <button onClick={() => switchTo('signin')} className="inline-flex min-h-9 items-center gap-1 hover:text-ink">
            <ArrowLeft className="size-4" /> Back to sign in
          </button>
        )}
      </div>
    </Shell>
  );
}

/** Shown after following a password-reset link. */
export function SetNewPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setError(friendly(error.message));
    else onDone();
  };

  return (
    <Shell>
      <p className="mt-5 text-sm font-extrabold">Choose a new password</p>
      <form onSubmit={submit} className="mt-4 text-left">
        <label htmlFor="new-password" className="label">New password</label>
        <input
          id="new-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="mt-1 text-xs font-semibold text-muted">At least 8 characters.</p>
        <button type="submit" disabled={busy} className="btn mt-4 w-full bg-sage-deep text-white">
          <KeyRound className="size-4" /> {busy ? 'Saving…' : 'Save password'}
        </button>
      </form>
      {error && <Message kind="error">{error}</Message>}
    </Shell>
  );
}

import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

// Dev-only: `?demo` renders the dashboard with in-memory sample data (no Supabase needed).
const Demo = import.meta.env.DEV ? lazy(() => import('./dev/Demo')) : null;
const showDemo = Demo !== null && new URLSearchParams(window.location.search).has('demo');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {showDemo && Demo ? (
      <Suspense fallback={null}>
        <Demo />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
  });
}

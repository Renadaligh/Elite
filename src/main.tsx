import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/playfair-display/800.css';
import '@fontsource/playfair-display/900.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/800.css';
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/700.css';
import '@fontsource/tajawal/800.css';
import './index.css';
import App from './App';
import { isStaleFile, reloadOnce } from './lazyPage';

class StartupBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  // an old copy of the site that lost its files after an update: one automatic reload brings the new one
  componentDidCatch(error: unknown) { if (isStaleFile(error)) reloadOnce(); }

  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="startup-fallback startup-error" role="alert">
      <p lang="ar" dir="rtl">تعذّر تشغيل الموقع.</p>
      <p lang="en">The site could not start.</p>
      <button type="button" onClick={() => window.location.reload()}>إعادة التحميل · Reload</button>
    </main>;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><StartupBoundary><App /></StartupBoundary></React.StrictMode>);

// Installable app (PWA): the worker only provides the install prompt and an offline notice.
if ('serviceWorker' in navigator && location.protocol === 'https:') window.addEventListener('load', () => { navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined); });

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

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);

// Remove the loading overlay after React has mounted and the browser has had a chance to paint.
const loader = document.getElementById('app-loader');
if (loader) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      loader.classList.add('is-hidden');
      const removeLoader = () => loader.remove();
      loader.addEventListener('transitionend', (event) => {
        if (event.target === loader && event.propertyName === 'opacity') removeLoader();
      }, { once: true });
      window.setTimeout(removeLoader, 1100);
    });
  });
}

// Installable app (PWA): the worker only provides the install prompt and an offline notice.
if ('serviceWorker' in navigator && location.protocol === 'https:') window.addEventListener('load', () => { navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined); });

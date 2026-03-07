import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

if ('serviceWorker' in navigator) {
  if (isLocalhost) {
    // Prevent stale offline cache from breaking local development screens.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        void registration.unregister();
      });
    });
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          if (key.startsWith('medirescue-')) {
            void caches.delete(key);
          }
        });
      });
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((error) => {
        console.error('Service worker registration failed:', error);
      });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

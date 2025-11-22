import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
// Import PWA registration
import { registerSW } from 'virtual:pwa-register';

// Polyfill process for libraries that might expect it
if (typeof window !== 'undefined' && (window as any).process === undefined) {
  (window as any).process = { env: {} };
}

// Register PWA Service Worker
// This allows the app to work offline and be installed
if (import.meta.env.PROD) {
  registerSW({
    onNeedRefresh() {
      if (confirm('New content available. Reload?')) {
        window.location.reload();
      }
    },
    onOfflineReady() {
      console.log('App is ready to work offline');
    },
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
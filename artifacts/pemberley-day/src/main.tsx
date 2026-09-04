// Suppress benign browser ResizeObserver and empty runtime error events
window.addEventListener('error', (e) => {
  if (
    !e.message ||
    e.message.includes('ResizeObserver') ||
    e.message === 'Script error.'
  ) {
    e.stopImmediatePropagation();
  }
});

import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';
import { initNativeShell } from '@/lib/native';

import './index.css';

void initNativeShell();

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);

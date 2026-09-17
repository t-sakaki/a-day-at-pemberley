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
import { PemberleyProProvider } from '@/hooks/usePemberleyPro';

import './index.css';

void initNativeShell();

// Temporary Phase-1 preview of the 3D walkthrough rewrite (see AGENTS.md's
// "3D化（進行中）"), reached via ?three=1 so the default game (and its
// Playwright coverage) is untouched until later phases replace it for real.
const showThreeDemo = new URLSearchParams(window.location.search).has('three');

const root = createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
});

if (showThreeDemo) {
  void import('./three/Pemberley3DDemo').then(({ default: Pemberley3DDemo }) => {
    root.render(
      <ErrorBoundary>
        <Pemberley3DDemo />
      </ErrorBoundary>,
    );
  });
} else {
  root.render(
    <ErrorBoundary>
      <PemberleyProProvider>
        <App />
      </PemberleyProProvider>
    </ErrorBoundary>,
  );
}

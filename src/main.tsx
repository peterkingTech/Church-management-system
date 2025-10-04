import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Initialize i18n
import './i18n';

// Add error boundary for Sentry issues
window.addEventListener('error', (event) => {
  // Filter out Sentry-related errors that don't affect functionality
  if (event.error?.message?.includes('getReplayId is not a function')) {
    console.warn('Sentry Replay error (non-critical):', event.error.message);
    event.preventDefault(); // Prevent the error from being logged
    return;
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('getReplayId is not a function')) {
    console.warn('Sentry Replay promise rejection (non-critical):', event.reason.message);
    event.preventDefault();
    return;
  }
});
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
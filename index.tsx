import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Suppress benign ResizeObserver loop errors that often occur with React Flow / Resizable panels
const resizeErrorMessages = [
  'ResizeObserver loop completed with undelivered notifications.',
  'ResizeObserver loop limit exceeded'
];

window.addEventListener('error', (e) => {
  if (resizeErrorMessages.some(msg => e.message.includes(msg))) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

// Also patch console.error to filter out these errors if logged by frameworks
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const firstArg = args[0];
  if (
    (typeof firstArg === 'string' && resizeErrorMessages.some(msg => firstArg.includes(msg))) ||
    (firstArg instanceof Error && resizeErrorMessages.some(msg => firstArg.message.includes(msg)))
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
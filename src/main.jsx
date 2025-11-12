import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializeAccessibility } from './utils/accessibilityInit.js'

// Initialize accessibility features before React renders
initializeAccessibility();

// Handle chunk load errors globally (for dynamic imports that fail after deployment)
window.addEventListener('error', (event) => {
  if (
    event.message?.includes('Failed to fetch dynamically imported module') ||
    event.message?.includes('Loading chunk') ||
    event.message?.includes('Loading CSS chunk') ||
    event.error?.name === 'ChunkLoadError'
  ) {
    // Prevent default error handling
    event.preventDefault();
    // Reload the page to get fresh assets
    console.log('Chunk load error detected. Reloading page...');
    setTimeout(() => {
      window.location.reload(true);
    }, 100);
  }
});

// Also handle unhandled promise rejections for chunk errors
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.message?.includes('Failed to fetch dynamically imported module') ||
    event.reason?.message?.includes('Loading chunk') ||
    event.reason?.message?.includes('Loading CSS chunk') ||
    event.reason?.name === 'ChunkLoadError'
  ) {
    // Prevent default error handling
    event.preventDefault();
    console.log('Chunk load error detected in promise. Reloading page...');
    setTimeout(() => {
      window.location.reload(true);
    }, 100);
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

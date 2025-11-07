import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Initialize accessibility features on page load
// This ensures preferences are applied before React renders
(function initializeAccessibility() {
  // Load high contrast mode
  const savedHighContrast = localStorage.getItem('highContrastMode');
  if (savedHighContrast === 'true') {
    document.body.classList.add('high-contrast');
  }

  // Load font size - check new key first, then fall back to old numeric key for backward compatibility
  const fontSizeMap = {
    small: 12,
    normal: 16,
    large: 22,
  };
  
  const savedTextSize = localStorage.getItem('accessibilityTextSize');
  if (savedTextSize && ['small', 'normal', 'large'].includes(savedTextSize)) {
    // Use new text size preference
    document.documentElement.style.fontSize = `${fontSizeMap[savedTextSize]}px`;
  } else {
    // Fall back to old numeric font size for backward compatibility
    const savedFontSize = localStorage.getItem('accessibilityFontSize');
    if (savedFontSize) {
      const size = parseInt(savedFontSize, 10);
      if (size >= 12 && size <= 24) {
        document.documentElement.style.fontSize = `${size}px`;
        // Migrate old value to new format - map to closest option
        if (size <= 13) {
          localStorage.setItem('accessibilityTextSize', 'small');
          document.documentElement.style.fontSize = `${fontSizeMap.small}px`;
        } else if (size <= 19) {
          localStorage.setItem('accessibilityTextSize', 'normal');
          document.documentElement.style.fontSize = `${fontSizeMap.normal}px`;
        } else {
          localStorage.setItem('accessibilityTextSize', 'large');
          document.documentElement.style.fontSize = `${fontSizeMap.large}px`;
        }
      }
    } else {
      // Default to normal
      document.documentElement.style.fontSize = `${fontSizeMap.normal}px`;
    }
  }
})();

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

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
    large: 20,
  };
  
  // Update CSS variables based on selected text size
  const updateCSSVariables = (baseSize) => {
    const root = document.documentElement;
    const multiplier = baseSize / 16; // 16px is the default base size
    
    // Update all CSS custom properties for text sizes
    root.style.setProperty('--text-xl', `${36 * multiplier}px`);
    root.style.setProperty('--text-xl-med', `${32 * multiplier}px`);
    root.style.setProperty('--text-lg', `${28 * multiplier}px`);
    root.style.setProperty('--text-lg-med', `${24 * multiplier}px`);
    root.style.setProperty('--text-med', `${20 * multiplier}px`);
    root.style.setProperty('--text-base-med', `${18 * multiplier}px`);
    root.style.setProperty('--text-base', `${16 * multiplier}px`);
    root.style.setProperty('--text-sm', `${14 * multiplier}px`);
    root.style.setProperty('--text-xs', `${12 * multiplier}px`);
  };
  
  const savedTextSize = localStorage.getItem('accessibilityTextSize');
  if (savedTextSize && ['small', 'normal', 'large'].includes(savedTextSize)) {
    // Use new text size preference
    const size = fontSizeMap[savedTextSize];
    document.documentElement.style.fontSize = `${size}px`;
    updateCSSVariables(size);
  } else {
    // Fall back to old numeric font size for backward compatibility
    const savedFontSize = localStorage.getItem('accessibilityFontSize');
    if (savedFontSize) {
      const size = parseInt(savedFontSize, 10);
      if (size >= 12 && size <= 24) {
        document.documentElement.style.fontSize = `${size}px`;
        updateCSSVariables(size);
        // Migrate old value to new format - map to closest option
        if (size <= 13) {
          localStorage.setItem('accessibilityTextSize', 'small');
          const newSize = fontSizeMap.small;
          document.documentElement.style.fontSize = `${newSize}px`;
          updateCSSVariables(newSize);
        } else if (size <= 19) {
          localStorage.setItem('accessibilityTextSize', 'normal');
          const newSize = fontSizeMap.normal;
          document.documentElement.style.fontSize = `${newSize}px`;
          updateCSSVariables(newSize);
        } else {
          localStorage.setItem('accessibilityTextSize', 'large');
          const newSize = fontSizeMap.large;
          document.documentElement.style.fontSize = `${newSize}px`;
          updateCSSVariables(newSize);
        }
      }
    } else {
      // Default to normal
      const defaultSize = fontSizeMap.normal;
      document.documentElement.style.fontSize = `${defaultSize}px`;
      updateCSSVariables(defaultSize);
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

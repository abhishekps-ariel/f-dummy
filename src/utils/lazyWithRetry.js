import { lazy } from 'react';

/**
 * Lazy load a component with retry logic for failed module loads
 * This is especially useful after deployments when old chunks may be cached
 * 
 * @param {Function} importFunc - The import function (e.g., () => import('./Component'))
 * @param {number} retries - Number of retry attempts (default: 3)
 * @param {number} delay - Delay between retries in ms (default: 1000)
 * @returns {Promise} - Promise that resolves to the component
 */
const lazyWithRetry = (importFunc, retries = 3, delay = 1000) => {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const attemptImport = (attemptNumber) => {
        importFunc()
          .then(resolve)
          .catch((error) => {
            // Check if it's a chunk/module load error
            const isChunkError = 
              error?.message?.includes('Failed to fetch dynamically imported module') ||
              error?.message?.includes('Loading chunk') ||
              error?.message?.includes('Loading CSS chunk') ||
              error?.name === 'ChunkLoadError';

            if (isChunkError && attemptNumber < retries) {
              // Clear cache and retry
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name));
                });
              }
              
              console.warn(`Module load failed, retrying... (${attemptNumber}/${retries})`);
              setTimeout(() => {
                attemptImport(attemptNumber + 1);
              }, delay * attemptNumber); // Exponential backoff
            } else {
              // If not a chunk error or max retries reached, reject
              reject(error);
            }
          });
      };

      attemptImport(1);
    });
  });
};

export default lazyWithRetry;


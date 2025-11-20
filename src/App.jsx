import './App.css';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { Suspense, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { PetitionWizardProvider } from './context/PetitionWizardContext';
import { router } from './routes/routes';
import LoadingFallback from './components/shared/LoadingFallback';
import ErrorBoundary from './components/shared/ErrorBoundary';

function App() {
  // Disable browser scroll restoration globally
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <PetitionWizardProvider>
          <div className="app-container">
            <div className="main-content">
              <ToastContainer position="top-right" autoClose={3000} />
              <Suspense fallback={<LoadingFallback />}>
                <RouterProvider router={router} />
              </Suspense>
            </div>
          </div>
        </PetitionWizardProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

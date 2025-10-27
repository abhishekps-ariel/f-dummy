import './App.css';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { PetitionWizardProvider } from './context/PetitionWizardContext';
import { router } from './routes/routes';
import LoadingFallback from './components/shared/LoadingFallback';

function App() {
  return (
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
  );
}

export default App;

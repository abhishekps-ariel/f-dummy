import './App.css';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { router } from './routes/routes';
import LoadingFallback from './components/LoadingFallback';

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <div className="main-content">
          <ToastContainer position="top-right" autoClose={3000} />
          <Suspense fallback={<LoadingFallback />}>
            <RouterProvider router={router} />
          </Suspense>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;

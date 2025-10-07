import './App.css';
import { useCookies } from "react-cookie";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { Suspense, lazy } from 'react';
import LoadingFallback from './components/LoadingFallback';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Auth/Login'));
const PageNotFound = lazy(() => import('./components/PageNotFound'));

function App() {
  const [cookies] = useCookies(["FilirAuthentication"]);
  const isAuthenticated = !!cookies.FilirAuthentication;

  return (
    <Router>
      <div className="app-container">
        {isAuthenticated}
        <div className="main-content">
          <ToastContainer position="top-right" autoClose={3000} />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Login />} />
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </Router>
  );
}

export default App;

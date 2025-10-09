import './App.css';
import { useCookies } from "react-cookie";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { Suspense, lazy } from 'react';
import LoadingFallback from './components/LoadingFallback';

// Lazy load main pages
const Home = lazy(() => import('./pages/Home'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const PasswordEmailSent = lazy(() => import('./pages/Auth/PasswordEmailSent'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));
const PasswordChanged = lazy(() => import('./pages/Auth/PasswordChanged'));
const TwoFactorAuth = lazy(() => import('./pages/Auth/TwoFactorAuth'));
const VerificationPage = lazy(() => import('./pages/Auth/VerificationPage'));
const VerificationEmailSent = lazy(() => import('./pages/Auth/VerificationEmailSent'));
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
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/password-email-sent" element={<PasswordEmailSent />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/password-changed" element={<PasswordChanged />} />
              <Route path="/two-factor-auth" element={<TwoFactorAuth />} />
              <Route path="/verification-page/:token" element={<VerificationPage />} />
              <Route path="/verification-page" element={<VerificationPage />} />
              <Route path="/verification-email-sent" element={<VerificationEmailSent />} />
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </Router>
  );
}

export default App;

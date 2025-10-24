import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../layout/Layout';
import { ROUTES } from '../constants/routerConstants';

const Home = lazy(() => import('../pages/Home'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Profile = lazy(() => import('../pages/Profile'));
const Petitions = lazy(() => import('../pages/Petitions'));
const Messages = lazy(() => import('../pages/Messages'));
const FAQ = lazy(() => import('../pages/FAQ'));
const Training = lazy(() => import('../pages/Training'));
const Login = lazy(() => import('../pages/Auth/Login'));
const Register = lazy(() => import('../pages/Auth/Register'));
const ForgotPassword = lazy(() => import('../pages/Auth/ForgotPassword'));
const PasswordEmailSent = lazy(() => import('../pages/Auth/PasswordEmailSent'));
const SetNewPassword = lazy(() => import('../pages/Auth/SetNewPassword'));
const PasswordChanged = lazy(() => import('../pages/Auth/PasswordChanged'));
const TwoFactorAuth = lazy(() => import('../pages/Auth/TwoFactorAuth'));
const VerificationPage = lazy(() => import('../pages/Auth/VerificationPage'));
const VerificationEmailSent = lazy(() => import('../pages/Auth/VerificationEmailSent'));
const PageNotFound = lazy(() => import('../components/shared/PageNotFound'));

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <Home />,
  },
  {
    path: ROUTES.LOGIN,
    element: <Login />,
  },
  {
    path: ROUTES.REGISTER,
    element: <Register />,
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: <ForgotPassword />,
  },
  {
    path: ROUTES.PASSWORD_EMAIL_SENT,
    element: <PasswordEmailSent />,
  },
  {
    path: `${ROUTES.SET_NEW_PASSWORD}/:token?`,
    element: <SetNewPassword />,
  },
  {
    path: ROUTES.PASSWORD_CHANGED,
    element: <PasswordChanged />,
  },
  {
    path: ROUTES.TWO_FACTOR_AUTH,
    element: <TwoFactorAuth />,
  },
  {
    path: `${ROUTES.VERIFICATION_PAGE}/:token?`,
    element: <VerificationPage />,
  },
  {
    path: ROUTES.VERIFICATION_EMAIL_SENT,
    element: <VerificationEmailSent />,
  },
  {
    path: ROUTES.DASHBOARD,
    element: (
      <Layout>
        <Dashboard />
      </Layout>
    ),
  },
  {
    path: ROUTES.PROFILE,
    element: (
      <Layout>
        <Profile />
      </Layout>
    ),
  },
  {
    path: ROUTES.PETITIONS,
    element: (
      <Layout>
        <Petitions />
      </Layout>
    ),
  },
  {
    path: ROUTES.MESSAGES,
    element: (
      <Layout>
        <Messages />
      </Layout>
    ),
  },
  {
    path: ROUTES.FAQ,
    element: (
      <Layout>
        <FAQ />
      </Layout>
    ),
  },
  {
    path: ROUTES.TRAINING,
    element: (
      <Layout>
        <Training />
      </Layout>
    ),
  },
  {
    path: ROUTES.NOT_FOUND,
    element: <PageNotFound />,
  },
]);

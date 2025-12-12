import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../layout/Layout';
import RouteGuard from './RouteGuard';
import { ROUTES } from '../constants/routerConstants';
import RouteError from '../components/shared/RouteError';
import lazyWithRetry from '../utils/lazyWithRetry';

// Use lazyWithRetry for better error handling on module load failures
const Home = lazyWithRetry(() => import('../pages/Home'));
const Dashboard = lazyWithRetry(() => import('../pages/Dashboard'));
const Profile = lazyWithRetry(() => import('../pages/Profile'));
const Petitions = lazyWithRetry(() => import('../pages/Petitions'));
const PublicPetitions = lazyWithRetry(() => import('../pages/PublicPetitions'));
const Messages = lazyWithRetry(() => import('../pages/Messages'));
const FAQ = lazyWithRetry(() => import('../pages/FAQ'));
const Training = lazyWithRetry(() => import('../pages/Training'));
const Form35 = lazyWithRetry(() => import('../pages/Form35'));
const EmailLogs = lazyWithRetry(() => import('../pages/EmailLogs'));
const Login = lazyWithRetry(() => import('../pages/Auth/Login'));
const Register = lazyWithRetry(() => import('../pages/Auth/Register'));
const ForgotPassword = lazyWithRetry(() => import('../pages/Auth/ForgotPassword'));
const PasswordEmailSent = lazyWithRetry(() => import('../pages/Auth/PasswordEmailSent'));
const SetNewPassword = lazyWithRetry(() => import('../pages/Auth/SetNewPassword'));
const PasswordChanged = lazyWithRetry(() => import('../pages/Auth/PasswordChanged'));
const TwoFactorAuth = lazyWithRetry(() => import('../pages/Auth/TwoFactorAuth'));
const VerificationPage = lazyWithRetry(() => import('../pages/Auth/VerificationPage'));
const VerificationEmailSent = lazyWithRetry(() => import('../pages/Auth/VerificationEmailSent'));
const ImpersonationRequest = lazyWithRetry(() => import('../pages/Auth/ImpersonationRequest'));
const PageNotFound = lazyWithRetry(() => import('../components/shared/PageNotFound'));

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: (
      <RouteGuard>
        <Home />
      </RouteGuard>
    ),
    errorElement: <RouteError />,
  },
  {
    path: ROUTES.PUBLIC_PETITIONS,
    element: <PublicPetitions />,
    errorElement: <RouteError />,
  },
  {
    path: ROUTES.LOGIN,
    element: <Login />,
    errorElement: <RouteError />,
  },
  {
    path: ROUTES.REGISTER,
    element: <Register />,
    errorElement: <RouteError />,
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: <ForgotPassword />,
    errorElement: <RouteError />,
  },
  {
    path: ROUTES.PASSWORD_EMAIL_SENT,
    element: <PasswordEmailSent />,
    errorElement: <RouteError />,
  },
  {
    path: `${ROUTES.SET_NEW_PASSWORD}/:token?`,
    element: <SetNewPassword />,
    errorElement: <RouteError />,
  },
  {
    path: ROUTES.PASSWORD_CHANGED,
    element: <PasswordChanged />,
    errorElement: <RouteError />,
  },
  {
    path: ROUTES.TWO_FACTOR_AUTH,
    element: <TwoFactorAuth />,
    errorElement: <RouteError />,
  },
  {
    path: `${ROUTES.VERIFICATION_PAGE}/:token?`,
    element: <VerificationPage />,
    errorElement: <RouteError />,
  },
  {
    path: ROUTES.VERIFICATION_EMAIL_SENT,
    element: <VerificationEmailSent />,
    errorElement: <RouteError />,
  },
  {
    path: ROUTES.REQUEST_IMPERSONATE_USER,
    element: <ImpersonationRequest />,
    errorElement: <RouteError />,
  },
  {
    path: ROUTES.DASHBOARD,
    element: (
      <Layout>
        <Dashboard />
      </Layout>
    ),
    errorElement: <RouteError />,
  },
  {
    path: ROUTES.PROFILE,
    element: (
      <Layout>
        <Profile />
      </Layout>
    ),
    errorElement: <RouteError />,
  },
  {
    path: ROUTES.PETITIONS,
    element: (
      <Layout>
        <Petitions />
      </Layout>
    ),
    errorElement: <RouteError />,
  },
  {
    path: ROUTES.MESSAGES,
    element: (
      <Layout>
        <Messages />
      </Layout>
    ),
    errorElement: <RouteError />,
  },
  {
    path: ROUTES.FAQ,
    element: (
      <Layout>
        <FAQ />
      </Layout>
    ),
    errorElement: <RouteError />,
  },
  {
    path: ROUTES.TRAINING,
    element: (
      <Layout>
        <Training />
      </Layout>
    ),
    errorElement: <RouteError />,
  },
  {
    path: ROUTES.FORM35,
    element: (
      <Layout>
        <Form35 />
      </Layout>
    ),
    errorElement: <RouteError />,
  },
  {
    path: ROUTES.EMAIL_LOGS,
    element: (
      <Layout>
        <EmailLogs />
      </Layout>
    ),
    errorElement: <RouteError />,
  },
  {
    path: ROUTES.NOT_FOUND,
    element: <PageNotFound />,
    errorElement: <RouteError />,
  },
]);

import { createBrowserRouter } from 'react-router';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import UserDashboard from './pages/UserDashboard';
import RecyclerDashboard from './pages/RecyclerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFoundPage from './pages/NotFoundPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LoginPage,
  },
  {
    path: '/register',
    Component: RegisterPage,
  },
  {
    path: '/user',
    Component: UserDashboard,
  },
  {
    path: '/recycler',
    Component: RecyclerDashboard,
  },
  {
    path: '/admin',
    Component: AdminDashboard,
  },
  {
    path: '/super-admin',
    Component: SuperAdminDashboard,
  },
  {
    path: '/auth/verify-email/:token',
    Component: VerifyEmailPage,
  },
  {
    path: '*',
    Component: NotFoundPage,
  },
]);

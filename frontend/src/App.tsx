import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/Toast';
import { RequireAdmin, RequireGuest } from '@/components/RouteGuards';
import RoomLoginPage from '@/pages/RoomLoginPage';
import AdminLoginPage from '@/pages/AdminLoginPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import ChatRoomPage from '@/pages/ChatRoomPage';
import ErrorPage from '@/pages/ErrorPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RoomLoginPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/chat/:roomCode',
    element: <RoomLoginPage />,
  },
  {
    path: '/chat/:roomCode/room',
    element: (
      <RequireGuest>
        <ChatRoomPage />
      </RequireGuest>
    ),
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin/dashboard',
    element: (
      <RequireAdmin>
        <AdminDashboardPage />
      </RequireAdmin>
    ),
  },
  {
    path: '/admin',
    element: <Navigate to="/admin/dashboard" replace />,
  },
  {
    path: '*',
    element: <ErrorPage />,
  },
]);

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

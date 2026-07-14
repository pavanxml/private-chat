import { Navigate } from 'react-router-dom';
import { type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (!session || session.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}

export function RequireGuest({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (!session || session.role !== 'guest') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

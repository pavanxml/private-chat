import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Role } from '@/types';

interface AdminSession {
  role: 'admin';
  token: string;
  username: string;
}

interface GuestSession {
  role: 'guest';
  token: string;
  username: string;
  roomId: number;
  roomCode: string;
  roomName: string;
}

type Session = AdminSession | GuestSession | null;

interface AuthContextValue {
  session: Session;
  isAdmin: boolean;
  isGuest: boolean;
  loginAdmin: (token: string, username: string) => void;
  loginGuest: (params: { token: string; username: string; roomId: number; roomCode: string; roomName: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'pc_session';
const TOKEN_KEY = 'pc_token';

function loadSession(): Session {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (!raw || !token) return null;
    const parsed = JSON.parse(raw) as Omit<AdminSession | GuestSession, 'token'>;
    return { ...parsed, token } as Session;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(() => loadSession());

  const persist = useCallback((next: Session) => {
    if (!next) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
      setSession(null);
      return;
    }
    const { token, ...rest } = next;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    setSession(next);
  }, []);

  const loginAdmin = useCallback(
    (token: string, username: string) => {
      persist({ role: 'admin', token, username });
    },
    [persist]
  );

  const loginGuest = useCallback(
    (params: { token: string; username: string; roomId: number; roomCode: string; roomName: string }) => {
      persist({ role: 'guest', ...params });
    },
    [persist]
  );

  const logout = useCallback(() => {
    persist(null);
  }, [persist]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAdmin: session?.role === ('admin' as Role),
      isGuest: session?.role === ('guest' as Role),
      loginAdmin,
      loginGuest,
      logout,
    }),
    [session, loginAdmin, loginGuest, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

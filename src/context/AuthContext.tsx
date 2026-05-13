import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { auth, saveTokens, clearTokens, isLoggedIn, setForceLogout, type AuthUser } from '../services/api';

interface AuthContextValue {
  user: AuthUser | null;
  loggedIn: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, password2: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Parameters<typeof auth.updateMe>[0]) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await auth.logout();
    setUser(null);
  }, []);

  // Register the force-logout callback so the API interceptor can trigger it
  useEffect(() => {
    setForceLogout(() => setUser(null));
  }, []);

  // Restore session on mount
  useEffect(() => {
    if (!isLoggedIn()) { setLoading(false); return; }
    auth.me()
      .then(setUser)
      .catch(() => { clearTokens(); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await auth.login(username, password);
    saveTokens(data.access, data.refresh);
    const me = await auth.me();
    setUser(me);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string, password2: string) => {
    const data = await auth.register(username, email, password, password2);
    saveTokens(data.access, data.refresh);
    setUser(data.user);
  }, []);

  const updateUser = useCallback(async (data: Parameters<typeof auth.updateMe>[0]) => {
    const updated = await auth.updateMe(data);
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loggedIn: !!user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

import { createContext, useContext, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const session = useAuthStore((state) => state.session);
  const value = useMemo(() => ({ session }), [session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

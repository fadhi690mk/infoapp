import React, { createContext, useContext, useState } from "react";
import * as api from "../services/api";

type User = { id: number; name: string; email: string; role: string } | null;

type AuthContextValue = {
  user: User;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phoneOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const u = await api.getStoredUser();
    setUser(u);
  };

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await api.getStoredUser();
      if (!cancelled) {
        setUser(u);
      }
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (phoneOrEmail: string, password: string) => {
    const data = await api.login(phoneOrEmail, password);
    await api.setAuth(data.access, data.refresh, data.user);
    setUser(data.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchProfile, logout as logoutService } from '../services/auth';
import { getAccessToken, getRefreshToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken() && !getRefreshToken()) {
      setUser(null);
      setLoading(false);
      return null;
    }

    setLoading(true);

    try {
      const profile = await fetchProfile();
      setUser(profile);
      return profile;
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) {
        logoutService();
      }
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setLoading(false);
    };

    const handleStorage = (event) => {
      if (!['auth_token', 'auth_refresh'].includes(event.key)) return;
      if (!getAccessToken() && !getRefreshToken()) {
        handleLogout();
        return;
      }
      refreshUser();
    };

    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshUser]);

  const logout = useCallback(() => {
    logoutService();
    setUser(null);
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, loading, logout, refreshUser }),
    [user, loading, logout, refreshUser],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}

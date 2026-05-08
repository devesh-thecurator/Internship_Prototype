import { useEffect, useState } from 'react';
import { fetchProfile, logout as logoutService } from '../services/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetchProfile()
      .then((data) => setUser(data))
      .catch(() => {
        logoutService();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    logoutService();
    setUser(null);
  };

  return { user, setUser, loading, logout };
}

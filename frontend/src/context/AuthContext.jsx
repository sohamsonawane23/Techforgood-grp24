import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // On first load, if we have a saved token, verify it's still valid by
  // asking the backend who it belongs to (rather than just trusting
  // whatever's cached in localStorage forever).
  useEffect(() => {
    const token = localStorage.getItem('civiccare_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/api/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('civiccare_token');
        localStorage.removeItem('civiccare_user');
      })
      .finally(() => setLoading(false));
  }, []);

  // If a request comes back 401 at any point after that initial check
  // (most commonly: the backend process restarted and issued a new
  // JWT_SECRET_KEY, invalidating every previously-issued token), the
  // api.js interceptor fires this event. We clear the stale `user` here
  // so the UI immediately reflects "logged out" instead of continuing
  // to show the person's name while every action actually goes through
  // as anonymous behind the scenes.
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setSessionExpired(true);
    };
    window.addEventListener('civiccare:session-expired', handleSessionExpired);
    return () => window.removeEventListener('civiccare:session-expired', handleSessionExpired);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('civiccare_token', res.data.access_token);
    setUser(res.data.user);
    setSessionExpired(false);
    return res.data.user;
  };

  const signup = async (name, email, password) => {
    const res = await api.post('/api/auth/signup', { name, email, password });
    localStorage.setItem('civiccare_token', res.data.access_token);
    setUser(res.data.user);
    setSessionExpired(false);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('civiccare_token');
    setUser(null);
    setSessionExpired(false);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAdmin, sessionExpired }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

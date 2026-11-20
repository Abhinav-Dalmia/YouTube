import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('yt_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me').then(({ data }) => setUser(data.user)).catch(() => localStorage.removeItem('yt_token')).finally(() => setLoading(false));
  }, []);
  const authenticate = async (endpoint, payload) => {
    const { data } = await api.post(`/auth/${endpoint}`, payload);
    localStorage.setItem('yt_token', data.token);
    setUser(data.user);
    return data.user;
  };
  const login = (payload) => authenticate('login', payload);
  const register = (payload) => authenticate('register', payload);
  const logout = () => { localStorage.removeItem('yt_token'); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api.js';
import { AuthContext } from './AuthContextValue.jsx';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate session on load
  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch (error) {
          console.error('Session validation failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    checkToken();
  }, []);

  // Login handler
  const login = useCallback(async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      const { token, ...userData } = res.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return userData;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed. Please check credentials.';
      throw new Error(errorMsg);
    }
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  // Fetch fresh stats/XP/streaks from backend
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      return res.data;
    } catch (error) {
      console.error('Error refreshing profile info:', error);
    }
  }, []);

  // Memoize context value object to prevent unnecessary renders for descendants
  const contextValue = useMemo(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  }), [user, loading, login, logout, refreshUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

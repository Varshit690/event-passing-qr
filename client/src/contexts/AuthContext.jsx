import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('eventora-token');
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('eventora-user', JSON.stringify(res.data.user));
      }
    } catch (e) {
      // Silently keep current state if transient network error
    }
  };

  // Restore authenticated session on initial mount from verified backend token
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('eventora-token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('eventora-user', JSON.stringify(res.data.user));
          } else {
            throw new Error('Invalid session');
          }
        } catch (e) {
          localStorage.removeItem('eventora-token');
          localStorage.removeItem('eventora-user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const login = async (email, password, portal) => {
    setIsLoading(true);
    try {
      const payload = { email, password };
      if (portal) {
        payload.portal = portal;
      }
      const res = await api.post('/auth/login', payload);
      if (res.data?.success && res.data.token) {
        localStorage.setItem('eventora-token', res.data.token);
        localStorage.setItem('eventora-user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data.user;
      } else {
        throw new Error(res.data?.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      if (res.data?.success && res.data.token) {
        localStorage.setItem('eventora-token', res.data.token);
        localStorage.setItem('eventora-user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data.user;
      } else {
        throw new Error(res.data?.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signupOrganizer = async (name, email, password, organizationName, contactPhone) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register-organizer', {
        name,
        email,
        password,
        organizationName,
        contactPhone,
      });
      if (res.data?.success && res.data.token) {
        localStorage.setItem('eventora-token', res.data.token);
        localStorage.setItem('eventora-user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data.user;
      } else {
        throw new Error(res.data?.message || 'Organizer registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Continue client cleanup even if network fails
    }
    localStorage.removeItem('eventora-token');
    localStorage.removeItem('eventora-user');
    localStorage.removeItem('eventora-tickets');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        signupOrganizer,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

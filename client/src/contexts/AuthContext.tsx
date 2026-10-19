import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, portal?: 'ATTENDEE' | 'ORGANIZER' | 'ADMIN') => Promise<User>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  signupOrganizer: (
    name: string,
    email: string,
    password: string,
    organizationName: string,
    contactPhone: string
  ) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  const login = async (
    email: string,
    password: string,
    portal?: 'ATTENDEE' | 'ORGANIZER' | 'ADMIN'
  ): Promise<User> => {
    setIsLoading(true);
    try {
      const payload: any = { email, password };
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

  const signup = async (name: string, email: string, password: string): Promise<User> => {
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

  const signupOrganizer = async (
    name: string,
    email: string,
    password: string,
    organizationName: string,
    contactPhone: string
  ): Promise<User> => {
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

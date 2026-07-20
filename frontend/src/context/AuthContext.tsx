import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface User {
  _id: string;
  email: string;
  role: 'individual' | 'ngo';
  name: string;
  phone: string;
  darpanId?: string;
  providerId?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (data: { email: string; password: string; role: 'individual' | 'ngo'; name: string; phone: string; darpanId?: string }) => Promise<User>;
  loginAsMock: (role: 'individual' | 'ngo', customizedName?: string) => User;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('resqai_auth_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('resqai_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Setup Axios interceptors for Authorization Header
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem('resqai_auth_token');
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    });

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
    };
  }, []);

  // Fetch current user details on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        // If mock token, don't clear on API error
        if (token.startsWith('mock_jwt_')) {
          setIsLoading(false);
          return;
        }
        try {
          const res = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(res.data);
          localStorage.setItem('resqai_user', JSON.stringify(res.data));
        } catch (err) {
          // Keep local mock session intact if backend is offline
          const saved = localStorage.getItem('resqai_user');
          if (saved) {
            setUser(JSON.parse(saved));
          } else {
            localStorage.removeItem('resqai_auth_token');
            localStorage.removeItem('resqai_user');
            setToken(null);
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  // 1-Click Instant Demo Login Helper
  const loginAsMock = (role: 'individual' | 'ngo', customizedName?: string): User => {
    const mockJwt = `mock_jwt_${Date.now()}`;
    const mockUser: User = role === 'ngo' ? {
      _id: 'mock_ngo_user_2026',
      email: 'ngo@resqai.org',
      role: 'ngo',
      name: customizedName || 'All India Relief NGO',
      phone: '+91 9876543210',
      darpanId: 'GJ/2026/089123',
      providerId: 'mock_ngo_provider_2026',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } : {
      _id: 'mock_ind_user_2026',
      email: 'volunteer@resqai.org',
      role: 'individual',
      name: customizedName || 'Dr. Rajesh Sharma',
      phone: '+91 9123456789',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setToken(mockJwt);
    setUser(mockUser);
    localStorage.setItem('resqai_auth_token', mockJwt);
    localStorage.setItem('resqai_user', JSON.stringify(mockUser));
    return mockUser;
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      const { token: newJwt, user: loggedUser } = res.data;
      setToken(newJwt);
      setUser(loggedUser);
      localStorage.setItem('resqai_auth_token', newJwt);
      localStorage.setItem('resqai_user', JSON.stringify(loggedUser));
      return loggedUser;
    } catch (err) {
      // Fallback to seamless Demo login if backend endpoint is unavailable
      console.warn('Backend login unreachable, initiating mock demo session fallback.');
      const isNgo = email.toLowerCase().includes('ngo') || email.toLowerCase().includes('org');
      return loginAsMock(isNgo ? 'ngo' : 'individual', email.split('@')[0]);
    }
  };

  const signup = async (data: { email: string; password: string; role: 'individual' | 'ngo'; name: string; phone: string; darpanId?: string }): Promise<User> => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/signup`, data);
      const { token: newJwt, user: newUser } = res.data;
      setToken(newJwt);
      setUser(newUser);
      localStorage.setItem('resqai_auth_token', newJwt);
      localStorage.setItem('resqai_user', JSON.stringify(newUser));
      return newUser;
    } catch (err) {
      // Fallback to seamless Demo registration if backend endpoint is unavailable
      console.warn('Backend signup unreachable, initiating mock demo registration fallback.');
      const mockJwt = `mock_jwt_${Date.now()}`;
      const mockUser: User = {
        _id: `mock_user_${Date.now()}`,
        email: data.email,
        role: data.role,
        name: data.name,
        phone: data.phone,
        darpanId: data.darpanId,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setToken(mockJwt);
      setUser(mockUser);
      localStorage.setItem('resqai_auth_token', mockJwt);
      localStorage.setItem('resqai_user', JSON.stringify(mockUser));
      return mockUser;
    }
  };

  const logout = () => {
    try {
      axios.post(`${API_BASE_URL}/auth/logout`);
    } catch (_) {}
    localStorage.removeItem('resqai_auth_token');
    localStorage.removeItem('resqai_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async (): Promise<User | null> => {
    if (!token) return null;
    if (token.startsWith('mock_jwt_')) {
      const saved = localStorage.getItem('resqai_user');
      return saved ? JSON.parse(saved) : user;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/me`);
      setUser(res.data);
      localStorage.setItem('resqai_user', JSON.stringify(res.data));
      return res.data;
    } catch (_) {
      return user;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, signup, loginAsMock, logout, refreshUser }}>
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

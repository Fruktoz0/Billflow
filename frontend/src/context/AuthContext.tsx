import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Household } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  household: Household | null;
  members: User[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, code?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshMe = async () => {
    try {
      const data = await api.auth.getMe();
      setUser(data.user);
      setHousehold(data.household);
      setMembers(data.members || []);
    } catch (err) {
      setUser(null);
      setHousehold(null);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.auth.login({ email, password: pass });
    if (res.token) {
      localStorage.setItem('billflow_token', res.token);
    }
    setUser(res.user);
    setHousehold(res.household);
    await refreshMe();
  };

  const register = async (email: string, pass: string, name: string, code?: string) => {
    const res = await api.auth.register({ email, password: pass, displayName: name, inviteCode: code });
    if (res.token) {
      localStorage.setItem('billflow_token', res.token);
    }
    setUser(res.user);
    setHousehold(res.household);
    await refreshMe();
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      // ignore
    }
    localStorage.removeItem('billflow_token');
    setUser(null);
    setHousehold(null);
    setMembers([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        household,
        members,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshMe
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

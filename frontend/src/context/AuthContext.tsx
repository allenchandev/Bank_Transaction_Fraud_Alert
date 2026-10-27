'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthUser {
  role: 'customer' | 'admin';
  accountRef?: string;
  customerName?: string;
  email?: string;
  analystId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  loginAsCustomer: (accountRef: string, customerName: string, email?: string) => void;
  loginAsAdmin: (analystName?: string) => void;
  logout: () => void;
  switchCustomerAccount: (accountRef: string, customerName: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('aegis_auth_session');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Default to demo customer Alice Vance ACC-2001 so initial experience is populated
        const defaultCustomer: AuthUser = {
          role: 'customer',
          accountRef: 'ACC-2001',
          customerName: 'Alice Vance',
          email: 'alice.vance@example.com',
        };
        setUser(defaultCustomer);
        localStorage.setItem('aegis_auth_session', JSON.stringify(defaultCustomer));
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginAsCustomer = (accountRef: string, customerName: string, email?: string) => {
    const newUser: AuthUser = {
      role: 'customer',
      accountRef,
      customerName,
      email: email || `${accountRef.toLowerCase()}@example.com`,
    };
    setUser(newUser);
    localStorage.setItem('aegis_auth_session', JSON.stringify(newUser));
  };

  const switchCustomerAccount = (accountRef: string, customerName: string) => {
    if (user && user.role === 'customer') {
      const updated: AuthUser = {
        ...user,
        accountRef,
        customerName,
      };
      setUser(updated);
      localStorage.setItem('aegis_auth_session', JSON.stringify(updated));
    }
  };

  const loginAsAdmin = (analystName: string = 'Lead Fraud Analyst') => {
    const newUser: AuthUser = {
      role: 'admin',
      customerName: analystName,
      analystId: 'FINCRIME-INVESTIGATOR-01',
    };
    setUser(newUser);
    localStorage.setItem('aegis_auth_session', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('aegis_auth_session');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginAsCustomer,
        loginAsAdmin,
        logout,
        switchCustomerAccount,
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

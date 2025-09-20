import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkAuth, getProfile, logoutUser, User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const login = async (userData: User) => {
    setUser(userData);
    // Fetch full profile data to get all fields
    try {
      const profileResponse = await getProfile();
      if (profileResponse.success) {
        setUser(profileResponse.user);
      }
    } catch (error) {
      console.error('Failed to fetch full profile after login:', error);
      // Keep the basic user data if profile fetch fails
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if logout fails
      setUser(null);
    }
  };

  // Check authentication status on app load
  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        // First check if user is authenticated
        const authResponse = await checkAuth();
        if (authResponse.authenticated) {
          // If authenticated, get full profile data
          const profileResponse = await getProfile();
          if (profileResponse.success) {
            setUser(profileResponse.user);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserAuth();
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

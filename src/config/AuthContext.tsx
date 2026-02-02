import React, { createContext, useContext, useEffect, useState } from 'react';
import authService from '../data/services/authService';
import type { User, Role } from '../data/services/authService';

interface AuthContextType {
  user: User | null;
  permissions: string[];
  roles: Role[];
  isAuthenticated: boolean;
  loading: boolean;
  needsOrganizationSetup: boolean;
  hasPermission: (permission: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verify: () => Promise<void>;
  refreshUserData: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsOrganizationSetup, setNeedsOrganizationSetup] = useState(false);

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  // Verify token on mount and setup token refresh
  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Check if token exists before calling verify
        const token = authService.getStoredToken();
        if (!token) {
          setUser(null);
          setPermissions([]);
          setRoles([]);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        const verifiedUser = await authService.verify();
        if (verifiedUser) {
          setUser(verifiedUser);
          setPermissions(verifiedUser.permissions || []);
          setRoles(verifiedUser.roles || []);
          setIsAuthenticated(true);
          // Check if user needs organization setup (no organizationCode)
          setNeedsOrganizationSetup(!verifiedUser.organizationCode);
        } else {
          setUser(null);
          setPermissions([]);
          setRoles([]);
          setIsAuthenticated(false);
          setNeedsOrganizationSetup(false);
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        setUser(null);
        setPermissions([]);
        setRoles([]);
        setIsAuthenticated(false);
        setNeedsOrganizationSetup(false);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await authService.login({ email, password });
      const verifiedUser = await authService.verify();
      if (verifiedUser) {
        setUser(verifiedUser);
        setPermissions(verifiedUser.permissions || []);
        setRoles(verifiedUser.roles || []);
        setIsAuthenticated(true);
        setNeedsOrganizationSetup(!verifiedUser.organizationCode);
      } else {
        throw new Error('Verify failed - no user data');
      }
    } catch (error) {
      setUser(null);
      setPermissions([]);
      setRoles([]);
      setIsAuthenticated(false);
      setNeedsOrganizationSetup(false);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      await authService.register({
        name,
        email,
        password,
      });
      // Registration successful, user needs to wait for approval
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setPermissions([]);
      setRoles([]);
      setIsAuthenticated(false);
      authService.clearTokens();
    }
  };

  const verify = async () => {
    try {
      const verifiedUser = await authService.verify();
      if (verifiedUser) {
        setUser(verifiedUser);
        setPermissions(verifiedUser.permissions || []);
        setRoles(verifiedUser.roles || []);
        setIsAuthenticated(true);
        setNeedsOrganizationSetup(!verifiedUser.organizationCode);
      } else {
        setUser(null);
        setPermissions([]);
        setRoles([]);
        setIsAuthenticated(false);
        setNeedsOrganizationSetup(false);
      }
    } catch (error) {
      setUser(null);
      setPermissions([]);
      setRoles([]);
      setIsAuthenticated(false);
      setNeedsOrganizationSetup(false);
      throw error;
    }
  };

  const refreshUserData = async () => {
    try {
      const verifiedUser = await authService.verify();
      if (verifiedUser) {
        setUser(verifiedUser);
        setPermissions(verifiedUser.permissions || []);
        setRoles(verifiedUser.roles || []);
        setIsAuthenticated(true);
        setNeedsOrganizationSetup(!verifiedUser.organizationCode);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        roles,
        isAuthenticated,
        loading,
        needsOrganizationSetup,
        hasPermission,
        login,
        register,
        logout,
        verify,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import { useAuth } from '../config/AuthContext';
import { PERMISSIONS } from '../constants/permissions';

/**
 * Hook to check user permissions
 * Provides utilities for permission validation
 */
export const usePermission = () => {
  const { permissions } = useAuth();

  /**
   * Check if user has a specific permission
   */
  const has = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAll = (permissionList: string[]): boolean => {
    return permissionList.every(permission => permissions.includes(permission));
  };

  /**
   * Check if user has at least one of the specified permissions
   */
  const hasAny = (permissionList: string[]): boolean => {
    return permissionList.some(permission => permissions.includes(permission));
  };

  /**
   * Get user's current permissions
   */
  const getPermissions = (): string[] => {
    return permissions;
  };

  return {
    has,
    hasAll,
    hasAny,
    getPermissions,
    PERMISSIONS,
  };
};

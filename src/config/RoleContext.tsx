import React, { createContext, useContext, useState, useCallback } from 'react';
import roleService from '../data/services/roleService';
import type { Role, Permission, CreateRoleRequest, UpdateRoleRequest } from '../data/services/roleService';

interface RoleContextType {
  roles: Role[];
  permissions: Permission[];
  loading: boolean;
  error: string | null;
  pagination: any;

  // Actions
  fetchRoles: (page?: number, limit?: number, filters?: any) => Promise<void>;
  fetchPermissions: () => Promise<void>;
  createRole: (data: CreateRoleRequest) => Promise<Role>;
  updateRole: (id: string, data: UpdateRoleRequest) => Promise<Role>;
  deleteRole: (id: string) => Promise<void>;
  assignRoleToStaff: (roleId: string, staffId: string) => Promise<any>;
  removeRoleFromStaff: (roleId: string, staffId: string) => Promise<void>;
  refreshRoles: () => Promise<void>;
  clearError: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchRoles = useCallback(
    async (page: number = 1, limit: number = 10, filters?: any) => {
      setLoading(true);
      setError(null);
      try {
        const { roles: rolesData, pagination: paginationData } =
          await roleService.getAll(page, limit, filters);
        setRoles(rolesData);
        setPagination(paginationData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch roles');
        setRoles([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchPermissions = useCallback(async () => {
    try {
      const permissionsData = await roleService.getAllPermissions();
      setPermissions(permissionsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch permissions');
    }
  }, []);

  const createRole = useCallback(async (data: CreateRoleRequest) => {
    setError(null);
    try {
      const newRole = await roleService.create(data);
      setRoles((prev) => [newRole, ...prev]);
      return newRole;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateRole = useCallback(async (id: string, data: UpdateRoleRequest) => {
    setError(null);
    try {
      const updated = await roleService.update(id, data);
      setRoles((prev) =>
        prev.map((r) => (r.id === id ? updated : r))
      );
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteRole = useCallback(async (id: string) => {
    setError(null);
    try {
      await roleService.delete(id);
      setRoles((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const assignRoleToStaff = useCallback(async (roleId: string, staffId: string) => {
    setError(null);
    try {
      const result = await roleService.assignToStaff(roleId, staffId);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const removeRoleFromStaff = useCallback(async (roleId: string, staffId: string) => {
    setError(null);
    try {
      await roleService.removeFromStaff(roleId, staffId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const refreshRoles = useCallback(async () => {
    await fetchRoles(pagination?.page || 1, pagination?.limit || 10);
  }, [fetchRoles, pagination]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <RoleContext.Provider
      value={{
        roles,
        permissions,
        loading,
        error,
        pagination,
        fetchRoles,
        fetchPermissions,
        createRole,
        updateRole,
        deleteRole,
        assignRoleToStaff,
        removeRoleFromStaff,
        refreshRoles,
        clearError,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
};

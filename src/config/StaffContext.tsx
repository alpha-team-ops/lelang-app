import React, { createContext, useContext, useState, useCallback } from 'react';
import staffService from '../data/services/staffService';
import type { Staff, CreateStaffRequest, UpdateStaffRequest } from '../data/services/staffService';

interface StaffContextType {
  staff: Staff[];
  loading: boolean;
  error: string | null;
  pagination: any;
  
  // Actions
  fetchStaff: (page?: number, limit?: number, filters?: any) => Promise<void>;
  createStaff: (data: CreateStaffRequest) => Promise<Staff>;
  updateStaff: (id: string, data: UpdateStaffRequest) => Promise<Staff>;
  deleteStaff: (id: string) => Promise<void>;
  refreshStaff: () => Promise<void>;
  clearError: () => void;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export const StaffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchStaff = useCallback(
    async (page: number = 1, limit: number = 10, filters?: any) => {
      setLoading(true);
      setError(null);
      try {
        const { staff: staffData, pagination: paginationData } =
          await staffService.getAll(page, limit, filters);
        setStaff(staffData);
        setPagination(paginationData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch staff');
        setStaff([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createStaff = useCallback(async (data: CreateStaffRequest) => {
    setError(null);
    try {
      const newStaff = await staffService.create(data);
      setStaff((prev) => [newStaff, ...prev]);
      return newStaff;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateStaff = useCallback(async (id: string, data: UpdateStaffRequest) => {
    setError(null);
    try {
      const updated = await staffService.update(id, data);
      setStaff((prev) =>
        prev.map((s) => (s.id === id ? updated : s))
      );
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteStaff = useCallback(async (id: string) => {
    setError(null);
    try {
      await staffService.delete(id);
      setStaff((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const refreshStaff = useCallback(async () => {
    await fetchStaff(pagination?.page || 1, pagination?.limit || 10);
  }, [fetchStaff, pagination]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <StaffContext.Provider
      value={{
        staff,
        loading,
        error,
        pagination,
        fetchStaff,
        createStaff,
        updateStaff,
        deleteStaff,
        refreshStaff,
        clearError,
      }}
    >
      {children}
    </StaffContext.Provider>
  );
};

export const useStaff = () => {
  const context = useContext(StaffContext);
  if (!context) {
    throw new Error('useStaff must be used within StaffProvider');
  }
  return context;
};

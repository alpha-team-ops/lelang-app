import React, { createContext, useContext, useState, useCallback } from 'react';
import organizationService from '../data/services/organizationService';
import type { OrganizationSettings } from '../data/services/organizationService';

interface OrganizationContextType {
  organization: OrganizationSettings | null;
  loading: boolean;
  error: string | null;
  fetchSettings: (organizationCode?: string) => Promise<void>;
  updateSettings: (settings: Partial<OrganizationSettings>) => Promise<void>;
  uploadLogo: (file: File) => Promise<string>;
  getOrganizationCode: () => Promise<{ organizationCode: string; portalInvitationCode: string; portalInvitationActive: boolean }>;
  clearError: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organization, setOrganization] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchSettings = useCallback(async (organizationCode?: string) => {
    setLoading(true);
    setError(null);
    try {
      const settings = await organizationService.getSettings(organizationCode);
      setOrganization(settings);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch organization settings';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (settings: Partial<OrganizationSettings>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await organizationService.updateSettings(settings);
      setOrganization(updated);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update organization settings';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadLogo = useCallback(async (file: File): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const result = await organizationService.uploadLogo(file);
      // Update local organization with new logo
      if (organization) {
        setOrganization({
          ...organization,
          logo: result.logoUrl,
        });
      }
      return result.logoUrl;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload logo';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [organization]);

  const getOrganizationCode = useCallback(async (): Promise<{ organizationCode: string; portalInvitationCode: string; portalInvitationActive: boolean }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await organizationService.getOrganizationCode();
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch organization code';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value: OrganizationContextType = {
    organization,
    loading,
    error,
    fetchSettings,
    updateSettings,
    uploadLogo,
    getOrganizationCode,
    clearError,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
};

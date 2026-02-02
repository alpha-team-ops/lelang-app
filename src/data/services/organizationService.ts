import apiClient from '../../config/apiClient';

// Types for Setup
export interface CheckSetupResponse {
  needsSetup: boolean;
  organizationCode?: string;
  role?: string;
}

export interface OrganizationSetupResponse {
  organizationCode: string;
  name: string;
  description?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface CreateOrganizationResponse extends OrganizationSetupResponse, AuthTokenResponse {}

export interface OrganizationSettings {
  organizationCode: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  country: string;
  logo: string;
  description: string;
  timezone: string;
  currency: string;
  language: string;
  emailNotifications: boolean;
  auctionNotifications: boolean;
  bidNotifications: boolean;
  twoFactorAuth: boolean;
  maintenanceMode: boolean;
  portalInvitationCode: string;
  portalInvitationActive: boolean;
}

export interface OrganizationResponse {
  success: boolean;
  data: OrganizationSettings;
  error?: string;
}

export interface OrganizationCodeResponse {
  success: boolean;
  data: {
    organizationCode: string;
  };
  error?: string;
}

export interface LogoUploadResponse {
  success: boolean;
  data: {
    logoUrl: string;
    fileName: string;
    uploadedAt: string;
  };
  error?: string;
}

// Service methods
const organizationService = {
  async checkSetupStatus(): Promise<CheckSetupResponse> {
    try {
      const response = await apiClient.get<{ data: CheckSetupResponse }>(
        '/organization/check-setup'
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to check setup status');
    }
  },

  async createOrganization(
    organizationName: string,
    description?: string
  ): Promise<CreateOrganizationResponse> {
    try {
      const response = await apiClient.post<{ data: CreateOrganizationResponse }>(
        '/organization/create',
        {
          organizationName,
          description,
        }
      );
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error('Organization name already exists');
      }
      throw new Error(error.response?.data?.error || 'Failed to create organization');
    }
  },

  async joinOrganization(organizationCode: string): Promise<CreateOrganizationResponse> {
    try {
      const response = await apiClient.post<{ data: CreateOrganizationResponse }>(
        '/organization/join',
        {
          organizationCode,
        }
      );
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Organization not found');
      }
      if (error.response?.status === 409) {
        throw new Error('You already belong to an organization');
      }
      throw new Error(error.response?.data?.error || 'Failed to join organization');
    }
  },

  /**
   * Get organization settings
   * @param organizationCode - Optional org code (defaults to user's org)
   */
  async getSettings(organizationCode?: string): Promise<OrganizationSettings | null> {
    try {
      const params = organizationCode ? { organizationCode } : {};
      const response = await apiClient.get<OrganizationResponse>(
        '/organization/settings',
        { params }
      );
      return response.data.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to fetch organization settings';
      console.error('Get settings error:', errorMsg);
      throw new Error(errorMsg);
    }
  },

  /**
   * Update organization settings
   * @param settings - Partial settings object with fields to update
   */
  async updateSettings(settings: Partial<OrganizationSettings>): Promise<OrganizationSettings> {
    try {
      const response = await apiClient.put<OrganizationResponse>(
        '/organization/settings',
        settings
      );
      return response.data.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to update organization settings';
      console.error('Update settings error:', errorMsg);
      throw new Error(errorMsg);
    }
  },

  /**
   * Upload organization logo
   * @param file - Image file to upload
   */
  async uploadLogo(file: File): Promise<{ logoUrl: string; fileName: string; uploadedAt: string }> {
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await apiClient.post<LogoUploadResponse>(
        '/organization/logo',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to upload logo';
      console.error('Upload logo error:', errorMsg);
      throw new Error(errorMsg);
    }
  },

  /**
   * Get organization code and portal invitation code
   * (Fastest endpoint for quick access)
   */
  async getOrganizationCode(): Promise<{ organizationCode: string; portalInvitationCode: string; portalInvitationActive: boolean }> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          organizationCode: string;
          portalInvitationCode: string;
          portalInvitationActive: boolean;
          [key: string]: any;
        };
      }>('/organization/code');
      return {
        organizationCode: response.data.data.organizationCode,
        portalInvitationCode: response.data.data.portalInvitationCode,
        portalInvitationActive: response.data.data.portalInvitationActive,
      };
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to fetch organization code';
      console.error('Get organization code error:', errorMsg);
      throw new Error(errorMsg);
    }
  },
};

export default organizationService;

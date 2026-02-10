import apiClient from '../../config/apiClient';

// Portal Organization Info
export interface PortalOrganization {
  organizationName: string;
  description: string;
}

// Portal Directorate for dropdown
export interface PortalDirectorate {
  id: string;
  name: string;
  description?: string;
}

// Portal Login Request - Updated spec
export interface PortalLoginRequest {
  corporateIdNip: string; // Required - NIP from admin, immutable
  portalCode: string; // Required - Invitation code
  fullName?: string; // Optional - Will auto-update if different
  directoriateId?: string; // Optional - Will auto-update if different
}

// Portal User Info
export interface PortalUser {
  id: string;
  fullName: string;
  corporateIdNip: string;
  directorate: string;
  directoriateId: string;
  organizationCode: string;
}

// Portal Login Response - Updated spec
export interface PortalLoginResponse {
  success: boolean;
  data: {
    portalToken: string;
    expiresIn: number;
    user: PortalUser;
  };
  message?: string;
}

// Error Response
export interface PortalErrorResponse {
  success: false;
  message: string;
  errorCode: string;
  errors?: Record<string, string[]>;
}

const portalAuthService = {
  /**
   * Get organization info for portal
   * GET /api/v1/auth/portal-organization?portalCode=PORTAL-NT1TRSRQ
   */
  async getOrganizationInfo(portalCode: string): Promise<PortalOrganization> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: PortalOrganization;
        message?: string;
      }>('/auth/portal-organization', {
        params: {
          portalCode,
        },
        headers: {
          'Authorization': undefined,
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching portal organization info:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch organization info';
      throw new Error(errorMessage);
    }
  },

  /**
   * Get list of directorates for portal login dropdown
   * GET /api/v1/auth/portal-directorates?portalCode=PORTAL-NT1TRSRQ
   */
  async getDirectorates(portalCode: string): Promise<PortalDirectorate[]> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: PortalDirectorate[];
        message?: string;
      }>('/auth/portal-directorates', {
        params: {
          portalCode,
        },
        headers: {
          'Authorization': undefined,
        },
      });

      return Array.isArray(response.data.data)
        ? response.data.data
        : [];
    } catch (error: any) {
      console.error('Error fetching portal directorates:', error);
      // Silently fail for directorates - it's optional
      return [];
    }
  },

  /**
   * Portal Login
   * POST /api/v1/auth/portal-login
   * NO AUTHORIZATION REQUIRED (PUBLIC)
   *
   * Request Body:
   * - corporateIdNip (required): NIP yang admin input, tidak bisa berubah
   * - portalCode (required): Invitation code dari admin
   * - fullName (optional): Jika berbeda dari DB, auto-update
   * - directoriateId (optional): Jika berbeda dari DB, auto-update
   */
  async login(credentials: PortalLoginRequest): Promise<PortalLoginResponse> {
    try {
      const response = await apiClient.post<PortalLoginResponse>(
        '/auth/portal-login',
        {
          corporateIdNip: credentials.corporateIdNip,
          portalCode: credentials.portalCode,
          fullName: credentials.fullName || undefined,
          directoriateId: credentials.directoriateId || undefined,
        },
        {
          // No authorization header for public endpoint
          headers: {
            'Authorization': undefined,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }

      return response.data;
    } catch (error: any) {
      // Handle specific error codes
      if (error.response?.status === 401) {
        throw new Error('Invalid NIP/ID or portal code');
      }

      if (error.response?.status === 422) {
        const errorData = error.response?.data as PortalErrorResponse;
        if (errorData.errors) {
          // Return validation errors
          const fieldErrors = Object.entries(errorData.errors)
            .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
            .join('\n');
          throw new Error(fieldErrors);
        }
        throw new Error(errorData.message || 'Validation failed');
      }

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Portal login failed';
      throw new Error(errorMessage);
    }
  },
};

export default portalAuthService;

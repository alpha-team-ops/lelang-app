import apiClient from '../../config/apiClient';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  organizationCode?: string;
}

export interface PortalLoginRequest {
  fullName: string;
  corporateIdNip: string;
  directorate: string;
  invitationCode: string;
}

export interface PortalLoginResponse {
  success: boolean;
  data: {
    userId: string;
    portalToken: string;
    expiresIn: number;
    isNewUser: boolean;
  };
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface Role {
  roleId: string;
  roleName: string;
  organizationCode: string;
}

export interface User {
  userId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MODERATOR';
  organizationCode: string;
  permissions: string[];
  roles?: Role[];
}

export interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
}

export interface VerifyResponse {
  success: boolean;
  data: {
    valid: boolean;
    user: User;
  };
}

const authService = {
  login: async (credentials: LoginRequest): Promise<TokenResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    const { accessToken, refreshToken, expiresIn, tokenType } = response.data.data;

    // Store tokens in localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('expiresIn', expiresIn.toString());
    localStorage.setItem('tokenType', tokenType);

    return { accessToken, refreshToken, expiresIn, tokenType };
  },

  register: async (data: RegisterRequest) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data.data;
  },

  portalLogin: async (credentials: PortalLoginRequest) => {
    try {
      const response = await apiClient.post<PortalLoginResponse>('/auth/portal-login', credentials);
      const { userId, portalToken, expiresIn, isNewUser } = response.data.data;

      // Store portal session in sessionStorage
      sessionStorage.setItem('portalToken', portalToken);
      sessionStorage.setItem('userId', userId);
      sessionStorage.setItem('expiresIn', expiresIn.toString());
      sessionStorage.setItem('portalSessionStart', Date.now().toString());

      return {
        userId,
        portalToken,
        expiresIn,
        isNewUser,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Portal login failed';
      throw new Error(errorMessage);
    }
  },

  logout: async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear tokens regardless of API response
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('expiresIn');
      localStorage.removeItem('tokenType');
    }
  },

  verify: async (): Promise<User | null> => {
    try {
      const response = await apiClient.get<VerifyResponse>('/auth/verify');
      if (response.data.data.valid) {
        return response.data.data.user;
      }
      return null;
    } catch (error) {
      console.error('Token verification error:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return null;
    }
  },

  refreshToken: async (): Promise<TokenResponse | null> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return null;
      }

      const response = await apiClient.post<{
        success: boolean;
        data: { accessToken: string; expiresIn: number; tokenType: string };
      }>('/auth/refresh', { refreshToken });

      const { accessToken, expiresIn, tokenType } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('expiresIn', expiresIn.toString());
      localStorage.setItem('tokenType', tokenType);

      return { accessToken, refreshToken, expiresIn, tokenType };
    } catch (error) {
      console.error('Token refresh error:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return null;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, newPassword });
  },

  getStoredToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('accessToken');
  },

  clearTokens: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expiresIn');
    localStorage.removeItem('tokenType');
  },
};

export default authService;

// Session Management Utility

export interface UserSession {
  fullName: string;
  corporateIdNip: string;
  directorate: string;
  organizationCode: string;
  timestamp: number;
}

export const saveUserSession = (userData: UserSession) => {
  sessionStorage.setItem('userSession', JSON.stringify(userData));
  sessionStorage.setItem('authToken', `token-${Date.now()}`);
};

export const getUserSession = (): UserSession | null => {
  const session = sessionStorage.getItem('userSession');
  return session ? JSON.parse(session) : null;
};

export const clearUserSession = () => {
  sessionStorage.removeItem('userSession');
  sessionStorage.removeItem('authToken');
};

export const isSessionActive = (): boolean => {
  return !!sessionStorage.getItem('authToken');
};

export const getSessionRemainingTime = (): number => {
  const session = getUserSession();
  if (!session) return 0;
  
  const now = Date.now();
  const sessionStart = session.timestamp;
  const sessionDuration = 30 * 60 * 1000; // 30 menit
  
  return Math.max(0, sessionDuration - (now - sessionStart));
};

export const formatRemainingTime = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

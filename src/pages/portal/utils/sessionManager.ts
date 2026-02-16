// Session Management Utility

export type AccessLevel = 'FULL' | 'VIEW_ONLY' | null;

export interface UserSession {
  fullName: string;
  corporateIdNip: string;
  directorate: string;
  invitationCode: string;
  timestamp: number;
  portalToken?: string;
  userId?: string;
  accessLevel?: AccessLevel;
}

export const saveUserSession = (userData: UserSession) => {
  sessionStorage.setItem('userSession', JSON.stringify(userData));
  sessionStorage.setItem('authToken', `token-${Date.now()}`);
  
  // Save portalToken separately for API calls (only if not null/undefined)
  if (userData.portalToken && userData.portalToken !== 'null' && userData.portalToken.length > 0) {
    sessionStorage.setItem('portalToken', userData.portalToken);
  } else {
    // Remove portalToken if it exists from previous session
    sessionStorage.removeItem('portalToken');
  }
  
  // Store accessLevel separately for easy access (always save, even if null)
  if (userData.accessLevel) {
    sessionStorage.setItem('accessLevel', userData.accessLevel);
  } else {
    sessionStorage.removeItem('accessLevel');
  }
  
  // Save userId separately (only if not null)
  if (userData.userId && userData.userId !== 'null') {
    sessionStorage.setItem('userId', userData.userId);
  } else {
    sessionStorage.removeItem('userId');
  }
};

export const getUserSession = (): UserSession | null => {
  const session = sessionStorage.getItem('userSession');
  return session ? JSON.parse(session) : null;
};

export const clearUserSession = () => {
  sessionStorage.removeItem('userSession');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('portalToken');
  sessionStorage.removeItem('userId');
  sessionStorage.removeItem('accessLevel');
};

export const savePortalCodePersistent = (invitationCode: string) => {
  const expiryTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  localStorage.setItem('portalCode', invitationCode);
  localStorage.setItem('portalCodeExpiry', expiryTime.toString());
};

export const getPortalCodePersistent = (): string | null => {
  const code = localStorage.getItem('portalCode');
  const expiry = localStorage.getItem('portalCodeExpiry');
  
  if (!code || !expiry) return null;
  
  // Check if code has expired
  if (Date.now() > parseInt(expiry)) {
    localStorage.removeItem('portalCode');
    localStorage.removeItem('portalCodeExpiry');
    return null;
  }
  
  return code;
};

export const clearPortalCodePersistent = () => {
  localStorage.removeItem('portalCode');
  localStorage.removeItem('portalCodeExpiry');
};

export const getAccessLevel = (): AccessLevel => {
  const accessLevel = sessionStorage.getItem('accessLevel') as AccessLevel;
  return accessLevel || null;
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

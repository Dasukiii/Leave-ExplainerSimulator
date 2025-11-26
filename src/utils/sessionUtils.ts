export const generateSessionToken = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

export const getSessionToken = (): string | null => {
  return localStorage.getItem('sessionToken');
};

export const setSessionToken = (token: string): void => {
  localStorage.setItem('sessionToken', token);
};

export const clearSessionToken = (): void => {
  localStorage.removeItem('sessionToken');
};

export const getUserProfileId = (): string | null => {
  return localStorage.getItem('userProfileId');
};

export const setUserProfileId = (profileId: string): void => {
  localStorage.setItem('userProfileId', profileId);
};

export const clearUserProfileId = (): void => {
  localStorage.removeItem('userProfileId');
};

export const clearSession = (): void => {
  clearSessionToken();
  clearUserProfileId();
};

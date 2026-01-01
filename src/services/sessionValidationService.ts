import { getUserProfile } from './userProfileService';

export interface SessionValidationResult {
  isValid: boolean;
  profileId: string | null;
  error?: string;
}

export const validateSession = async (profileId: string | null): Promise<SessionValidationResult> => {
  if (!profileId) {
    return {
      isValid: false,
      profileId: null,
      error: 'No profile ID provided',
    };
  }

  try {
    console.log('[sessionValidationService] Validating session for profile:', profileId);
    const profile = await getUserProfile(profileId);

    if (!profile) {
      console.log('[sessionValidationService] Profile not found in localStorage');
      return {
        isValid: false,
        profileId: null,
        error: 'Profile not found',
      };
    }

    console.log('[sessionValidationService] Session is valid');
    return {
      isValid: true,
      profileId: profileId,
    };
  } catch (error) {
    console.error('[sessionValidationService] Error validating session:', error);
    return {
      isValid: false,
      profileId: null,
      error: 'Validation error',
    };
  }
};

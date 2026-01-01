export interface LeaveBalance {
  annual?: number;
  sick?: number;
  [key: string]: number | undefined;
}

export interface LeaveTaken {
  type: string;
  start_date: string;
  end_date: string;
  days: number;
  status?: string;
}

export interface UserProfile {
  id: string;
  name?: string;
  hire_date?: string;
  employment_type?: string;
  leave_balances: LeaveBalance;
  leaves_taken: LeaveTaken[];
  uploaded_policy_url?: string;
  created_at: string;
}

export interface CreateUserProfileData {
  name?: string;
  hire_date?: string;
  employment_type?: string;
  leave_balances?: LeaveBalance;
  leaves_taken?: LeaveTaken[];
  uploaded_policy_url?: string;
}

const STORAGE_KEY = 'user_profiles';

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const getProfiles = (): UserProfile[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveProfiles = (profiles: UserProfile[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
};

export const createUserProfile = async (profileData: CreateUserProfileData): Promise<UserProfile> => {
  const profiles = getProfiles();

  const newProfile: UserProfile = {
    id: generateId(),
    name: profileData.name,
    hire_date: profileData.hire_date,
    employment_type: profileData.employment_type,
    leave_balances: profileData.leave_balances || {},
    leaves_taken: profileData.leaves_taken || [],
    uploaded_policy_url: profileData.uploaded_policy_url,
    created_at: new Date().toISOString(),
  };

  profiles.push(newProfile);
  saveProfiles(profiles);

  return newProfile;
};

export const getUserProfile = async (profileId: string): Promise<UserProfile | null> => {
  const profiles = getProfiles();
  return profiles.find(p => p.id === profileId) || null;
};

export const getLatestUserProfile = async (): Promise<UserProfile | null> => {
  const profiles = getProfiles();
  if (profiles.length === 0) return null;

  return profiles.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
};

export const updateUserProfile = async (
  profileId: string,
  updates: Partial<CreateUserProfileData>
): Promise<UserProfile> => {
  const profiles = getProfiles();
  const index = profiles.findIndex(p => p.id === profileId);

  if (index === -1) {
    throw new Error('Profile not found');
  }

  profiles[index] = {
    ...profiles[index],
    ...updates,
  };

  saveProfiles(profiles);
  return profiles[index];
};

export const deleteUserProfile = async (profileId: string): Promise<void> => {
  const profiles = getProfiles();
  const filtered = profiles.filter(p => p.id !== profileId);
  saveProfiles(filtered);
};

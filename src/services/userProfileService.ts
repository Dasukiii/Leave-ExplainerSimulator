import { supabase } from '../lib/supabaseClient';

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

export const createUserProfile = async (profileData: CreateUserProfileData): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([profileData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserProfile = async (profileId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', profileId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getLatestUserProfile = async (): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const updateUserProfile = async (
  profileId: string,
  updates: Partial<CreateUserProfileData>
): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', profileId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteUserProfile = async (profileId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', profileId);

  if (error) throw error;
};

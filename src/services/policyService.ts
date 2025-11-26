import { supabase } from '../lib/supabaseClient';

export interface Policy {
  id: string;
  title: string;
  category: string;
  text_doc: string;
  source_url?: string;
  user_profile_id?: string | null;
  updated_at: string;
}

export const getAllPolicies = async (userProfileId?: string): Promise<Policy[]> => {
  console.log('[getAllPolicies] Called with userProfileId:', userProfileId);

  if (!userProfileId) {
    console.log('[getAllPolicies] No user profile ID, fetching default policies');
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .is('user_profile_id', null)
      .order('category', { ascending: true });

    if (error) throw error;
    console.log('[getAllPolicies] Returning default policies:', data?.length || 0);
    return data || [];
  }

  console.log('[getAllPolicies] Fetching user-specific policies for:', userProfileId);
  const { data: userPolicies, error: userError } = await supabase
    .from('policies')
    .select('*')
    .eq('user_profile_id', userProfileId)
    .order('category', { ascending: true });

  if (userError) throw userError;

  console.log('[getAllPolicies] User-specific policies found:', userPolicies?.length || 0);

  if (userPolicies && userPolicies.length > 0) {
    console.log('[getAllPolicies] Returning user-specific policies');
    return userPolicies;
  }

  console.log('[getAllPolicies] No user policies found, falling back to defaults');
  const { data: defaultPolicies, error: defaultError } = await supabase
    .from('policies')
    .select('*')
    .is('user_profile_id', null)
    .order('category', { ascending: true });

  if (defaultError) throw defaultError;
  console.log('[getAllPolicies] Returning default policies:', defaultPolicies?.length || 0);
  return defaultPolicies || [];
};

export const getPolicyById = async (policyId: string): Promise<Policy | null> => {
  const { data, error } = await supabase
    .from('policies')
    .select('*')
    .eq('id', policyId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const searchPolicies = async (query: string, userProfileId?: string): Promise<Policy[]> => {
  let queryBuilder = supabase
    .from('policies')
    .select('*')
    .or(`title.ilike.%${query}%,text_doc.ilike.%${query}%`);

  if (userProfileId) {
    queryBuilder = queryBuilder.or(`user_profile_id.eq.${userProfileId},user_profile_id.is.null`);
  } else {
    queryBuilder = queryBuilder.is('user_profile_id', null);
  }

  const { data, error } = await queryBuilder;

  if (error) throw error;
  return data || [];
};

export const getPoliciesByCategory = async (category: string, userProfileId?: string): Promise<Policy[]> => {
  let queryBuilder = supabase
    .from('policies')
    .select('*')
    .eq('category', category);

  if (userProfileId) {
    queryBuilder = queryBuilder.or(`user_profile_id.eq.${userProfileId},user_profile_id.is.null`);
  } else {
    queryBuilder = queryBuilder.is('user_profile_id', null);
  }

  queryBuilder = queryBuilder.order('title', { ascending: true });

  const { data, error } = await queryBuilder;

  if (error) throw error;
  return data || [];
};

export const createPolicy = async (policyData: Omit<Policy, 'id' | 'updated_at'>): Promise<Policy> => {
  const { data, error } = await supabase
    .from('policies')
    .insert([policyData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updatePolicy = async (policyId: string, updates: Partial<Omit<Policy, 'id' | 'updated_at'>>): Promise<Policy> => {
  const { data, error } = await supabase
    .from('policies')
    .update(updates)
    .eq('id', policyId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deletePolicy = async (policyId: string): Promise<void> => {
  const { error } = await supabase
    .from('policies')
    .delete()
    .eq('id', policyId);

  if (error) throw error;
};

export const deleteUserPolicies = async (userProfileId: string): Promise<void> => {
  const { error } = await supabase
    .from('policies')
    .delete()
    .eq('user_profile_id', userProfileId);

  if (error) throw error;
};

export const createMultiplePolicies = async (policies: Array<Omit<Policy, 'id' | 'updated_at'>>): Promise<Policy[]> => {
  const { data, error } = await supabase
    .from('policies')
    .insert(policies)
    .select();

  if (error) throw error;
  return data || [];
};

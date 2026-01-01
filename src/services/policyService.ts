export interface Policy {
  id: string;
  title: string;
  category: string;
  text_doc: string;
  source_url?: string;
  user_profile_id?: string | null;
  updated_at: string;
}

const STORAGE_KEY = 'policies';
const INITIALIZED_KEY = 'policies_initialized';

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const DEFAULT_POLICIES: Omit<Policy, 'id' | 'updated_at'>[] = [
  {
    title: 'Annual Leave Entitlement',
    category: 'Annual Leave',
    text_doc: 'Full-time employees are entitled to 18 days of paid annual leave per calendar year. Leave accrues at a rate of 1.5 days per month worked. Part-time employees receive leave on a pro-rata basis. Employees must provide at least 14 days advance notice for annual leave requests. Annual leave can be carried over up to a maximum of 5 days into the next calendar year. Unused leave beyond the carry-over limit will be forfeited.',
    source_url: undefined,
    user_profile_id: null,
  },
  {
    title: 'Sick Leave Policy',
    category: 'Sick Leave',
    text_doc: 'All employees receive 10 days of paid sick leave annually. Sick leave does not accumulate or carry over to the next year. A medical certificate is required for absences exceeding 2 consecutive working days. Employees must notify their manager as soon as possible, preferably before their scheduled start time. Sick leave can be used for personal illness or to care for an immediate family member.',
    source_url: undefined,
    user_profile_id: null,
  },
  {
    title: 'Parental Leave Eligibility',
    category: 'Parental Leave',
    text_doc: 'Employees with a minimum of 12 months continuous service are eligible for parental leave. Primary caregivers are entitled to 16 weeks of paid parental leave. Secondary caregivers receive 2 weeks of paid leave. Additional unpaid parental leave of up to 6 weeks is available. Employees must provide at least 4 weeks notice before the expected birth or adoption date. Medical documentation or adoption papers are required.',
    source_url: undefined,
    user_profile_id: null,
  },
  {
    title: 'Leave Application Process',
    category: 'General',
    text_doc: 'All leave requests must be submitted to your direct manager for approval. Applications should be made at least 2 weeks in advance for planned leave. Use the company email system to request leave, copying HR. Emergency leave can be approved retroactively with valid supporting documentation. Managers will respond to leave requests within 3 business days. Approved leave will be recorded in the HR system.',
    source_url: undefined,
    user_profile_id: null,
  },
  {
    title: 'Compassionate Leave',
    category: 'Special Leave',
    text_doc: 'Employees are entitled to 3 days of paid compassionate leave in the event of death or serious illness of an immediate family member (spouse, child, parent, sibling). Additional leave may be granted at managements discretion. Employees should notify their manager as soon as possible. Documentation may be required. This leave is separate from annual leave entitlements.',
    source_url: undefined,
    user_profile_id: null,
  },
  {
    title: 'Public Holidays',
    category: 'Public Holiday',
    text_doc: 'The company observes all official public holidays as declared by the government. If a public holiday falls on a weekend, a replacement day off will be provided on the following Monday. Employees required to work on public holidays receive double pay or a replacement day off. Part-time employees receive public holiday pay on a pro-rata basis.',
    source_url: undefined,
    user_profile_id: null,
  },
  {
    title: 'Study Leave',
    category: 'Special Leave',
    text_doc: 'Employees pursuing work-related education may apply for study leave. Up to 5 days per year may be granted for exam preparation or attendance. Applications must be submitted at least 1 month in advance. Proof of enrollment and course relevance is required. Study leave is separate from annual leave. Approval is subject to operational requirements and managements discretion.',
    source_url: undefined,
    user_profile_id: null,
  },
  {
    title: 'Unpaid Leave',
    category: 'Unpaid Leave',
    text_doc: 'Unpaid leave may be granted in exceptional circumstances when all paid leave has been exhausted. Requests must be submitted to HR with justification. Approval is at managements discretion. Unpaid leave affects salary and may impact benefits accrual. Maximum unpaid leave period is 4 weeks per year unless special circumstances apply. Employee must maintain contact with HR during unpaid leave.',
    source_url: undefined,
    user_profile_id: null,
  },
];

const initializeDefaultPolicies = (): void => {
  const isInitialized = localStorage.getItem(INITIALIZED_KEY);
  if (isInitialized) return;

  const policies: Policy[] = DEFAULT_POLICIES.map(policy => ({
    ...policy,
    id: generateId(),
    updated_at: new Date().toISOString(),
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));
  localStorage.setItem(INITIALIZED_KEY, 'true');
};

const getPolicies = (): Policy[] => {
  initializeDefaultPolicies();
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const savePolicies = (policies: Policy[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));
};

export const getAllPolicies = async (userProfileId?: string): Promise<Policy[]> => {
  const policies = getPolicies();

  if (!userProfileId) {
    return policies.filter(p => p.user_profile_id === null);
  }

  const userPolicies = policies.filter(p => p.user_profile_id === userProfileId);
  if (userPolicies.length > 0) {
    return userPolicies;
  }

  return policies.filter(p => p.user_profile_id === null);
};

export const getPolicyById = async (policyId: string): Promise<Policy | null> => {
  const policies = getPolicies();
  return policies.find(p => p.id === policyId) || null;
};

export const searchPolicies = async (query: string, userProfileId?: string): Promise<Policy[]> => {
  const policies = getPolicies();
  const lowercaseQuery = query.toLowerCase();

  let filtered = policies.filter(p =>
    p.title.toLowerCase().includes(lowercaseQuery) ||
    p.text_doc.toLowerCase().includes(lowercaseQuery)
  );

  if (userProfileId) {
    filtered = filtered.filter(p =>
      p.user_profile_id === userProfileId || p.user_profile_id === null
    );
  } else {
    filtered = filtered.filter(p => p.user_profile_id === null);
  }

  return filtered;
};

export const getPoliciesByCategory = async (category: string, userProfileId?: string): Promise<Policy[]> => {
  const policies = getPolicies();

  let filtered = policies.filter(p => p.category === category);

  if (userProfileId) {
    filtered = filtered.filter(p =>
      p.user_profile_id === userProfileId || p.user_profile_id === null
    );
  } else {
    filtered = filtered.filter(p => p.user_profile_id === null);
  }

  return filtered.sort((a, b) => a.title.localeCompare(b.title));
};

export const createPolicy = async (policyData: Omit<Policy, 'id' | 'updated_at'>): Promise<Policy> => {
  const policies = getPolicies();

  const newPolicy: Policy = {
    ...policyData,
    id: generateId(),
    updated_at: new Date().toISOString(),
  };

  policies.push(newPolicy);
  savePolicies(policies);

  return newPolicy;
};

export const updatePolicy = async (policyId: string, updates: Partial<Omit<Policy, 'id' | 'updated_at'>>): Promise<Policy> => {
  const policies = getPolicies();
  const index = policies.findIndex(p => p.id === policyId);

  if (index === -1) {
    throw new Error('Policy not found');
  }

  policies[index] = {
    ...policies[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  savePolicies(policies);
  return policies[index];
};

export const deletePolicy = async (policyId: string): Promise<void> => {
  const policies = getPolicies();
  const filtered = policies.filter(p => p.id !== policyId);
  savePolicies(filtered);
};

export const deleteUserPolicies = async (userProfileId: string): Promise<void> => {
  const policies = getPolicies();
  const filtered = policies.filter(p => p.user_profile_id !== userProfileId);
  savePolicies(filtered);
};

export const createMultiplePolicies = async (policies: Array<Omit<Policy, 'id' | 'updated_at'>>): Promise<Policy[]> => {
  const existingPolicies = getPolicies();

  const newPolicies: Policy[] = policies.map(policy => ({
    ...policy,
    id: generateId(),
    updated_at: new Date().toISOString(),
  }));

  existingPolicies.push(...newPolicies);
  savePolicies(existingPolicies);

  return newPolicies;
};

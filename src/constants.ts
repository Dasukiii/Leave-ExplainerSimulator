import { User, Policy } from './types';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Alex Johnson',
  email: 'alex.j@company.com',
  role: 'Employee',
  hireDate: '2022-03-15',
  tenureYears: 2.5,
  balances: {
    annual: 14,
    sick: 5,
    personal: 2,
    parental: 60, // Eligible but 0 used usually, setting cap
  },
};

export const MOCK_POLICIES: Policy[] = [
  {
    id: 'p1',
    title: 'Annual Leave Policy',
    category: 'Time Off',
    lastUpdated: '2023-11-01',
    content: `
# Annual Leave Policy (Section 3.2)

## Eligibility
All full-time employees are eligible for annual leave.
- 0-2 years tenure: 14 days per year.
- 2-5 years tenure: 18 days per year.
- 5+ years tenure: 21 days per year.

## Accrual
Leave accrues monthly on the last working day of the month.

## Carry Over
Up to 5 days of unused annual leave can be carried over to the next calendar year. Any excess will be forfeited on March 31st.

## Application Process
Requests for leave of 3 days or more must be submitted at least 2 weeks in advance.
    `
  },
  {
    id: 'p2',
    title: 'Sick Leave Policy',
    category: 'Health',
    lastUpdated: '2024-01-15',
    content: `
# Sick Leave Policy

## Entitlement
Employees receive 10 days of paid sick leave annually.

## Medical Certificate
A medical certificate is required for sick leave exceeding 2 consecutive days.
    `
  },
  {
    id: 'p3',
    title: 'Parental Leave',
    category: 'Family',
    lastUpdated: '2023-06-20',
    content: `
# Parental Leave

## Eligibility
Employees who have completed at least 12 months of continuous service are eligible.

## Entitlement
- Primary Caregiver: 12 weeks fully paid.
- Secondary Caregiver: 4 weeks fully paid.
    `
  }
];

export const SYSTEM_INSTRUCTION_TEMPLATE = `
You are "LeaveExplainer", an advanced HR assistant for a company.
Your goal is to answer employee questions about leave policies, simulate leave balances, and check eligibility.

CONTEXT:
User Name: {{USER_NAME}}
Tenure: {{USER_TENURE}} years
Current Balances:
- Annual: {{BALANCE_ANNUAL}} days
- Sick: {{BALANCE_SICK}} days

POLICIES:
{{POLICY_TEXT}}

INSTRUCTIONS:
1. Answer strictly based on the provided policies. Cite the specific policy section (e.g., [Annual Leave Policy, Section 3.2]).
2. If asked to simulate leave (e.g., "If I take 5 days in August"), calculate the remaining balance based on their *current* balance shown above.
3. If checking eligibility (e.g., "Can I take parental leave?"), compare the user's tenure to the policy requirements.
4. Keep answers concise, professional, and empathetic.
5. Use markdown for formatting.
6. If the user is not eligible, explain why clearly based on the tenure rule.
`;

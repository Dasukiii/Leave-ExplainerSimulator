/*
  # Re-insert Malaysia Leave Policies as Default Policies

  1. Actions
    - Insert Malaysia Leave Policies with user_profile_id = NULL
    - These policies will be available to all users by default
    - Users who upload their own policies will see their custom policies instead
  
  2. Policies Included
    - Annual Leave Entitlement
    - Sick Leave Policy
    - Parental Leave Eligibility
    - Leave Application Process
    - Compassionate Leave
    - Public Holidays
    - Study Leave
    - Unpaid Leave
  
  3. Notes
    - Only inserts if these policies don't already exist
    - All policies have user_profile_id = NULL (default/shared)
*/

-- Insert Malaysia default policies only if they don't exist
INSERT INTO policies (title, category, text_doc, source_url, user_profile_id) 
SELECT * FROM (VALUES
  (
    'Annual Leave Entitlement',
    'Annual Leave',
    'Full-time employees are entitled to 18 days of paid annual leave per calendar year. Leave accrues at a rate of 1.5 days per month worked. Part-time employees receive leave on a pro-rata basis. Employees must provide at least 14 days advance notice for annual leave requests. Annual leave can be carried over up to a maximum of 5 days into the next calendar year. Unused leave beyond the carry-over limit will be forfeited.',
    NULL::text,
    NULL::uuid
  ),
  (
    'Sick Leave Policy',
    'Sick Leave',
    'All employees receive 10 days of paid sick leave annually. Sick leave does not accumulate or carry over to the next year. A medical certificate is required for absences exceeding 2 consecutive working days. Employees must notify their manager as soon as possible, preferably before their scheduled start time. Sick leave can be used for personal illness or to care for an immediate family member.',
    NULL::text,
    NULL::uuid
  ),
  (
    'Parental Leave Eligibility',
    'Parental Leave',
    'Employees with a minimum of 12 months continuous service are eligible for parental leave. Primary caregivers are entitled to 16 weeks of paid parental leave. Secondary caregivers receive 2 weeks of paid leave. Additional unpaid parental leave of up to 6 weeks is available. Employees must provide at least 4 weeks notice before the expected birth or adoption date. Medical documentation or adoption papers are required.',
    NULL::text,
    NULL::uuid
  ),
  (
    'Leave Application Process',
    'General',
    'All leave requests must be submitted to your direct manager for approval. Applications should be made at least 2 weeks in advance for planned leave. Use the company email system to request leave, copying HR. Emergency leave can be approved retroactively with valid supporting documentation. Managers will respond to leave requests within 3 business days. Approved leave will be recorded in the HR system.',
    NULL::text,
    NULL::uuid
  ),
  (
    'Compassionate Leave',
    'Special Leave',
    'Employees are entitled to 3 days of paid compassionate leave in the event of death or serious illness of an immediate family member (spouse, child, parent, sibling). Additional leave may be granted at managements discretion. Employees should notify their manager as soon as possible. Documentation may be required. This leave is separate from annual leave entitlements.',
    NULL::text,
    NULL::uuid
  ),
  (
    'Public Holidays',
    'Public Holiday',
    'The company observes all official public holidays as declared by the government. If a public holiday falls on a weekend, a replacement day off will be provided on the following Monday. Employees required to work on public holidays receive double pay or a replacement day off. Part-time employees receive public holiday pay on a pro-rata basis.',
    NULL::text,
    NULL::uuid
  ),
  (
    'Study Leave',
    'Special Leave',
    'Employees pursuing work-related education may apply for study leave. Up to 5 days per year may be granted for exam preparation or attendance. Applications must be submitted at least 1 month in advance. Proof of enrollment and course relevance is required. Study leave is separate from annual leave. Approval is subject to operational requirements and managements discretion.',
    NULL::text,
    NULL::uuid
  ),
  (
    'Unpaid Leave',
    'Unpaid Leave',
    'Unpaid leave may be granted in exceptional circumstances when all paid leave has been exhausted. Requests must be submitted to HR with justification. Approval is at managements discretion. Unpaid leave affects salary and may impact benefits accrual. Maximum unpaid leave period is 4 weeks per year unless special circumstances apply. Employee must maintain contact with HR during unpaid leave.',
    NULL::text,
    NULL::uuid
  )
) AS new_policies(title, category, text_doc, source_url, user_profile_id)
WHERE NOT EXISTS (
  SELECT 1 FROM policies 
  WHERE policies.title = new_policies.title 
  AND policies.user_profile_id IS NULL
);

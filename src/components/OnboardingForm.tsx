import React, { useState } from 'react';
import { Calendar, User, Briefcase, FileText, ArrowRight, Building2, Upload } from 'lucide-react';
import { createUserProfile, CreateUserProfileData } from '../services/userProfileService';
import { extractPoliciesFromPDF } from '../services/aiPdfExtractor';
import { deleteUserPolicies, createMultiplePolicies } from '../services/policyService';

interface OnboardingFormProps {
  onComplete: (profileId: string) => void;
  onPrivacyClick?: () => void;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({ onComplete, onPrivacyClick }) => {
  const [formData, setFormData] = useState<CreateUserProfileData>({
    name: '',
    hire_date: '',
    employment_type: 'Permanent',
    leave_balances: { annual: 18, sick: 10 },
    leaves_taken: [],
  });
  const [companyName, setCompanyName] = useState('');
  const [annualDaysTaken, setAnnualDaysTaken] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtractingPDF, setIsExtractingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // New state: user must accept privacy policy before extraction runs
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF or DOCX file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setUploadedFile(file);
      setError(null);
      setInfo(null);
      // Reset privacy acceptance when file changes to force explicit consent for the new file
      setAcceptedPrivacy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    try {
      if (!formData.hire_date) {
        setError('Please select your hire date');
        setIsSubmitting(false);
        return;
      }

      // Only annualDaysTaken is collected here. Sick stays at default (10).
      const allLeaveBalances = {
        annual: Math.max(0, 18 - annualDaysTaken),
        sick: 10
      };

      let uploadedPolicyUrl = '';
      if (uploadedFile) {
        uploadedPolicyUrl = `uploaded-policy-${Date.now()}-${uploadedFile.name}`;
      }

      const profilePayload: CreateUserProfileData = {
        name: companyName ? `${formData.name} (${companyName})` : formData.name,
        hire_date: formData.hire_date,
        employment_type: formData.employment_type,
        leave_balances: allLeaveBalances,
        leaves_taken: formData.leaves_taken,
        uploaded_policy_url: uploadedPolicyUrl || undefined,
      };

      const profile = await createUserProfile(profilePayload);

      // If user uploaded a file but did NOT accept privacy policy, skip extraction
      if (uploadedFile && !acceptedPrivacy) {
        setInfo('You uploaded a company policy, but you did not accept the privacy policy. Extraction was skipped. If you want automatic extraction, re-upload the file and accept the privacy notice.');
        // We still created the profile above; continue to completion.
        onComplete(profile.id);
        return;
      }

      // If uploadedFile exists and user accepted privacy, proceed to extract and save policies
      if (uploadedFile && acceptedPrivacy) {
        try {
          setIsExtractingPDF(true);
          console.log('[OnboardingForm] Starting PDF extraction...');
          const extractedPolicies = await extractPoliciesFromPDF(uploadedFile);
          console.log(`[OnboardingForm] Successfully extracted ${extractedPolicies.length} policies`);

          if (extractedPolicies.length > 0) {
            console.log('[OnboardingForm] Deleting user-specific policies and saving new ones...');
            await deleteUserPolicies(profile.id);

            const newPolicies = extractedPolicies.map(p => ({
              title: p.title,
              category: p.category,
              text_doc: p.content,
              source_url: null,
              user_profile_id: profile.id
            }));

            console.log('[OnboardingForm] Saving policies with user_profile_id:', profile.id);
            const savedPolicies = await createMultiplePolicies(newPolicies);
            console.log('[OnboardingForm] Policies saved successfully:', savedPolicies.length);
            setInfo(`Extracted and saved ${savedPolicies.length} policy items.`);
          } else {
            setInfo('No policy sections were detected in the uploaded document.');
          }
        } catch (pdfError) {
          console.error('[OnboardingForm] Error processing PDF:', pdfError);
          setError('There was a problem extracting policies from the uploaded file. The profile was still created.');
        } finally {
          setIsExtractingPDF(false);
        }
      }

      onComplete(profile.id);
    } catch (err) {
      console.error('Error creating profile:', err);
      setError('Failed to save your profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-6 overflow-y-auto">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-3xl relative z-10 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-2xl mb-6 border border-blue-500/30">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Let's personalize your experience
          </h1>
          <p className="text-slate-400 text-lg">
            Tell us about yourself and your leave situation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Building2 size={16} className="text-blue-400" />
                Company Name <span className="text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Acme Corp"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-slate-500 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <User size={16} className="text-blue-400" />
                Your Name <span className="text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., John"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-slate-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Calendar size={16} className="text-blue-400" />
                Hire Date
              </label>
              <input
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Briefcase size={16} className="text-blue-400" />
                Employment Type
              </label>
              <select
                value={formData.employment_type}
                onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              >
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Leaves Taken This Year</label>
            <p className="text-xs text-slate-500 mb-3">Enter the number of days you've already taken this year</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Annual Leave Days Taken</label>
                <input
                  type="number"
                  min="0"
                  max="18"
                  value={annualDaysTaken}
                  onChange={(e) => setAnnualDaysTaken(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-slate-500 transition-all"
                />
              </div>

              {/* Sick leave input removed per request */}
            </div>
          </div>

          {/* Upload + Privacy acceptance */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Upload Company Leave Policy <span className="text-slate-500">(optional)</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Upload your company's leave policy PDF to automatically extract and organize policies using AI
            </p>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="policy-upload"
              />
              <label
                htmlFor="policy-upload"
                className="flex items-center justify-center gap-3 w-full bg-slate-900 border-2 border-dashed border-slate-700 hover:border-blue-500/50 text-slate-400 hover:text-slate-300 rounded-xl px-4 py-6 cursor-pointer transition-all"
              >
                <Upload size={20} />
                {uploadedFile ? (
                  <span className="text-slate-300">{uploadedFile.name}</span>
                ) : (
                  <span>Click to upload PDF or DOCX (max 10MB)</span>
                )}
              </label>
            </div>

            {/* Privacy acceptance checkbox - required for extraction */}
            {uploadedFile && (
              <div className="mt-3 flex items-start gap-3">
                <input
                  id="accept-privacy"
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="mt-1 accent-blue-500 w-4 h-4 rounded"
                />
                <label htmlFor="accept-privacy" className="text-xs text-slate-400">
                  I consent to upload and allow automatic extraction of my company's policy for the purpose of
                  identifying leave rules. I understand extracted data will be stored and used only to personalize
                  leave calculations. Read the{' '}
                  <button
                    type="button"
                    onClick={onPrivacyClick}
                    className="text-blue-400 underline hover:text-blue-300 transition-colors"
                  >
                    privacy policy
                  </button>
                  .
                </label>
              </div>
            )}

            {!import.meta.env.VITE_OPENAI_API_KEY && uploadedFile && (
              <p className="text-xs text-amber-400 mt-2 flex items-start gap-2">
                <span className="text-amber-500">⚠</span>
                <span>OpenAI API key is required for PDF extraction. Your file will be saved but policies won't be extracted automatically.</span>
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {info && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-slate-300 text-sm">
              {info}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            {/* Skip button removed per request - only Save & Start Chatting remains */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 font-medium"
            >
              {isSubmitting ? (
                isExtractingPDF ? (
                  <>Extracting policies from PDF...</>
                ) : (
                  <>Processing...</>
                )
              ) : (
                <>
                  Save & Start Chatting
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Your information is stored securely and used only to personalize leave calculations
        </p>
      </div>
    </div>
  );
};

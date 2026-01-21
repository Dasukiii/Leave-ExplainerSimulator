import React, { useState } from 'react';
import { Calendar, User, Briefcase, FileText, ArrowRight, ArrowLeft, Building2, Upload, X } from 'lucide-react';
import { createUserProfile, CreateUserProfileData } from '../services/userProfileService';
import { extractPoliciesFromPDF } from '../services/aiPdfExtractor';
import { deleteUserPolicies, createMultiplePolicies } from '../services/policyService';

interface OnboardingFormProps {
  onComplete: (profileId: string) => void;
  onPrivacyClick?: () => void;
  onBack?: () => void;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({ onComplete, onPrivacyClick, onBack }) => {
  const [formData, setFormData] = useState<CreateUserProfileData>({
    name: '',
    hire_date: '',
    employment_type: 'Permanent',
    leave_balances: { annual: 18, sick: 10 },
    leaves_taken: [],
  });
  const [companyName, setCompanyName] = useState('');
  const [annualDaysTaken, setAnnualDaysTaken] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtractingPDF, setIsExtractingPDF] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const validFiles: File[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!allowedTypes.includes(file.type)) {
          setError(`${file.name}: Only PDF or DOCX files are allowed`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError(`${file.name}: File size must be less than 10MB`);
          continue;
        }
        const isDuplicate = uploadedFiles.some(f => f.name === file.name && f.size === file.size);
        if (!isDuplicate) {
          validFiles.push(file);
        }
      }

      if (validFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...validFiles]);
        setError(null);
        setInfo(null);
        if (uploadedFiles.length === 0) {
          setAcceptedPrivacy(false);
        }
      }
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    if (uploadedFiles.length <= 1) {
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

      const allLeaveBalances = {
        annual: Math.max(0, 18 - annualDaysTaken),
        sick: 10
      };

      let uploadedPolicyUrl = '';
      if (uploadedFiles.length > 0) {
        uploadedPolicyUrl = uploadedFiles.map(f => `uploaded-policy-${Date.now()}-${f.name}`).join(',');
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

      if (uploadedFiles.length > 0 && !acceptedPrivacy) {
        setInfo('You uploaded leave policies, but you did not accept the privacy policy. Extraction was skipped.');
        onComplete(profile.id);
        return;
      }

      if (uploadedFiles.length > 0 && acceptedPrivacy) {
        try {
          setIsExtractingPDF(true);
          console.log('[OnboardingForm] Starting PDF extraction for', uploadedFiles.length, 'files...');

          await deleteUserPolicies(profile.id);

          let totalPoliciesSaved = 0;
          const pdfFiles = uploadedFiles.filter(f => f.type === 'application/pdf');

          for (let i = 0; i < pdfFiles.length; i++) {
            const file = pdfFiles[i];
            setExtractionProgress(`Processing file ${i + 1} of ${pdfFiles.length}: ${file.name}`);

            try {
              const extractedPolicies = await extractPoliciesFromPDF(file);
              console.log(`[OnboardingForm] Extracted ${extractedPolicies.length} policies from ${file.name}`);

              if (extractedPolicies.length > 0) {
                const newPolicies = extractedPolicies.map(p => ({
                  title: p.title,
                  category: p.category,
                  text_doc: p.content,
                  source_url: file.name,
                  user_profile_id: profile.id
                }));

                const savedPolicies = await createMultiplePolicies(newPolicies);
                totalPoliciesSaved += savedPolicies.length;
              }
            } catch (fileError) {
              console.error(`[OnboardingForm] Error extracting from ${file.name}:`, fileError);
            }
          }

          if (totalPoliciesSaved > 0) {
            setInfo(`Extracted and saved ${totalPoliciesSaved} policy items from ${pdfFiles.length} file(s).`);
          } else {
            setInfo('No policy sections were detected in the uploaded documents.');
          }
        } catch (pdfError) {
          console.error('[OnboardingForm] Error processing PDFs:', pdfError);
          setError('There was a problem extracting policies. The profile was still created.');
        } finally {
          setIsExtractingPDF(false);
          setExtractionProgress('');
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
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-6 overflow-y-auto">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-3xl relative z-10 py-12">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        )}

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-2xl mb-6 border border-blue-500/30">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Let's personalize your experience
          </h1>
          <p className="text-slate-300 text-lg">
            Tell us about yourself and your leave situation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-8 space-y-6 shadow-2xl">
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
                className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-slate-400 transition-all"
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
                className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-slate-400 transition-all"
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
                className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
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
                className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              >
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Leaves Taken This Year</label>
            <p className="text-xs text-slate-400 mb-3">Enter the number of days you've already taken this year</p>
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
                  className="w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-slate-400 transition-all"
                />
              </div>

              {/* Sick leave input removed per request */}
            </div>
          </div>

          {/* Upload + Privacy acceptance */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Upload your leave policies <span className="text-slate-500">(optional)</span>
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Upload PDF files containing your leave policies. AI will extract and organize them automatically.
            </p>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.docx"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="policy-upload"
              />
              <label
                htmlFor="policy-upload"
                className="flex items-center justify-center gap-3 w-full bg-slate-800 border-2 border-dashed border-slate-600 hover:border-blue-500/50 text-slate-300 hover:text-slate-200 rounded-xl px-4 py-6 cursor-pointer transition-all"
              >
                <Upload size={20} />
                <span>Click to upload PDF or DOCX files (max 10MB each)</span>
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-blue-400 flex-shrink-0" />
                      <span className="text-sm text-slate-300 truncate">{file.name}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        ({(file.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="mt-3 flex items-start gap-3">
                <input
                  id="accept-privacy"
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="mt-1 accent-blue-500 w-4 h-4 rounded"
                />
                <label htmlFor="accept-privacy" className="text-xs text-slate-300">
                  I consent to upload and allow automatic extraction of my leave policies for the purpose of
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

            {!import.meta.env.VITE_OPENAI_API_KEY && uploadedFiles.length > 0 && (
              <p className="text-xs text-amber-400 mt-2 flex items-start gap-2">
                <span className="text-amber-500">!</span>
                <span>OpenAI API key is required for PDF extraction. Your files will be saved but policies won't be extracted automatically.</span>
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {info && (
            <div className="bg-slate-700/60 border border-slate-600 rounded-xl p-4 text-slate-200 text-sm">
              {info}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 font-medium"
            >
              {isSubmitting ? (
                isExtractingPDF ? (
                  <span className="text-center">
                    {extractionProgress || 'Extracting policies...'}
                  </span>
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

        <p className="text-center text-slate-400 text-sm mt-6">
          Your information is stored securely and used only to personalize leave calculations
        </p>
      </div>
    </div>
  );
};

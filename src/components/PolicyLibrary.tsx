import React, { useState, useEffect } from 'react';
import { getAllPolicies, Policy, deleteUserPolicies, createMultiplePolicies } from '../services/policyService';
import { Search, FileText, ChevronRight, Upload } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { extractPoliciesFromPDF } from '../services/aiPdfExtractor';
import { getUserProfileId } from '../utils/sessionUtils';

export const PolicyLibrary: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const userProfileId = getUserProfileId();

  useEffect(() => {
    console.log('[PolicyLibrary] User Profile ID from localStorage:', userProfileId);
    loadPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPolicies = async () => {
    try {
      console.log('[PolicyLibrary] Loading policies for user:', userProfileId);
      const data = await getAllPolicies(userProfileId || undefined);
      console.log('[PolicyLibrary] Loaded policies:', data.length, 'policies');
      setPolicies(data);
    } catch (error) {
      console.error('Error loading policies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const extractedPolicies = await extractPoliciesFromPDF(file);

      if (extractedPolicies.length === 0) {
        setUploadError('Could not extract policies from the PDF');
        setIsUploading(false);
        return;
      }

      if (userProfileId) {
        await deleteUserPolicies(userProfileId);
      }

      const newPolicies = extractedPolicies.map(p => ({
        title: p.title,
        category: p.category,
        text_doc: p.content,
        source_url: null,
        user_profile_id: userProfileId || null
      }));

      await createMultiplePolicies(newPolicies);
      await loadPolicies();
      setSelectedPolicy(null);
    } catch (error) {
      console.error('Error processing PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process PDF. Please try again.';
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const filteredPolicies = policies.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.text_doc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activePolicyData = policies.find(p => p.id === selectedPolicy);

  return (
    <div className="h-full flex bg-slate-900">
      <div className={`flex-1 flex flex-col border-r border-slate-700 ${selectedPolicy ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Policy Library</h2>
            <div>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="policy-pdf-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="policy-pdf-upload"
                className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer transition-colors text-sm ${
                  isUploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload size={16} />
                {isUploading ? 'Uploading...' : 'Upload PDF'}
              </label>
            </div>
          </div>

          {uploadError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {uploadError}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading || isUploading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-400">{isUploading ? 'Processing PDF...' : 'Loading policies...'}</div>
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText size={48} className="text-slate-500 mb-4" />
              <div className="text-slate-300 mb-2">No policies found</div>
              <p className="text-sm text-slate-400 max-w-xs">
                Upload a company policy PDF to replace the default policies
              </p>
            </div>
          ) : (
            <>
              {filteredPolicies.map(policy => (
                <div
                  key={policy.id}
                  onClick={() => setSelectedPolicy(policy.id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedPolicy === policy.id
                      ? 'bg-blue-600/10 border border-blue-500/50'
                      : 'bg-slate-800/30 border border-transparent hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                        <FileText className="text-blue-400" size={20} />
                      </div>
                      <div>
                        <h3 className={`font-medium ${selectedPolicy === policy.id ? 'text-blue-400' : 'text-slate-200'}`}>
                          {policy.title}
                        </h3>
                        <p className="text-xs text-slate-400">{policy.category}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-500" />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className={`flex-[1.5] bg-slate-900/50 flex-col ${selectedPolicy ? 'flex' : 'hidden md:flex'}`}>
        {activePolicyData ? (
          <>
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/20 backdrop-blur-sm">
              <div>
                <button
                  onClick={() => setSelectedPolicy(null)}
                  className="md:hidden text-sm text-slate-400 mb-2 flex items-center gap-1"
                >
                  ← Back to list
                </button>

                <h2 className="text-xl font-bold text-white">{activePolicyData.title}</h2>

                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 mt-1 inline-block">
                  {activePolicyData.category}
                </span>
              </div>

              <div className="flex gap-2">
                {/* Edit functionality removed intentionally to prevent in-app edits */}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="prose prose-invert prose-blue max-w-none">
                <ReactMarkdown>{activePolicyData.text_doc}</ReactMarkdown>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <FileText size={32} className="opacity-50" />
            </div>
            <p>Select a policy to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

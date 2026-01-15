import React from 'react';
import { ArrowLeft, Shield, Mail, MapPin, UserCheck } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen w-full bg-slate-950 relative overflow-auto">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
            <Shield className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Privacy Policy</h1>
            <p className="text-slate-400 mt-1">Personal Data Protection Act (PDPA) Compliance</p>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-slate-300 leading-relaxed">
              Leave Explainer ("we", "our", or "us") is committed to protecting your personal data in accordance with
              the Personal Data Protection Act 2010 (PDPA) of Malaysia. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <p className="text-slate-300 leading-relaxed mb-3">We may collect the following types of personal data:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Name and company information (optional)</li>
              <li>Employment details (hire date, employment type)</li>
              <li>Leave balances and leave history</li>
              <li>Uploaded company policy documents for AI-powered extraction</li>
              <li>Chat conversation history for service improvement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-slate-300 leading-relaxed mb-3">Your personal data is used for:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Personalizing leave calculations and eligibility checks</li>
              <li>Extracting and organizing leave policies from uploaded documents</li>
              <li>Providing AI-powered responses to your leave-related questions</li>
              <li>Improving our services and user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Data Storage and Security</h2>
            <p className="text-slate-300 leading-relaxed">
              Your data is stored securely using industry-standard encryption. We implement appropriate technical
              and organizational measures to protect your personal data against unauthorized access, alteration,
              disclosure, or destruction. Data is stored locally on your device and in secure cloud infrastructure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Third-Party Services</h2>
            <p className="text-slate-300 leading-relaxed">
              We use OpenAI's API to process and analyze uploaded policy documents and provide intelligent responses.
              When you upload a document or send a message, relevant content may be processed by OpenAI's servers.
              OpenAI's privacy practices are governed by their own privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Your Rights Under PDPA</h2>
            <p className="text-slate-300 leading-relaxed mb-3">Under the PDPA, you have the right to:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Access your personal data held by us</li>
              <li>Correct any inaccurate or incomplete personal data</li>
              <li>Withdraw consent for data processing</li>
              <li>Request deletion of your personal data</li>
              <li>Be informed about how your data is being used</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Data Retention</h2>
            <p className="text-slate-300 leading-relaxed">
              We retain your personal data only for as long as necessary to fulfill the purposes for which it was
              collected, or as required by applicable laws. You may request deletion of your data at any time by
              contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Changes to This Policy</h2>
            <p className="text-slate-300 leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an
              updated revision date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section className="border-t border-slate-700 pt-8">
            <h2 className="text-xl font-semibold text-white mb-6">9. Contact Us</h2>
            <p className="text-slate-300 leading-relaxed mb-6">
              If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
            </p>

            <div className="bg-slate-800/50 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-blue-400">Kadosh AI</h3>

              <div className="flex items-center gap-3 text-slate-300">
                <Mail size={18} className="text-slate-500" />
                <a href="mailto:asha@kadoshai.com" className="hover:text-blue-400 transition-colors">
                  asha@kadoshai.com
                </a>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <MapPin size={18} className="text-slate-500" />
                <span>Petaling Jaya, Malaysia</span>
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <UserCheck size={18} className="text-slate-500" />
                <span>Data Protection Officer: Colin Benedict Raj</span>
              </div>
            </div>
          </section>

          <p className="text-slate-500 text-sm pt-4 border-t border-slate-700">
            Last updated: January 2026
          </p>
        </div>
      </div>
    </div>
  );
};

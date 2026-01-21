import React, { useState } from 'react';
import { ArrowRight, MessageSquare, CheckCircle, PieChart, Loader2 } from 'lucide-react';
import kadoshIcon from '../kadosh-ai-icon.png';

interface LandingPageProps {
  onGetStarted: () => void;
  onAutoLogin?: (profileId: string) => void;
  onPrivacyClick?: () => void;
}

/**
 * Replaces Dashboard.tsx with a landing/hero style component.
 * Exported as default so it can safely replace the original Dashboard file.
 */
export default function LandingPage({ onGetStarted, onAutoLogin, onPrivacyClick }: LandingPageProps) {
  const [isCheckingSession, setIsCheckingSession] = useState(false);

  const handleGetStarted = async () => {
    setIsCheckingSession(true);

    try {
      const storedProfileId = localStorage.getItem('userProfileId');

      if (storedProfileId && onAutoLogin) {
        console.log('[LandingPage] Found existing session, attempting auto-login');
        await onAutoLogin(storedProfileId);
      } else {
        console.log('[LandingPage] No existing session, proceeding to onboarding');
        onGetStarted();
      }
    } catch (error) {
      console.error('[LandingPage] Error checking session:', error);
      onGetStarted();
    } finally {
      setIsCheckingSession(false);
    }
  };

  return (
    <div className="w-screen min-h-screen bg-slate-900 flex flex-col relative overflow-auto">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="flex-1 flex items-center justify-center z-10">
        <div className="text-center max-w-3xl px-6 py-12">
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 leading-tight">
            Instant answers to your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              leave questions
            </span>
          </h1>

          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            No HR waiting. Get instant policy citations, check personalized eligibility, and simulate your leave balances in seconds.
          </p>

          <button
            onClick={handleGetStarted}
            disabled={isCheckingSession}
            className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full text-lg transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCheckingSession ? (
              <>
                <Loader2 className="animate-spin" />
                Checking session...
              </>
            ) : (
              <>
                Get Started
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left">
            {[
              { icon: MessageSquare, title: 'AI Chatbot', desc: 'Instant answers with policy citations', glowColor: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]' },
              { icon: CheckCircle, title: 'Eligibility Check', desc: 'Personalized based on your tenure', glowColor: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.6)]' },
              { icon: PieChart, title: 'Leave Simulation', desc: 'Visualize future balance scenarios', glowColor: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]' }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl bg-slate-800/50 border border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 ${feature.glowColor}`}
                >
                  <Icon className="text-blue-400 mb-4" size={28} />
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-300 text-sm">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="relative z-10 border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-slate-400">Copyright © 2026</span>
            <span
              className="inline-flex items-center justify-center rounded-sm p-1"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
              }}
            >
              <img
                src={kadoshIcon}
                alt="Kadosh AI"
                className="w-20 h-6 object-contain rounded-sm"
              />
            </span>
            <span className="text-slate-400">All rights reserved.</span>
            <span className="text-slate-500 mx-2">|</span>
            <button
              onClick={onPrivacyClick}
              className="text-slate-400 hover:text-blue-400 transition-colors"
            >
              PDPA Policy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

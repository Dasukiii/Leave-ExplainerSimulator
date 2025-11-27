import React, { useState } from 'react';
import { ArrowRight, MessageSquare, CheckCircle, PieChart, Loader2 } from 'lucide-react';
import kadoshIcon from '../kadosh-ai-icon.png';

interface LandingPageProps {
  onGetStarted: () => void;
  onAutoLogin?: (profileId: string) => void;
}

/**
 * Replaces Dashboard.tsx with a landing/hero style component.
 * Exported as default so it can safely replace the original Dashboard file.
 */
export default function LandingPage({ onGetStarted, onAutoLogin }: LandingPageProps) {
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
    <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="z-10 text-center max-w-3xl px-6">
        <div className="inline-flex flex-col items-center gap-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 text-xs font-medium animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            AI-Powered HR Assistant
          </div>

          {/* Powered by Kadosh icon (small, subtle) */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Powered by</span>
            <span
              className="inline-flex items-center justify-center rounded-md p-0.5"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <img
                src={kadoshIcon}
                alt="Kadosh AI"
                className="w-6 h-6 object-contain rounded-sm"
                // it's fine to adjust filter or bg here if you want to hide white background:
                // e.g. style={{ filter: 'grayscale(0.2) contrast(0.95)' }}
              />
            </span>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 leading-tight">
          Instant answers to your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
            leave questions
          </span>
        </h1>

        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
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

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left">
          {[
            { icon: MessageSquare, title: 'AI Chatbot', desc: 'Instant answers with policy citations' },
            { icon: CheckCircle, title: 'Eligibility Check', desc: 'Personalized based on your tenure' },
            { icon: PieChart, title: 'Leave Simulation', desc: 'Visualize future balance scenarios' }
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-sm hover:bg-slate-900/60 transition-colors"
              >
                <Icon className="text-blue-400 mb-4" size={28} />
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

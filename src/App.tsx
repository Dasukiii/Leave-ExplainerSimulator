import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import { PolicyLibrary } from './components/PolicyLibrary';
import LandingPage from './components/LandingPage';
import { OnboardingForm } from './components/OnboardingForm';
import { AppView, User } from './types';
import { getUserProfile } from './services/userProfileService';
import { generateSessionToken, setSessionToken, setUserProfileId as saveUserProfileId, getUserProfileId, clearSession } from './utils/sessionUtils';
import { validateSession } from './services/sessionValidationService';
import { Settings as SettingsIcon } from 'lucide-react';

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [isLoading, setIsLoading] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const loadUserProfile = async (profileId: string) => {
    try {
      const profile = await getUserProfile(profileId);
      if (profile) {
        let tenureYears = 0;
        if (profile.hire_date) {
          const hireDate = new Date(profile.hire_date);
          const now = new Date();
          tenureYears = (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        }

        setUser({
          id: profile.id,
          name: profile.name || 'User',
          email: 'user@company.com',
          role: profile.employment_type || 'Full-time',
          tenureYears: Math.floor(tenureYears * 10) / 10,
          balances: {
            annual: profile.leave_balances?.annual || 18,
            sick: profile.leave_balances?.sick || 10,
          },
        });
        setHasOnboarded(true);
        setHasStarted(true);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoLogin = async (profileId: string) => {
    try {
      console.log('[App] Attempting auto-login with profile:', profileId);
      const validation = await validateSession(profileId);

      if (validation.isValid) {
        console.log('[App] Session valid, loading profile');
        await loadUserProfile(profileId);
        setWelcomeMessage(`Welcome back!`);
        setTimeout(() => setWelcomeMessage(null), 3000);
      } else {
        console.log('[App] Session invalid, clearing and showing onboarding');
        clearSession();
        setHasStarted(true);
        setHasOnboarded(false);
      }
    } catch (error) {
      console.error('[App] Auto-login error:', error);
      clearSession();
      setHasStarted(true);
      setHasOnboarded(false);
    }
  };

  const handleOnboardingComplete = (profileId: string) => {
    console.log('[App] Onboarding complete, saving profile ID:', profileId);
    const sessionToken = generateSessionToken();
    setSessionToken(sessionToken);
    saveUserProfileId(profileId);
    setUserProfileId(profileId);
    loadUserProfile(profileId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <LandingPage
        onGetStarted={() => setHasStarted(true)}
        onAutoLogin={handleAutoLogin}
      />
    );
  }

  if (!hasOnboarded) {
    return <OnboardingForm onComplete={handleOnboardingComplete} />;
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Error loading user profile</div>
      </div>
    );
  }

  const handleLogout = () => {
    clearSession();
    setHasStarted(false);
    setHasOnboarded(false);
    setUserProfileId(null);
    setUser(null);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.CHAT:
        return <ChatInterface user={user} />;
      case AppView.PROFILE:
        return (
          <Dashboard
            userId={user.id}
            userName={user.name}
            userEmail={user.email}
            userRole={user.role}
            onLogout={handleLogout}
            isActive={currentView === AppView.PROFILE} // <-- added prop so Dashboard can replay charts
          />
        );
      case AppView.POLICIES:
        return <PolicyLibrary />;
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} user={user} onLogout={handleLogout} />

      <main className="flex-1 ml-64 relative z-10 h-full">
        {renderContent()}
      </main>

      {welcomeMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-slate-700 rounded-lg px-6 py-3 shadow-2xl animate-fade-in">
          <p className="text-sm text-slate-200">{welcomeMessage}</p>
        </div>
      )}
    </div>
  );
};

export default App;

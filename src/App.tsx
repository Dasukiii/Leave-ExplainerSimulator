import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import { PolicyLibrary } from './components/PolicyLibrary';
import LandingPage from './components/LandingPage';
import { OnboardingForm } from './components/OnboardingForm';
import { AppView, User } from './types';
import { getUserProfile } from './services/userProfileService';
import { generateSessionToken, setSessionToken, setUserProfileId, getUserProfileId, clearSession } from './utils/sessionUtils';
import { Settings as SettingsIcon } from 'lucide-react';

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedProfileId = getUserProfileId();
    if (storedProfileId) {
      setUserProfileId(storedProfileId);
      loadUserProfile(storedProfileId);
    } else {
      setIsLoading(false);
    }
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

  const handleOnboardingComplete = (profileId: string) => {
    const sessionToken = generateSessionToken();
    setSessionToken(sessionToken);
    setUserProfileId(profileId);
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
    return <LandingPage onGetStarted={() => setHasStarted(true)} />;
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
          />
        );
      case AppView.POLICIES:
        return <PolicyLibrary />;
      case AppView.SETTINGS:
        return (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <SettingsIcon size={32} className="opacity-50" />
            </div>
            <p>Settings panel coming soon</p>
          </div>
        );
      default:
        return <ChatInterface user={user} />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} user={user} onLogout={handleLogout} />

      <main className="flex-1 ml-64 relative z-10 h-full">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;

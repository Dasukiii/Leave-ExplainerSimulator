import React, { useState } from 'react';
import { AppView, User as UserType } from '../types';
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Settings,
  LogOut,
  User,
  Sparkles
} from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  user?: UserType | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, user, onLogout }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => onChangeView(view)}
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
          isActive 
            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
        }`}
      >
        <Icon size={20} className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
        <span className="font-medium text-sm">{label}</span>
      </button>
    );
  };

  return (
    <div className="w-64 h-screen bg-slate-950/50 backdrop-blur-xl border-r border-slate-800 flex flex-col p-4 fixed left-0 top-0 z-20">
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-2 mb-8 mt-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Sparkles className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">LeaveExplainer AI</h1>
          <p className="text-xs text-slate-500">Your Personal Leave Assistant</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-2">
        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">Menu</div>
        <NavItem view={AppView.CHAT} icon={MessageSquare} label="AI Assistant" />
        <NavItem view={AppView.PROFILE} icon={LayoutDashboard} label="My Profile" />
        <NavItem view={AppView.POLICIES} icon={BookOpen} label="Policy Library" />
        <NavItem view={AppView.SETTINGS} icon={Settings} label="Settings" />
      </div>

      {/* User Mini Profile */}
      <div className="mt-auto pt-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-900/50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
            {user?.name ? (
              <span className="text-sm font-semibold">{user.name.charAt(0).toUpperCase()}</span>
            ) : (
              <User size={16} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-300 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role || 'Employee'}</p>
          </div>
          {onLogout && (
            <button
              onClick={handleLogoutClick}
              className="text-slate-500 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        title="Confirm Logout"
        message="You may lose your session data if you quit now, are you sure?"
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { AppView, User as UserType } from '../types';
import {
  MessageSquare,
  BookOpen,
  LogOut,
  User,
  Sparkles,
  Calendar,
  Award,
  Edit2,
  Save,
  X,
  Clock as ClockIcon,
} from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import { getUserProfile, updateUserProfile, UserProfile } from '../services/userProfileService';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  user?: UserType | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, user, onLogout }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    hire_date: '',
    employment_type: '',
    annual_balance: 0,
  });
  const [reloadKey, setReloadKey] = useState<number>(() => Date.now());

  useEffect(() => {
    if (user?.id) {
      loadUserProfile();
    }
  }, [user?.id]);

  const loadUserProfile = async () => {
    if (!user?.id) return;
    try {
      const profile = await getUserProfile(user.id);
      if (profile) {
        setUserProfile(profile);
        setEditForm({
          name: profile.name || '',
          hire_date: profile.hire_date || '',
          employment_type: profile.employment_type || '',
          annual_balance: profile.leave_balances?.annual || 0,
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!user?.id) return;
    try {
      await updateUserProfile(user.id, {
        name: editForm.name,
        hire_date: editForm.hire_date,
        employment_type: editForm.employment_type,
        leave_balances: {
          annual: editForm.annual_balance,
          sick: userProfile?.leave_balances?.sick || 10,
        },
      });
      await loadUserProfile();
      setIsEditing(false);
      setReloadKey(Date.now());
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const calculateTenure = (hireDate: string): number => {
    if (!hireDate) return 0;
    const hire = new Date(hireDate);
    const now = new Date();
    const years = (now.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return Math.floor(years * 10) / 10;
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

  const annualLeaveTotal = 18;
  const annualLeaveRemaining = userProfile?.leave_balances?.annual || 0;
  const annualLeaveUsed = annualLeaveTotal - annualLeaveRemaining;
  const tenure = calculateTenure(userProfile?.hire_date || '');

  const pieData = [
    { name: 'Used', value: Math.max(0, annualLeaveUsed) },
    { name: 'Remaining', value: Math.max(0, annualLeaveRemaining) },
  ];
  const COLORS = ['#334155', '#10b981'];

  return (
    <div className="w-80 h-screen bg-slate-900/50 backdrop-blur-xl border-r border-slate-700 flex flex-col p-4 fixed left-0 top-0 z-20 overflow-y-auto">
      <div className="flex items-center gap-3 px-2 mb-6 mt-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Sparkles className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">LeaveExplainer AI</h1>
          <p className="text-xs text-slate-400">Your Personal Leave Assistant</p>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Menu</div>
        <NavItem view={AppView.CHAT} icon={MessageSquare} label="AI Assistant" />
        <NavItem view={AppView.POLICIES} icon={BookOpen} label="Policy Library" />
      </div>

      <div className="space-y-4 flex-1 mb-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">Profile</div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 backdrop-blur-sm">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Hire Date</label>
                <input
                  type="date"
                  value={editForm.hire_date}
                  onChange={(e) => setEditForm({ ...editForm, hire_date: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Employment Type</label>
                <select
                  value={editForm.employment_type}
                  onChange={(e) => setEditForm({ ...editForm, employment_type: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Annual Leave Balance</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.annual_balance}
                  onChange={(e) => setEditForm({ ...editForm, annual_balance: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors"
                >
                  <Save size={14} />
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-700 text-slate-200 rounded-lg text-sm hover:bg-slate-600 transition-colors"
                >
                  <X size={14} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Hire Date</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-200 text-xs font-medium">
                      {userProfile?.hire_date ? new Date(userProfile.hire_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Tenure</p>
                  <div className="flex items-center gap-1">
                    <Award className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-200 text-xs font-medium">{tenure} Years</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="w-full mt-2 py-2 flex items-center justify-center gap-2 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-lg text-xs hover:bg-blue-600/20 transition-colors"
              >
                <Edit2 size={14} />
                Edit Details
              </button>
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="text-slate-300 text-xs font-medium">Annual Leave</h4>
              <h3 className="text-2xl font-bold text-white mt-1">
                {annualLeaveRemaining} <span className="text-xs text-slate-400 font-normal">days</span>
              </h3>
            </div>
            <div className="h-8 w-8 bg-green-500/10 rounded-full flex items-center justify-center">
              <ClockIcon className="text-green-400" size={16} />
            </div>
          </div>

          <div className="h-28 w-full -mt-2 flex items-center">
            <ResponsiveContainer key={`pie-${reloadKey}`} width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="55%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={32}
                  outerRadius={48}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={true}
                  animationDuration={800}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between text-xs text-slate-400 -mt-4 px-4">
            <span>Used ({annualLeaveUsed})</span>
            <span>Total ({annualLeaveTotal})</span>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-700">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-slate-200">
            {user?.name ? (
              <span className="text-sm font-semibold">{user.name.charAt(0).toUpperCase()}</span>
            ) : (
              <User size={16} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.role || 'Employee'}</p>
          </div>
          {onLogout && (
            <button
              onClick={handleLogoutClick}
              className="text-slate-400 hover:text-red-400 transition-colors"
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

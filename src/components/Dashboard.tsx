import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Award,
  Clock as ClockIcon,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { getUserProfile, updateUserProfile, UserProfile } from '../services/userProfileService';

interface DashboardProps {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  onLogout: () => void;
  /**
   * NEW: when true, Dashboard will remount charts to replay animations.
   * Parent should pass `isActive={currentView === AppView.PROFILE}` (or equivalent).
   */
  isActive?: boolean;
}

export default function Dashboard({
  userId,
  userName,
  userEmail,
  userRole,
  onLogout,
  isActive = false,
}: DashboardProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    hire_date: '',
    employment_type: '',
    annual_balance: 0,
    sick_balance: 0,
  });

  // reloadKey forces chart remount when changed
  const [reloadKey, setReloadKey] = useState<number>(() => Date.now());

  // Only trigger chart remount when navigating inside the app:
  useEffect(() => {
    if (isActive) {
      // small delay so any mounting UI settles — optional, but smoother
      const t = window.setTimeout(() => setReloadKey(Date.now()), 40);
      return () => clearTimeout(t);
    }
    // if not active we do nothing (no chart remount)
    return;
  }, [isActive]);

  useEffect(() => {
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile(userId);
      if (profile) {
        setUserProfile(profile);
        setEditForm({
          name: profile.name || '',
          hire_date: profile.hire_date || '',
          employment_type: profile.employment_type || '',
          annual_balance: profile.leave_balances?.annual || 0,
          sick_balance: profile.leave_balances?.sick || 0,
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateUserProfile(userId, {
        name: editForm.name,
        hire_date: editForm.hire_date,
        employment_type: editForm.employment_type,
        leave_balances: {
          annual: editForm.annual_balance,
          sick: editForm.sick_balance,
        },
      });
      await loadUserProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const calculateTenure = (hireDate: string): number => {
    if (!hireDate) return 0;
    const hire = new Date(hireDate);
    const now = new Date();
    const years = (now.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return Math.floor(years * 10) / 10;
  };

  const calculateLeaveUsed = (leaveType: string): number => {
    if (!userProfile?.leaves_taken) return 0;
    return userProfile.leaves_taken
      .filter((leave) => leave.type === leaveType)
      .reduce((sum, leave) => sum + leave.days, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen overflow-y-auto bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-slate-400">Loading profile...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen overflow-y-auto bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-slate-400">Profile not found</div>
      </div>
    );
  }

  const annualLeaveTotal = 18;
  const sickLeaveTotal = 10;
  const annualLeaveRemaining = userProfile.leave_balances?.annual || 0;
  const sickLeaveRemaining = userProfile.leave_balances?.sick || 0;
  const annualLeaveUsed = annualLeaveTotal - annualLeaveRemaining;
  const sickLeaveUsed = sickLeaveTotal - sickLeaveRemaining;
  const tenure = calculateTenure(userProfile.hire_date || '');

  const pieData = [
    { name: 'Used', value: Math.max(0, annualLeaveUsed) },
    { name: 'Remaining', value: Math.max(0, annualLeaveRemaining) },
  ];
  // green palette
  const COLORS = ['#334155', '#10b981'];

  const barData = [
    {
      name: 'Annual',
      total: annualLeaveTotal,
      used: annualLeaveUsed,
      remaining: annualLeaveRemaining,
    },
    {
      name: 'Sick',
      total: sickLeaveTotal,
      used: sickLeaveUsed,
      remaining: sickLeaveRemaining,
    },
  ];

  return (
    <div className="min-h-screen overflow-y-auto bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">My Profile</h2>
            <p className="text-slate-400">View and manage your leave details</p>
          </div>

          {/* Export Summary removed intentionally */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Hire Date</label>
                  <input
                    type="date"
                    value={editForm.hire_date}
                    onChange={(e) => setEditForm({ ...editForm, hire_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Employment Type</label>
                  <select
                    value={editForm.employment_type}
                    onChange={(e) => setEditForm({ ...editForm, employment_type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Sick Leave Balance</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.sick_balance}
                    onChange={(e) => setEditForm({ ...editForm, sick_balance: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors"
                  >
                    <Save size={16} />
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-3xl font-bold text-slate-500">
                  {(userProfile.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{userProfile.name || 'User'}</h3>
                  <p className="text-blue-400 text-sm">{userProfile.employment_type || 'Employee'}</p>
                </div>

                <div className="w-full grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800">
                  <div className="text-center">
                    <p className="text-slate-500 text-xs uppercase tracking-wide">Hire Date</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-200 font-medium">
                        {userProfile.hire_date ? new Date(userProfile.hire_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-slate-500 text-xs uppercase tracking-wide">Tenure</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Award className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-200 font-medium">{tenure} Years</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full mt-4 py-2 flex items-center justify-center gap-2 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-lg text-sm hover:bg-blue-600/20 transition-colors"
                >
                  <Edit2 size={16} />
                  Edit Details
                </button>
              </div>
            )}
          </div>

          <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-sm hover:border-slate-700 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-slate-500 font-medium">Annual Leave</h4>
                  <h1 className="text-4xl font-bold text-white mt-2">
                    {annualLeaveRemaining} <span className="text-sm text-slate-500 font-normal">days left</span>
                  </h1>
                </div>
                <div className="h-10 w-10 bg-green-500/10 rounded-full flex items-center justify-center">
                  <ClockIcon className="text-green-400" />
                </div>
              </div>

              {/* lifted the pie a bit (reduced top margin) and centered vertically by changing cy */}
              <div className="h-36 w-full mt-2 flex items-center">
                <ResponsiveContainer key={`pie-${reloadKey}`} width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="55%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive={true}
                      animationDuration={800}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-between text-xs text-slate-500 -mt-6 px-8">
                <span>Used ({annualLeaveUsed})</span>
                <span>Total ({annualLeaveTotal})</span>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-sm flex flex-col justify-between hover:border-slate-700 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-slate-400 font-medium">Sick Leave</h4>
                  <h1 className="text-4xl font-bold text-white mt-2">
                    {sickLeaveRemaining} <span className="text-sm text-slate-500 font-normal">days left</span>
                  </h1>
                </div>
                <div className="h-10 w-10 bg-pink-500/10 rounded-full flex items-center justify-center">
                  <ClockIcon className="text-pink-400" />
                </div>
              </div>

              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-pink-500 h-full rounded-full"
                  style={{ width: `${(sickLeaveRemaining / sickLeaveTotal) * 100}%` }}
                />
              </div>

              <p className="text-xs text-slate-500 mt-2">
                {sickLeaveUsed} of {sickLeaveTotal} days used
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Leave Overview</h3>
            <div className="flex gap-2">
              {/* only Yearly label retained */}
              <span className="px-3 py-1 rounded-lg bg-slate-800 text-xs text-white">Yearly</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer key={`bar-${reloadKey}`} width="100%" height="100%">
              <BarChart data={barData} layout="vertical" barSize={18}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#64748b" width={80} tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#e2e8f0' }}
                />
                <Bar dataKey="used" stackId="a" fill="#065f46" radius={[6, 0, 0, 6]} isAnimationActive={true} animationDuration={800} />
                <Bar dataKey="remaining" stackId="a" fill="#10b981" radius={[0, 6, 6, 0]} isAnimationActive={true} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

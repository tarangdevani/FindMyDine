
import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Store, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { getAdminStats, AdminStats } from '../../../services/adminService';

export const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats().then(data => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400"/></div>;

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
       <div className={`w-14 h-14 rounded-full flex items-center justify-center ${color}`}>
          <Icon size={24} className="text-white"/>
       </div>
       <div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black text-slate-900">{value}</h3>
       </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in-up">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Platform Revenue" value={`$${stats?.platformRevenue.toFixed(2)}`} icon={DollarSign} color="bg-emerald-500" />
          <StatCard title="Total Reservations" value={stats?.totalReservations} icon={Calendar} color="bg-blue-500" />
          <StatCard title="Active Restaurants" value={stats?.totalRestaurants} icon={Store} color="bg-orange-500" />
          <StatCard title="Total Users" value={stats?.totalUsers} icon={Users} color="bg-purple-500" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={20}/> Growth Analytics</h3>
             <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm font-medium">Chart Visualization Coming Soon</p>
             </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
             <h3 className="text-lg font-bold text-slate-800 mb-4">Pending Actions</h3>
             <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl border border-orange-100">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-500 font-bold shadow-sm">{stats?.pendingWithdrawals}</div>
                      <span className="font-bold text-orange-900">Pending Withdrawals</span>
                   </div>
                   <button className="text-xs font-bold text-orange-600 hover:underline">Review</button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

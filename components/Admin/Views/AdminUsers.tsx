
import React, { useEffect, useState } from 'react';
import { Loader2, User, Ban, CheckCircle } from 'lucide-react';
import { UserProfile } from '../../../types';
import { getAllCustomers, toggleUserStatus } from '../../../services/adminService';
import { useToast } from '../../../context/ToastContext';

export const AdminUsers: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const data = await getAllCustomers();
    setUsers(data);
    setLoading(false);
  };

  const handleToggleStatus = async (uid: string, isActive: boolean) => {
    if(!confirm(`Are you sure you want to ${isActive ? 'ban' : 'unban'} this user?`)) return;
    await toggleUserStatus(uid, !isActive);
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, isActive: !isActive } : u));
    showToast(`User ${!isActive ? 'activated' : 'banned'}`, 'info');
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400"/></div>;

  return (
    <div className="animate-fade-in-up">
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
             <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Joined</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                   <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Action</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                   <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                               <User size={16}/>
                            </div>
                            <div>
                               <p className="font-bold text-slate-900">{u.displayName || 'User'}</p>
                               <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                         {/* Firestore usually stores iso strings in our setup */}
                         {/* createdAt might be missing on very old mock data */}
                         {/* @ts-ignore */}
                         {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${(u.isActive ?? true) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {(u.isActive ?? true) ? 'Active' : 'Banned'}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button 
                            onClick={() => handleToggleStatus(u.uid, u.isActive ?? true)}
                            className={`p-2 rounded-lg transition-colors ${(u.isActive ?? true) ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-green-400 hover:bg-green-50 hover:text-green-600'}`}
                            title={(u.isActive ?? true) ? "Ban User" : "Activate User"}
                         >
                            {(u.isActive ?? true) ? <Ban size={18}/> : <CheckCircle size={18}/>}
                         </button>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};

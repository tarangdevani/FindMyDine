
import React, { useEffect, useState } from 'react';
import { Loader2, Store, CheckCircle, Ban, Search } from 'lucide-react';
import { RestaurantProfile } from '../../../types';
import { getAllRestaurants, verifyRestaurant, toggleUserStatus } from '../../../services/adminService';
import { useToast } from '../../../context/ToastContext';

export const AdminRestaurants: React.FC = () => {
  const { showToast } = useToast();
  const [restaurants, setRestaurants] = useState<RestaurantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const data = await getAllRestaurants();
    setRestaurants(data);
    setLoading(false);
  };

  const handleVerify = async (uid: string, currentStatus: boolean) => {
    await verifyRestaurant(uid, !currentStatus);
    setRestaurants(prev => prev.map(r => r.uid === uid ? { ...r, isVerified: !currentStatus } : r));
    showToast(`Restaurant ${!currentStatus ? 'verified' : 'unverified'}`, 'success');
  };

  const handleSuspend = async (uid: string, isActive: boolean) => {
    if(!confirm(`Are you sure you want to ${isActive ? 'suspend' : 'activate'} this restaurant?`)) return;
    await toggleUserStatus(uid, !isActive);
    // Note: In a real app, isActive might default to undefined (true). Handle safely.
    const newStatus = !isActive;
    setRestaurants(prev => prev.map(r => r.uid === uid ? { ...r, isActive: newStatus } : r));
    showToast(`Restaurant ${newStatus ? 'activated' : 'suspended'}`, 'info');
  };

  const filtered = restaurants.filter(r => 
    (r.restaurantName || '').toLowerCase().includes(search.toLowerCase()) || 
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400"/></div>;

  return (
    <div className="space-y-6 animate-fade-in-up">
       <div className="flex justify-between items-center">
          <div className="relative w-96">
             <Search size={18} className="absolute left-3 top-3 text-slate-400" />
             <input 
                type="text" 
                placeholder="Search restaurants..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-slate-500 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
          </div>
          <div className="text-sm font-bold text-slate-500">Total: {restaurants.length}</div>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
             <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Restaurant</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Location</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Verification</th>
                   <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {filtered.map(r => (
                   <tr key={r.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                               {r.logoUrl ? <img src={r.logoUrl} className="w-full h-full object-cover rounded-lg"/> : <Store size={18}/>}
                            </div>
                            <div>
                               <p className="font-bold text-slate-900">{r.restaurantName}</p>
                               <p className="text-xs text-slate-500">{r.email}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{r.address || 'N/A'}</td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${(r.isActive ?? true) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {(r.isActive ?? true) ? 'Active' : 'Suspended'}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                         {r.isVerified ? (
                            <span className="flex items-center gap-1 text-blue-600 font-bold text-xs"><CheckCircle size={14}/> Verified</span>
                         ) : (
                            <span className="text-slate-400 text-xs font-medium">Unverified</span>
                         )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                         <button 
                            onClick={() => handleVerify(r.uid, r.isVerified || false)}
                            className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors"
                         >
                            {r.isVerified ? 'Unverify' : 'Verify'}
                         </button>
                         <button 
                            onClick={() => handleSuspend(r.uid, r.isActive ?? true)}
                            className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${(r.isActive ?? true) ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                         >
                            {(r.isActive ?? true) ? 'Suspend' : 'Activate'}
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

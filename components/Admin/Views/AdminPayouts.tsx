
import React, { useEffect, useState } from 'react';
import { Loader2, DollarSign, Check, X, Building2 } from 'lucide-react';
import { Transaction } from '../../../types';
import { getPayoutRequests, processPayout } from '../../../services/adminService';
import { useToast } from '../../../context/ToastContext';

export const AdminPayouts: React.FC = () => {
  const { showToast } = useToast();
  const [payouts, setPayouts] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const data = await getPayoutRequests();
    setPayouts(data);
    setLoading(false);
  };

  const handleProcess = async (id: string, action: 'approve' | 'reject') => {
    if(!confirm(`Confirm ${action} withdrawal?`)) return;
    setProcessingId(id);
    const success = await processPayout(id, action);
    if(success) {
        setPayouts(prev => prev.filter(p => p.id !== id));
        showToast(`Payout ${action}ed successfully`, 'success');
    } else {
        showToast('Action failed', 'error');
    }
    setProcessingId(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400"/></div>;

  return (
    <div className="space-y-6 animate-fade-in-up">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payouts.length === 0 ? (
             <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400">
                <DollarSign size={48} className="mx-auto mb-4 opacity-20"/>
                <p>No pending payout requests.</p>
             </div>
          ) : (
             payouts.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                            <Building2 size={18}/>
                         </div>
                         <div>
                            {/* We assume restaurantId is the UID, fetching name requires a join or storing name in metadata. For now showing ID/Amount */}
                            <p className="font-bold text-slate-900">Restaurant Payout</p>
                            <p className="text-xs text-slate-400 font-mono">ID: {p.restaurantId.slice(0,8)}...</p>
                         </div>
                      </div>
                      <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded uppercase">Pending</span>
                   </div>
                   
                   <div className="mb-6">
                      <p className="text-xs font-bold text-slate-400 uppercase">Amount Requested</p>
                      <p className="text-3xl font-black text-slate-900">${Math.abs(p.amount).toFixed(2)}</p>
                      <p className="text-xs text-slate-500 mt-1">Date: {new Date(p.createdAt).toLocaleDateString()}</p>
                   </div>

                   <div className="mt-auto grid grid-cols-2 gap-3">
                      <button 
                        disabled={!!processingId}
                        onClick={() => handleProcess(p.id!, 'reject')}
                        className="flex items-center justify-center gap-2 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-600 rounded-lg text-sm font-bold transition-colors"
                      >
                         <X size={16}/> Reject
                      </button>
                      <button 
                        disabled={!!processingId}
                        onClick={() => handleProcess(p.id!, 'approve')}
                        className="flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
                      >
                         {processingId === p.id ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>} Approve
                      </button>
                   </div>
                </div>
             ))
          )}
       </div>
    </div>
  );
};

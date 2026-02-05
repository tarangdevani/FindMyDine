
import React, { useState, useEffect } from 'react';
import { Transaction, WalletStats } from '../../types';
import { getTransactions, getWalletStats, requestWithdrawal } from '../../services/walletService';
import { getRestaurantProfile } from '../../services/restaurantService';
import { useToast } from '../../context/ToastContext';
import { Loader2, AlertTriangle, X } from 'lucide-react';
import { Button } from '../UI/Button';
import { DashboardView } from './Sidebar';

// Child Components (Internal for simplicity, but could be separated)
import { WalletHeader } from './Wallet/WalletHeader';
import { BalanceCard } from './Wallet/BalanceCard';
import { TransactionList } from './Wallet/TransactionList';
import { TransactionDetailsModal } from './Wallet/TransactionDetailsModal';

interface WalletProps {
  userId: string;
  onNavigate: (view: DashboardView) => void;
}

export const Wallet: React.FC<WalletProps> = ({ userId, onNavigate }) => {
  const { showToast } = useToast();
  const [stats, setStats] = useState<WalletStats>({ availableBalance: 0, pendingBalance: 0, totalEarnings: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankInfoMissing, setBankInfoMissing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [statsData, txnsData, profile] = await Promise.all([
            getWalletStats(userId),
            getTransactions(userId),
            getRestaurantProfile(userId)
        ]);
        setStats(statsData);
        setTransactions(txnsData);
        // Check if bank info is configured
        setBankInfoMissing(!profile?.bankInfoConfigured); 
    } catch (e) {
        console.error(e);
        showToast("Failed to load wallet data", "error");
    } finally {
        setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (stats.availableBalance <= 0) return;
    if (bankInfoMissing) {
        showToast("Please update your bank information in Settings first.", "warning");
        return;
    }
    
    setWithdrawing(true);
    const success = await requestWithdrawal(userId, stats.availableBalance);
    if (success) {
        showToast("Withdrawal request submitted", "success");
        fetchData();
    } else {
        showToast("Withdrawal failed", "error");
    }
    setWithdrawing(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32}/></div>;

  return (
    <div className="animate-fade-in-up pb-10 space-y-6">
       
       <WalletHeader />

       {bankInfoMissing && (
           <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-3">
               <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={20} />
               <div>
                   <h4 className="font-bold text-orange-800 text-sm">Action Required: Add Bank Details</h4>
                   <p className="text-orange-700 text-xs mt-1">
                     You must configure your payout method in Settings before you can withdraw funds. 
                     <button 
                       onClick={() => onNavigate('settings')} 
                       className="underline font-bold ml-1 hover:text-orange-900"
                     >
                       Go to Settings
                     </button>
                   </p>
               </div>
           </div>
       )}

       <BalanceCard 
          stats={stats} 
          onWithdraw={handleWithdraw} 
          isWithdrawing={withdrawing} 
          canWithdraw={!bankInfoMissing && stats.availableBalance > 0}
       />

       <TransactionList 
          transactions={transactions} 
          onSelect={setSelectedTransaction} 
       />

       <TransactionDetailsModal 
          isOpen={!!selectedTransaction}
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
       />

    </div>
  );
};

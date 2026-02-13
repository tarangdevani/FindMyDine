
import React, { useState, useEffect } from 'react';
import { Transaction, WalletStats } from '../../types';
import { getTransactionsPaginated, getWalletStats, requestWithdrawal } from '../../services/walletService';
import { getRestaurantProfile } from '../../services/restaurantService';
import { useToast } from '../../context/ToastContext';
import { AlertTriangle } from 'lucide-react';
import { DashboardView } from './Sidebar';
import { Skeleton } from '../UI/Skeleton';

// Child Components
import { WalletHeader } from './Wallet/WalletHeader';
import { BalanceCard } from './Wallet/BalanceCard';
import { TransactionList } from './Wallet/TransactionList';
import { TransactionDetailsModal } from './Wallet/TransactionDetailsModal';

interface WalletProps {
  userId: string;
  onNavigate: (view: DashboardView) => void;
}

const PAGE_SIZE = 15;

export const Wallet: React.FC<WalletProps> = ({ userId, onNavigate }) => {
  const { showToast } = useToast();
  
  // Stats
  const [stats, setStats] = useState<WalletStats>({ availableBalance: 0, pendingBalance: 0, totalEarnings: 0 });
  
  // Transactions Data & Pagination State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters State
  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [bankInfoMissing, setBankInfoMissing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    // Initial Load
    fetchStats();
    fetchTransactions(true);
  }, [userId]);

  // Refetch when filters change
  useEffect(() => {
    fetchTransactions(true);
  }, [filterType, startDate, endDate]);

  const fetchStats = async () => {
    try {
        const [statsData, profile] = await Promise.all([
            getWalletStats(userId),
            getRestaurantProfile(userId)
        ]);
        setStats(statsData);
        setBankInfoMissing(!profile?.bankInfoConfigured); 
    } catch(e) { console.error(e); }
  };

  const fetchTransactions = async (reset: boolean = false) => {
    if (reset) {
        setLoadingInitial(true);
        setTransactions([]);
        setLastDoc(null);
        setHasMore(true);
    } else {
        setLoadingMore(true);
    }

    try {
        const result = await getTransactionsPaginated(
            userId, 
            PAGE_SIZE, 
            reset ? null : lastDoc,
            { type: filterType, startDate, endDate }
        );

        if (reset) {
            setTransactions(result.data);
        } else {
            setTransactions(prev => [...prev, ...result.data]);
        }

        setLastDoc(result.lastDoc);
        setHasMore(result.data.length === PAGE_SIZE);
    } catch (e) {
        console.error(e);
        showToast("Failed to load transactions", "error");
    } finally {
        setLoadingInitial(false);
        setLoadingMore(false);
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
        fetchStats();
        fetchTransactions(true); // Refresh list to show pending withdrawal
    } else {
        showToast("Withdrawal failed", "error");
    }
    setWithdrawing(false);
  };

  if (loadingInitial && transactions.length === 0) {
      return (
        <div className="animate-fade-in-up pb-10 space-y-6">
            <WalletHeader />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      );
  }

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
          filterType={filterType}
          setFilterType={setFilterType}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          hasMore={hasMore}
          onLoadMore={() => fetchTransactions(false)}
          isLoadingMore={loadingMore}
       />

       <TransactionDetailsModal 
          isOpen={!!selectedTransaction}
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
       />

    </div>
  );
};


import React from 'react';
import { DollarSign, Clock, TrendingUp } from 'lucide-react';
import { Button } from '../../UI/Button';
import { WalletStats } from '../../../types';

interface BalanceCardProps {
  stats: WalletStats;
  onWithdraw: () => void;
  isWithdrawing: boolean;
  canWithdraw: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ stats, onWithdraw, isWithdrawing, canWithdraw }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
       {/* Available Balance */}
       <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 flex flex-col justify-between">
          <div>
             <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><DollarSign size={16} className="text-green-500"/> Available to Withdraw</p>
             <h3 className="text-3xl font-black text-gray-900">${stats.availableBalance.toFixed(2)}</h3>
             <p className="text-xs text-gray-400 mt-2">Funds from completed reservations & paid bills.</p>
          </div>
          <div className="mt-6">
             <Button fullWidth onClick={onWithdraw} isLoading={isWithdrawing} disabled={!canWithdraw || isWithdrawing} className={!canWithdraw ? 'opacity-50 cursor-not-allowed' : ''}>
                Request Payout
             </Button>
          </div>
       </div>

       {/* Pending Balance */}
       <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 flex flex-col justify-between">
          <div>
             <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><Clock size={16} className="text-orange-500"/> Pending Clearance</p>
             <h3 className="text-3xl font-black text-gray-900">${stats.pendingBalance.toFixed(2)}</h3>
             <p className="text-xs text-gray-400 mt-2">Future bookings. Clears after reservation completes.</p>
          </div>
       </div>

       {/* Total Earnings */}
       <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 flex flex-col justify-between">
          <div>
             <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><TrendingUp size={16} className="text-blue-500"/> Total Earnings</p>
             <h3 className="text-3xl font-black text-gray-900">${stats.totalEarnings.toFixed(2)}</h3>
             <p className="text-xs text-gray-400 mt-2">Lifetime revenue generated on platform.</p>
          </div>
       </div>
    </div>
  );
};

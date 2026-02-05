
import React from 'react';
import { Transaction } from '../../../types';
import { ArrowUpRight, ArrowDownLeft, FileText } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onSelect: (txn: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onSelect }) => {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
       <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-900">Transaction History</h3>
       </div>
       
       <div className="overflow-x-auto">
          <table className="w-full">
             <thead className="bg-gray-50">
                <tr>
                   <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Description</th>
                   <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                   <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                   <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Amount</th>
                   <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Action</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">No transactions found.</td></tr>
                ) : (
                    transactions.map(txn => {
                        const isIncome = txn.amount > 0;
                        return (
                            <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-gray-900 text-sm">{txn.description}</p>
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${txn.status === 'completed' ? 'bg-green-100 text-green-700' : txn.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                        {txn.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500">
                                    {new Date(txn.createdAt).toLocaleDateString()} <br/> {new Date(txn.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </td>
                                <td className="px-6 py-4 text-xs font-medium text-gray-600 capitalize">
                                    {txn.type.replace('_', ' ')}
                                </td>
                                <td className={`px-6 py-4 text-right font-bold text-sm ${isIncome ? 'text-green-600' : 'text-gray-900'}`}>
                                    {isIncome ? '+' : ''}${txn.amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => onSelect(txn)}
                                        className="p-2 bg-white border border-gray-200 rounded-lg hover:border-primary-500 hover:text-primary-600 transition-colors text-gray-400"
                                        title="View Details"
                                    >
                                        <FileText size={16} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })
                )}
             </tbody>
          </table>
       </div>
    </div>
  );
};

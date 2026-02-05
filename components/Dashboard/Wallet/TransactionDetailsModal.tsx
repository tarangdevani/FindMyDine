
import React from 'react';
import { X, Receipt, AlertCircle, Calendar } from 'lucide-react';
import { Transaction } from '../../../types';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({ isOpen, transaction, onClose }) => {
  if (!isOpen || !transaction) return null;

  const isIncome = transaction.amount > 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Transaction Details</h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">{transaction.id}</p>
                </div>
                <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100"><X size={20}/></button>
            </div>

            {/* Content */}
            <div className="p-6">
                
                {/* Amount Display */}
                <div className="text-center mb-8">
                    <span className={`text-4xl font-black ${isIncome ? 'text-green-600' : 'text-gray-900'}`}>
                        {isIncome ? '+' : ''}${transaction.amount.toFixed(2)}
                    </span>
                    <p className={`text-xs font-bold uppercase mt-2 px-2 py-1 rounded inline-block ${transaction.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {transaction.status}
                    </p>
                </div>

                {/* Specific Views based on Type */}
                <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    
                    {transaction.type === 'bill_payment' && (
                        <>
                            <div className="flex items-center gap-2 text-primary-600 font-bold border-b border-gray-200 pb-2 mb-2">
                                <Receipt size={16}/> Invoice Details
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Bill</span>
                                <span className="font-medium">${transaction.metadata?.totalBill?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Customer</span>
                                <span className="font-medium">{transaction.metadata?.customerName}</span>
                            </div>
                            {transaction.metadata?.itemsSummary && (
                                <div className="text-sm text-gray-500 pt-2">
                                    <p className="font-bold text-gray-700">Items:</p>
                                    <p>{transaction.metadata.itemsSummary}</p>
                                </div>
                            )}
                        </>
                    )}

                    {(transaction.type === 'reservation' || transaction.type === 'cancellation') && (
                        <>
                            <div className="flex items-center gap-2 text-primary-600 font-bold border-b border-gray-200 pb-2 mb-2">
                                <Calendar size={16}/> {transaction.type === 'reservation' ? 'Booking Details' : 'Cancellation Details'}
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Customer</span>
                                <span className="font-medium">{transaction.metadata?.customerName}</span>
                            </div>
                            {transaction.metadata?.platformFee && (
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Platform Fee Deducted</span>
                                    <span>-${transaction.metadata.platformFee.toFixed(2)}</span>
                                </div>
                            )}
                            {transaction.metadata?.refundAmount && transaction.metadata.refundAmount > 0 && (
                                <div className="flex justify-between text-sm text-red-500">
                                    <span>User Refund</span>
                                    <span>-${transaction.metadata.refundAmount.toFixed(2)}</span>
                                </div>
                            )}
                        </>
                    )}

                    {transaction.type === 'withdrawal' && (
                        <div className="text-center text-gray-500 italic text-sm">
                            Funds transferred to your linked bank account.
                        </div>
                    )}

                </div>

                <div className="mt-6 text-xs text-gray-400 text-center">
                    Recorded on {new Date(transaction.createdAt).toLocaleString()}
                </div>

            </div>
        </div>
    </div>
  );
};

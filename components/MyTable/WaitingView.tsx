import React from 'react';
import { Clock } from 'lucide-react';
import { TableItem } from '../../types';

interface WaitingViewProps {
  table: TableItem;
}

export const WaitingView: React.FC<WaitingViewProps> = ({ table }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-soft p-8 animate-fade-in">
            <div className="w-20 h-20 bg-orange-50 rounded-full mx-auto flex items-center justify-center mb-6 animate-pulse">
                <Clock size={40} className="text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Sent</h2>
            <p className="text-gray-500 mb-6">Please wait while the restaurant confirms your table.</p>
            <div className="bg-gray-50 p-4 rounded-xl text-sm font-medium text-gray-600 border border-gray-100">
                Your table: <span className="text-gray-900 font-bold">{table.name}</span>
            </div>
        </div>
    </div>
  );
};
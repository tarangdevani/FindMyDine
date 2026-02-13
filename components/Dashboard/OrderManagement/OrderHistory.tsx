
import React, { useState } from 'react';
import { History, Calendar } from 'lucide-react';
import { KanbanCardItem } from './types';
import { DatePicker } from '../../UI/DatePicker';

interface OrderHistoryProps {
  historyItems: KanbanCardItem[];
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ 
  historyItems, hasMore, onLoadMore, isLoadingMore,
  startDate, setStartDate, endDate, setEndDate 
}) => {
  return (
    <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
       
       <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
             <Calendar size={16}/> Filter Range:
          </div>
          <div className="w-32"><DatePicker value={startDate} onChange={setStartDate} max={endDate} /></div>
          <span className="text-gray-300">-</span>
          <div className="w-32"><DatePicker value={endDate} onChange={setEndDate} min={startDate} /></div>
       </div>

       <div className="flex-1 overflow-y-auto">
           {historyItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                 <History size={48} className="text-gray-200 mb-4" />
                 <p className="text-gray-500 font-medium">No item history found.</p>
              </div>
           ) : (
              <table className="w-full">
                 <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-100">
                    <tr>
                       <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Time</th>
                       <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Table</th>
                       <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Item</th>
                       <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Price</th>
                       <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {historyItems.map((kItem) => (
                       <tr key={kItem.uniqueId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-500">{new Date(kItem.order.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} <br/> <span className="text-xs">{new Date(kItem.order.createdAt).toLocaleDateString()}</span></td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">{kItem.order.tableName}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                             <span className="font-bold text-gray-900 mr-2">{kItem.item.quantity}x</span> 
                             {kItem.item.name}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-600">${(kItem.item.price * kItem.item.quantity).toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                kItem.item.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                             }`}>
                                {kItem.item.status}
                             </span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           )}
           
           {hasMore && (
              <div className="p-4 text-center border-t border-gray-100">
                 <button 
                    onClick={onLoadMore}
                    disabled={isLoadingMore}
                    className="text-sm font-bold text-primary-600 hover:text-primary-700 disabled:opacity-50"
                 >
                    {isLoadingMore ? 'Loading...' : 'Load More Items'}
                 </button>
              </div>
           )}
       </div>
    </div>
  );
};

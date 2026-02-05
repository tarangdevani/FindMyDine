
import React from 'react';
import { History } from 'lucide-react';
import { KanbanCardItem } from './types';

interface OrderHistoryProps {
  historyItems: KanbanCardItem[];
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ historyItems }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-soft border border-gray-100">
       {historyItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
             <History size={48} className="text-gray-200 mb-4" />
             <p className="text-gray-500 font-medium">No item history yet.</p>
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
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(kItem.order.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
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
    </div>
  );
};

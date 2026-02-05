
import React from 'react';
import { Armchair, Utensils, Receipt } from 'lucide-react';
import { Reservation, Order } from '../../../types';
import { Button } from '../../UI/Button';

interface ActiveSessionsProps {
  sessions: Reservation[];
  orders: Order[];
  onComplete: (id: string) => void;
}

export const ActiveSessions: React.FC<ActiveSessionsProps> = ({ sessions, orders, onComplete }) => {
  
  const calculateTotal = (resId: string) => {
    const resOrders = orders.filter(o => o.reservationId === resId);
    let total = 0;
    let itemCount = 0;
    
    resOrders.forEach(order => {
        const activeItems = order.items.filter(i => i.status !== 'cancelled');
        total += activeItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        itemCount += activeItems.length;
    });
    
    return { total, itemCount, orders: resOrders };
  };

  return (
      <div>
         <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Armchair size={20} className="text-primary-600"/>
            Active Tables ({sessions.length})
         </h3>

         {sessions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Utensils size={32} />
               </div>
               <h3 className="text-lg font-bold text-gray-900">No active sessions</h3>
               <p className="text-gray-500">Guests will appear here when seated.</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
               {sessions.map(session => {
                  const { total, itemCount, orders: sessionOrders } = calculateTotal(session.id!);
                  
                  // Collect unique item names for preview
                  const itemNames = Array.from(new Set(
                      sessionOrders.flatMap(o => o.items.filter(i => i.status !== 'cancelled').map(i => `${i.quantity}x ${i.name}`))
                  )).slice(0, 3);

                  return (
                     <div key={session.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <h4 className="font-extrabold text-xl text-gray-900">{session.tableName}</h4>
                                 {session.type === 'walk_in' && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">Walk-in</span>}
                              </div>
                              <p className="text-sm text-gray-500">{session.userName} • {session.guestCount} Guests</p>
                           </div>
                           <div className="text-right">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Bill</p>
                              <p className="text-xl font-black text-gray-900">${total.toFixed(2)}</p>
                           </div>
                        </div>

                        <div className="p-5 flex-1">
                           <div className="mb-4">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                 <Receipt size={12}/> Orders Summary
                              </p>
                              {itemCount > 0 ? (
                                 <ul className="space-y-1">
                                    {itemNames.map((name, idx) => (
                                       <li key={idx} className="text-sm text-gray-700 truncate">• {name}</li>
                                    ))}
                                    {itemCount > 3 && <li className="text-xs text-gray-400 italic pl-2">...and more items</li>}
                                 </ul>
                              ) : (
                                 <p className="text-sm text-gray-400 italic">No orders placed yet.</p>
                              )}
                           </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                           <Button 
                              variant="white" 
                              fullWidth 
                              size="sm"
                              className="text-gray-600"
                              onClick={() => { /* Could open detail modal */ }}
                           >
                              View Details
                           </Button>
                           <Button 
                              fullWidth 
                              size="sm"
                              onClick={() => onComplete(session.id!)}
                              className="bg-gray-900 text-white hover:bg-black"
                           >
                              Complete Session
                           </Button>
                        </div>
                     </div>
                  );
               })}
            </div>
         )}
      </div>
  );
};

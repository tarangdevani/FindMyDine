
import React from 'react';
import { Star, Utensils, UtensilsCrossed, Edit2, MessageSquarePlus, PenLine } from 'lucide-react';
import { RestaurantData, TableItem, OrderItem, Review } from '../../types';

interface SummaryViewProps {
  restaurant: RestaurantData;
  table: TableItem;
  displayItems: (OrderItem & { orderId: string, itemIndex: number, status: string })[];
  userReview: Review | null;
  onAddReview: () => void;
  onEditReview: () => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ 
  restaurant, table, displayItems, 
  userReview, onAddReview, onEditReview 
}) => {
  return (
    <div className="p-4 space-y-4 animate-fade-in">
        
        {/* Restaurant Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 flex justify-between items-start">
                <div className="flex-1 pr-4">
                    <h2 className="text-xl font-extrabold text-gray-900 leading-tight mb-1">{restaurant.name}</h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1 text-gray-900 bg-yellow-50 border border-yellow-100 px-2 py-0.5 rounded-lg">
                            <Star size={10} className="text-yellow-500 fill-current" /> {restaurant.rating}
                        </span>
                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                            <Utensils size={10} className="text-gray-400" /> {restaurant.cuisine}
                        </span>
                    </div>
                </div>
                <div className="bg-primary-50 text-primary-700 px-3 py-2 rounded-xl text-center border border-primary-100 shadow-sm shrink-0 min-w-[70px]">
                    <span className="text-[10px] font-bold uppercase text-primary-400 tracking-wider block mb-0.5">Table</span>
                    <span className="text-xl font-black leading-none">{table.name.replace('Table ', '')}</span>
                </div>
            </div>

            {/* Embedded Review Action */}
            <div className="bg-gray-50/50 border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Rating</span>
                {userReview ? (
                    <div className="flex items-center gap-3">
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={12} className={i < userReview.rating ? "text-yellow-400 fill-current" : "text-gray-300 fill-gray-200"} />
                            ))}
                        </div>
                        <button 
                            onClick={onEditReview}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                            <PenLine size={12}/> Edit
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={onAddReview}
                        className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                        <MessageSquarePlus size={14}/> Rate Experience
                    </button>
                )}
            </div>
        </div>

        <div>
            <h3 className="font-bold text-gray-900 text-lg mb-3 pl-1">Ordered Items</h3>
            {displayItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 text-center px-6">
                    <UtensilsCrossed size={28} className="text-orange-500 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Hungry?</h3>
                    <p className="text-gray-500 text-sm">Start ordering delicious food from the menu.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {displayItems.map((item) => (
                        <div key={`${item.orderId}_${item.itemIndex}`} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center relative overflow-hidden">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center font-bold text-gray-900 shrink-0 border border-gray-200">{item.quantity}x</div>
                                <div>
                                    <h4 className={`font-bold text-gray-900 text-sm ${item.status === 'cancelled' ? 'line-through text-gray-400' : ''}`}>{item.name}</h4>
                                    {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {item.selectedAddOns.map((addon, i) => (
                                                <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">+ {addon.name}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${['bg-blue-100 text-blue-700', 'bg-orange-100 text-orange-700', 'bg-green-100 text-green-700', 'bg-red-100 text-red-700', 'bg-gray-100 text-gray-700'][['ordered','preparing','served','cancelled','paid'].indexOf(item.status || 'ordered')]}`}>
                                {item.status || 'Placed'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

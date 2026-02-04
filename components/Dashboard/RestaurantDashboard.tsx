import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Utensils, Calendar, Settings as SettingsIcon, TrendingUp, LogOut, Bell, Search, Menu, ChefHat, Users, Camera, Armchair, AlertCircle, Clock, Check, X, ShoppingBag, Play, Ban, DollarSign, GripVertical, Loader2, Receipt, Ticket, BookOpen, Store, CreditCard, ChevronRight
} from 'lucide-react';
import { UserProfile, Reservation, TableItem, Order, OrderStatus, OrderItem } from '../../types';
import { MenuManagement } from './MenuManagement';
import { Settings } from './Settings';
import { AIPhotography } from './AIPhotography';
import { TableManagement } from './TableManagement';
import { RestaurantDetails } from './RestaurantDetails';
import { Reservations } from './Reservations';
import { OrderManagement } from './OrderManagement';
import { Billing } from './Billing';
import { Offers } from './Offers';
import { Bookings } from './Bookings';
import { Button } from '../UI/Button';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, orderBy } from "firebase/firestore";
import { db } from '../../lib/firebase';
import { getTables, updateTable } from '../../services/tableService';
import { getOrdersByRestaurant, updateOrderItemStatus } from '../../services/orderService';
import { completeReservation } from '../../services/reservationService';

interface RestaurantDashboardProps {
  user: UserProfile | null;
  onLogout: () => void;
}

type DashboardView = 'overview' | 'reservations' | 'bookings' | 'orders' | 'billing' | 'offers' | 'menu' | 'tables' | 'ai-photography' | 'customers' | 'settings' | 'profile';

export const RestaurantDashboard: React.FC<RestaurantDashboardProps> = ({ user, onLogout }) => {
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const renderContent = () => {
    switch (activeView) {
      case 'profile': return <RestaurantDetails userId={user?.uid || ''} />;
      case 'menu': return <MenuManagement userId={user?.uid || ''} />;
      case 'tables': return <TableManagement userId={user?.uid || ''} />;
      case 'ai-photography': return <AIPhotography />;
      case 'settings': return <Settings userId={user?.uid || ''} />;
      case 'reservations': return <Reservations userId={user?.uid || ''} />;
      case 'bookings': return <Bookings userId={user?.uid || ''} />;
      case 'orders': return <OrderManagement userId={user?.uid || ''} />;
      case 'billing': return <Billing userId={user?.uid || ''} />;
      case 'offers': return <Offers userId={user?.uid || ''} />;
      case 'overview':
      default: return <OverviewContent userId={user?.uid || ''} onViewChange={setActiveView} />;
    }
  };

  const NavItem = ({ view, icon: Icon, label, badge }: { view: DashboardView, icon: any, label: string, badge?: string }) => (
    <button 
      onClick={() => { setActiveView(view); setIsMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
        activeView === view 
          ? 'bg-primary-50 text-primary-700 shadow-sm' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon size={20} />
      {label}
      {badge && <span className="ml-auto bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-bold">{badge}</span>}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="h-20 flex items-center px-8 border-b border-gray-50 justify-between shrink-0">
          <div className="flex items-center gap-2 text-primary-600">
            <ChefHat size={28} />
            <span className="text-xl font-bold text-gray-900 tracking-tight">Partner</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-1 text-gray-400"><Menu size={20}/></button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <NavItem view="overview" icon={LayoutDashboard} label="Overview" />
          <NavItem view="bookings" icon={BookOpen} label="Live Sessions" />
          <NavItem view="reservations" icon={Calendar} label="Reservations" />
          <NavItem view="orders" icon={ShoppingBag} label="Kitchen Display" />
          <NavItem view="billing" icon={Receipt} label="Billing" />
          <NavItem view="offers" icon={Ticket} label="Offers & Coupons" />
          <NavItem view="tables" icon={Armchair} label="Tables" />
          <NavItem view="menu" icon={Utensils} label="Menu" />
          <NavItem view="ai-photography" icon={Camera} label="AI Photography" />
          <NavItem view="settings" icon={SettingsIcon} label="Settings" />
        </nav>
        <div className="p-4 border-t border-gray-50 bg-gray-50/30">
          <div onClick={() => { setActiveView('profile'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border mb-3 group ${activeView === 'profile' ? 'bg-white border-primary-200 shadow-md ring-1 ring-primary-100' : 'bg-white border-gray-100 hover:border-primary-200'}`}>
            <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold shrink-0 border-2 border-white shadow-sm">{user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'R'}</div>
            <div className="overflow-hidden flex-1"><p className="text-sm font-bold text-gray-900 truncate">{user?.displayName || 'Restaurant'}</p><p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">View Profile</p></div>
          </div>
          <button onClick={() => setIsLogoutModalOpen(true)} className="flex items-center justify-center gap-2 w-full px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"><LogOut size={14} /> Sign Out</button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-lg"><Menu size={24} /></button>
             <h2 className="text-xl font-bold text-gray-900 capitalize">{activeView.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
             <button className="relative p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full"><Bell size={20} /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span></button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">{renderContent()}</main>
      </div>
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsLogoutModalOpen(false)}>
           <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-600 mx-auto"><AlertCircle size={24} /></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Sign Out?</h3>
              <p className="text-gray-500 mb-6 text-sm text-center">Are you sure you want to end your session?</p>
              <div className="flex gap-3"><Button variant="ghost" fullWidth onClick={() => setIsLogoutModalOpen(false)}>Cancel</Button><Button fullWidth onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white shadow-red-500/20">Sign Out</Button></div>
           </div>
        </div>
      )}
    </div>
  );
};

const OverviewContent = ({ userId, onViewChange }: { userId: string, onViewChange: (view: DashboardView) => void }) => {
    const [liveRequests, setLiveRequests] = useState<Reservation[]>([]);
    const [pendingPayments, setPendingPayments] = useState<Reservation[]>([]);
    const [tables, setTables] = useState<TableItem[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        // 1. Listen for Reservations (Requests & Payments)
        const qLive = query(
            collection(db, "reservations"), 
            where("restaurantId", "==", userId), 
            where("status", "in", ["pending", "active", "completed"])
        );
        const unsubRequests = onSnapshot(qLive, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
            setLiveRequests(data.filter(r => r.status === 'pending' && r.type === 'walk_in'));
            setPendingPayments(data.filter(r => r.paymentStatus === 'pending_counter' && r.status !== 'completed'));
            setLoading(false);
        });

        // 2. Listen for Tables
        const qTables = query(collection(db, "users", userId, "tables"), orderBy("createdAt"));
        const unsubTables = onSnapshot(qTables, (snapshot) => {
            const tData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TableItem));
            // Sort numerically if possible
            tData.sort((a, b) => parseInt(a.name.replace(/\D/g, '')) - parseInt(b.name.replace(/\D/g, '')));
            setTables(tData);
        });

        // 3. Listen for Orders (Live Kitchen)
        const qOrders = query(
            collection(db, "orders"), 
            where("restaurantId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const unsubOrders = onSnapshot(qOrders, (snapshot) => {
            const oData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            setOrders(oData);
        });

        return () => {
            unsubRequests();
            unsubTables();
            unsubOrders();
        };
    }, [userId]);

    const handleMarkPaid = async (res: Reservation) => {
        if (!confirm(`Mark Table ${res.tableName} as Paid? This will end the session.`)) return;
        await completeReservation(res.id!, userId, res.tableId);
    };

    const handleRequestAction = async (reservation: Reservation, action: 'confirm' | 'decline') => {
        if (!reservation.id) return;
        const status = action === 'confirm' ? 'active' : 'declined';
        
        await updateDoc(doc(db, "reservations", reservation.id), { status });

        // If confirming, auto-occupy the table
        if (action === 'confirm' && reservation.tableId) {
            const tableRef = doc(db, "users", userId, "tables", reservation.tableId);
            await updateDoc(tableRef, { status: 'occupied' });
        }
    };

    const toggleTableStatus = async (table: TableItem) => {
        if (!table.id) return;
        const newStatus = table.status === 'occupied' ? 'available' : 'occupied';
        await updateTable(userId, { id: table.id, status: newStatus } as TableItem);
    };

    const activeItems = orders.flatMap(order => order.items.map((item, idx) => ({ uniqueId: `${order.id}_${idx}`, order: order, item: item }))
        .filter(k => ['ordered', 'preparing', 'served'].includes(k.item.status || 'ordered'))
    );

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>;

    return (
      <div className="animate-fade-in-up space-y-8 pb-10">
        
        {/* Urgent Alerts */}
        {(liveRequests.length > 0 || pendingPayments.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {liveRequests.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Clock size={16} className="text-orange-500"/> Walk-in Requests</h3>
                        <div className="space-y-3">
                            {liveRequests.map(req => (
                                <div key={req.id} className="bg-white p-4 rounded-xl shadow-soft border-l-4 border-orange-500 flex justify-between items-center">
                                    <div><p className="font-bold text-gray-900">{req.tableName}</p><p className="text-xs text-gray-500">{req.userName} • {req.guestCount}p</p></div>
                                    <div className="flex gap-2"><button onClick={() => handleRequestAction(req, 'decline')} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><X size={18}/></button><button onClick={() => handleRequestAction(req, 'confirm')} className="bg-green-600 text-white p-2 rounded-lg shadow-sm"><Check size={18}/></button></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {pendingPayments.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Store size={16} className="text-blue-500"/> Awaiting Counter Payment</h3>
                        <div className="space-y-3">
                            {pendingPayments.map(req => (
                                <div key={req.id} className="bg-white p-4 rounded-xl shadow-soft border-l-4 border-blue-500 flex justify-between items-center">
                                    <div><p className="font-bold text-gray-900">{req.tableName}</p><p className="text-xs text-blue-600 font-bold">Bill: ${req.totalBillAmount?.toFixed(2)}</p></div>
                                    <Button size="sm" onClick={() => handleMarkPaid(req)} className="bg-blue-600 hover:bg-blue-700">Mark Paid</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Table Grid */}
        <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Table Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {tables.map(table => {
                    const isOccupied = table.status === 'occupied' || table.status === 'reserved';
                    return (
                        <div key={table.id} className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between h-32 ${isOccupied ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                            <div className="flex justify-between items-start"><span className={`font-bold text-lg ${isOccupied ? 'text-red-800' : 'text-emerald-800'}`}>{table.name}</span><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/50">{table.seats}p</span></div>
                            <button onClick={() => toggleTableStatus(table)} className={`w-full py-1.5 rounded-lg text-xs font-bold shadow-sm ${isOccupied ? 'bg-white text-red-600' : 'bg-white text-emerald-600'}`}>{isOccupied ? 'Free Table' : 'Occupy'}</button>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Kanban Preview */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Live Kitchen (Active Items)</h3>
                <button onClick={() => onViewChange('orders')} className="text-xs font-bold text-primary-600 flex items-center">View Board <ChevronRight size={14}/></button>
            </div>
            <div className="p-4 overflow-x-auto">
                <div className="flex gap-4">
                    {['ordered', 'preparing', 'served'].map(col => (
                        <div key={col} className="flex-1 min-w-[200px] bg-gray-50 p-2 rounded-xl border border-gray-200">
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-2 px-2">{col}</p>
                            <div className="space-y-2">
                                {activeItems.filter(k => (k.item.status || 'ordered') === col).map(k => (
                                    <div key={k.uniqueId} className="bg-white p-2 rounded shadow-sm text-xs border border-gray-100">
                                        <div className="flex justify-between font-bold mb-1"><span>{k.order.tableName}</span><span className="text-gray-400">#{k.order.id?.slice(-3)}</span></div>
                                        <p className="text-gray-700">{k.item.quantity}x {k.item.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    );
};
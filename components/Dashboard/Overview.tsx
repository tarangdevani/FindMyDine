
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Reservation, TableItem, Order, MenuItem, OrderStatus } from '../../types';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, getDocs } from "firebase/firestore";
import { db } from '../../lib/firebase';
import { updateTable, getTables } from '../../services/tableService';
import { completeReservation } from '../../services/reservationService';
import { markOrderAsPaid, getOrdersByReservation, updateOrderItemStatus } from '../../services/orderService';
import { getRestaurantProfile } from '../../services/restaurantService';
import { getMenu } from '../../services/menuService';
import { DashboardView } from './Sidebar';
import { useToast } from '../../context/ToastContext';

// Child Components
import { SetupWarnings } from './Overview/SetupWarnings';
import { WalkInRequests } from './Overview/WalkInRequests';
import { BillRequests } from './Overview/BillRequests';
import { TableStatusGrid } from './Overview/TableStatusGrid';
import { InteractiveKitchen } from './Overview/InteractiveKitchen';

interface OverviewProps {
  userId: string;
  onViewChange: (view: DashboardView) => void;
}

export const Overview: React.FC<OverviewProps> = ({ userId, onViewChange }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    
    // Real-time Data
    const [liveRequests, setLiveRequests] = useState<Reservation[]>([]);
    const [pendingPayments, setPendingPayments] = useState<Reservation[]>([]);
    const [tables, setTables] = useState<TableItem[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    
    // Setup Check Data
    const [menuCount, setMenuCount] = useState(0);
    const [profileCompleted, setProfileCompleted] = useState(true);

    // Initial Data Load (One-time checks)
    useEffect(() => {
        const initChecks = async () => {
            try {
                const [menuData, profileData] = await Promise.all([
                    getMenu(userId),
                    getRestaurantProfile(userId)
                ]);
                setMenuCount(menuData.length);
                // Check essential profile fields
                const isComplete = !!(profileData?.restaurantName && profileData?.address && profileData?.logoUrl);
                setProfileCompleted(isComplete);
            } catch (e) {
                console.error("Init check failed", e);
            }
        };
        initChecks();
    }, [userId]);
    
    // Real-time Listeners
    useEffect(() => {
        // 1. Listen for Reservations (Requests & Payments)
        const qLive = query(
            collection(db, "reservations"), 
            where("restaurantId", "==", userId), 
            where("status", "in", ["pending", "active", "completed"])
        );
        const unsubRequests = onSnapshot(qLive, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
            // Requests: Pending + Walk-in
            setLiveRequests(data.filter(r => r.status === 'pending' && r.type === 'walk_in'));
            // Payments: Pending Counter + Not Completed/Paid yet
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

    // --- Actions ---

    const handleMarkPaid = async (res: Reservation) => {
        if (!confirm(`Confirm payment received for ${res.tableName}?`)) return;
        
        try {
            // 1. Complete Reservation
            await completeReservation(res.id!, userId, res.tableId, { totalBillAmount: res.totalBillAmount });
            
            // 2. Find and Mark Associated Orders as Paid
            const resOrders = await getOrdersByReservation(res.id!);
            const updatePromises = resOrders.map(o => markOrderAsPaid(o.id!));
            await Promise.all(updatePromises);
            
            showToast("Bill marked as paid & table freed.", "success");
        } catch (e) {
            console.error(e);
            showToast("Failed to process payment.", "error");
        }
    };

    const handleRequestAction = async (reservation: Reservation, action: 'confirm' | 'decline') => {
        if (!reservation.id) return;
        const status = action === 'confirm' ? 'active' : 'declined';
        
        await updateDoc(doc(db, "reservations", reservation.id), { status });

        // If confirming, auto-occupy the table
        if (action === 'confirm' && reservation.tableId) {
            const tableRef = doc(db, "users", userId, "tables", reservation.tableId);
            await updateDoc(tableRef, { status: 'occupied' });
            showToast(`${reservation.tableName} is now active.`, "success");
        }
    };

    const toggleTableStatus = async (table: TableItem) => {
        if (!table.id) return;
        const newStatus = table.status === 'occupied' ? 'available' : 'occupied';
        await updateTable(userId, { id: table.id, status: newStatus } as TableItem);
    };

    const handleKitchenStatusUpdate = async (uniqueId: string, newStatus: OrderStatus) => {
        const [orderId, idxStr] = uniqueId.split('_');
        const itemIndex = parseInt(idxStr);
        await updateOrderItemStatus(orderId, itemIndex, newStatus);
    };

    // Filter active items for kitchen
    const activeKitchenItems = orders.flatMap(order => 
        order.items
            .map((item, idx) => ({ uniqueId: `${order.id}_${idx}`, order: order, item: item }))
            .filter(k => ['ordered', 'preparing', 'served'].includes(k.item.status || 'ordered'))
    );

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>;

    return (
      <div className="animate-fade-in-up space-y-8 pb-10">
        
        {/* 1. Setup Warnings */}
        <SetupWarnings 
            hasProfile={profileCompleted} 
            tableCount={tables.length} 
            menuCount={menuCount} 
            onNavigate={onViewChange} 
        />

        {/* 2. Critical Actions Row */}
        {(liveRequests.length > 0 || pendingPayments.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {liveRequests.length > 0 && (
                    <WalkInRequests 
                        requests={liveRequests} 
                        onAction={handleRequestAction} 
                    />
                )}
                {pendingPayments.length > 0 && (
                    <BillRequests 
                        pendingPayments={pendingPayments} 
                        onMarkPaid={handleMarkPaid} 
                    />
                )}
            </div>
        )}

        {/* 3. Live Interactive Kitchen */}
        <InteractiveKitchen 
            activeItems={activeKitchenItems} 
            onViewBoard={() => onViewChange('orders')}
            onUpdateStatus={handleKitchenStatusUpdate}
        />

        {/* 4. Quick Table Overview */}
        <TableStatusGrid 
            tables={tables} 
            onToggleStatus={toggleTableStatus} 
        />
        
      </div>
    );
};

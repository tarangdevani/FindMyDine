
import React, { useState, useEffect } from 'react';
import { Reservation, TableItem, Order, MenuItem, OrderStatus } from '../../types';
import { db } from '../../lib/firebase';
import { updateTable, getTables } from '../../services/tableService';
import { completeReservation } from '../../services/reservationService';
import { markOrderAsPaid, getOrdersByReservation, updateOrderItemStatus } from '../../services/orderService';
import { getRestaurantProfile } from '../../services/restaurantService';
import { getMenu } from '../../services/menuService';
import { DashboardView } from './Sidebar';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../UI/Skeleton';

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
    
    // Loading States
    const [isMinTimeElapsed, setIsMinTimeElapsed] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    
    // Real-time Data
    const [liveRequests, setLiveRequests] = useState<Reservation[]>([]);
    const [pendingPayments, setPendingPayments] = useState<Reservation[]>([]);
    const [tables, setTables] = useState<TableItem[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    
    // Setup Check Data
    const [menuCount, setMenuCount] = useState(0);
    const [profileCompleted, setProfileCompleted] = useState(true);

    // 1. Force Minimum Loading Time (1s)
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsMinTimeElapsed(true);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // 2. Initial Data Load (One-time checks)
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
    
    // 3. Real-time Listeners
    useEffect(() => {
        // Listen for Reservations (Requests & Payments)
        const unsubscribeRequests = db.collection("reservations")
            .where("restaurantId", "==", userId)
            .where("status", "in", ["pending", "active", "completed"])
            .onSnapshot((snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
                // Requests: Pending + Walk-in
                setLiveRequests(data.filter(r => r.status === 'pending' && r.type === 'walk_in'));
                // Payments: Pending Counter + Not Completed/Paid yet
                setPendingPayments(data.filter(r => r.paymentStatus === 'pending_counter' && r.status !== 'completed'));
                
                // Mark data as loaded
                setIsDataLoaded(true);
            });

        // Listen for Tables
        const unsubscribeTables = db.collection("users").doc(userId).collection("tables")
            .orderBy("createdAt")
            .onSnapshot((snapshot) => {
                const tData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TableItem));
                // Sort numerically if possible
                tData.sort((a, b) => parseInt(a.name.replace(/\D/g, '')) - parseInt(b.name.replace(/\D/g, '')));
                setTables(tData);
            });

        // Listen for Orders (Live Kitchen)
        const unsubscribeOrders = db.collection("orders")
            .where("restaurantId", "==", userId)
            .orderBy("createdAt", "desc")
            .onSnapshot((snapshot) => {
                const oData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                setOrders(oData);
            });

        return () => {
            unsubscribeRequests();
            unsubscribeTables();
            unsubscribeOrders();
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
        
        await db.collection("reservations").doc(reservation.id).update({ status });

        // If confirming, auto-occupy the table
        if (action === 'confirm' && reservation.tableId) {
            const tableRef = db.collection("users").doc(userId).collection("tables").doc(reservation.tableId);
            await tableRef.update({ status: 'occupied' });
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

    // Combined Loading Check
    const isLoading = !isMinTimeElapsed || !isDataLoaded;

    if (isLoading) {
        return (
            <div className="animate-fade-in-up space-y-8 pb-10">
                {/* Setup Warning Skeleton */}
                <Skeleton className="h-28 w-full rounded-2xl" />
                
                {/* Requests Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-80 w-full rounded-2xl" />
                    <Skeleton className="h-80 w-full rounded-2xl" />
                </div>

                {/* Kitchen Skeleton */}
                <Skeleton className="h-64 w-full rounded-2xl" />

                {/* Tables Skeleton */}
                <div>
                    <Skeleton className="h-6 w-32 mb-4" variant="text" />
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
                    </div>
                </div>
            </div>
        );
    }

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

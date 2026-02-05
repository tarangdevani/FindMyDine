
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Reservation, TableItem, Order } from '../../types';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from '../../lib/firebase';
import { updateTable } from '../../services/tableService';
import { completeReservation } from '../../services/reservationService';
import { DashboardView } from './Sidebar';

// Child Components
import { UrgentAlerts } from './Overview/UrgentAlerts';
import { TableStatusGrid } from './Overview/TableStatusGrid';
import { KitchenPreview } from './Overview/KitchenPreview';

interface OverviewProps {
  userId: string;
  onViewChange: (view: DashboardView) => void;
}

export const Overview: React.FC<OverviewProps> = ({ userId, onViewChange }) => {
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
        
        <UrgentAlerts 
            liveRequests={liveRequests} 
            pendingPayments={pendingPayments} 
            onRequestAction={handleRequestAction} 
            onMarkPaid={handleMarkPaid} 
        />

        <TableStatusGrid 
            tables={tables} 
            onToggleStatus={toggleTableStatus} 
        />

        <KitchenPreview 
            activeItems={activeItems} 
            onViewBoard={() => onViewChange('orders')} 
        />
        
      </div>
    );
};

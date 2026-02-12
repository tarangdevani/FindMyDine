
import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, LineChart, Line, ComposedChart 
} from 'recharts';
import { Loader2, DollarSign, ShoppingBag, Calendar, TrendingUp, RefreshCw, Filter } from 'lucide-react';
import { getFinancialStats, syncDailyStats } from '../../services/statsService';
import { DailyStat } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Button } from '../UI/Button';

interface FinancialStatsProps {
  userId: string;
}

type Granularity = 'daily' | 'weekly' | 'monthly';

export const FinancialStats: React.FC<FinancialStatsProps> = ({ userId }) => {
  const { showToast } = useToast();
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Date State
  // Default to last 30 days
  const todayStr = new Date().toISOString().split('T')[0];
  const lastMonthStr = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(lastMonthStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [granularity, setGranularity] = useState<Granularity>('daily');

  useEffect(() => {
    initData();
  }, [userId]); // Only sync on mount/user change

  // Fetch whenever filters change
  useEffect(() => {
    if (!isSyncing) {
        fetchData();
    }
  }, [startDate, endDate]);

  const initData = async () => {
    setIsLoading(true);
    // 1. Trigger Sync (Lazy Update)
    setIsSyncing(true);
    try {
        const newDaysProcessed = await syncDailyStats(userId);
        if (newDaysProcessed > 0) {
            showToast(`Synced ${newDaysProcessed} days of historical data.`, 'success');
        }
    } catch(e) {
        console.error("Sync error", e);
    }
    setIsSyncing(false);
    
    // 2. Fetch Initial Data
    await fetchData();
    setIsLoading(false);
  };

  const fetchData = async () => {
    const data = await getFinancialStats(userId, startDate, endDate);
    setStats(data);
  };

  // --- Aggregation Logic ---
  const processedData = useMemo(() => {
    if (granularity === 'daily') return stats;

    const grouped: Record<string, DailyStat> = {};

    stats.forEach(stat => {
        let key = stat.date;
        const dateObj = new Date(stat.date);

        if (granularity === 'weekly') {
            // Get Monday of the week
            const day = dateObj.getDay();
            const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1); 
            const monday = new Date(dateObj.setDate(diff));
            key = monday.toISOString().split('T')[0];
        } else if (granularity === 'monthly') {
            // YYYY-MM
            key = stat.date.substring(0, 7); 
        }

        if (!grouped[key]) {
            grouped[key] = { 
                ...stat, 
                date: key, // Will be "2023-10-23" (week start) or "2023-10" (month)
                orderCount: 0, 
                totalRevenue: 0, 
                diningRevenue: 0, 
                reservationRevenue: 0, 
                reservationCount: 0 
            };
        }

        grouped[key].orderCount += stat.orderCount;
        grouped[key].totalRevenue += stat.totalRevenue;
        grouped[key].diningRevenue += stat.diningRevenue;
        grouped[key].reservationRevenue += stat.reservationRevenue;
        grouped[key].reservationCount += stat.reservationCount;
    });

    // Finalize averages and sort
    return Object.values(grouped).map(item => ({
        ...item,
        averageOrderValue: item.orderCount > 0 ? item.diningRevenue / item.orderCount : 0
    })).sort((a, b) => a.date.localeCompare(b.date));

  }, [stats, granularity]);

  // Calculations for KPI Cards (Always based on current selection sum)
  const totalRevenue = stats.reduce((acc, curr) => acc + curr.totalRevenue, 0);
  const totalOrders = stats.reduce((acc, curr) => acc + curr.orderCount, 0);
  const totalReservations = stats.reduce((acc, curr) => acc + curr.reservationCount, 0);
  const avgOrderVal = totalOrders > 0 ? (stats.reduce((acc, curr) => acc + curr.diningRevenue, 0) / totalOrders) : 0;

  // Formatters
  const formatDateTick = (val: string) => {
      if (granularity === 'monthly') return val; // 2023-10
      const d = new Date(val);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32}/></div>;

  return (
    <div className="animate-fade-in-up pb-10 space-y-8">
       
       {/* Header Controls */}
       <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
             <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Financial Statistics</h2>
             <p className="text-gray-500 text-sm">Analyze revenue, orders, and growth trends.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                <input 
                    type="date" 
                    className="bg-transparent text-sm font-bold text-gray-700 outline-none px-2"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-gray-400">-</span>
                <input 
                    type="date" 
                    className="bg-transparent text-sm font-bold text-gray-700 outline-none px-2"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
             </div>

             <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

             <div className="flex bg-gray-100 p-1 rounded-lg">
                {(['daily', 'weekly', 'monthly'] as const).map(g => (
                    <button
                        key={g}
                        onClick={() => setGranularity(g)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${granularity === g ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        {g}
                    </button>
                ))}
             </div>
             
             <Button size="sm" variant="outline" onClick={initData} isLoading={isSyncing}>
                <RefreshCw size={16} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`}/> Sync Data
             </Button>
          </div>
       </div>

       {/* KPI Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Revenue" 
            value={`$${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
            icon={DollarSign}
            trend="Gross Income"
          />
          <StatCard 
            title="Total Orders" 
            value={totalOrders.toString()} 
            icon={ShoppingBag}
            trend="Completed Orders"
          />
          <StatCard 
            title="Avg Order Value" 
            value={`$${avgOrderVal.toFixed(2)}`} 
            icon={TrendingUp}
            trend="Per Order"
          />
          <StatCard 
            title="Reservations" 
            value={totalReservations.toString()} 
            icon={Calendar}
            trend="Total Bookings"
          />
       </div>

       {/* 1. REVENUE COMPOSITE CHART */}
       <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
             <DollarSign size={20} className="text-primary-500"/> Revenue Analysis
          </h3>
          <div className="h-[350px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                   <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                         <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                   <XAxis dataKey="date" tickFormatter={formatDateTick} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} minTickGap={30} />
                   <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} tickFormatter={(val) => `$${val}`} />
                   <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)'}}
                      labelFormatter={formatDateTick}
                      formatter={(val: number) => [`$${val.toFixed(2)}`, '']}
                   />
                   <Legend wrapperStyle={{paddingTop: '20px'}}/>
                   <Bar dataKey="diningRevenue" name="Dining Sales" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} barSize={20} />
                   <Bar dataKey="reservationRevenue" name="Reservation Fees" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                   <Area type="monotone" dataKey="totalRevenue" name="Total Revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </ComposedChart>
             </ResponsiveContainer>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 2. ORDER VOLUME CHART */}
          <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
             <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ShoppingBag size={20} className="text-blue-500"/> Order Volume
             </h3>
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={processedData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                      <XAxis dataKey="date" tickFormatter={formatDateTick} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} minTickGap={30} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                      <Tooltip 
                         cursor={{fill: '#f9fafb'}}
                         contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)'}}
                         labelFormatter={formatDateTick}
                      />
                      <Bar dataKey="orderCount" name="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* 3. AOV TREND CHART */}
          <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
             <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-green-500"/> Average Order Value
             </h3>
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={processedData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                      <XAxis dataKey="date" tickFormatter={formatDateTick} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} minTickGap={30} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} tickFormatter={(val) => `$${val}`} />
                      <Tooltip 
                         contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)'}}
                         labelFormatter={formatDateTick}
                         formatter={(val: number) => [`$${val.toFixed(2)}`, 'Avg Value']}
                      />
                      <Line type="monotone" dataKey="averageOrderValue" stroke="#10b981" strokeWidth={3} dot={{r: 3, fill: '#10b981'}} activeDot={{r: 6}} />
                   </LineChart>
                </ResponsiveContainer>
             </div>
          </div>

       </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group">
       <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Icon size={64}/></div>
       <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
       <div>
          <h3 className="text-3xl font-black text-gray-900">{value}</h3>
          <p className="text-xs text-gray-500 font-medium mt-1">{trend}</p>
       </div>
    </div>
);

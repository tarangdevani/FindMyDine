
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2, DollarSign, ShoppingBag, Calendar, TrendingUp, RefreshCw } from 'lucide-react';
import { getFinancialStats, syncDailyStats } from '../../services/statsService';
import { DailyStat } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Button } from '../UI/Button';

interface FinancialStatsProps {
  userId: string;
}

type Granularity = 'daily' | 'weekly' | 'monthly';

// --- CUSTOM CHART COMPONENTS ---

// Helper for smooth bezier curves
const getPath = (points: {x: number, y: number}[], height: number, isArea = false) => {
  if (points.length === 0) return "";
  
  // Simple straight lines for stability, or basic smoothing
  // For financial data, slightly smoothed or straight is often better than over-smoothed bezier
  let d = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
     // Bezier control points for smoothing
     const prev = points[i-1];
     const curr = points[i];
     const cp1x = prev.x + (curr.x - prev.x) / 3;
     const cp1y = prev.y;
     const cp2x = curr.x - (curr.x - prev.x) / 3;
     const cp2y = curr.y;
     d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }

  if (isArea) {
      d += ` L ${points[points.length-1].x} ${height} L ${points[0].x} ${height} Z`;
  }
  
  return d;
};

interface TooltipProps {
  x: number;
  y: number;
  label: string;
  items: { label: string; value: string; color: string }[];
}

const ChartTooltip: React.FC<TooltipProps> = ({ x, y, label, items }) => (
  <div 
    className="absolute pointer-events-none bg-white p-3 rounded-xl shadow-xl border border-gray-100 z-10 min-w-[150px] animate-fade-in"
    style={{ 
        left: `${x}px`, 
        top: `${Math.max(0, y - 100)}px`,
        transform: 'translateX(-50%)' 
    }}
  >
    <p className="text-xs font-bold text-gray-400 uppercase mb-2">{label}</p>
    <div className="space-y-1">
        {items.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-gray-600 font-medium">{item.label}</span>
                </div>
                <span className="font-bold text-gray-900">{item.value}</span>
            </div>
        ))}
    </div>
  </div>
);

// 1. REVENUE CHART (Composed: Stacked Bars + Line)
const RevenueChart = ({ data, formatDate }: { data: any[], formatDate: (d: string) => string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [width, setWidth] = useState(0);
    const height = 300;
    const padding = { top: 20, right: 0, bottom: 30, left: 0 };

    useEffect(() => {
        if(!containerRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            if(entries[0]) setWidth(entries[0].contentRect.width);
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const maxValue = Math.max(...data.map(d => d.totalRevenue), 1) * 1.1; // 10% headroom
    
    // Coordinates
    const getX = (index: number) => (index / (data.length - 1 || 1)) * (width - padding.left - padding.right) + padding.left;
    const getY = (val: number) => height - padding.bottom - (val / maxValue) * (height - padding.top - padding.bottom);
    
    const barWidth = Math.max(4, (width / data.length) * 0.6);

    // Line Points
    const linePoints = data.map((d, i) => ({ 
        x: data.length === 1 ? width/2 : getX(i), 
        y: getY(d.totalRevenue) 
    }));
    
    const areaPath = getPath(linePoints, height - padding.bottom, true);
    const linePath = getPath(linePoints, height - padding.bottom, false);

    return (
        <div ref={containerRef} className="relative w-full h-[300px] select-none cursor-crosshair">
            {width > 0 && (
                <svg width={width} height={height} className="overflow-visible">
                    <defs>
                        <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f97316" stopOpacity="0.2"/>
                            <stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                        const y = height - padding.bottom - (tick * (height - padding.top - padding.bottom));
                        return (
                            <g key={tick}>
                                <line x1={0} y1={y} x2={width} y2={y} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4 4" />
                                <text x={0} y={y - 4} className="text-[10px] fill-gray-400 font-medium">${(maxValue * tick).toFixed(0)}</text>
                            </g>
                        );
                    })}

                    {/* Stacked Bars */}
                    {data.map((d, i) => {
                        const x = data.length === 1 ? width/2 : getX(i);
                        const yReservation = getY(d.reservationRevenue);
                        const hReservation = (height - padding.bottom) - yReservation;
                        
                        const yDining = getY(d.diningRevenue);
                        const hDining = (height - padding.bottom) - yDining;
                        
                        // Stack: Dining on bottom, Reservation on top
                        const yStackBase = height - padding.bottom;
                        const yDiningTop = yStackBase - hDining;
                        const yResTop = yDiningTop - hReservation;

                        return (
                            <g key={i}>
                                {/* Dining Bar */}
                                <rect 
                                    x={x - barWidth/2} 
                                    y={yDiningTop} 
                                    width={barWidth} 
                                    height={hDining} 
                                    fill="#3b82f6" 
                                    opacity={hoverIndex === i ? 1 : 0.8}
                                    rx={2}
                                />
                                {/* Reservation Bar */}
                                <rect 
                                    x={x - barWidth/2} 
                                    y={yResTop} 
                                    width={barWidth} 
                                    height={hReservation} 
                                    fill="#10b981" 
                                    opacity={hoverIndex === i ? 1 : 0.8}
                                    rx={2}
                                />
                            </g>
                        );
                    })}

                    {/* Area & Line */}
                    <path d={areaPath} fill="url(#revenueArea)" />
                    <path d={linePath} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Active Dot */}
                    {hoverIndex !== null && (
                        <circle 
                            cx={linePoints[hoverIndex].x} 
                            cy={linePoints[hoverIndex].y} 
                            r={5} 
                            className="fill-white stroke-orange-500 stroke-2" 
                        />
                    )}

                    {/* Interaction Layer */}
                    {data.map((_, i) => {
                         const x = data.length === 1 ? width/2 : getX(i);
                         return (
                            <rect 
                                key={i}
                                x={x - (width/data.length)/2}
                                y={0}
                                width={width/data.length}
                                height={height}
                                fill="transparent"
                                onMouseEnter={() => setHoverIndex(i)}
                                onMouseLeave={() => setHoverIndex(null)}
                            />
                         )
                    })}

                    {/* X Axis Labels */}
                    {data.map((d, i) => {
                        // Show label if it fits (every nth item based on density)
                        const showLabel = data.length < 10 || i % Math.ceil(data.length / 6) === 0;
                        if (!showLabel) return null;
                        const x = data.length === 1 ? width/2 : getX(i);
                        return (
                            <text key={i} x={x} y={height - 5} textAnchor="middle" className="text-[10px] fill-gray-400 font-medium">
                                {formatDate(d.date)}
                            </text>
                        );
                    })}
                </svg>
            )}

            {/* Tooltip */}
            {hoverIndex !== null && hoverIndex < data.length && (
                <ChartTooltip 
                    x={data.length === 1 ? width/2 : getX(hoverIndex)} 
                    y={getY(data[hoverIndex].totalRevenue)} 
                    label={formatDate(data[hoverIndex].date)}
                    items={[
                        { label: 'Total Revenue', value: `$${data[hoverIndex].totalRevenue.toFixed(2)}`, color: '#f97316' },
                        { label: 'Reservation Fees', value: `$${data[hoverIndex].reservationRevenue.toFixed(2)}`, color: '#10b981' },
                        { label: 'Dining Sales', value: `$${data[hoverIndex].diningRevenue.toFixed(2)}`, color: '#3b82f6' },
                    ]}
                />
            )}
        </div>
    );
};

// 2. ORDER CHART (Simple Bar)
const OrderChart = ({ data, formatDate }: { data: any[], formatDate: (d: string) => string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [width, setWidth] = useState(0);
    const height = 250;
    const padding = { top: 20, right: 0, bottom: 30, left: 0 };

    useEffect(() => {
        if(!containerRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            if(entries[0]) setWidth(entries[0].contentRect.width);
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const maxValue = Math.max(...data.map(d => d.orderCount), 1) * 1.1;
    const getX = (index: number) => (index / (data.length - 1 || 1)) * (width - padding.left - padding.right) + padding.left;
    const getY = (val: number) => height - padding.bottom - (val / maxValue) * (height - padding.top - padding.bottom);
    const barWidth = Math.max(4, (width / data.length) * 0.5);

    return (
        <div ref={containerRef} className="relative w-full h-[250px] select-none">
            {width > 0 && (
                <svg width={width} height={height} className="overflow-visible">
                    {[0, 0.5, 1].map((tick) => {
                        const y = height - padding.bottom - (tick * (height - padding.top - padding.bottom));
                        return <line key={tick} x1={0} y1={y} x2={width} y2={y} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4 4" />;
                    })}

                    {data.map((d, i) => {
                        const x = data.length === 1 ? width/2 : getX(i);
                        const y = getY(d.orderCount);
                        const h = (height - padding.bottom) - y;
                        return (
                            <g key={i} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
                                <rect 
                                    x={x - barWidth/2} 
                                    y={y} 
                                    width={barWidth} 
                                    height={h} 
                                    fill={hoverIndex === i ? '#2563eb' : '#3b82f6'} 
                                    rx={3}
                                />
                                {/* Invisible Hover Target */}
                                <rect x={x - (width/data.length)/2} y={0} width={width/data.length} height={height} fill="transparent" />
                            </g>
                        );
                    })}

                    {/* X Labels */}
                    {data.map((d, i) => {
                        const showLabel = data.length < 10 || i % Math.ceil(data.length / 6) === 0;
                        if (!showLabel) return null;
                        return (
                            <text key={i} x={data.length === 1 ? width/2 : getX(i)} y={height - 5} textAnchor="middle" className="text-[10px] fill-gray-400 font-medium">
                                {formatDate(d.date)}
                            </text>
                        );
                    })}
                </svg>
            )}
            {hoverIndex !== null && hoverIndex < data.length && (
                <ChartTooltip 
                    x={data.length === 1 ? width/2 : getX(hoverIndex)} 
                    y={getY(data[hoverIndex].orderCount)} 
                    label={formatDate(data[hoverIndex].date)}
                    items={[{ label: 'Orders', value: `${data[hoverIndex].orderCount}`, color: '#3b82f6' }]}
                />
            )}
        </div>
    );
};

// 3. AOV CHART (Line)
const AovChart = ({ data, formatDate }: { data: any[], formatDate: (d: string) => string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [width, setWidth] = useState(0);
    const height = 250;
    const padding = { top: 20, right: 0, bottom: 30, left: 0 };

    useEffect(() => {
        if(!containerRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            if(entries[0]) setWidth(entries[0].contentRect.width);
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const maxValue = Math.max(...data.map(d => d.averageOrderValue), 1) * 1.1;
    const getX = (index: number) => (index / (data.length - 1 || 1)) * (width - padding.left - padding.right) + padding.left;
    const getY = (val: number) => height - padding.bottom - (val / maxValue) * (height - padding.top - padding.bottom);

    const linePoints = data.map((d, i) => ({ 
        x: data.length === 1 ? width/2 : getX(i), 
        y: getY(d.averageOrderValue) 
    }));
    const linePath = getPath(linePoints, height - padding.bottom, false);
    const areaPath = getPath(linePoints, height - padding.bottom, true);

    return (
        <div ref={containerRef} className="relative w-full h-[250px] select-none">
            {width > 0 && (
                <svg width={width} height={height} className="overflow-visible">
                    <defs>
                        <linearGradient id="aovGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                        </linearGradient>
                    </defs>
                    {[0, 0.5, 1].map((tick) => {
                        const y = height - padding.bottom - (tick * (height - padding.top - padding.bottom));
                        return <line key={tick} x1={0} y1={y} x2={width} y2={y} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4 4" />;
                    })}

                    <path d={areaPath} fill="url(#aovGradient)" />
                    <path d={linePath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Interaction Layer */}
                    {data.map((_, i) => {
                         const x = data.length === 1 ? width/2 : getX(i);
                         return (
                            <rect 
                                key={i}
                                x={x - (width/data.length)/2}
                                y={0}
                                width={width/data.length}
                                height={height}
                                fill="transparent"
                                onMouseEnter={() => setHoverIndex(i)}
                                onMouseLeave={() => setHoverIndex(null)}
                            />
                         )
                    })}

                    {hoverIndex !== null && (
                        <circle 
                            cx={linePoints[hoverIndex].x} 
                            cy={linePoints[hoverIndex].y} 
                            r={5} 
                            className="fill-white stroke-emerald-500 stroke-2" 
                        />
                    )}

                    {data.map((d, i) => {
                        const showLabel = data.length < 10 || i % Math.ceil(data.length / 6) === 0;
                        if (!showLabel) return null;
                        return (
                            <text key={i} x={data.length === 1 ? width/2 : getX(i)} y={height - 5} textAnchor="middle" className="text-[10px] fill-gray-400 font-medium">
                                {formatDate(d.date)}
                            </text>
                        );
                    })}
                </svg>
            )}
            {hoverIndex !== null && hoverIndex < data.length && (
                <ChartTooltip 
                    x={data.length === 1 ? width/2 : getX(hoverIndex)} 
                    y={getY(data[hoverIndex].averageOrderValue)} 
                    label={formatDate(data[hoverIndex].date)}
                    items={[{ label: 'Avg Value', value: `$${data[hoverIndex].averageOrderValue.toFixed(2)}`, color: '#10b981' }]}
                />
            )}
        </div>
    );
};

export const FinancialStats: React.FC<FinancialStatsProps> = ({ userId }) => {
  const { showToast } = useToast();
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Date State
  const todayStr = new Date().toISOString().split('T')[0];
  const lastMonthStr = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(lastMonthStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [granularity, setGranularity] = useState<Granularity>('daily');

  useEffect(() => {
    initData();
  }, [userId]); 

  useEffect(() => {
    if (!isSyncing) {
        fetchData();
    }
  }, [startDate, endDate]);

  const initData = async () => {
    setIsLoading(true);
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
    await fetchData();
    setIsLoading(false);
  };

  const fetchData = async () => {
    const data = await getFinancialStats(userId, startDate, endDate);
    setStats(data);
  };

  const processedData = useMemo(() => {
    if (granularity === 'daily') return stats;

    const grouped: Record<string, DailyStat> = {};

    stats.forEach(stat => {
        let key = stat.date;
        const dateObj = new Date(stat.date);

        if (granularity === 'weekly') {
            const day = dateObj.getDay();
            const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1); 
            const monday = new Date(dateObj.setDate(diff));
            key = monday.toISOString().split('T')[0];
        } else if (granularity === 'monthly') {
            key = stat.date.substring(0, 7); 
        }

        if (!grouped[key]) {
            grouped[key] = { 
                ...stat, 
                date: key, 
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

    return Object.values(grouped).map(item => ({
        ...item,
        averageOrderValue: item.orderCount > 0 ? item.diningRevenue / item.orderCount : 0
    })).sort((a, b) => a.date.localeCompare(b.date));

  }, [stats, granularity]);

  const totalRevenue = stats.reduce((acc, curr) => acc + curr.totalRevenue, 0);
  const totalOrders = stats.reduce((acc, curr) => acc + curr.orderCount, 0);
  const totalReservations = stats.reduce((acc, curr) => acc + curr.reservationCount, 0);
  const avgOrderVal = totalOrders > 0 ? (stats.reduce((acc, curr) => acc + curr.diningRevenue, 0) / totalOrders) : 0;

  const formatDateTick = (val: string) => {
      if (granularity === 'monthly') return val;
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
                <RefreshCw size={16} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`}/> Sync
             </Button>
          </div>
       </div>

       {/* KPI Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={DollarSign} trend="Gross Income" />
          <StatCard title="Total Orders" value={totalOrders.toString()} icon={ShoppingBag} trend="Completed Orders" />
          <StatCard title="Avg Order Value" value={`$${avgOrderVal.toFixed(2)}`} icon={TrendingUp} trend="Per Order" />
          <StatCard title="Reservations" value={totalReservations.toString()} icon={Calendar} trend="Total Bookings" />
       </div>

       {/* 1. REVENUE COMPOSITE CHART */}
       <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
          <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                 <DollarSign size={20} className="text-primary-500"/> Revenue Analysis
              </h3>
              <div className="flex gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Dining</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Reservation</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Total</span>
              </div>
          </div>
          <RevenueChart data={processedData} formatDate={formatDateTick} />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 2. ORDER VOLUME CHART */}
          <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
             <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ShoppingBag size={20} className="text-blue-500"/> Order Volume
             </h3>
             <OrderChart data={processedData} formatDate={formatDateTick} />
          </div>

          {/* 3. AOV TREND CHART */}
          <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
             <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-green-500"/> Average Order Value
             </h3>
             <AovChart data={processedData} formatDate={formatDateTick} />
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
    
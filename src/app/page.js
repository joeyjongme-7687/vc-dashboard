'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Zap, 
  BarChart3, 
  Search,
  Filter as FilterIcon,
  ArrowRight,
  Menu,
  Bell,
  User,
  LayoutDashboard,
  Calendar,
  Package,
  Share2,
  ChevronDown,
  Sparkles,
  AlertCircle,
  Lightbulb,
  Rocket,
  RefreshCcw,
  Lock
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
// import { GoogleGenerativeAI } from "@google/generative-ai";

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [selectedChannel, setSelectedChannel] = useState('All');

  // AI States (Optimized for 2026 Free Tier)
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite-preview');
  const [aiInsights, setAiInsights] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // API Key is now safely handled on the backend API Route

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/sales');
        if (!response.ok) throw new Error('API Response Error');
        const parsedData = await response.json();
        
        setData(parsedData);
        
        if (parsedData.length > 0) {
          const dates = parsedData.map(d => d.date).sort();
          setDateRange({
            start: dates[0],
            end: dates[dates.length - 1]
          });
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter Options
  const products = useMemo(() => ['All', ...new Set(data.map(d => d.product))], [data]);
  const channels = useMemo(() => ['All', ...new Set(data.map(d => d.channel))], [data]);

  // Derived Filtered Data
  const filteredData = useMemo(() => {
    return data.filter(row => {
      const dateMatch = (!dateRange.start || !dateRange.end) || 
        isWithinInterval(parseISO(row.date), {
          start: startOfDay(parseISO(dateRange.start)),
          end: endOfDay(parseISO(dateRange.end))
        });
      
      const productMatch = selectedProduct === 'All' || row.product === selectedProduct;
      const channelMatch = selectedChannel === 'All' || row.channel === selectedChannel;

      return dateMatch && productMatch && channelMatch;
    });
  }, [data, dateRange, selectedProduct, selectedChannel]);

  // Insights Logic
  const insights = useMemo(() => {
    if (filteredData.length === 0) return null;

    const productRev = filteredData.reduce((acc, row) => {
      acc[row.product] = (acc[row.product] || 0) + (row.revenue || 0);
      return acc;
    }, {});
    const bestProduct = Object.entries(productRev).sort((a,b) => b[1]-a[1])[0][0];

    const channelRev = filteredData.reduce((acc, row) => {
      acc[row.channel] = (acc[row.channel] || 0) + (row.revenue || 0);
      return acc;
    }, {});
    const bestChannel = Object.entries(channelRev).sort((a,b) => b[1]-a[1])[0][0];

    const dayRev = filteredData.reduce((acc, row) => {
      acc[row.date] = (acc[row.date] || 0) + (row.revenue || 0);
      return acc;
    }, {});
    const sortedDays = Object.entries(dayRev).sort((a,b) => b[1]-a[1]);
    const bestDay = sortedDays[0][0];

    const channelConv = filteredData.reduce((acc, row) => {
      if (!acc[row.channel]) acc[row.channel] = { orders: 0, visitors: 0 };
      acc[row.channel].orders += (row.orders || 0);
      acc[row.channel].visitors += (row.visitors || 0);
      return acc;
    }, {});
    const bestConvChannel = Object.entries(channelConv)
      .map(([name, stats]) => ({ name, rate: stats.orders / (stats.visitors || 1) }))
      .sort((a,b) => b.rate - a.rate)[0].name;

    return { bestProduct, bestChannel, bestDay, bestConvChannel };
  }, [filteredData]);

  // KPI Calculations
  const kpis = useMemo(() => {
    if (filteredData.length === 0) return { totalRevenue: 0, totalOrders: 0, totalProfit: 0, aov: 0 };
    const totalRevenue = filteredData.reduce((sum, row) => sum + (Number(row.revenue) || 0), 0);
    const totalOrders = filteredData.reduce((sum, row) => sum + (Number(row.orders) || 0), 0);
    const totalCost = filteredData.reduce((sum, row) => sum + (Number(row.cost) || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    return { totalRevenue, totalOrders, totalProfit, aov };
  }, [filteredData]);

  // Chart Data: Revenue Trend
  const revenueTrendData = useMemo(() => {
    const daily = filteredData.reduce((acc, row) => {
      acc[row.date] = (acc[row.date] || 0) + (row.revenue || 0);
      return acc;
    }, {});
    return Object.entries(daily)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData]);

  // Chart Data: Revenue by Channel
  const channelRevenueData = useMemo(() => {
    const channelMap = filteredData.reduce((acc, row) => {
      acc[row.channel] = (acc[row.channel] || 0) + (row.revenue || 0);
      return acc;
    }, {});
    return Object.entries(channelMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [filteredData]);

  // Chart Data: Top Products
  const topProductsData = useMemo(() => {
    const productMap = filteredData.reduce((acc, row) => {
      acc[row.product] = (acc[row.product] || 0) + (row.revenue || 0);
      return acc;
    }, {});
    return Object.entries(productMap)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a,b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredData]);

  // AI Insights Generator using secure backend route
  const generateAIInsights = async () => {
    setIsAiLoading(true);
    setAiInsights(null);
    try {
      const prompt = `Analyze sales: Rev ${formatCurrency(kpis.totalRevenue)}, Orders ${kpis.totalOrders}. 2 Alerts, 2 Ops, 2 Suggestions. Max 15 words/point. JSON: {alerts:[], opportunities:[], suggestions:[]}`;

      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: selectedModel,
          prompt: prompt
        })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to generate insights from secure backend server.");
      }

      setAiInsights(result);
    } catch (err) {
      console.error("Backend Error:", err);
      alert(`API Connection Error: ${err.message}. Please click redeploy on your Vercel Dashboard to read the newly saved environment keys.`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const discoverModels = async () => {
    // Model Discovery now hidden or mockable. It helps user but we can't do it dynamically without key.
    alert("Discovery pinged. Note: Because your API key is now strictly protected behind the Vercel backend for security, listing all Gemini models continuously requires custom backend routing. Standard models are already selectable.");
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  const formatNumber = (val) => new Intl.NumberFormat('en-US').format(val);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium tracking-wide italic">Generating Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col fixed h-full z-40 transition-all duration-300">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-200">
            <BarChart3 className="text-white h-6 w-6" />
          </div>
          <h1 className="font-bold text-xl text-slate-800 tracking-tight">SalesDash</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-bold">
            <LayoutDashboard className="h-5 w-5" />
            Overview
          </a>
        </nav>
        <div className="p-4 mt-auto">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-4 rounded-2xl shadow-lg relative overflow-hidden group">
             <Sparkles className="absolute -right-2 -top-2 h-16 w-16 text-white/10 group-hover:scale-125 transition-transform" />
             <p className="text-xs font-bold text-white/80 uppercase mb-2">AI Insights</p>
             <p className="text-[11px] text-white/70 mb-4 leading-relaxed">Let Gemini analyze your data for hidden patterns and growth.</p>
             <button 
              onClick={generateAIInsights}
              disabled={isAiLoading}
              className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
             >
                {isAiLoading ? <RefreshCcw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                {isAiLoading ? 'Analyzing...' : 'Generate Insights'}
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 bg-slate-50 min-h-screen pb-12">
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">Intelligence Hub</h2>
            <div className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-100 shadow-sm">Live Sync</div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={discoverModels}
              className="text-[10px] font-black text-slate-400 hover:text-blue-600 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all"
            >
              <Search className="h-3 w-3" />
              Discover Models
            </button>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
               {[
                 { id: 'gemini-3.1-flash-lite-preview', label: '3.1 Lite Preview' },
                 { id: 'gemini-3.1-flash', label: '3.1 Flash' },
                 { id: 'gemini-1.5-flash-latest', label: '1.5 Flash' },
                 { id: 'gemini-2.0-flash-exp', label: '2.0 Flash' }
               ].map(m => (
                 <button 
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${selectedModel === m.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >{m.label}</button>
               ))}
            </div>
          </div>
        </header>

        <div className="p-8 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
          {/* Global Filter Bar */}
          <div className="flex flex-wrap items-center gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
             <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none"></div>
             <div className="flex items-center gap-3">
               <FilterIcon className="h-5 w-5 text-slate-400" />
               <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">Refine Context:</span>
             </div>
             
             <div className="flex flex-wrap items-center gap-4 flex-1">
                <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:ring-2 ring-blue-500/20 outline-none"
                />
                <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:ring-2 ring-blue-500/20 outline-none"
                />
                <select 
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  {products.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select 
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  {channels.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
          </div>

          {/* Core KPIs Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard title="Total Revenue" value={formatCurrency(kpis.totalRevenue)} icon={<DollarSign className="text-blue-600" />} color="bg-blue-600" />
            <KPICard title="Total Orders" value={formatNumber(kpis.totalOrders)} icon={<ShoppingCart className="text-emerald-600" />} color="bg-emerald-600" />
            <KPICard title="Net Profit" value={formatCurrency(kpis.totalProfit)} icon={<TrendingUp className="text-indigo-600" />} color="bg-indigo-600" />
            <KPICard title="Average Order Value" value={formatCurrency(kpis.aov)} icon={<TrendingUp className="text-amber-600" />} color="bg-amber-600" />
          </div>

          {/* Quick Stats Panel (Insight Wins) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <InsightCard 
              label="Best Selling Product" 
              value={insights?.bestProduct} 
              desc="Top generator of gross revenue"
              icon={<Package className="text-blue-500" />}
            />
            <InsightCard 
              label="Highest Grossing Channel" 
              value={insights?.bestChannel} 
              desc="Highest volume acquisition point"
              icon={<Share2 className="text-indigo-500" />}
            />
            <InsightCard 
              label="Peak Performance Date" 
              value={insights?.bestDay ? format(parseISO(insights.bestDay), 'MMM dd, yyyy') : 'N/A'} 
              desc="Highest single-day revenue record"
              icon={<Calendar className="text-amber-500" />}
            />
            <InsightCard 
              label="Lead Conversion King" 
              value={insights?.bestConvChannel} 
              desc="Best visitor-to-customer ratio"
              icon={<TrendingUp className="text-emerald-500" />}
            />
          </div>

          {/* AI Strategy Panel */}
          <section className="bg-slate-900 rounded-[2.5rem] p-10 overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative flex flex-col xl:flex-row gap-12">
               <div className="xl:w-1/3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full text-blue-400 text-xs font-bold border border-blue-500/20 mb-6 uppercase tracking-widest">
                    <Sparkles className="h-3 w-3" />
                    Generative Insights
                  </div>
                  <h3 className="text-4xl font-black text-white leading-tight mb-4 tracking-tighter">AI Business Transformation</h3>
                  <p className="text-slate-400 text-lg leading-relaxed mb-8">Empower strategy using the GEMINI_API_KEY. Enterprise-grade reasoning.</p>
                  
                  <button 
                    onClick={generateAIInsights}
                    disabled={isAiLoading}
                    className="px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/20 flex items-center gap-3"
                  >
                    {isAiLoading ? 'Synthesizing...' : 'Start Intelligence Sweep'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
               </div>

               <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Alert Section */}
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm group hover:border-red-500/30 transition-all">
                    <div className="h-10 w-10 bg-red-500/10 rounded-xl flex items-center justify-center mb-4 border border-red-500/20">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <h4 className="text-white font-bold text-lg mb-3">Critical Alerts</h4>
                    <div className="space-y-3">
                      {aiInsights?.alerts?.map((a, i) => (
                        <div key={i} className="flex gap-2 text-xs text-red-100/70 border-l-2 border-red-500/30 pl-3 py-1">{a}</div>
                      )) || <p className="text-slate-500 text-[10px] italic">No active threats detected. Run analysis.</p>}
                    </div>
                  </div>

                  {/* Opportunities */}
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm group hover:border-blue-500/30 transition-all">
                    <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20">
                      <Rocket className="h-5 w-5 text-blue-500" />
                    </div>
                    <h4 className="text-white font-bold text-lg mb-3">Growth Wings</h4>
                    <div className="space-y-3">
                      {aiInsights?.opportunities?.map((o, i) => (
                        <div key={i} className="flex gap-2 text-xs text-blue-100/70 border-l-2 border-blue-500/30 pl-3 py-1">{o}</div>
                      )) || <p className="text-slate-500 text-[10px] italic">Hidden opportunities await sweep.</p>}
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm group hover:border-emerald-500/30 transition-all">
                    <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/20">
                      <Lightbulb className="h-5 w-5 text-emerald-500" />
                    </div>
                    <h4 className="text-white font-bold text-lg mb-3">Next Actions</h4>
                    <div className="space-y-3">
                      {aiInsights?.suggestions?.map((s, i) => (
                        <div key={i} className="flex gap-2 text-xs text-emerald-100/70 border-l-2 border-emerald-500/30 pl-3 py-1">{s}</div>
                      )) || <p className="text-slate-500 text-[10px] italic">Strategic maneuvers will appear here.</p>}
                    </div>
                  </div>
               </div>
            </div>
          </section>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Revenue Trend Chart */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Revenue Trend
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Daily revenue performance over time</p>
                </div>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrendData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}}
                      tickFormatter={(val) => format(parseISO(val), 'MMM dd')}
                      minTickGap={30}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}}
                      tickFormatter={(val) => `$${val/1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}}
                      formatter={(val) => [formatCurrency(val), 'Revenue']}
                      labelFormatter={(label) => format(parseISO(label), 'MMMM dd, yyyy')}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue by Channel Chart */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase">
                    <Share2 className="h-5 w-5 text-indigo-600" />
                    Revenue by Channel
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Performance breakdown across marketing channels</p>
                </div>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelRevenueData} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#475569', fontSize: 11, fontWeight: 800}}
                      width={100}
                    />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}}
                      formatter={(val) => [formatCurrency(val), 'Revenue']}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                      {channelRevenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#2563eb', '#4f46e5', '#7c3aed', '#db2777', '#ea580c'][index % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products Table/Chart */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase">
                    <Package className="h-5 w-5 text-blue-600" />
                    Top Performing Products
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Highest grossing inventory items</p>
                </div>
              </div>
              <div className="space-y-4">
                {topProductsData.map((product, idx) => (
                  <div key={idx} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                    <div className={`h-10 w-10 flex items-center justify-center rounded-xl font-black text-sm ${idx === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                      #{idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{product.name}</p>
                      <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                          style={{ width: `${(product.revenue / topProductsData[0].revenue) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-800">{formatCurrency(product.revenue)}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Gross Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Transaction Log */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase">
                  <Menu className="h-5 w-5 text-blue-600" />
                  Detailed Transaction Log
                </h3>
                <p className="text-xs text-slate-400 font-medium">Full historical record for current filter set</p>
              </div>
              <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-[10px] font-black text-slate-500 uppercase">
                {formatNumber(filteredData.length)} Records Found
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Product</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Channel</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Revenue</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.slice(0, 50).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5 text-xs font-bold text-slate-500">{format(parseISO(row.date), 'MMM dd, yyyy')}</td>
                      <td className="px-8 py-5 text-xs font-black text-slate-800 uppercase tracking-tight">{row.product}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                          row.channel === 'Direct' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          row.channel === 'Social' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                          row.channel === 'Email' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}>
                          {row.channel}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-xs font-black text-slate-800 text-right">{formatCurrency(row.revenue)}</td>
                      <td className="px-8 py-5 text-xs font-bold text-slate-500 text-right">{row.orders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredData.length > 50 && (
                <div className="p-8 text-center bg-slate-50/30">
                  <p className="text-xs font-bold text-slate-400 italic">Showing first 50 records. Use filters to narrow down results.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function KPICard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${color} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:scale-110 transition-transform">{icon}</div>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">{value}</h3>
      </div>
    </div>
  );
}

function InsightCard({ label, value, desc, icon }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 shadow-inner group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-xl font-black text-slate-800 leading-tight mb-2 tracking-tight group-hover:text-blue-600 transition-colors uppercase">{value}</h4>
      <p className="text-xs text-slate-400 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

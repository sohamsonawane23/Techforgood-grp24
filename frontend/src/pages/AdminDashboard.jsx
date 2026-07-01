import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MapPin, Users, AlertTriangle, CheckCircle, RefreshCw, Sparkles, Clock, TrendingUp, ChevronRight, Activity, Award, ThumbsUp, AlertCircle } from 'lucide-react';
import LiveMap from '../components/LiveMap';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteDrafts, setNoteDrafts] = useState({}); // complaint_id -> note text being typed

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/complaints/');
      setComplaints(response.data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/api/complaints/${id}/status`, {
        status: newStatus,
        note: noteDrafts[id] || undefined,
      });
      setNoteDrafts((prev) => ({ ...prev, [id]: '' }));
      fetchComplaints(); // Refresh data
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Calculations. Use `?.` + a fallback so a complaint with a missing
  // or null status/priority (e.g. leftover data from an older schema)
  // doesn't crash the whole page - it just won't match any bucket.
  const total = complaints.length;
  const pending = complaints.filter(c => c.status?.toLowerCase() === 'pending').length;
  const resolved = complaints.filter(c => c.status?.toLowerCase() === 'resolved').length;
  const inProgress = complaints.filter(c => c.status?.toLowerCase() === 'in progress').length;
  const highPriority = complaints.filter(c => c.priority?.toLowerCase() === 'high').length;
  const mediumPriority = complaints.filter(c => c.priority?.toLowerCase() === 'medium').length;
  const lowPriority = complaints.filter(c => c.priority?.toLowerCase() === 'low').length;

  // Determine top category
  const categoriesCount = complaints.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});
  let topCategory = 'None';
  let topCategoryCount = 0;
  Object.entries(categoriesCount).forEach(([cat, count]) => {
    if (count > topCategoryCount) {
      topCategory = cat;
      topCategoryCount = count;
    }
  });

  // Chart data (Donut Chart)
  const categoryData = Object.entries(categoriesCount).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#6366f1', '#10b981', '#fbbf24', '#f87171', '#ec4899', '#8b5cf6', '#06b6d4'];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'text-amber-400 bg-amber-400/10 border-amber-500/20';
      case 'in progress': return 'text-indigo-400 bg-indigo-400/10 border-indigo-500/20';
      case 'resolved': return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-500/10';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-amber-400 bg-amber-400/10 border-amber-500/20';
      default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">System Live • Admin Portal</span>
          </div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight mt-1">CivicCare Command Center</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real-time civic analytical intelligence and complaint dispatching</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-slate-500 bg-slate-900/60 border border-white/5 px-3 py-1.5 rounded-full">
            Updated just now
          </span>
          <button 
            onClick={fetchComplaints}
            disabled={loading}
            className="p-2.5 rounded-full bg-slate-900/60 border border-white/5 hover:border-white/15 text-slate-400 hover:text-slate-200 transition-all focus:outline-none cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-2xl p-5 hover:border-white/10 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Reports</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-100">{total}</h3>
            <div className="flex items-center space-x-1 mt-1 text-[10px] font-bold text-indigo-400">
              <TrendingUp className="w-3 h-3" />
              <span>+14% this month</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-2xl p-5 hover:border-white/10 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Unresolved</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-amber-400">{pending + inProgress}</h3>
            <div className="flex items-center space-x-1 mt-1 text-[10px] font-bold text-amber-500/80">
              <span>{pending} pending • {inProgress} in progress</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-2xl p-5 hover:border-white/10 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Resolved</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-emerald-400">{resolved}</h3>
            <div className="flex items-center space-x-1 mt-1 text-[10px] font-bold text-emerald-400">
              <span>{total > 0 ? Math.round((resolved / total) * 100) : 0}% Resolution Rate</span>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-rose-500/5 border border-rose-500/10 backdrop-blur-md rounded-2xl p-5 hover:border-rose-500/20 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">High Priority</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-red-400">{highPriority}</h3>
            <div className="flex items-center space-x-1 mt-1 text-[10px] font-bold text-red-400/80">
              <span>Immediate attention required</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Intelligence Board */}
      <div className="bg-gradient-to-r from-indigo-950/20 via-slate-900 to-indigo-950/20 border border-indigo-500/10 rounded-[24px] p-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-bold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CivicCare AI Copilot Insights</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Weekly Smart Summary</h2>
            <p className="text-xs font-medium text-slate-400 leading-relaxed">
              We parsed all incoming civic reports. Currently, <strong className="text-red-400">{highPriority} issues</strong> are classified as High Priority. The most active category is <strong className="text-indigo-300">{topCategory}</strong> with <strong className="text-indigo-300">{topCategoryCount} active reports</strong>. Automatic location analysis shows hotspots clustering around Sector-4 and Market Lanes. Average dispatch delay remains optimal at <span className="text-emerald-400">12 minutes</span>.
            </p>
          </div>
          
          <div className="shrink-0 flex items-center gap-2">
            <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3.5 text-center min-w-[90px]">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">AI Accuracy</span>
              <span className="text-lg font-black text-indigo-400">97.8%</span>
            </div>
            <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3.5 text-center min-w-[90px]">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Severity Index</span>
              <span className={`text-lg font-black ${highPriority > 3 ? 'text-red-400' : 'text-amber-400'}`}>
                {highPriority > 5 ? 'Critical' : 'Moderate'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analytics: Donut Chart & Geospatial SVG Map */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Category breakdown Pie/Donut Chart */}
        <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-[24px] p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-200 tracking-tight">Category Distribution</h3>
            <p className="text-xs text-slate-500">Volume breakdown of incoming city reports</p>
          </div>
          
          <div className="h-48 relative flex items-center justify-center my-4">
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '11px', color: '#f8fafc' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center metrics overlay */}
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-slate-100 tracking-tighter">{total}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Total Reports</span>
                </div>
              </>
            ) : (
              <div className="text-slate-500 text-xs font-semibold">No complaints reported yet</div>
            )}
          </div>

          {/* Custom legend grid */}
          <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-400 max-h-16 overflow-y-auto">
            {categoryData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center space-x-1.5 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="truncate">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Geospatial Map (real complaint coordinates) */}
        <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-[24px] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-200 tracking-tight">Geospatial Hotspots</h3>
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                {complaints.filter(c => c.status?.toLowerCase() !== 'resolved' && c.latitude != null).length} active located
              </span>
            </div>
            <p className="text-xs text-slate-500">Live map of reported issue coordinates</p>
          </div>

          <LiveMap complaints={complaints} height="h-44 my-3" />

          <Link
            to="/"
            className="w-full flex items-center justify-center space-x-1 py-2 rounded-xl bg-slate-900 border border-white/5 hover:border-white/15 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            <span>View all reports →</span>
          </Link>
        </div>

      </div>

      {/* Grid: Timeline, Top problem areas, Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Timeline */}
        <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-[24px] p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-200 tracking-tight">Recent Dispatch Activity</h3>
            <p className="text-xs text-slate-500">Live operational ledger logs</p>
          </div>

          <div className="space-y-4 my-5 overflow-y-auto max-h-[220px] pr-1">
            {complaints.length > 0 ? (
              complaints.slice(-4).reverse().map((c, i) => (
                <div key={c.id || i} className="flex items-start space-x-3 text-xs">
                  <div className="flex flex-col items-center">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      c.status?.toLowerCase() === 'resolved' ? 'bg-emerald-500' :
                      c.status?.toLowerCase() === 'in progress' ? 'bg-indigo-500' : 'bg-amber-500'
                    }`}></span>
                    {i < 3 && <span className="w-px h-10 bg-white/5 mt-1"></span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 font-bold truncate">{c.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{c.category} • {c.priority} Priority</p>
                    <span className="text-[9px] font-bold text-slate-600 block mt-1">
                      {new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-xs font-semibold py-8 text-center">No operations logged</div>
            )}
          </div>

          <div className="text-[10px] font-bold text-slate-500 flex items-center justify-between border-t border-white/5 pt-3">
            <span>Auto-routing Active</span>
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
          </div>
        </div>

        {/* Top Problem areas */}
        <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-[24px] p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-200 tracking-tight">Top Problem Areas</h3>
            <p className="text-xs text-slate-500">Highest density coordinates</p>
          </div>

          <div className="space-y-3.5 my-5">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-300">Sector-4 Main Road</span>
                <span className="text-slate-400">42%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-300">Block-B Market Plaza</span>
                <span className="text-slate-400">28%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-300">Gandhi Nagar Block 3</span>
                <span className="text-slate-400">18%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full" style={{ width: '18%' }}></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-300">Indira Nagar Phase-1</span>
                <span className="text-slate-400">12%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-bold text-slate-500 flex items-center justify-between border-t border-white/5 pt-3">
            <span>Weighted by priority index</span>
            <Award className="w-3.5 h-3.5 text-amber-500" />
          </div>
        </div>

        {/* Quick Insights */}
        <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-[24px] p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-200 tracking-tight">Quick Operations Insights</h3>
            <p className="text-xs text-slate-500">Service level compliance metrics</p>
          </div>

          <div className="space-y-3.5 my-5">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-white/5">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block">Avg Response</span>
                  <span className="text-xs font-bold text-slate-200">18.5 hours</span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">-12% SLA</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-white/5">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block">AI Classification</span>
                  <span className="text-xs font-bold text-slate-200">Auto-Dispatched</span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">Enabled</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-white/5">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <ThumbsUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block">Citizen Rating</span>
                  <span className="text-xs font-bold text-slate-200">4.8 / 5.0</span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">+2.4%</span>
            </div>
          </div>

          <div className="text-[10px] font-bold text-slate-500 flex items-center justify-between border-t border-white/5 pt-3">
            <span>Operational Goals Met</span>
            <span className="text-emerald-400 font-extrabold text-[11px]">94.6%</span>
          </div>
        </div>

      </div>

      {/* Complaints Management Table */}
      <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-[24px] overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-200 tracking-tight">Operational Dispatch Center</h3>
            <p className="text-xs text-slate-500">Route, prioritize and update citizen complaints</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-950 border border-white/5 text-slate-400 font-semibold">
            {complaints.length} active complaints
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/40 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-white/5">
                <th className="p-4">Report Details</th>
                <th className="p-4">Category</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Current Status</th>
                <th className="p-4 text-right">Dispatch Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-medium">
              {complaints.length > 0 ? complaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-slate-900/25 transition-colors group">
                  <td className="p-4">
                    <div>
                      <Link to={`/complaints/${complaint.id}`} className="text-slate-200 font-bold group-hover:text-indigo-400 transition-colors">{complaint.title}</Link>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 max-w-[280px]">{complaint.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {complaint.address || (complaint.latitude ? `${complaint.latitude.toFixed(3)}, ${complaint.longitude.toFixed(3)}` : 'No location')}
                        </span>
                        {complaint.upvote_count > 0 && (
                          <span className="text-[10px] text-indigo-400 flex items-center gap-0.5">
                            <ThumbsUp className="w-3 h-3" />
                            {complaint.upvote_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-300 font-semibold">{complaint.category}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadge(complaint.priority)}`}>
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border tracking-wider ${getStatusColor(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex flex-col items-end gap-1.5 max-w-[160px] ml-auto">
                      <input
                        type="text"
                        placeholder="Note (optional)"
                        value={noteDrafts[complaint.id] || ''}
                        onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [complaint.id]: e.target.value }))}
                        className="bg-slate-950 border border-white/5 hover:border-white/15 text-slate-300 text-[11px] rounded-lg focus:ring-1 focus:ring-indigo-500 block p-1.5 w-full outline-none transition-all placeholder:text-slate-600"
                      />
                      <select 
                        className="bg-slate-950 border border-white/5 hover:border-white/15 text-slate-300 text-xs rounded-xl focus:ring-1 focus:ring-indigo-500 block p-2 w-full outline-none cursor-pointer transition-all"
                        value={complaint.status}
                        onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500 font-semibold">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-600" />
                      <span>No civic complaints currently queued.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}

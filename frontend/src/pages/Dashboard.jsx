import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, ClipboardList, PlusCircle, ShieldAlert } from 'lucide-react';
import ComplaintCard from '../components/ComplaintCard';
import LiveMap from '../components/LiveMap';

export default function Dashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Best-effort: center the map on the citizen's current location if they
  // grant permission. Silently ignored if denied/unsupported - the map
  // still works, just centers on the first reported issue instead.
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  const fetchComplaints = async (mineOnly) => {
    setLoading(true);
    try {
      const response = await api.get('/api/complaints/', {
        params: mineOnly ? { mine: true } : {},
      });
      setComplaints(response.data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints(showMineOnly);
  }, [showMineOnly]);

  // Quick stats reflect whichever list is currently shown (all reports,
  // or just the logged-in citizen's own reports).
  const totalReports = complaints.length;
  const resolvedReports = complaints.filter(c => c.status?.toLowerCase() === 'resolved').length;
  const pendingReports = totalReports - resolvedReports;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Hero Section / Welcome banner */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-white/5 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/5 rounded-full blur-2xl -ml-20 -mb-20"></div>
        
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20 mb-4">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>CivicCare Citizen Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Help us build a cleaner, safer, and better city.
          </h1>
          <p className="text-slate-400 font-medium text-sm mt-2 leading-relaxed">
            Report civic issues—from streetlights and drainage to potholes and trash—and watch our team resolve them in real-time.
          </p>
        </div>
      </div>

      {/* Quick stats counter */}
      {complaints.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Filed</span>
            <div className="flex items-baseline space-x-1.5 mt-2">
              <span className="text-xl sm:text-2xl font-black text-slate-100">{totalReports}</span>
              <span className="text-[10px] font-semibold text-slate-400">issues</span>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500/80">Pending Action</span>
            <div className="flex items-baseline space-x-1.5 mt-2">
              <span className="text-xl sm:text-2xl font-black text-amber-400">{pendingReports}</span>
              <span className="text-[10px] font-semibold text-amber-500/60">active</span>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500/80">Resolved</span>
            <div className="flex items-baseline space-x-1.5 mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">{resolvedReports}</span>
              <span className="text-[10px] font-semibold text-emerald-500/60">closed</span>
            </div>
          </div>
        </div>
      )}

      {/* Map of reported issues */}
      {complaints.length > 0 && (
        <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md rounded-[24px] p-5">
          <h3 className="text-sm font-bold text-slate-300 mb-1">Issues Near You</h3>
          <p className="text-xs text-slate-500 mb-3">Live map of reported locations — toggle to view density as a heatmap</p>
          <LiveMap complaints={complaints} userLocation={userLocation} height="h-72" />
        </div>
      )}

      {/* Title, filter toggle & Refresh */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-slate-200 tracking-tight flex items-center space-x-2">
          <span>{showMineOnly ? 'Your Filed Complaints' : 'All Reported Issues'}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-slate-400 font-semibold">{complaints.length}</span>
        </h2>
        <div className="flex items-center space-x-3">
          {user && (
            <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1 text-xs font-semibold">
              <button
                onClick={() => setShowMineOnly(false)}
                className={`px-3 py-1 rounded-full transition-colors ${!showMineOnly ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                All
              </button>
              <button
                onClick={() => setShowMineOnly(true)}
                className={`px-3 py-1 rounded-full transition-colors ${showMineOnly ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Mine
              </button>
            </div>
          )}
          <button 
            onClick={() => fetchComplaints(showMineOnly)}
            disabled={loading}
            className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main List / Loading / Empty State */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-[20px] bg-slate-900/20 border border-white/5 animate-pulse flex items-center p-4 space-x-4">
              <div className="w-44 h-24 rounded-2xl bg-slate-800 shrink-0"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                <div className="h-3 bg-slate-800 rounded w-3/4"></div>
                <div className="h-3 bg-slate-800 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="relative overflow-hidden bg-slate-900/30 border border-white/5 backdrop-blur-md rounded-[24px] p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-5">
          {/* Decorative background glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
          
          <div className="relative bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 p-5 rounded-full border border-indigo-500/20 shadow-md">
            <ClipboardList className="w-10 h-10 text-indigo-400" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[8px] font-black text-white">!</span>
          </div>
          
          <div className="max-w-sm space-y-2 relative z-10">
            <h3 className="text-lg font-bold text-slate-200 tracking-tight">No issues reported yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {showMineOnly
                ? "You haven't filed any civic complaints yet. Help us keep the community clean and functional by reporting issues you see."
                : "It looks like no one has filed any civic complaints yet. Help us keep the community clean and functional by reporting issues you see."}
            </p>
          </div>

          <Link 
            to="/new" 
            className="relative inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all duration-300 hover:-translate-y-0.5 tracking-wide hover:shadow-indigo-500/30 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>File Your First Report</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {complaints.map(complaint => (
            <ComplaintCard key={complaint.id} complaint={complaint} />
          ))}
        </div>
      )}
    </div>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, PlusCircle, LayoutDashboard, UserCircle, Shield, Bell } from 'lucide-react';

export default function Navbar({ isAdmin, setIsAdmin }) {
  const location = useLocation();

  return (
    <nav className="bg-slate-900/60 backdrop-blur-2xl border-b border-white/10 sticky top-0 z-50 mb-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center space-x-2 text-indigo-400 font-extrabold text-lg tracking-tight hover:opacity-90 transition-opacity">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">CivicCare</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Link 
                to="/" 
                className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
                  location.pathname === '/' 
                    ? 'bg-indigo-500/15 text-indigo-300 shadow-sm border border-indigo-500/20' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              {!isAdmin && (
                <Link 
                  to="/new" 
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 shadow-md ${
                    location.pathname === '/new' 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border border-indigo-500/30' 
                      : 'bg-indigo-500 text-white hover:bg-indigo-600 hover:-translate-y-0.5'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Report Issue</span>
                </Link>
              )}
            </div>

            <div className="h-6 w-px bg-white/10"></div>

            {/* Notification Bell */}
            <button className="relative p-1.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            </button>

            {/* Admin Toggle */}
            <button
              onClick={() => setIsAdmin(!isAdmin)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition-all duration-300 hover:border-white/20"
            >
              <div className={`p-0.5 rounded-full ${isAdmin ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`}>
                {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <UserCircle className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs font-semibold text-slate-300 tracking-wide">
                {isAdmin ? 'Admin' : 'Citizen'}
              </span>
            </button>

            {/* Avatar Placeholder */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-inner select-none cursor-pointer hover:scale-105 transition-transform">
              JD
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

import { Link } from 'react-router-dom';
import { MapPin, Calendar, Tag, Trash2, Lightbulb, Droplets, Droplet, Construction, Car, AlertCircle, ArrowRight, ThumbsUp } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

export default function ComplaintCard({ complaint }) {
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'low': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
      case 'in progress': return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20';
      case 'resolved': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/15 text-slate-400 border-slate-500/20';
    }
  };

  const getCategoryDetails = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('garbage') || cat.includes('trash')) {
      return {
        icon: <Trash2 className="w-8 h-8 text-white" />,
        gradient: 'from-emerald-500 to-teal-600',
      };
    } else if (cat.includes('streetlight') || cat.includes('light')) {
      return {
        icon: <Lightbulb className="w-8 h-8 text-white" />,
        gradient: 'from-yellow-400 to-amber-500',
      };
    } else if (cat.includes('drainage') || cat.includes('sewer')) {
      return {
        icon: <Droplets className="w-8 h-8 text-white" />,
        gradient: 'from-blue-500 to-cyan-600',
      };
    } else if (cat.includes('water')) {
      return {
        icon: <Droplet className="w-8 h-8 text-white" />,
        gradient: 'from-cyan-500 to-blue-600',
      };
    } else if (cat.includes('pothole') || cat.includes('road')) {
      return {
        icon: <Construction className="w-8 h-8 text-white" />,
        gradient: 'from-amber-500 to-orange-600',
      };
    } else if (cat.includes('traffic')) {
      return {
        icon: <Car className="w-8 h-8 text-white" />,
        gradient: 'from-rose-500 to-red-600',
      };
    } else {
      return {
        icon: <AlertCircle className="w-8 h-8 text-white" />,
        gradient: 'from-purple-500 to-indigo-600',
      };
    }
  };

  const catDetails = getCategoryDetails(complaint.category);
  const locationLabel = complaint.address
    || (complaint.latitude != null && complaint.longitude != null
      ? `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}`
      : 'Location not provided');

  return (
    <div className="bg-slate-900/40 border border-white/5 backdrop-blur-md shadow-xl rounded-[20px] p-4 hover:bg-slate-900/60 hover:border-white/10 transition-all duration-300 hover:-translate-y-0.5 group">
      <div className="flex flex-col sm:flex-row gap-5">
        
        {/* Left Section: Image or Category Gradient Fallback */}
        {complaint.image_url ? (
          <div className="w-full sm:w-44 h-44 sm:h-28 rounded-2xl overflow-hidden shadow-md shrink-0 relative">
            <img 
              src={`${API_BASE_URL}${complaint.image_url}`} 
              alt={complaint.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-2 left-2 bg-slate-950/75 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center space-x-1 border border-white/10">
              <Tag className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] font-semibold text-slate-200">{complaint.category}</span>
            </div>
          </div>
        ) : (
          <div className={`w-full sm:w-44 h-44 sm:h-28 rounded-2xl bg-gradient-to-br ${catDetails.gradient} flex items-center justify-center shrink-0 relative shadow-md overflow-hidden`}>
            {/* Subtle glow circle overlay */}
            <div className="absolute -inset-2 bg-white/10 rounded-full blur-xl"></div>
            <div className="relative transform group-hover:scale-110 transition-transform duration-300">
              {catDetails.icon}
            </div>
            <div className="absolute top-2 left-2 bg-slate-950/75 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center space-x-1 border border-white/10">
              <Tag className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] font-semibold text-slate-200">{complaint.category}</span>
            </div>
          </div>
        )}
        
        {/* Center Section: Text Details */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100 tracking-tight leading-snug group-hover:text-indigo-300 transition-colors">
              {complaint.title}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1.5 line-clamp-2 leading-relaxed">
              {complaint.description}
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-3 text-[11px] font-semibold text-slate-500 border-t border-white/5 pt-3">
            <div className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-400/80" />
              <span className="text-slate-400">{locationLabel}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(complaint.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</span>
            </div>
          </div>
        </div>

        {/* Right Section: Badges and Actions */}
        <div className="flex flex-row sm:flex-col justify-between items-end shrink-0 sm:border-l sm:border-white/5 sm:pl-5 pt-3 sm:pt-0">
          <div className="flex sm:flex-col items-center sm:items-end gap-1.5">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(complaint.status)}`}>
              {complaint.status}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPriorityColor(complaint.priority)}`}>
              {complaint.priority}
            </span>
            {complaint.upvote_count > 0 && (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border bg-indigo-500/10 text-indigo-300 border-indigo-500/20">
                <ThumbsUp className="w-2.5 h-2.5" />
                <span>{complaint.upvote_count}</span>
              </span>
            )}
          </div>
          
          <Link to={`/complaints/${complaint.id}`} className="flex items-center space-x-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors group/btn cursor-pointer">
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>

      </div>
    </div>
  );
}

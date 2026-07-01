import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, API_BASE_URL } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  MapPin, Calendar, Tag, ArrowLeft, ThumbsUp, Loader2,
  CheckCircle2, Clock, AlertCircle, FileText,
} from 'lucide-react';

const STATUS_ORDER = ['Pending', 'In Progress', 'Resolved'];

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upvoting, setUpvoting] = useState(false);
  const [upvoteError, setUpvoteError] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/complaints/${id}`);
      setComplaint(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load this report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleUpvote = async () => {
    setUpvoting(true);
    setUpvoteError('');
    try {
      await api.post(`/api/complaints/${id}/upvote`);
      fetchDetail();
    } catch (err) {
      setUpvoteError(err.response?.data?.detail || 'Could not confirm this issue.');
    } finally {
      setUpvoting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-3">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <p className="text-slate-300 font-semibold">{error || 'Report not found.'}</p>
        <Link to="/" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold">Back to dashboard</Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_ORDER.indexOf(complaint.status);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/" className="inline-flex items-center space-x-1.5 text-sm text-slate-400 hover:text-slate-200 font-semibold">
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </Link>

      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {complaint.image_url && (
          <img
            src={`${API_BASE_URL}${complaint.image_url}`}
            alt={complaint.title}
            className="w-full h-64 object-cover rounded-2xl"
          />
        )}

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-indigo-500/15 text-indigo-300 border-indigo-500/20">
              {complaint.category}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-amber-500/10 text-amber-400 border-amber-500/20">
              {complaint.priority} priority
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">{complaint.title}</h1>
          <p className="text-slate-300 mt-2 leading-relaxed">{complaint.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 border-t border-white/5 pt-4">
          <div className="flex items-center space-x-1.5">
            <MapPin className="w-4 h-4 text-indigo-400/80" />
            <span>{complaint.address || (complaint.latitude ? `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}` : 'Location not provided')}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-4 h-4" />
            <span>{new Date(complaint.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          {complaint.owner_name && (
            <div className="flex items-center space-x-1.5">
              <Tag className="w-4 h-4" />
              <span>Reported by {complaint.owner_name}</span>
            </div>
          )}
        </div>

        {/* Upvote / confirm */}
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <p className="text-sm text-slate-400">
            <span className="font-bold text-slate-200">{complaint.upvote_count}</span> {complaint.upvote_count === 1 ? 'person has' : 'people have'} confirmed this issue
          </p>
          {complaint.status !== 'Resolved' && (
            user ? (
              <button
                onClick={handleUpvote}
                disabled={upvoting}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-colors"
              >
                {upvoting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                <span>This is happening to me too</span>
              </button>
            ) : (
              <Link to="/login" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                Log in to confirm this issue
              </Link>
            )
          )}
        </div>
        {upvoteError && <p className="text-xs text-red-400">{upvoteError}</p>}
      </div>

      {/* Status timeline */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl">
        <h2 className="text-lg font-bold text-slate-200 mb-5 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          <span>Status Timeline</span>
        </h2>

        {/* Progress steps */}
        <div className="flex items-center mb-6">
          {STATUS_ORDER.map((step, idx) => (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 ${
                    idx <= currentStepIndex
                      ? 'bg-indigo-500 border-indigo-500 text-white'
                      : 'bg-transparent border-slate-600 text-slate-500'
                  }`}
                >
                  {idx < currentStepIndex || complaint.status === 'Resolved' && idx === currentStepIndex ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span className={`text-xs font-semibold whitespace-nowrap ${idx <= currentStepIndex ? 'text-slate-200' : 'text-slate-500'}`}>
                  {step}
                </span>
              </div>
              {idx < STATUS_ORDER.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${idx < currentStepIndex ? 'bg-indigo-500' : 'bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* History entries */}
        <div className="space-y-4">
          {complaint.status_history.slice().reverse().map((entry, idx) => (
            <div key={entry.id} className="flex space-x-3">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5" />
                {idx < complaint.status_history.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" />}
              </div>
              <div className="pb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-slate-200">{entry.status}</span>
                  <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(entry.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>
                {entry.note && <p className="text-sm text-slate-400 mt-0.5">{entry.note}</p>}
                {entry.changed_by && <p className="text-xs text-slate-500 mt-0.5">by {entry.changed_by}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, MapPin, LocateFixed, ThumbsUp } from 'lucide-react';
import LocationPicker from '../components/LocationPicker';

export default function NewComplaint() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const [location, setLocation] = useState(null); // { latitude, longitude }
  const [address, setAddress] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const [duplicates, setDuplicates] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [acknowledgedDuplicates, setAcknowledgedDuplicates] = useState(false);

  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setShowPicker(true);
        setLocating(false);
      },
      (err) => {
        // Surface the actual reason instead of a generic message, since
        // each of these needs a different fix on the user's end (e.g.
        // "denied" means check browser site settings, not "try again").
        let message = 'Could not get your location. You can still place it manually below.';
        if (err.code === err.PERMISSION_DENIED) {
          message = 'Location permission was denied. Check your browser\'s site settings (the icon left of the address bar) and allow location access, then try again - or place the pin manually below.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = 'Your location could not be determined right now (this can happen indoors or without GPS/Wi-Fi positioning available). Try again outdoors, or place the pin manually below.';
        } else if (err.code === err.TIMEOUT) {
          message = 'Getting your location took too long and timed out. Try again, or place the pin manually below.';
        }
        setLocationError(message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Whenever we have a location, check whether someone has already
  // reported something nearby, so the citizen can confirm an existing
  // report instead of creating a duplicate ticket.
  useEffect(() => {
    if (!location) {
      setDuplicates([]);
      return;
    }
    setCheckingDuplicates(true);
    setAcknowledgedDuplicates(false);
    api
      .get('/api/complaints/nearby-duplicates', {
        params: { latitude: location.latitude, longitude: location.longitude },
      })
      .then((res) => setDuplicates(res.data))
      .catch(() => setDuplicates([]))
      .finally(() => setCheckingDuplicates(false));
  }, [location]);

  const handleUpvote = async (complaintId) => {
    try {
      await api.post(`/api/complaints/${complaintId}/upvote`);
      navigate(`/complaints/${complaintId}`);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setErrorMessage(err.response?.data?.detail || 'Could not confirm this issue.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return;

    setStatus('submitting');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (location) {
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);
    }
    if (address) {
      formData.append('address', address);
    }
    if (image) {
      formData.append('image', image);
    }

    try {
      await api.post('/api/complaints/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus('success');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error('Submission error:', error);
      setStatus('error');
      setErrorMessage(error.response?.data?.detail || 'An error occurred during submission.');
    }
  };

  const hasUnresolvedDuplicates = duplicates.length > 0 && !acknowledgedDuplicates;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Report an Issue</h1>
        <p className="text-slate-400 mt-2">Help us keep the city safe and clean. Our AI will automatically categorize your report.</p>
      </div>

      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        {status === 'success' && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <CheckCircle2 className="w-20 h-20 text-emerald-400 mb-4" />
            <h2 className="text-2xl font-bold text-slate-100">Report Submitted!</h2>
            <p className="text-slate-400 mt-2">Redirecting to dashboard...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {status === 'error' && (
            <div className="bg-red-500/10 text-red-400 p-4 rounded-xl flex items-start space-x-3 border border-red-500/20">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-bold text-slate-300 mb-2">Issue Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-black/20 text-slate-100 backdrop-blur-sm placeholder:text-slate-500"
              placeholder="e.g. Deep pothole on Main St."
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-bold text-slate-300 mb-2">Detailed Description</label>
            <textarea
              id="description"
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-black/20 text-slate-100 backdrop-blur-sm resize-none placeholder:text-slate-500"
              placeholder="Please provide details about the location and severity of the issue..."
              required
            ></textarea>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Location</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-black/20 text-slate-100 backdrop-blur-sm placeholder:text-slate-500"
                placeholder="e.g. Near FC Road junction (optional)"
              />
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locating}
                className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border border-white/10 bg-black/20 hover:bg-white/5 text-slate-200 font-semibold text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                <span>Use my location</span>
              </button>
              {!showPicker && (
                <button
                  type="button"
                  onClick={() => setShowPicker(true)}
                  className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border border-white/10 bg-black/20 hover:bg-white/5 text-slate-300 font-semibold text-sm transition-colors whitespace-nowrap"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Set on map</span>
                </button>
              )}
            </div>
            {location && (
              <p className="text-xs text-emerald-400 mt-2 flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>Location captured ({location.latitude.toFixed(5)}, {location.longitude.toFixed(5)})</span>
              </p>
            )}
            {locationError && <p className="text-xs text-amber-400 mt-2">{locationError}</p>}

            {showPicker && (
              <div className="mt-3 space-y-1.5">
                {!location && (
                  <p className="text-xs text-slate-400">Click anywhere on the map to drop a pin at the issue's location.</p>
                )}
                <LocationPicker
                  latitude={location?.latitude}
                  longitude={location?.longitude}
                  onChange={(lat, lng) => setLocation({ latitude: lat, longitude: lng })}
                />
              </div>
            )}
          </div>

          {/* Nearby duplicates */}
          {checkingDuplicates && (
            <p className="text-xs text-slate-400 flex items-center space-x-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Checking for similar reports nearby...</span>
            </p>
          )}

          {hasUnresolvedDuplicates && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-amber-300">
                {duplicates.length === 1 ? 'A similar report already exists nearby' : `${duplicates.length} similar reports already exist nearby`}
              </p>
              <p className="text-xs text-amber-200/80">
                If this is the same issue, confirm it instead of filing a new report — it helps prioritize fixes faster.
              </p>
              <div className="space-y-2">
                {duplicates.map((d) => (
                  <div key={d.id} className="flex items-center justify-between bg-black/20 rounded-xl px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{d.title}</p>
                      <p className="text-xs text-slate-400">{d.category} · {Math.round(d.distance_meters)}m away · {d.upvote_count} confirmed</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpvote(d.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors whitespace-nowrap"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>This too</span>
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setAcknowledgedDuplicates(true)}
                className="text-xs font-semibold text-slate-300 hover:text-slate-100 underline"
              >
                This is a different issue — continue filing a new report
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Photo Evidence</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-700 border-dashed rounded-2xl bg-black/20 hover:bg-white/5 transition-colors relative">
              {preview ? (
                <div className="space-y-4 w-full">
                  <div className="h-48 w-full rounded-xl overflow-hidden shadow-sm relative group">
                    <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white font-medium text-sm">Click to change</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-center py-6">
                  <UploadCloud className="mx-auto h-12 w-12 text-slate-500" />
                  <div className="text-sm text-slate-400">
                    <span className="relative cursor-pointer rounded-md font-bold text-indigo-400 hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 transition-colors">
                      <span>Upload a file</span>
                    </span>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
              <input 
                id="file-upload" 
                name="file-upload" 
                type="file" 
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={status === 'submitting' || !title || !description || hasUnresolvedDuplicates}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-indigo-500/30"
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Analyzing with AI...
                </>
              ) : (
                'Submit Report'
              )}
            </button>
            {hasUnresolvedDuplicates && (
              <p className="text-xs text-slate-500 text-center mt-2">
                Resolve the similar-reports notice above to submit, or confirm an existing report instead.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function NewComplaint() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return;
    
    setStatus('submitting');
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (image) {
      formData.append('image', image);
    }

    try {
      await axios.post('http://localhost:8000/api/complaints/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setStatus('success');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Submission error:', error);
      setStatus('error');
      setErrorMessage(error.response?.data?.detail || 'An error occurred during submission.');
    }
  };

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
              disabled={status === 'submitting' || !title || !description}
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
          </div>
        </form>
      </div>
    </div>
  );
}

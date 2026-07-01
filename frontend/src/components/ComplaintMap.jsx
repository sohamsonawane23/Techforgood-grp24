import { MapPin } from 'lucide-react';

// A lightweight, dependency-free map: projects real complaint lat/lng
// onto an SVG viewbox using min/max bounds of the actual data. This is
// intentionally not a tiled street map (no Google/Mapbox API key
// required) - good enough to show real geographic clustering for a
// demo, with an honest "doesn't represent real streets" tradeoff.
//
// Replace with react-leaflet + OpenStreetMap tiles (free, no API key)
// if you want real street-level maps for production.

const STATUS_COLOR = {
  pending: '#f59e0b',
  'in progress': '#6366f1',
  resolved: '#10b981',
};

function getColor(status) {
  return STATUS_COLOR[status?.toLowerCase()] || '#94a3b8';
}

export default function ComplaintMap({ complaints, height = 'h-44', showLegend = false }) {
  const located = complaints.filter((c) => c.latitude != null && c.longitude != null);

  if (located.length === 0) {
    return (
      <div className={`${height} my-3 bg-slate-950/60 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center px-6`}>
        <MapPin className="w-6 h-6 text-slate-600 mb-2" />
        <p className="text-xs font-semibold text-slate-500">No located reports yet</p>
        <p className="text-[10px] text-slate-600 mt-0.5">Reports with a captured location will appear here</p>
      </div>
    );
  }

  const lats = located.map((c) => c.latitude);
  const lngs = located.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Pad the bounding box a bit so points near the edge aren't clipped,
  // and so a single point (zero-size box) doesn't divide by zero.
  const latRange = Math.max(maxLat - minLat, 0.001);
  const lngRange = Math.max(maxLng - minLng, 0.001);
  const pad = 0.15;

  const project = (lat, lng) => {
    const x = ((lng - minLng) / lngRange) * (100 - 2 * pad * 100) + pad * 100;
    // Latitude increases northward but SVG y increases downward, so flip.
    const y = (1 - (lat - minLat) / latRange) * (100 - 2 * pad * 100) + pad * 100;
    return { x, y };
  };

  return (
    <div className={`${height} my-3 bg-slate-950/60 rounded-2xl border border-white/5 relative overflow-hidden`}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-slate-950 opacity-90" />

      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* subtle reference grid */}
        <path d="M0 25 H100 M0 50 H100 M0 75 H100 M25 0 V100 M50 0 V100 M75 0 V100" stroke="#1e293b" strokeWidth="0.3" />

        {located.map((c) => {
          const { x, y } = project(c.latitude, c.longitude);
          const color = getColor(c.status);
          const radius = c.priority?.toLowerCase() === 'high' ? 2.6 : 1.8;
          return (
            <g key={c.id}>
              <circle cx={x} cy={y} r={radius + 1.5} fill={color} opacity="0.35" className="animate-ping" style={{ transformOrigin: `${x}px ${y}px` }} />
              <circle cx={x} cy={y} r={radius} fill={color} stroke="#0f172a" strokeWidth="0.4" />
            </g>
          );
        })}
      </svg>

      {showLegend && (
        <div className="absolute bottom-2 left-2 flex items-center gap-3 bg-slate-900/90 border border-white/10 px-2.5 py-1 rounded-lg text-[9px] font-bold text-slate-400">
          {Object.entries(STATUS_COLOR).map(([status, color]) => (
            <span key={status} className="flex items-center gap-1 capitalize">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
              {status}
            </span>
          ))}
        </div>
      )}

      <div className="absolute top-2 right-2 bg-slate-900/90 border border-white/10 px-2 py-0.5 rounded text-[8px] font-black text-slate-400">
        {located.length} located
      </div>
    </div>
  );
}

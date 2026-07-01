import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Link } from 'react-router-dom';
import { Flame, MapPinned, ThumbsUp } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

// Leaflet's default marker icon paths break under Vite's bundler unless
// built manually (a well-known gotcha), so we instead build small colored
// pin icons ourselves as inline SVG data URIs - this also lets us
// color-code pins by status without shipping separate icon image files.
const STATUS_COLOR = {
  pending: '#f59e0b',
  'in progress': '#6366f1',
  resolved: '#10b981',
};

function getColor(status) {
  return STATUS_COLOR[status?.toLowerCase()] || '#94a3b8';
}

function makePinIcon(color, highlighted = false) {
  const size = highlighted ? 34 : 26;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <path d="M12 0C7.6 0 4 3.6 4 8c0 5.4 6.6 12.6 7.1 13.1.2.2.4.3.6.3s.4-.1.6-.3C12.8 20.6 20 13.4 20 8c0-4.4-3.6-8-8-8z"
        fill="${color}" stroke="#0f172a" stroke-width="0.8"/>
      <circle cx="12" cy="8" r="3.2" fill="#0f172a" opacity="0.85"/>
    </svg>`;
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// Recenters the map whenever the target coordinates change (e.g. once
// browser geolocation resolves after the map has already mounted).
function RecenterOnChange({ center, zoom }) {
  const map = useMap();
  const prevCenter = useRef(null);
  useEffect(() => {
    if (!center) return;
    const changed =
      !prevCenter.current ||
      prevCenter.current[0] !== center[0] ||
      prevCenter.current[1] !== center[1];
    if (changed) {
      map.setView(center, zoom ?? map.getZoom());
      prevCenter.current = center;
    }
  }, [center, zoom, map]);
  return null;
}

// Renders (or clears) a leaflet.heat heatmap layer driven by the same
// complaint data as the pins, toggled on/off rather than mounted as a
// separate map.
function HeatmapLayer({ points, visible }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }
    if (points.length === 0) return;

    const heat = L.heatLayer(points, {
      radius: 28,
      blur: 22,
      maxZoom: 17,
      gradient: { 0.2: '#10b981', 0.5: '#f59e0b', 0.8: '#ef4444' },
    });
    heat.addTo(map);
    layerRef.current = heat;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [points, visible, map]);

  return null;
}

const DEFAULT_CENTER = [18.5204, 73.8567]; // Pune - used only if no complaints and no user location are available

export default function LiveMap({ complaints, userLocation, height = 'h-72' }) {
  const [mode, setMode] = useState('pins'); // 'pins' | 'heatmap'

  const located = useMemo(
    () => complaints.filter((c) => c.latitude != null && c.longitude != null),
    [complaints]
  );

  const center = useMemo(() => {
    if (userLocation) return [userLocation.latitude, userLocation.longitude];
    if (located.length > 0) return [located[0].latitude, located[0].longitude];
    return DEFAULT_CENTER;
  }, [userLocation, located]);

  const heatPoints = useMemo(
    () =>
      located.map((c) => {
        // Weight unresolved/high-priority issues more heavily so the
        // heatmap highlights where attention is most needed, not just
        // raw report density.
        const intensity =
          c.status?.toLowerCase() === 'resolved' ? 0.3 : c.priority?.toLowerCase() === 'high' ? 1 : 0.6;
        return [c.latitude, c.longitude, intensity];
      }),
    [located]
  );

  const icons = useMemo(() => {
    const cache = new Map();
    return (status) => {
      if (!cache.has(status)) cache.set(status, makePinIcon(getColor(status)));
      return cache.get(status);
    };
  }, []);

  return (
    <div className={`${height} relative rounded-2xl overflow-hidden border border-white/10`}>
      {/* Pins / Heatmap toggle */}
      <div className="absolute top-3 right-3 z-[500] flex items-center bg-slate-900/90 border border-white/10 rounded-full p-1 text-xs font-semibold shadow-lg">
        <button
          onClick={() => setMode('pins')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
            mode === 'pins' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPinned className="w-3.5 h-3.5" />
          Pins
        </button>
        <button
          onClick={() => setMode('heatmap')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
            mode === 'heatmap' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          Heatmap
        </button>
      </div>

      {located.length === 0 ? (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center px-6">
          <MapPinned className="w-7 h-7 text-slate-600 mb-2" />
          <p className="text-xs font-semibold text-slate-500">No located reports yet</p>
          <p className="text-[10px] text-slate-600 mt-0.5">Reports with a captured location will appear here</p>
        </div>
      ) : (
        <MapContainer
          center={center}
          zoom={located.length > 0 ? 14 : 12}
          scrollWheelZoom
          style={{ height: '100%', width: '100%', background: '#0f172a' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <RecenterOnChange center={center} />

          {mode === 'pins' &&
            located.map((c) => (
              <Marker key={c.id} position={[c.latitude, c.longitude]} icon={icons(c.status)}>
                <Popup>
                  <div className="w-48 space-y-1.5">
                    {c.image_url && (
                      <img
                        src={`${API_BASE_URL}${c.image_url}`}
                        alt={c.title}
                        className="w-full h-20 object-cover rounded-lg mb-1"
                      />
                    )}
                    <p className="font-bold text-sm text-slate-900 leading-snug">{c.title}</p>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span
                        className="px-1.5 py-0.5 rounded-full font-bold text-white"
                        style={{ backgroundColor: getColor(c.status) }}
                      >
                        {c.status}
                      </span>
                      <span className="text-slate-500">{c.category}</span>
                    </div>
                    {c.upvote_count > 0 && (
                      <p className="flex items-center gap-1 text-[11px] text-slate-500">
                        <ThumbsUp className="w-3 h-3" /> {c.upvote_count} confirmed
                      </p>
                    )}
                    <Link
                      to={`/complaints/${c.id}`}
                      className="block text-center text-[11px] font-bold text-indigo-600 hover:text-indigo-700 pt-1"
                    >
                      View details →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}

          <HeatmapLayer points={heatPoints} visible={mode === 'heatmap'} />
        </MapContainer>
      )}

      {mode === 'heatmap' && located.length > 0 && (
        <div className="absolute bottom-3 left-3 z-[500] bg-slate-900/90 border border-white/10 px-2.5 py-1.5 rounded-lg text-[9px] font-bold text-slate-400">
          <span className="text-emerald-400">Low</span> · <span className="text-amber-400">Medium</span> ·{' '}
          <span className="text-red-400">High</span> concentration
        </div>
      )}
    </div>
  );

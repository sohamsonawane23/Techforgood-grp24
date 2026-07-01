import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const pinIconSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
    <path d="M12 0C7.6 0 4 3.6 4 8c0 5.4 6.6 12.6 7.1 13.1.2.2.4.3.6.3s.4-.1.6-.3C12.8 20.6 20 13.4 20 8c0-4.4-3.6-8-8-8z"
      fill="#6366f1" stroke="#0f172a" stroke-width="0.8"/>
    <circle cx="12" cy="8" r="3.2" fill="#0f172a" opacity="0.85"/>
  </svg>`;
const pinIcon = new L.Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(pinIconSvg)}`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function ClickToMove({ onMove }) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnChange({ center }) {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (!center) return;
    if (!prev.current || prev.current[0] !== center[0] || prev.current[1] !== center[1]) {
      map.setView(center, map.getZoom() < 14 ? 16 : map.getZoom());
      prev.current = center;
    }
  }, [center, map]);
  return null;
}

const DEFAULT_CENTER = [18.5204, 73.8567]; // fallback only if no location is set yet

/**
 * Interactive map for confirming a complaint's exact location: shows a
 * single draggable pin, and lets the citizen click anywhere on the map
 * to move it (since device GPS can be off by tens of meters, especially
 * indoors). Calls onChange(lat, lng) whenever the pin moves.
 */
export default function LocationPicker({ latitude, longitude, onChange, height = 'h-56' }) {
  const center = latitude != null && longitude != null ? [latitude, longitude] : DEFAULT_CENTER;

  const handleMove = (lat, lng) => onChange(lat, lng);

  return (
    <div className={`${height} rounded-2xl overflow-hidden border border-white/10 relative`}>
      <MapContainer center={center} zoom={latitude != null ? 16 : 12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnChange center={latitude != null ? center : null} />
        <ClickToMove onMove={handleMove} />
        {latitude != null && longitude != null && (
          <Marker
            position={[latitude, longitude]}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const { lat, lng } = e.target.getLatLng();
                handleMove(lat, lng);
              },
            }}
          />
        )}
      </MapContainer>
      <div className="absolute bottom-2 left-2 z-[500] bg-slate-900/90 border border-white/10 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-300">
        Click the map or drag the pin to fine-tune the exact spot
      </div>
    </div>
  );
}

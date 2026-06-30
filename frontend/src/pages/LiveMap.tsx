import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AlertTriangle, ShieldPlus, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createEmojiIcon = (color: string, emoji: string) => {
  return new L.DivIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 14px;">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

const fireIcon = createEmojiIcon('#EF4444', '🔥');
const stormIcon = createEmojiIcon('#8B5CF6', '⛈️');
const volcanoIcon = createEmojiIcon('#EA580C', '🌋');
const alertIcon = createEmojiIcon('#EF4444', '⚠️');
const shelterIcon = createEmojiIcon('#10B981', '🛡️');
const hospitalIcon = createEmojiIcon('#3B82F6', '🏥');

const getIconForType = (type: string) => {
  switch (type) {
    case 'fire': return fireIcon;
    case 'storm': return stormIcon;
    case 'volcano': return volcanoIcon;
    case 'shelter': return shelterIcon;
    case 'hospital': return hospitalIcon;
    default: return alertIcon;
  }
};

// Simulated lazy-loaded markers
const generateMarkers = (count: number, type: 'alert' | 'shelter' | 'hospital', bounds: { lat: number, lng: number }) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${type}-${i}`,
    type,
    position: [
      bounds.lat + (Math.random() - 0.5) * 0.1,
      bounds.lng + (Math.random() - 0.5) * 0.1
    ] as [number, number],
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
  }));
};

const initialCenter: [number, number] = [28.6139, 77.2090]; // New Delhi

const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const PopupAddress = ({ lat, lng }: { lat: number; lng: number }) => {
  const [address, setAddress] = useState<string>('Resolving location...');

  useEffect(() => {
    let active = true;
    const fetchAddress = async () => {
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
          { headers: { 'User-Agent': 'ResQAI-Emergency-App' } }
        );
        if (!active) return;
        const addr = response.data.address;
        if (addr) {
          const area = addr.suburb || addr.neighbourhood || addr.road || addr.village || addr.town || addr.hamlet || '';
          const city = addr.city || addr.town || addr.city_district || '';
          const state = addr.state || '';
          const country = addr.country || '';
          
          const parts = [area, city, state, country].filter(Boolean);
          if (parts.length > 0) {
            setAddress(parts.join(', '));
          } else {
            setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        } else {
          setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      } catch (error) {
        if (!active) return;
        console.error('Reverse geocoding error:', error);
        setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    };

    fetchAddress();
    return () => {
      active = false;
    };
  }, [lat, lng]);

  return (
    <p className="text-xs text-gray-600 mb-3 bg-gray-100/70 p-2 rounded border border-gray-200/50 leading-relaxed font-medium">
      {address}
    </p>
  );
};

const LiveMap = () => {
  const [activeLayer, setActiveLayer] = useState<'all' | 'alerts' | 'shelters' | 'hospitals'>('all');

  // AI Risk Assessment State
  const [assessments, setAssessments] = useState<Record<string, any>>({});
  const [assessingId, setAssessingId] = useState<string | null>(null);

  const assessRisk = async (marker: any) => {
    setAssessingId(marker.id);
    try {
      const payload = {
        event_title: marker.title,
        event_type: marker.type,
        latitude: marker.position[0],
        longitude: marker.position[1],
        temperature: 32,
        humidity: 85,
        wind_speed: 15
      };
      const res = await axios.post(`${API_BASE_URL}/ai/risk-score`, payload);
      setAssessments(prev => ({...prev, [marker.id]: res.data}));
    } catch (e) {
      console.error(e);
    } finally {
      setAssessingId(null);
    }
  };

  // Fetch Live NASA Data with Optimistic Loading
  const { data: nasaEvents, isLoading: isNasaLoading, isFetching: isNasaFetching, refetch: refetchNasa } = useQuery({
    queryKey: ['nasa_events'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/disasters/nasa`);
      return res.data;
    },
    refetchInterval: 60000, // Refetch every minute
    initialData: () => {
      const cached = localStorage.getItem('cached_nasa_events');
      if (cached) {
        return JSON.parse(cached);
      }
      return undefined;
    }
  });

  // Save successful fetch to local storage for next time
  useEffect(() => {
    if (nasaEvents && nasaEvents.length > 0) {
      localStorage.setItem('cached_nasa_events', JSON.stringify(nasaEvents));
    }
  }, [nasaEvents]);

  // Simulated Shelters & Hospitals to augment the live disaster data
  const [staticMarkers, setStaticMarkers] = useState<any[]>([]);
  useEffect(() => {
    const shelters = generateMarkers(8, 'shelter', { lat: initialCenter[0], lng: initialCenter[1] });
    const hospitals = generateMarkers(5, 'hospital', { lat: initialCenter[0], lng: initialCenter[1] });
    setStaticMarkers([...shelters, ...hospitals]);
  }, []);

  const allMarkers = [...(nasaEvents || []), ...staticMarkers];
  const loading = isNasaLoading;


  const filteredMarkers = allMarkers.filter(m => activeLayer === 'all' || m.type === activeLayer.slice(0, -1) || (activeLayer === 'alerts' && ['fire', 'storm', 'volcano'].includes(m.type)));

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col glass-panel overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-surface/50 z-10 relative">
        <div>
          <h2 className="text-xl font-bold text-white">Interactive Disaster Map</h2>
          <p className="text-sm text-gray-400">Real-time resource and incident tracking</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => refetchNasa()}
            disabled={isNasaFetching}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-gray-700/50"
            title="Sync live NASA disaster alerts"
          >
            <RefreshCw size={16} className={isNasaFetching ? 'animate-spin text-primary' : ''} />
            {isNasaFetching ? 'Syncing...' : 'Sync NASA'}
          </button>
          <button 
            onClick={() => setActiveLayer('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeLayer === 'all' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            All Layers
          </button>
          <button 
            onClick={() => setActiveLayer('alerts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeLayer === 'alerts' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <AlertTriangle size={16} /> Alerts
          </button>
          <button 
            onClick={() => setActiveLayer('shelters')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeLayer === 'shelters' ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <ShieldPlus size={16} /> Shelters
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-surface/50 backdrop-blur-sm flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
        <MapContainer 
          center={initialCenter} 
          zoom={12} 
          style={{ height: '100%', width: '100%', backgroundColor: '#0B0F19' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapController center={initialCenter} />
          <MarkerClusterGroup chunkedLoading={true} maxClusterRadius={50}>
            {filteredMarkers.map((marker) => (
              <Marker 
                key={marker.id} 
                position={marker.position}
                icon={getIconForType(marker.type)}
              >
                <Popup className="custom-popup">
                  <div className="p-2 w-64">
                    <h3 className="font-bold text-gray-900">{marker.title}</h3>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Geocoded Location</div>
                    <PopupAddress lat={marker.position[0]} lng={marker.position[1]} />
                    
                    {assessments[marker.id] ? (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100 shadow-sm">
                         <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-gray-900">AI Risk: {assessments[marker.id].severity}</span>
                           <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${assessments[marker.id].severity === 'Critical' ? 'bg-red-600' : 'bg-orange-500'}`}>
                             {assessments[marker.id].riskScore}/100
                           </span>
                         </div>
                         <p className="text-xs text-gray-700 mb-2 leading-relaxed">{assessments[marker.id].analysis}</p>
                         <ul className="text-xs text-gray-800 list-disc pl-4 space-y-1">
                           {assessments[marker.id].recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                         </ul>
                      </div>
                    ) : (
                      <button 
                        onClick={() => assessRisk(marker)} 
                        disabled={assessingId === marker.id}
                        className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all shadow-md disabled:opacity-70"
                      >
                        {assessingId === marker.id ? (
                          <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> Analyzing...</>
                        ) : (
                          <>✨ AI Assess Risk</>
                        )}
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  );
};

export default LiveMap;

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Activity, Wind, AlertTriangle, Users, MapPin, HeartPulse, Sun, CloudRain, Snowflake, Building2, ShieldCheck, Phone, ExternalLink, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

// Interface definitions
interface VolunteerProvider {
  _id: string;
  name: string;
  type: 'individual' | 'ngo';
  organizationName?: string;
  registrationNumber?: string;
  contact: { phone: string; email: string };
  location: { city: string; state: string; country: string; address?: string };
  servicesOffered: string[];
  capacity?: string;
  availability: 'available' | 'busy' | 'unavailable';
  verified?: boolean;
}

// Helper to get weather background themes and scenery overlays
const getWeatherTheme = (condition: string) => {
  const cond = condition ? condition.toLowerCase() : '';
  
  if (cond.includes('clear') || cond.includes('sunny')) {
    return {
      bgClass: "bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-surface/80 border-amber-500/30",
      pageBg: "linear-gradient(135deg, rgba(245, 158, 11, 0.4) 0%, rgba(251, 146, 60, 0.15) 50%, #0b0f19 100%)",
      textClass: "text-amber-400",
      iconColor: "#F59E0B",
      scenery: (
        <div className="fixed inset-0 overflow-hidden opacity-90 pointer-events-none z-0">
          <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-amber-400/20 blur-[100px] animate-pulse"></div>
          <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-amber-300/10 opacity-40 border border-amber-200/25 animate-ping" style={{ animationDuration: '6s' }}></div>
        </div>
      )
    };
  }
  
  if (cond.includes('rain') || cond.includes('shower') || cond.includes('thunderstorm')) {
    return {
      bgClass: "bg-gradient-to-br from-blue-900/20 via-slate-800/10 to-surface/80 border-blue-500/30",
      pageBg: "linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(30, 58, 138, 0.15) 50%, #0b0f19 100%)",
      textClass: "text-blue-400",
      iconColor: "#3B82F6",
      scenery: (
        <div className="fixed inset-0 overflow-hidden opacity-80 pointer-events-none z-0">
          <div className="absolute inset-0">
            <div className="rain-line left-[10%]" style={{ animationDelay: '0s', animationDuration: '1.2s' }}></div>
            <div className="rain-line left-[25%]" style={{ animationDelay: '0.4s', animationDuration: '1.5s' }}></div>
            <div className="rain-line left-[40%]" style={{ animationDelay: '0.8s', animationDuration: '1.1s' }}></div>
            <div className="rain-line left-[55%]" style={{ animationDelay: '0.2s', animationDuration: '1.4s' }}></div>
            <div className="rain-line left-[70%]" style={{ animationDelay: '1.1s', animationDuration: '1.3s' }}></div>
            <div className="rain-line left-[85%]" style={{ animationDelay: '0.6s', animationDuration: '1.6s' }}></div>
          </div>
        </div>
      )
    };
  }
  
  if (cond.includes('snow') || cond.includes('winter')) {
    return {
      bgClass: "bg-gradient-to-br from-sky-300/10 via-slate-800/10 to-surface/80 border-sky-300/30",
      pageBg: "linear-gradient(135deg, rgba(56, 189, 248, 0.4) 0%, rgba(125, 211, 252, 0.15) 50%, #0b0f19 100%)",
      textClass: "text-sky-300",
      iconColor: "#38BDF8",
      scenery: (
        <div className="fixed inset-0 overflow-hidden opacity-90 pointer-events-none z-0">
          <div className="absolute inset-0">
            <div className="snowflake left-[15%]" style={{ animationDelay: '0s', animationDuration: '5s' }}>❄</div>
            <div className="snowflake left-[35%]" style={{ animationDelay: '2s', animationDuration: '6s' }}>❄</div>
            <div className="snowflake left-[55%]" style={{ animationDelay: '0.8s', animationDuration: '4.5s' }}>❄</div>
            <div className="snowflake left-[75%]" style={{ animationDelay: '2.5s', animationDuration: '5.5s' }}>❄</div>
            <div className="snowflake left-[90%]" style={{ animationDelay: '1.2s', animationDuration: '5.2s' }}>❄</div>
          </div>
        </div>
      )
    };
  }

  if (cond.includes('cloud') || cond.includes('fog') || cond.includes('overcast')) {
    return {
      bgClass: "bg-gradient-to-br from-slate-500/20 via-slate-800/10 to-surface/80 border-slate-500/20",
      pageBg: "linear-gradient(135deg, rgba(148, 163, 184, 0.45) 0%, rgba(71, 85, 105, 0.15) 50%, #0b0f19 100%)",
      textClass: "text-slate-400",
      iconColor: "#94A3B8",
      scenery: (
        <div className="fixed inset-0 overflow-hidden opacity-85 pointer-events-none z-0">
          <div className="absolute top-[-5%] left-[-10%] w-[130%] h-80 bg-slate-500/25 blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="absolute top-[20%] right-[-10%] w-[120%] h-64 bg-slate-600/15 blur-3xl animate-pulse" style={{ animationDuration: '12s' }}></div>
        </div>
      )
    };
  }
  
  return {
    bgClass: "bg-surface/80 border-gray-800",
    pageBg: "linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.2) 50%, #0b0f19 100%)",
    textClass: "text-gray-400",
    iconColor: "#9CA3AF",
    scenery: null
  };
};

// Default Sample NGO Data if offline
const DEMO_NGO_LIST: VolunteerProvider[] = [
  {
    _id: 'ngo_demo_01',
    type: 'ngo',
    name: 'Disaster Relief India Foundation',
    organizationName: 'Disaster Relief India Foundation',
    registrationNumber: 'GJ/2026/089123',
    contact: { phone: '+91 9876543210', email: 'relief@drif-india.org' },
    location: { city: 'Surat', state: 'Gujarat', country: 'India', address: 'Ring Road Sector 2' },
    servicesOffered: ['Shelter & Evacuation', 'Food & Clean Water', 'Medical Aid'],
    capacity: '500 Persons Shelter Capacity',
    availability: 'available',
    verified: true
  },
  {
    _id: 'ngo_demo_02',
    type: 'ngo',
    name: 'Red Cross Emergency Response Corps',
    organizationName: 'Red Cross Emergency Response Corps',
    registrationNumber: 'MH/2025/044521',
    contact: { phone: '+91 9123456789', email: 'emergency@redcross.org.in' },
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India', address: 'Bandra Reclamation' },
    servicesOffered: ['Medical Aid & First Response', 'Rescue Manpower', 'Emergency Transport'],
    capacity: '12 Ambulances & Mobile Clinics',
    availability: 'available',
    verified: true
  },
  {
    _id: 'ngo_demo_03',
    type: 'ngo',
    name: 'Seva Bharathi Flood Rescue Taskforce',
    organizationName: 'Seva Bharathi Flood Rescue Taskforce',
    registrationNumber: 'KL/2026/011982',
    contact: { phone: '+91 9447012345', email: 'help@sevabharathi.org' },
    location: { city: 'Kochi', state: 'Kerala', country: 'India', address: 'MG Road' },
    servicesOffered: ['Food & Clean Water', 'Emergency Transport', 'Logistics & Supplies'],
    capacity: '20 Motorboats & Supply Trucks',
    availability: 'busy',
    verified: true
  }
];

// Augmented data fetching hook
const useDashboardData = () => {
  const [staticData, setStaticData] = useState<any>(null);
  const [staticLoading, setStaticLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(() => {
    const cached = localStorage.getItem('user_coords');
    return cached ? JSON.parse(cached) : null;
  });
  const [isLocating, setIsLocating] = useState(false);
  const [locationName, setLocationName] = useState<string>(() => {
    return localStorage.getItem('user_location_name') || 'New Delhi (Default)';
  });

  // Fetch Live NASA Data
  const { data: nasaEvents, isLoading: isNasaLoading } = useQuery({
    queryKey: ['nasa_events_dashboard'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/disasters/nasa`);
      return res.data;
    },
    refetchInterval: 60000,
    initialData: () => {
      const cached = localStorage.getItem('cached_nasa_events');
      return cached ? JSON.parse(cached) : undefined;
    }
  });

  // Fetch Live Weather Data
  const { data: weatherData, isLoading: isWeatherLoading } = useQuery({
    queryKey: ['weather_dashboard', coords?.lat, coords?.lng],
    queryFn: async () => {
      const url = coords 
        ? `${API_BASE_URL}/weather?lat=${coords.lat}&lng=${coords.lng}`
        : `${API_BASE_URL}/weather`;
      const res = await axios.get(url);
      return res.data;
    },
    refetchInterval: 1800000,
  });

  // Fetch Live Volunteer & NGO Data from Volunteer Hub
  const { data: volunteerList = DEMO_NGO_LIST } = useQuery<VolunteerProvider[]>({
    queryKey: ['volunteer_providers_dashboard'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/volunteers`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data;
        }
      } catch (_) {
        console.warn('Backend volunteers API offline, loading demo volunteer roster.');
      }
      return DEMO_NGO_LIST;
    }
  });

  useEffect(() => {
    if (weatherData) {
      localStorage.setItem('cached_weather_dashboard', JSON.stringify(weatherData));
    }
  }, [weatherData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStaticData({
        riskScore: 78,
        shelters: 45,
        weather: { temp: 32, humidity: 85, condition: 'Heavy Rain' },
        preparedness: 65,
        resources: { food: 85, water: 60, medical: 40 }
      });
      setStaticLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCoords(newCoords);
        setLocationName('Current Location');
        localStorage.setItem('user_coords', JSON.stringify(newCoords));
        localStorage.setItem('user_location_name', 'Current Location');
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Could not retrieve your location. Using default location.');
        setIsLocating(false);
      }
    );
  };

  const resetLocation = () => {
    setCoords(null);
    setLocationName('New Delhi (Default)');
    localStorage.removeItem('user_coords');
    localStorage.removeItem('user_location_name');
  };

  // Compute Volunteer & NGO Stats
  const totalProviders = volunteerList.length;
  const ngoProviders = volunteerList.filter(p => p.type === 'ngo');
  const individualVolunteers = volunteerList.filter(p => p.type === 'individual');
  const availableCount = volunteerList.filter(p => p.availability === 'available').length;
  const busyCount = volunteerList.filter(p => p.availability === 'busy').length;

  const data = {
    ...staticData,
    activeAlerts: nasaEvents ? nasaEvents.length : 0,
    weather: weatherData ? weatherData.current : staticData?.weather,
    forecast: weatherData ? weatherData.hourly : [],
    volunteerList,
    totalProviders,
    ngoCount: ngoProviders.length,
    individualCount: individualVolunteers.length,
    availableCount,
    busyCount,
    ngos: ngoProviders
  };

  const hasOptimisticData = nasaEvents !== undefined && weatherData !== undefined;
  const loading = !hasOptimisticData && (staticLoading || isNasaLoading || isWeatherLoading);

  return { data, loading, locationName, isLocating, detectLocation, resetLocation, coords };
};

const SkeletonCard = () => (
  <div className="glass-panel p-6 animate-pulse">
    <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
    <div className="h-10 bg-gray-700 rounded w-1/2"></div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { data, loading, locationName, isLocating, detectLocation, resetLocation, coords } = useDashboardData();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const weatherCondition = data.weather?.condition || '';
  const weatherTheme = getWeatherTheme(weatherCondition);
  
  let WeatherIcon = Wind;
  const condLower = weatherCondition.toLowerCase();
  if (condLower.includes('clear') || condLower.includes('sunny')) {
    WeatherIcon = Sun;
  } else if (condLower.includes('rain') || condLower.includes('shower') || condLower.includes('thunderstorm')) {
    WeatherIcon = CloudRain;
  } else if (condLower.includes('snow') || condLower.includes('winter')) {
    WeatherIcon = Snowflake;
  }

  return (
    <div 
      className="pb-12 min-h-screen relative -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-all duration-700 overflow-hidden rounded-2xl"
      style={{ background: weatherTheme.pageBg }}
    >
      {/* Dynamic Page Background Scenery */}
      {weatherTheme.scenery}
      
      <div className="relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Command Center</h1>
          <p className="text-sm text-gray-400 mt-1">
            Monitoring location: <span className="text-primary font-medium">{locationName}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={detectLocation}
            disabled={isLocating}
            className="px-4 py-2 bg-primary hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {isLocating ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <MapPin size={16} />
            )}
            Use My Location
          </button>
          {coords && (
            <button
              onClick={resetLocation}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors border border-gray-700"
            >
              Reset
            </button>
          )}
          <div className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            Live Data Active
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel bg-surface/20 border-gray-800/50 backdrop-blur-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Disaster Risk Score</h3>
            <AlertTriangle className="text-warning" size={20} />
          </div>
          <div className="text-4xl font-bold text-white mb-2">{data.riskScore}<span className="text-lg text-gray-500">/100</span></div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-gradient-to-r from-yellow-500 to-red-500 h-2 rounded-full" style={{ width: `${data.riskScore}%` }}></div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel bg-surface/20 border-gray-800/50 backdrop-blur-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Active NASA Alerts</h3>
            <Activity className="text-danger" size={20} />
          </div>
          <div className="text-4xl font-bold text-white mb-2">{data.activeAlerts}</div>
          <p className="text-sm text-red-400">Live from NASA EONET</p>
        </motion.div>

        {/* 🏥 VOLUNTEER & NGO COUNTER CARD */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel bg-surface/20 border-emerald-500/30 backdrop-blur-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Registered Relief Units</h3>
            <Building2 className="text-emerald-400" size={20} />
          </div>
          <div className="text-4xl font-bold text-white mb-2">{data.totalProviders}</div>
          <div className="flex justify-between items-center text-xs text-gray-300 border-t border-gray-800 pt-2 mt-2">
            <span className="text-emerald-400 font-bold">🏢 {data.ngoCount} NGOs</span>
            <span className="text-purple-400 font-bold">👤 {data.individualCount} Volunteers</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }} 
          className="glass-panel bg-surface/20 border-gray-800/50 backdrop-blur-md p-6 relative overflow-hidden transition-all duration-500"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 font-medium">Weather Conditions</h3>
              <WeatherIcon size={20} style={{ color: weatherTheme.iconColor }} />
            </div>
            <div className="text-4xl font-black text-white mb-1">{data.weather.temp}°C</div>
            <p className={`text-sm font-semibold tracking-wide uppercase ${weatherTheme.textClass}`}>
              {data.weather.condition}
            </p>
            <p className="text-xs text-gray-400 mt-2 font-medium">
              Humidity: {data.weather.humidity}% • Wind: {data.weather.wind !== undefined ? `${data.weather.wind} km/h` : 'N/A'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Middle Row: Community Resilience + Active Volunteer Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel bg-surface/20 border-gray-800/50 backdrop-blur-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Community Resilience Index</h3>
            <HeartPulse className="text-emerald-400" size={24} />
          </div>
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" className="text-gray-800 stroke-current" strokeWidth="12" fill="none" />
                <circle cx="64" cy="64" r="56" className="text-emerald-500 stroke-current" strokeWidth="12" fill="none" strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * data.preparedness) / 100} />
              </svg>
              <div className="absolute text-3xl font-bold text-white">{data.preparedness}</div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">Medical Coverage</span><span className="text-white">90%</span></div>
                <div className="w-full bg-gray-800 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full w-[90%]"></div></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">Shelter Accessibility</span><span className="text-white">65%</span></div>
                <div className="w-full bg-gray-800 rounded-full h-1.5"><div className="bg-yellow-500 h-1.5 rounded-full w-[65%]"></div></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">Water Availability</span><span className="text-white">45%</span></div>
                <div className="w-full bg-gray-800 rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full w-[45%]"></div></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* VOLUNTEER HUB SUMMARY CARD */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel bg-surface/20 border-gray-800/50 backdrop-blur-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Volunteer Hub Overview</h3>
              <p className="text-xs text-gray-400">Active relief responders & emergency personnel</p>
            </div>
            <Users className="text-primary" size={24} />
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-6 text-center">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <span className="text-lg font-bold text-emerald-400">{data.availableCount}</span>
              <p className="text-[11px] text-gray-300 font-medium">🟢 Available</p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <span className="text-lg font-bold text-amber-400">{data.busyCount}</span>
              <p className="text-[11px] text-gray-300 font-medium">🟡 On Mission</p>
            </div>
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <span className="text-lg font-bold text-purple-400">{data.ngoCount}</span>
              <p className="text-[11px] text-gray-300 font-medium">🏢 Relief NGOs</p>
            </div>
          </div>

          <div className="space-y-2.5">
             <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
               <span className="text-xs text-gray-300 font-medium">Shelter & Evacuation Units</span>
               <span className="text-xs text-emerald-400 font-bold">Active</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
               <span className="text-xs text-gray-300 font-medium">Medical Aid & First Responders</span>
               <span className="text-xs text-emerald-400 font-bold">Active</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
               <span className="text-xs text-gray-300 font-medium">Emergency Transport & Logistics</span>
               <span className="text-xs text-emerald-400 font-bold">Active</span>
             </div>
          </div>

          <button
            onClick={() => navigate('/volunteers')}
            className="mt-4 w-full py-2.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Zap size={14} /> Open Volunteer Hub Workplace
          </button>
        </motion.div>
      </div>

      {/* 🏢 REGISTERED RELIEF NGOS & ORGANIZATIONS SECTION */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-panel bg-surface/20 border-gray-800/50 backdrop-blur-md p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="text-blue-400" size={22} />
              <h3 className="text-xl font-bold text-white">Registered Relief NGOs & Organizations</h3>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Verified non-governmental organizations and disaster relief units registered on ResQAI.
            </p>
          </div>
          <button
            onClick={() => navigate('/volunteers?tab=register')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-lg shadow-blue-600/20"
          >
            <Building2 size={14} /> Register Relief NGO
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.ngos.map((ngo: VolunteerProvider) => (
            <div 
              key={ngo._id} 
              className="bg-gray-900/80 border border-gray-800 hover:border-blue-500/40 rounded-xl p-4 space-y-3 transition-all relative group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                    {ngo.organizationName || ngo.name}
                  </h4>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-gray-500" /> {ngo.location.city}, {ngo.location.state}
                  </p>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                  ngo.availability === 'available' 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                }`}>
                  {ngo.availability === 'available' ? '🟢 Available' : '🟡 On Mission'}
                </span>
              </div>

              {ngo.registrationNumber && (
                <div className="flex items-center justify-between gap-2 p-2 bg-gray-800/60 rounded-lg border border-gray-700/50">
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck size={13} /> DARPAN: <span className="font-mono text-white">{ngo.registrationNumber}</span>
                  </span>
                  <a
                    href="https://ngodarpan.gov.in/index.php/search/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline font-bold flex items-center gap-1 bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 rounded"
                  >
                    Verify Darpan <ExternalLink size={9} />
                  </a>
                </div>
              )}

              {ngo.capacity && (
                <p className="text-xs text-gray-300 bg-gray-800/60 p-2 rounded border border-gray-800 font-medium">
                  📦 Capacity: {ngo.capacity}
                </p>
              )}

              <div className="flex flex-wrap gap-1">
                {ngo.servicesOffered.map((service, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-blue-950/60 text-blue-300 border border-blue-800/40 text-[10px] rounded font-medium">
                    {service}
                  </span>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-800 flex justify-between items-center text-xs text-gray-400">
                <span className="flex items-center gap-1"><Phone size={12} /> {ngo.contact.phone}</span>
                <button
                  onClick={() => navigate('/volunteers?tab=browse')}
                  className="text-primary hover:underline text-[11px] font-bold inline-flex items-center gap-0.5"
                >
                  Contact <ExternalLink size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 24 Hour Forecast */}
      {data.forecast && data.forecast.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-panel bg-surface/20 border-gray-800/50 backdrop-blur-md p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">24-Hour Weather Forecast</h3>
            <Wind className="text-blue-400" size={24} />
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
            {data.forecast.map((hour: any, idx: number) => {
              const timeStr = new Date(hour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={idx} className="flex-shrink-0 w-24 p-3 bg-gray-800/50 rounded-xl text-center snap-center flex flex-col items-center border border-gray-700/50">
                  <p className="text-xs text-gray-400 mb-2">{timeStr}</p>
                  <p className="text-xl font-bold text-white mb-1">{Math.round(hour.temp)}°</p>
                  <p className="text-[10px] text-blue-300 font-medium tracking-wide uppercase">{hour.condition}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
      </div>
    </div>
  );
};

export default Dashboard;

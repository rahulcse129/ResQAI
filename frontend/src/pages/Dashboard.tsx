import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Activity, Wind, AlertTriangle, Users, MapPin, HeartPulse, Sun, CloudRain, Snowflake } from 'lucide-react';
import { API_BASE_URL } from '../config';

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
          {/* Sun disc */}
          <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-amber-400/20 blur-[100px] animate-pulse"></div>
          {/* Solar rays */}
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
          {/* Rain lines */}
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
          {/* Snowflakes drifting */}
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
          {/* Cloudy drifting fog layers */}
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

  // Fetch Live NASA Data with Optimistic Loading
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

  // Fetch Live Weather Data with Dynamic Coordinates
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

  // Save successful fetches to local storage
  useEffect(() => {
    if (weatherData) {
      localStorage.setItem('cached_weather_dashboard', JSON.stringify(weatherData));
    }
  }, [weatherData]);

  useEffect(() => {
    // Simulate API call for static metrics
    const timer = setTimeout(() => {
      setStaticData({
        riskScore: 78,
        shelters: 45,
        weather: { temp: 32, humidity: 85, condition: 'Heavy Rain' },
        volunteers: 1240,
        preparedness: 65,
        resources: { food: 85, water: 60, medical: 40 }
      });
      setStaticLoading(false);
    }, 1000);
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

  const data = {
    ...staticData,
    activeAlerts: nasaEvents ? nasaEvents.length : 0,
    weather: weatherData ? weatherData.current : staticData?.weather,
    forecast: weatherData ? weatherData.hourly : []
  };

  // If we have optimistic data, bypass the loading screen instantly
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
  const { data, loading, locationName, isLocating, detectLocation, resetLocation, coords } = useDashboardData();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  // Resolve weather background theme
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
          <h1 className="text-3xl font-bold text-white">Command Center</h1>
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
            <h3 className="text-gray-400 font-medium">Active Alerts</h3>
            <Activity className="text-danger" size={20} />
          </div>
          <div className="text-4xl font-bold text-white mb-2">{data.activeAlerts}</div>
          <p className="text-sm text-red-400">Live from NASA EONET</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel bg-surface/20 border-gray-800/50 backdrop-blur-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Available Shelters</h3>
            <MapPin className="text-success" size={20} />
          </div>
          <div className="text-4xl font-bold text-white mb-2">{data.shelters}</div>
          <p className="text-sm text-emerald-400">85% Capacity Remaining</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel bg-surface/20 border-gray-800/50 backdrop-blur-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Active Volunteers</h3>
            <Users className="text-primary" size={24} />
          </div>
          <div className="text-5xl font-bold text-white mb-6">{data.volunteers}</div>
          <div className="space-y-3">
             <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
               <span className="text-gray-300">Medical Experts</span>
               <span className="text-white font-medium">342</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
               <span className="text-gray-300">Rescue Personnel</span>
               <span className="text-white font-medium">850</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
               <span className="text-gray-300">Drivers/Logistics</span>
               <span className="text-white font-medium">48</span>
             </div>
          </div>
        </motion.div>
      </div>

      {/* 24 Hour Forecast */}
      {data.forecast && data.forecast.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-6 glass-panel bg-surface/20 border-gray-800/50 backdrop-blur-md p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">24-Hour Forecast</h3>
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

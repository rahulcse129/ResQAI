import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Activity, 
  Users, 
  Map as MapIcon, 
  ChevronRight, 
  Building2, 
  ShieldCheck, 
  HeartPulse, 
  Zap, 
  CheckCircle2, 
  ExternalLink,
  Bot,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { user, loginAsMock } = useAuth();

  const handleQuickNgoDemo = () => {
    loginAsMock('ngo', 'Disaster Relief India NGO');
    navigate('/volunteers?tab=register');
  };

  const handleQuickVolunteerDemo = () => {
    loginAsMock('individual', 'Dr. Rajesh Sharma');
    navigate('/volunteers?tab=register');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col font-sans selection:bg-primary selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#0B0F19]/90 backdrop-blur-md border-b border-gray-800/80 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-red-600 to-amber-500 rounded-xl shadow-lg shadow-red-500/20 text-white">
            <ShieldAlert size={24} />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
              ResQ<span className="text-primary">AI</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 block -mt-1">
              Disaster Relief & NGO Network
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            to="/volunteers" 
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
          >
            <Building2 size={15} className="text-blue-400" /> Relief Hub
          </Link>
          <Link 
            to="/map" 
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
          >
            <MapIcon size={15} className="text-emerald-400" /> Live Map
          </Link>

          {user ? (
            <Link 
              to="/dashboard" 
              className="px-4 py-2 text-xs font-bold bg-primary hover:bg-blue-600 text-white rounded-lg transition-all shadow-md shadow-blue-500/20 flex items-center gap-1"
            >
              Dashboard <ChevronRight size={14} />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                to="/login" 
                className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white border border-gray-700/80 hover:border-gray-600 rounded-lg transition-all"
              >
                Log In
              </Link>
              <Link 
                to="/signup" 
                className="px-4 py-2 text-xs font-bold bg-primary hover:bg-blue-600 text-white rounded-lg transition-all shadow-md shadow-blue-500/20"
              >
                Join Network
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center w-full">
        {/* Background glow discs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-blue-600/20 via-emerald-500/10 to-amber-500/15 blur-[120px] rounded-full pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 space-y-6 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            India's AI Disaster Relief & Verified NGO Platform
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-none">
            Empowering Communities. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400">
              Connecting Relief. Saving Lives.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-gray-300 font-normal leading-relaxed max-w-3xl mx-auto">
            ResQAI bridges the emergency gap between disaster-affected citizens, government emergency operations cells, and registered relief NGOs. Powered by real-time NASA EONET satellite telemetry, interactive GIS resource mapping, and NITI Aayog Darpan-verified NGO coordination.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              to="/dashboard" 
              className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-500/25 hover:scale-[1.02]"
            >
              <Zap size={20} /> Launch Command Center
            </Link>

            <Link 
              to="/volunteers" 
              className="w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-700/80 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Building2 size={20} className="text-blue-400" /> Explore Relief Hub
            </Link>
          </div>

          {/* Quick Demo Login Bar */}
          <div className="pt-4 flex items-center justify-center gap-3 text-xs text-gray-400 flex-wrap">
            <span className="font-semibold text-gray-400">⚡ Instant Demo Access:</span>
            <button 
              onClick={handleQuickNgoDemo}
              className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md font-bold transition-all flex items-center gap-1"
            >
              🏢 Demo NGO Workplace
            </button>
            <button 
              onClick={handleQuickVolunteerDemo}
              className="px-3 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-md font-bold transition-all flex items-center gap-1"
            >
              👤 Demo Volunteer Workplace
            </button>
          </div>
        </motion.div>
      </section>

      {/* IMPACT STATS BANNER */}
      <section className="border-y border-gray-800/80 bg-gray-900/40 py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-white">1,240+</div>
            <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Relief Responders & NGOs</p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-blue-400">24 / 7</div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">NASA Satellite Telemetry</p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-amber-400">100%</div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">NGO Darpan Cross-Check Ready</p>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-purple-400">&lt; 1 sec</div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">AI Disaster Risk Processing</p>
          </div>
        </div>
      </section>

      {/* PROJECT GOAL & HOW IT HELPS SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary">Mission & Objective</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Why ResQAI Was Built & How It Saves Lives
          </h2>
          <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
            During major floods, cyclones, and earthquakes, the biggest bottleneck is not a lack of goodwill—it is resource miscommunication and delayed verification. ResQAI synchronizes emergency intelligence between victims and responders in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-panel p-8 border-l-4 border-l-blue-500 space-y-4 relative"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xl">
              <Users size={24} />
            </div>
            <h3 className="text-2xl font-bold text-white">For Affected Citizens & Victims</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-blue-400 shrink-0 mt-0.5" />
                <span><strong>Instant Emergency Aid Dispatch:</strong> Directly submit service requests for evacuation, medical aid, or clean drinking water to nearby active relief providers.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-blue-400 shrink-0 mt-0.5" />
                <span><strong>Real-time GIS Shelter Map:</strong> Locate emergency shelters with live capacity metrics and GPS directions during disaster evacuations.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-blue-400 shrink-0 mt-0.5" />
                <span><strong>Multilingual AI Assistant:</strong> Receive instant AI-driven emergency first-aid protocols and disaster guidelines even during phone line congestion.</span>
              </li>
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-panel p-8 border-l-4 border-l-emerald-500 space-y-4 relative"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xl">
              <Building2 size={24} />
            </div>
            <h3 className="text-2xl font-bold text-white">For NGOs & Relief Organizations</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>NGO Darpan Verification:</strong> Self-attest using your NITI Aayog Darpan Unique ID with direct official link-outs (`ngodarpan.gov.in`) to establish trust with authorities.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Active Provider Workplace:</strong> Manage incoming disaster requests, accept/decline relief missions, and update live operational status (Available / On Mission / Unavailable).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Capacity Scaling:</strong> Showcase available food ration kits, emergency ambulances, and temporary shelter capacity to government operation cells.</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* FEATURES BUILT SECTION */}
      <section className="py-16 bg-gray-900/40 border-y border-gray-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">Platform Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              What We Have Built in ResQAI
            </h2>
            <p className="text-sm text-gray-400">
              A comprehensive disaster intelligence ecosystem engineered with React 19, Leaflet GIS, Node.js, and Gemini AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Activity,
                color: "text-red-400",
                badge: "Live Telemetry",
                title: "AI Disaster Risk & NASA Satellite Engine",
                desc: "Fetches live natural hazard telemetry from NASA EONET (wildfires, floods, storms) combined with 24-hour meteorological forecasting."
              },
              {
                icon: Building2,
                color: "text-blue-400",
                badge: "NGO Hub",
                title: "Verified Relief Workplace & Directory",
                desc: "Role-based hub where NGOs & volunteers list emergency capabilities, self-attest Darpan IDs, and manage incoming aid requests."
              },
              {
                icon: MapIcon,
                color: "text-emerald-400",
                badge: "Interactive GIS",
                title: "Real-Time Resource & Shelter Mapping",
                desc: "Leaflet GIS interactive map rendering live locations of emergency shelters, medical relief units, and responder availability markers."
              },
              {
                icon: ShieldCheck,
                color: "text-amber-400",
                badge: "Compliance",
                title: "NGO Darpan Self-Attestation & Link-Out",
                desc: "Integrated NITI Aayog NGO Darpan Unique ID attestation with direct link-out to ngodarpan.gov.in for transparent cross-checking."
              },
              {
                icon: Bot,
                color: "text-purple-400",
                badge: "GenAI Assistant",
                title: "ResQAI Emergency AI Assistant",
                desc: "Multi-lingual conversational AI assistant providing immediate first-aid procedures, evacuation guidance, and emergency helplines."
              },
              {
                icon: HeartPulse,
                color: "text-pink-400",
                badge: "Analytics",
                title: "District Community Resilience Index",
                desc: "Calculates medical coverage, shelter accessibility, and emergency water supply metrics for disaster readiness evaluation."
              }
            ].map((f, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass-panel p-6 border border-gray-800 hover:border-gray-700 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`p-2.5 rounded-xl bg-gray-800/80 ${f.color}`}>
                      <f.icon size={22} />
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-gray-800 text-gray-300 rounded border border-gray-700">
                      {f.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{f.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* REGISTERED RELIEF NGOS SHOWCASE */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400">Verified Network</span>
            <h2 className="text-3xl font-black text-white tracking-tight mt-1">
              Registered Disaster Relief NGOs
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Official non-governmental organizations coordinated through ResQAI.
            </p>
          </div>
          <Link
            to="/volunteers?tab=register"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 shrink-0"
          >
            <Building2 size={16} /> Register Your NGO
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Disaster Relief India Foundation",
              city: "Surat, Gujarat",
              darpan: "GJ/2026/089123",
              services: ["Shelter & Evacuation", "Food & Water", "Medical Aid"],
              capacity: "500 Persons Shelter Capacity"
            },
            {
              name: "Red Cross Emergency Response Corps",
              city: "Mumbai, Maharashtra",
              darpan: "MH/2025/044521",
              services: ["Medical Aid & First Response", "Ambulance Transport"],
              capacity: "12 Mobile Ambulances"
            },
            {
              name: "Seva Bharathi Flood Rescue Taskforce",
              city: "Kochi, Kerala",
              darpan: "KL/2026/011982",
              services: ["Rescue Manpower", "Food Rations", "Motorboats"],
              capacity: "20 Motorboats & Rescue Personnel"
            }
          ].map((ngo, idx) => (
            <div key={idx} className="glass-panel p-6 border border-gray-800 hover:border-blue-500/40 transition-all space-y-4">
              <div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-bold uppercase">
                  🟢 Available Now
                </span>
                <h3 className="text-base font-bold text-white mt-2">{ngo.name}</h3>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Compass size={12} className="text-primary" /> {ngo.city}
                </p>
              </div>

              <div className="p-2.5 bg-gray-900/90 rounded-lg border border-gray-800 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck size={14} /> DARPAN: <span className="font-mono text-white">{ngo.darpan}</span>
                </span>
                <a
                  href="https://ngodarpan.gov.in/index.php/search/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5 font-semibold"
                >
                  Verify <ExternalLink size={9} />
                </a>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Services Provided</p>
                <div className="flex flex-wrap gap-1">
                  {ngo.services.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-800 text-gray-300 text-[10px] rounded border border-gray-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section className="py-16 px-4 max-w-7xl mx-auto w-full">
        <div className="glass-panel p-8 sm:p-12 border-2 border-primary/40 bg-gradient-to-r from-blue-950/40 via-surface/80 to-emerald-950/30 text-center space-y-6 relative overflow-hidden rounded-2xl">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Ready to Strengthen India's Disaster Resilience?
            </h2>
            <p className="text-sm sm:text-base text-gray-300">
              Join hundreds of verified NGOs, medical experts, and emergency responders on ResQAI today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-all shadow-xl shadow-blue-500/30"
              >
                Register Organization / Volunteer
              </Link>
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white border border-gray-700 rounded-xl font-bold text-sm transition-all"
              >
                View Analytics Command Center
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-800/80 bg-gray-950 py-10 px-4 sm:px-8 text-xs text-gray-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-white font-bold text-base">
              <ShieldAlert className="text-primary" size={18} /> ResQAI Relief Network
            </div>
            <p className="text-gray-400">
              AI-driven disaster intelligence and verified NGO relief platform.
            </p>
          </div>

          <div className="flex items-center gap-6 text-gray-400 font-medium">
            <Link to="/dashboard" className="hover:text-white transition-colors">Command Center</Link>
            <Link to="/volunteers" className="hover:text-white transition-colors">Volunteer Hub</Link>
            <Link to="/map" className="hover:text-white transition-colors">GIS Live Map</Link>
            <a href="https://ngodarpan.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              NGO Darpan Portal <ExternalLink size={10} />
            </a>
          </div>

          <div className="text-center md:text-right text-gray-400">
            <p className="font-semibold text-white">Emergency Operations Hotline: <span className="text-red-400">112 / 1070</span></p>
            <p>© 2026 ResQAI Platform. Built for India's Disaster Resilience.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

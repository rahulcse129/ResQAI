
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldAlert, Activity, Users, Map as MapIcon, ChevronRight } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col">
      <nav className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-2xl font-bold text-white">
          <ShieldAlert className="text-primary" />
          ResQAI
        </div>
        <div className="flex gap-4">
          <Link to="/dashboard" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">Login</Link>
          <Link to="/dashboard" className="px-4 py-2 text-sm bg-primary hover:bg-blue-600 text-white rounded-lg transition-colors">Enter Platform</Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center mt-12 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-6">
            Predict. Prepare. Protect.
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            AI-powered disaster intelligence that helps communities act before disaster strikes. Real-time insights for citizens, NGOs, and government agencies.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link to="/dashboard" className="px-8 py-4 bg-primary hover:bg-blue-600 text-white rounded-xl font-semibold text-lg flex items-center gap-2 transition-transform hover:scale-105">
              Launch Dashboard <ChevronRight size={20} />
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mt-24">
          {[
            { icon: Activity, title: 'Live Risk Monitoring', desc: 'Predictive modeling for floods, wildfires, and extreme weather based on real-time data.' },
            { icon: MapIcon, title: 'Interactive Disaster Map', desc: 'Real-time resource allocation, SOS tracking, and shelter availability mapping.' },
            { icon: Users, title: 'Community Impact', desc: 'Coordinate volunteers, assess district resilience, and communicate with AI assistants.' }
          ].map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
              className="glass-panel p-8 text-left hover:border-primary/50 transition-colors"
            >
              <feature.icon className="text-primary mb-4" size={32} />
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Landing;

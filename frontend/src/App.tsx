import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Activity, Map as MapIcon, MessageSquare, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

// Lazy loaded components
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const LiveMap = React.lazy(() => import('./pages/LiveMap'));
const Assistant = React.lazy(() => import('./pages/Assistant'));
const Landing = React.lazy(() => import('./pages/Landing'));

const TopNav = () => (
  <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between mb-8 rounded-none border-t-0 border-l-0 border-r-0">
    <div className="flex items-center gap-2 text-xl font-bold text-white">
      <ShieldAlert className="text-primary" />
      ResQAI
    </div>
    <div className="flex gap-6">
      <Link to="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
        <Activity size={18} /> Analytics
      </Link>
      <Link to="/map" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
        <MapIcon size={18} /> Live Map
      </Link>
      <Link to="/assistant" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
        <MessageSquare size={18} /> AI Assistant
      </Link>
    </div>
  </nav>
);

const LoadingFallback = () => (
  <div className="flex-1 flex items-center justify-center min-h-[50vh]">
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
    />
  </div>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Routes>
          <Route path="/" element={
            <Suspense fallback={<LoadingFallback />}>
              <Landing />
            </Suspense>
          } />
          <Route path="/*" element={
            <>
              <TopNav />
              <main className="flex-1 px-6 max-w-7xl mx-auto w-full">
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/map" element={<LiveMap />} />
                    <Route path="/assistant" element={<Assistant />} />
                  </Routes>
                </Suspense>
              </main>
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

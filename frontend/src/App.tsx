import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Activity, Map as MapIcon, MessageSquare, ShieldAlert, HeartHandshake, LogIn, UserPlus, LogOut, User as UserIcon, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy loaded components
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const LiveMap = React.lazy(() => import('./pages/LiveMap'));
const Assistant = React.lazy(() => import('./pages/Assistant'));
const Landing = React.lazy(() => import('./pages/Landing'));
const VolunteerWorkplace = React.lazy(() => import('./pages/VolunteerWorkplace'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));

const TopNav = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between mb-8 rounded-none border-t-0 border-l-0 border-r-0 border-b-gray-800/80">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white hover:opacity-90 transition-opacity">
        <ShieldAlert className="text-primary" />
        ResQAI
      </Link>

      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <Activity size={17} /> Analytics
        </Link>
        <Link to="/map" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <MapIcon size={17} /> Live Map
        </Link>
        <Link to="/volunteers" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <HeartHandshake size={17} /> Volunteer Hub
        </Link>
        <Link to="/assistant" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <MessageSquare size={17} /> AI Assistant
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 bg-gray-900/80 border border-gray-800 px-3 py-1.5 rounded-lg">
            <span className={`p-1 rounded ${user.role === 'ngo' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
              {user.role === 'ngo' ? <Building2 size={16} /> : <UserIcon size={16} />}
            </span>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-white leading-none">{user.name}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider leading-none mt-0.5">{user.role}</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="p-1.5 text-gray-400 hover:text-red-400 transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-xs font-bold text-gray-300 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-700/80 rounded-lg transition-all flex items-center gap-1.5"
            >
              <LogIn size={14} /> Sign In
            </Link>
            <Link
              to="/signup"
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
            >
              <UserPlus size={14} /> Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

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
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-background text-foreground">
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
                      <Route path="/volunteers" element={<VolunteerWorkplace />} />
                      <Route path="/assistant" element={<Assistant />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                    </Routes>
                  </Suspense>
                </main>
              </>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

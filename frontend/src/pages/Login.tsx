import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Mail, Lock, LogIn, AlertCircle, CheckCircle2, ArrowRight, Zap, Building2, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAsMock } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      redirectUser(user);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to log in. Please check your credentials or backend server connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = (role: 'ngo' | 'individual') => {
    const user = loginAsMock(role);
    redirectUser(user);
  };

  const redirectUser = (user: any) => {
    const from = (location.state as any)?.from?.pathname;
    if (from && from !== '/login' && from !== '/signup') {
      navigate(from);
    } else if (!user.providerId) {
      navigate('/volunteers?tab=register');
    } else {
      navigate('/volunteers?tab=my_workspace');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg('If an account exists, a password reset link has been dispatched.');
    setTimeout(() => {
      setForgotModal(false);
      setForgotMsg('');
    }, 3000);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-md p-8 border border-gray-800 space-y-6 relative"
      >
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-primary/20 text-primary border border-primary/30 mb-3">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign In to ResQAI</h2>
          <p className="text-xs text-gray-400 mt-1">
            Access the Volunteer Workplace, list emergency capabilities, or submit service requests.
          </p>
        </div>

        {/* ⚡ One-Click Demo Mode Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-primary/10 to-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl space-y-2 text-center">
          <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-xs">
            <Zap size={15} className="animate-pulse" /> 1-Click Demo Quick Access
          </div>
          <p className="text-[11px] text-gray-300">Instant test login without password verification:</p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDemoLogin('ngo')}
              className="py-2 px-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 rounded-lg text-[11px] font-bold text-blue-300 flex items-center justify-center gap-1.5 transition-all"
            >
              <Building2 size={14} /> Demo NGO
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('individual')}
              className="py-2 px-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 rounded-lg text-[11px] font-bold text-purple-300 flex items-center justify-center gap-1.5 transition-all"
            >
              <User size={14} /> Demo Volunteer
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-bold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-500" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.org"
                className="w-full pl-9 pr-3 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-gray-300 font-bold">Password</label>
              <button
                type="button"
                onClick={() => setForgotModal(true)}
                className="text-[11px] text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-500" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn size={16} /> Sign In
              </span>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-gray-800 text-center">
          <p className="text-xs text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-bold hover:underline inline-flex items-center gap-0.5">
              Create account <ArrowRight size={12} />
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm p-6 border border-gray-700 space-y-4">
            <h3 className="text-base font-bold text-white">Reset Your Password</h3>
            <p className="text-xs text-gray-400">Enter your account email to receive reset instructions.</p>

            {forgotMsg ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 size={16} /> {forgotMsg}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3 text-xs">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-primary"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotModal(false)}
                    className="flex-1 py-2 bg-gray-800 text-gray-300 rounded font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-primary text-white rounded font-bold"
                  >
                    Send Token
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

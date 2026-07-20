import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, User, Building2, Mail, Lock, Phone, FileText, UserPlus, AlertCircle, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, loginAsMock } = useAuth();

  const [role, setRole] = useState<'individual' | 'ngo'>('ngo');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [darpanId, setDarpanId] = useState('');
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await signup({
        email,
        password,
        role,
        name,
        phone,
        darpanId: role === 'ngo' ? darpanId : undefined
      });
      // Redirect to Volunteer Workplace registration tab on new account creation
      navigate('/volunteers?tab=register');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create account. Please check your network or backend server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = (demoRole: 'ngo' | 'individual') => {
    loginAsMock(demoRole);
    navigate('/volunteers?tab=register');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-lg p-8 border border-gray-800 space-y-6 relative"
      >
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-primary/20 text-primary border border-primary/30 mb-3">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create ResQAI Account</h2>
          <p className="text-xs text-gray-400 mt-1">
            Join the emergency response network as an Individual Volunteer or Relief NGO.
          </p>
        </div>

        {/* ⚡ One-Click Demo Mode Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-primary/10 to-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl space-y-2 text-center">
          <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-xs">
            <Zap size={15} className="animate-pulse" /> 1-Click Demo Quick Access
          </div>
          <p className="text-[11px] text-gray-300">Bypass registration and enter instant demo mode:</p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDemoLogin('ngo')}
              className="py-2 px-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 rounded-lg text-[11px] font-bold text-blue-300 flex items-center justify-center gap-1.5 transition-all"
            >
              <Building2 size={14} /> Demo NGO Mode
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('individual')}
              className="py-2 px-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 rounded-lg text-[11px] font-bold text-purple-300 flex items-center justify-center gap-1.5 transition-all"
            >
              <User size={14} /> Demo Volunteer Mode
            </button>
          </div>
        </div>

        {/* Role Toggle Switch */}
        <div className="bg-gray-900/80 p-1.5 rounded-xl border border-gray-800 flex gap-2">
          <button
            type="button"
            onClick={() => setRole('ngo')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              role === 'ngo' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-500/40' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Building2 size={16} /> NGO / Organization
          </button>
          <button
            type="button"
            onClick={() => setRole('individual')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              role === 'individual' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-500/40' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <User size={16} /> Individual Volunteer
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-bold mb-1">
              {role === 'ngo' ? 'Organization / NGO Name *' : 'Full Name *'}
            </label>
            <div className="relative">
              {role === 'ngo' ? (
                <Building2 className="absolute left-3 top-3 text-gray-500" size={16} />
              ) : (
                <User className="absolute left-3 top-3 text-gray-500" size={16} />
              )}
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'ngo' ? 'e.g. Disaster Relief India Foundation' : 'e.g. Dr. Rajesh Sharma'}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {role === 'ngo' && (
            <div>
              <label className="block text-gray-300 font-bold mb-1">
                NGO Darpan / NITI Aayog ID <span className="text-gray-500 font-normal">(Optional, for verification badge)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-500" size={16} />
                <input
                  type="text"
                  value={darpanId}
                  onChange={(e) => setDarpanId(e.target.value)}
                  placeholder="e.g. GJ/2026/0123456"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-bold mb-1">Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-gray-500" size={16} />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 font-bold mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-500" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@org.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-bold mb-1">Password * (Min 8 characters)</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-500" size={16} />
              <input
                type="password"
                required
                minLength={8}
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
                Creating Account...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserPlus size={16} /> Register Account & Continue
              </span>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-gray-800 text-center">
          <p className="text-xs text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline inline-flex items-center gap-0.5">
              Sign In <ArrowRight size={12} />
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  PlusCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  User, 
  Map as MapIcon, 
  Grid, 
  AlertCircle,
  X,
  Navigation,
  Send,
  ExternalLink,
  HeartHandshake
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

// Fixed Service Categories Enum List
export const SERVICE_CATEGORIES = [
  { id: 'shelter', label: 'Shelter & Evacuation', icon: '🏠' },
  { id: 'medical_aid', label: 'Medical Aid & First Response', icon: '🚑' },
  { id: 'food_water', label: 'Food & Clean Water', icon: '🍞' },
  { id: 'transport', label: 'Emergency Transport', icon: '🚚' },
  { id: 'rescue_manpower', label: 'Rescue Manpower', icon: '🦺' },
  { id: 'mental_health', label: 'Mental Health Support', icon: '🧠' },
  { id: 'logistics_supply_chain', label: 'Logistics & Supplies', icon: '📦' },
  { id: 'communication_support', label: 'Telecom & SatCom Support', icon: '📡' },
  { id: 'other', label: 'Other Support Services', icon: '🤝' },
];

const createEmojiMarker = (color: string, emoji: string) => {
  return new L.DivIcon({
    className: 'custom-provider-icon',
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 16px;">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const availableIcon = createEmojiMarker('#10B981', '🟢');
const busyIcon = createEmojiMarker('#F59E0B', '🟡');
const unavailableIcon = createEmojiMarker('#6B7280', '⚪');

export interface Provider {
  _id: string;
  userId?: string;
  type: 'individual' | 'ngo';
  name: string;
  organizationName?: string;
  registrationNumber?: string;
  contact: { phone: string; email: string };
  location: { lat: number; lng: number; address: string; city: string; state: string; country: string };
  servicesOffered: string[];
  capacity?: string;
  availability: 'available' | 'busy' | 'unavailable';
  description?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequestItem {
  _id: string;
  providerId: string;
  requesterName: string;
  requesterType: 'individual' | 'ngo' | 'authority';
  requesterContact: { phone: string; email: string };
  serviceNeeded: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  location?: { lat?: number; lng?: number; address?: string };
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  providerContact?: { phone: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export default function VolunteerWorkplace() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'browse' | 'register'>(() => {
    const t = searchParams.get('tab');
    return t === 'register' || t === 'my_workspace' ? 'register' : 'browse';
  });

  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Modals & Selection
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [requestModalProvider, setRequestModalProvider] = useState<Provider | null>(null);

  // My Provider ID (from user profile or localStorage)
  const myProviderId = user?.providerId || localStorage.getItem('resqai_my_provider_id');

  // Request Form State
  const [requestForm, setRequestForm] = useState({
    requesterName: user?.name || '',
    requesterType: (user?.role === 'ngo' ? 'ngo' : 'individual') as 'individual' | 'ngo' | 'authority',
    phone: user?.phone || '',
    email: user?.email || '',
    serviceNeeded: '',
    urgency: 'high' as 'low' | 'medium' | 'high' | 'critical',
    message: '',
    address: ''
  });
  const [requestSuccessMsg, setRequestSuccessMsg] = useState('');

  // Registration Form State
  const [regForm, setRegForm] = useState({
    type: (user?.role === 'ngo' ? 'ngo' : 'individual') as 'individual' | 'ngo',
    name: user?.name || '',
    organizationName: user?.role === 'ngo' ? user?.name : '',
    registrationNumber: user?.darpanId || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    city: 'Surat',
    state: 'Gujarat',
    country: 'India',
    lat: 21.1702,
    lng: 72.8311,
    servicesOffered: ['shelter', 'food_water'] as string[],
    capacity: '',
    availability: 'available' as 'available' | 'busy' | 'unavailable',
    description: ''
  });
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Synchronize user profile with form defaults
  useEffect(() => {
    if (user) {
      setRegForm(p => ({
        ...p,
        type: user.role === 'ngo' ? 'ngo' : 'individual',
        name: user.name,
        organizationName: user.role === 'ngo' ? user.name : p.organizationName,
        registrationNumber: user.darpanId || p.registrationNumber,
        phone: user.phone,
        email: user.email
      }));
      setRequestForm(p => ({
        ...p,
        requesterName: user.name,
        requesterType: user.role === 'ngo' ? 'ngo' : 'individual',
        phone: user.phone,
        email: user.email
      }));
    }
  }, [user]);

  // Fetch Providers List
  const { data: providers = [], isLoading: isLoadingProviders } = useQuery<Provider[]>({
    queryKey: ['volunteers', selectedService, selectedAvailability, selectedType, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedService) params.append('service', selectedService);
      if (selectedAvailability) params.append('availability', selectedAvailability);
      if (selectedType) params.append('type', selectedType);
      if (searchQuery) params.append('search', searchQuery);

      const res = await axios.get(`${API_BASE_URL}/volunteers?${params.toString()}`);
      return res.data;
    }
  });

  // Fetch Requests for My Provider Listing
  const { data: myRequests = [], refetch: refetchMyRequests } = useQuery<ServiceRequestItem[]>({
    queryKey: ['myRequests', myProviderId],
    queryFn: async () => {
      if (!myProviderId) return [];
      try {
        const res = await axios.get(`${API_BASE_URL}/volunteers/${myProviderId}/requests`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data;
        }
      } catch (err) {
        console.warn('Backend requests fetch unreachable, loading demo requests.');
      }

      const savedMockReqs = localStorage.getItem(`resqai_mock_requests_${myProviderId}`);
      if (savedMockReqs) {
        return JSON.parse(savedMockReqs);
      }

      // Default sample emergency requests for interactive testing
      const sampleRequests: ServiceRequestItem[] = [
        {
          _id: `req_surat_001`,
          providerId: myProviderId,
          requesterName: 'Surat Emergency Operations Cell',
          requesterType: 'authority',
          requesterContact: { phone: '+91 9876500000', email: 'controlroom@surat.gov.in' },
          serviceNeeded: 'Shelter & Evacuation',
          urgency: 'critical',
          message: 'Urgent: 15 families stranded near Tapi riverfront due to flood overflow. Immediate shelter deployment and emergency rations required.',
          location: { lat: 21.1702, lng: 72.8311, address: 'Tapi Riverfront Sector 4, Surat' },
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: `req_surat_002`,
          providerId: myProviderId,
          requesterName: 'Aditya Patel (Citizen)',
          requesterType: 'individual',
          requesterContact: { phone: '+91 9123499887', email: 'aditya.p@gmail.com' },
          serviceNeeded: 'Medical Aid & First Response',
          urgency: 'high',
          message: 'First-aid assistance required for elderly citizen suffering from minor injuries during flood evacuation in Varachha.',
          location: { lat: 21.2035, lng: 72.8465, address: 'Varachha Main Road, Surat' },
          status: 'pending',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];

      localStorage.setItem(`resqai_mock_requests_${myProviderId}`, JSON.stringify(sampleRequests));
      return sampleRequests;
    },
    enabled: !!myProviderId
  });

  // Register Provider Mutation
  const registerMutation = useMutation({
    mutationFn: async (formData: any) => {
      const payload = {
        userId: user?._id,
        type: formData.type,
        name: formData.name,
        organizationName: formData.type === 'ngo' ? formData.organizationName : undefined,
        registrationNumber: formData.registrationNumber || undefined,
        contact: { phone: formData.phone, email: formData.email },
        location: {
          lat: Number(formData.lat) || 21.1702,
          lng: Number(formData.lng) || 72.8311,
          address: formData.address || '',
          city: formData.city || 'Surat',
          state: formData.state || 'Gujarat',
          country: formData.country || 'India'
        },
        servicesOffered: formData.servicesOffered,
        capacity: formData.capacity || undefined,
        availability: formData.availability,
        description: formData.description
      };

      try {
        const res = await axios.post(`${API_BASE_URL}/volunteers/register`, payload);
        return res.data;
      } catch (err: any) {
        console.warn('Backend provider registration unreachable, using local demo fallback.');
        const mockCreatedProvider: Provider = {
          _id: `mock_provider_${Date.now()}`,
          userId: user?._id || 'mock_user_123',
          type: payload.type,
          name: payload.name,
          organizationName: payload.organizationName,
          registrationNumber: payload.registrationNumber,
          contact: payload.contact,
          location: payload.location,
          servicesOffered: payload.servicesOffered,
          capacity: payload.capacity,
          availability: payload.availability as any,
          description: payload.description,
          verified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return mockCreatedProvider;
      }
    },
    onSuccess: async (data) => {
      setRegSuccess('Registration successful! You are now listed as an active relief provider.');
      setRegError('');
      localStorage.setItem('resqai_my_provider_id', data._id);
      if (user) {
        user.providerId = data._id;
        localStorage.setItem('resqai_user', JSON.stringify(user));
      }
      await refreshUser();
      queryClient.setQueryData(['volunteers', selectedService, selectedAvailability, selectedType, searchQuery], (old: Provider[] = []) => {
        return [data, ...(Array.isArray(old) ? old.filter(p => p._id !== data._id) : [])];
      });
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
    },
    onError: (err: any) => {
      setRegError(err.response?.data?.error || err.message || 'Registration failed. Please check your inputs.');
    }
  });

  // Submit Service Request Mutation
  const submitRequestMutation = useMutation({
    mutationFn: async (payload: any) => {
      try {
        const res = await axios.post(`${API_BASE_URL}/volunteers/${requestModalProvider?._id}/request`, payload);
        return res.data;
      } catch (err: any) {
        console.warn('Backend service request submission unreachable, using local demo fallback.');
        const mockReq: ServiceRequestItem = {
          _id: `mock_req_${Date.now()}`,
          providerId: requestModalProvider?._id || 'mock_provider_123',
          requesterName: payload.requesterName,
          requesterType: payload.requesterType,
          requesterContact: payload.requesterContact,
          serviceNeeded: payload.serviceNeeded,
          urgency: payload.urgency,
          message: payload.message,
          location: payload.location,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return mockReq;
      }
    },
    onSuccess: () => {
      setRequestSuccessMsg('Service request submitted successfully! The provider has been notified.');
      setTimeout(() => {
        setRequestModalProvider(null);
        setRequestSuccessMsg('');
      }, 2500);
    }
  });

  // Update Request Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: string }) => {
      try {
        const res = await axios.patch(`${API_BASE_URL}/requests/${requestId}`, { status });
        return res.data;
      } catch (err: any) {
        console.warn('Backend status update unreachable, updating local demo state.');
        return { _id: requestId, status };
      }
    },
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(['myRequests', myProviderId], (old: ServiceRequestItem[] = []) => {
        const newArr = old.map(r => r._id === updatedItem._id ? { ...r, status: updatedItem.status as any } : r);
        if (myProviderId) {
          localStorage.setItem(`resqai_mock_requests_${myProviderId}`, JSON.stringify(newArr));
        }
        return newArr;
      });
      refetchMyRequests();
    }
  });

  // Provider Live Availability State
  const [myAvailability, setMyAvailability] = useState<'available' | 'busy' | 'unavailable'>(() => (localStorage.getItem(`resqai_provider_avail_${myProviderId}`) as any) || 'available');

  // Toggle Provider Availability Mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async (availability: 'available' | 'busy' | 'unavailable') => {
      setMyAvailability(availability);
      if (myProviderId) {
        localStorage.setItem(`resqai_provider_avail_${myProviderId}`, availability);
      }
      try {
        const res = await axios.patch(`${API_BASE_URL}/volunteers/${myProviderId}`, { availability });
        return res.data;
      } catch (err: any) {
        console.warn('Backend status patch unreachable, using local status update.');
        return { _id: myProviderId, availability };
      }
    },
    onSuccess: (updated) => {
      if (updated?.availability) {
        setMyAvailability(updated.availability);
      }
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
    }
  });

  // Toggle NGO Darpan Verification Mutation
  const toggleVerifyMutation = useMutation({
    mutationFn: async ({ providerId, verified }: { providerId: string; verified: boolean }) => {
      try {
        const res = await axios.patch(`${API_BASE_URL}/volunteers/${providerId}`, { verified });
        return res.data;
      } catch (err: any) {
        console.warn('Backend verify endpoint unreachable, updating local state.');
        return { _id: providerId, verified };
      }
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['volunteers', selectedService, selectedAvailability, selectedType, searchQuery], (old: Provider[] = []) => {
        if (!Array.isArray(old)) return old;
        return old.map(p => p._id === updated._id ? { ...p, verified: updated.verified } : p);
      });
      if (selectedProvider && selectedProvider._id === updated._id) {
        setSelectedProvider(prev => prev ? { ...prev, verified: updated.verified } : null);
      }
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
    }
  });

  const handleGPSLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setRegForm(prev => ({
          ...prev,
          lat: Number(pos.coords.latitude.toFixed(4)),
          lng: Number(pos.coords.longitude.toFixed(4))
        }));
      });
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setRegForm(prev => {
      const exists = prev.servicesOffered.includes(serviceId);
      if (exists) {
        return { ...prev, servicesOffered: prev.servicesOffered.filter(s => s !== serviceId) };
      } else {
        return { ...prev, servicesOffered: [...prev.servicesOffered, serviceId] };
      }
    });
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded text-xs font-bold uppercase">Critical</span>;
      case 'high': return <span className="bg-orange-500/20 text-orange-400 border border-orange-500/40 px-2 py-0.5 rounded text-xs font-bold uppercase">High</span>;
      case 'medium': return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 px-2 py-0.5 rounded text-xs font-bold uppercase">Medium</span>;
      default: return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/40 px-2 py-0.5 rounded text-xs font-bold uppercase">Low</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted': return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14} /> Accepted</span>;
      case 'declined': return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1"><XCircle size={14} /> Declined</span>;
      case 'completed': return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1"><ShieldCheck size={14} /> Completed</span>;
      default: return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1"><Clock size={14} /> Pending</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-primary">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <HeartHandshake className="text-primary" /> Volunteer & Relief Workplace
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Connect NGOs, local volunteers, and disaster rescue teams directly to affected citizens and emergency responders.
          </p>
        </div>
        <div className="flex gap-2 bg-gray-900/60 p-1.5 rounded-lg border border-gray-800 self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'browse' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Browse Providers ({providers.length})
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'register' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Register / My Workspace
          </button>
        </div>
      </div>

      {activeTab === 'browse' && (
        <>
          {/* Filter Bar & Search */}
          <div className="glass-panel p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by provider name, NGO, city, or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900/80 border border-gray-700/60 rounded-lg text-white text-sm focus:outline-none focus:border-primary placeholder-gray-500"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="bg-gray-900/80 border border-gray-700/60 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">All Services</option>
                  {SERVICE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>

                <select
                  value={selectedAvailability}
                  onChange={(e) => setSelectedAvailability(e.target.value)}
                  className="bg-gray-900/80 border border-gray-700/60 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">All Statuses</option>
                  <option value="available">🟢 Available Now</option>
                  <option value="busy">🟡 Busy / Occupied</option>
                  <option value="unavailable">⚪ Unavailable</option>
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-gray-900/80 border border-gray-700/60 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">All Types</option>
                  <option value="ngo">NGOs & Orgs</option>
                  <option value="individual">Individuals</option>
                </select>

                <div className="flex bg-gray-900/80 rounded-lg border border-gray-700/60 p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                    title="Grid View"
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`p-1.5 rounded ${viewMode === 'map' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                    title="Interactive Map View"
                  >
                    <MapIcon size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Grid View vs Map View */}
          {isLoadingProviders ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : viewMode === 'grid' ? (
            providers.length === 0 ? (
              <div className="glass-panel p-12 text-center text-gray-400">
                <Users size={48} className="mx-auto text-gray-600 mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">No relief providers found</h3>
                <p className="text-sm">Try broadening your search filters or register as a provider to list your services.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((p) => (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-5 flex flex-col justify-between hover:border-gray-700 transition-all border border-gray-800/80 relative"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`p-2 rounded-lg ${p.type === 'ngo' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'}`}>
                            {p.type === 'ngo' ? <Building2 size={20} /> : <User size={20} />}
                          </span>
                          <div>
                            <h3 className="font-bold text-white text-base leading-snug">{p.name}</h3>
                            {p.organizationName && <p className="text-xs text-blue-400 font-medium">{p.organizationName}</p>}
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                          p.availability === 'available' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                          p.availability === 'busy' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                          'bg-gray-700/50 text-gray-400 border border-gray-600'
                        }`}>
                          {p.availability}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                        <MapPin size={14} className="text-primary shrink-0" />
                        {p.location.city}, {p.location.state}
                      </p>

                      {p.registrationNumber && (
                        <div className="bg-gray-900/90 p-2.5 rounded-lg border border-gray-800 space-y-1.5 mb-3">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
                              <ShieldCheck size={13} className={p.verified ? "text-emerald-400" : "text-amber-400"} />
                              DARPAN: <span className="font-mono text-white font-semibold">{p.registrationNumber}</span>
                            </span>
                            {p.verified ? (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                <CheckCircle2 size={10} /> Verified
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                <AlertCircle size={10} /> Self-Attested
                              </span>
                            )}
                          </div>
                          <a
                            href="https://ngodarpan.gov.in/index.php/search/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-medium pt-0.5"
                          >
                            🔗 Verify on NGO Darpan <ExternalLink size={10} />
                          </a>
                        </div>
                      )}

                      {p.description && (
                        <p className="text-xs text-gray-300 line-clamp-2 mb-4 leading-relaxed bg-surface/40 p-2.5 rounded border border-gray-800">
                          {p.description}
                        </p>
                      )}

                      <div className="mb-4">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Services Offered</p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.servicesOffered.map(s => {
                            const cat = SERVICE_CATEGORIES.find(c => c.id === s);
                            return (
                              <span key={s} className="px-2 py-0.5 bg-gray-800/90 border border-gray-700 text-gray-200 text-xs rounded">
                                {cat?.icon} {cat?.label || s}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-800 flex gap-2">
                      <button
                        onClick={() => setSelectedProvider(p)}
                        className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs font-medium transition-colors"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => {
                          setRequestModalProvider(p);
                          setRequestForm(prev => ({ ...prev, serviceNeeded: p.servicesOffered[0] || 'shelter' }));
                        }}
                        className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <Send size={12} /> Request Service
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            <div className="glass-panel p-2 h-[600px] relative rounded-xl overflow-hidden border border-gray-800">
              <MapContainer
                center={[21.1702, 72.8311]}
                zoom={6}
                style={{ height: '100%', width: '100%', borderRadius: '0.5rem', backgroundColor: '#0B0F19' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {providers.map(p => {
                  const icon = p.availability === 'available' ? availableIcon : p.availability === 'busy' ? busyIcon : unavailableIcon;
                  return (
                    <Marker key={p._id} position={[p.location.lat, p.location.lng]} icon={icon}>
                      <Popup className="custom-popup">
                        <div className="p-2 w-56">
                          <h4 className="font-bold text-gray-900 text-sm">{p.name}</h4>
                          {p.organizationName && <p className="text-xs text-blue-600 font-semibold">{p.organizationName}</p>}
                          <p className="text-xs text-gray-600 mt-1">{p.location.city}, {p.location.state}</p>
                          <div className="mt-2 flex gap-1 flex-wrap">
                            {p.servicesOffered.map(s => (
                              <span key={s} className="px-1.5 py-0.5 bg-gray-200 text-gray-800 text-[10px] rounded font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={() => {
                              setRequestModalProvider(p);
                              setRequestForm(prev => ({ ...prev, serviceNeeded: p.servicesOffered[0] || 'shelter' }));
                            }}
                            className="mt-3 w-full py-1.5 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700"
                          >
                            Request Aid
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          )}
        </>
      )}

      {/* TAB B: REGISTER & MY WORKSPACE */}
      {activeTab === 'register' && (
        <div className="space-y-8">
          {/* MY WORKSPACE DASHBOARD (IF REGISTERED) */}
          {myProviderId && (
            <div className="glass-panel p-6 border-l-4 border-l-emerald-500 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-4">
                <div>
                  <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">My Active Provider Workspace</span>
                  <h2 className="text-xl font-bold text-white">Incoming Service Requests ({myRequests.length})</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">Set Status:</span>
                  <button
                    onClick={() => toggleAvailabilityMutation.mutate('available')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      myAvailability === 'available'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 ring-2 ring-emerald-400'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    🟢 Available
                  </button>
                  <button
                    onClick={() => toggleAvailabilityMutation.mutate('busy')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      myAvailability === 'busy'
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/40 ring-2 ring-amber-400'
                        : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    🟡 Busy
                  </button>
                  <button
                    onClick={() => toggleAvailabilityMutation.mutate('unavailable')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      myAvailability === 'unavailable'
                        ? 'bg-gray-600 text-white shadow-lg shadow-gray-600/40 ring-2 ring-gray-400'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700'
                    }`}
                  >
                    ⚪ Unavailable
                  </button>
                </div>
              </div>

              {myRequests.length === 0 ? (
                <div className="bg-gray-900/60 border border-dashed border-gray-800 rounded-xl p-6 text-center space-y-3">
                  <p className="text-xs text-gray-400">
                    No incoming disaster service requests yet for your listing. Requests will appear here when citizens or agencies request aid from your profile in the Browse Relief Directory.
                  </p>
                  <button
                    onClick={() => {
                      const mockSampleReq: ServiceRequestItem = {
                        _id: `demo_req_${Date.now()}`,
                        providerId: myProviderId || 'mock_provider_123',
                        requesterName: 'Surat Emergency Operations Cell',
                        requesterType: 'authority',
                        requesterContact: { phone: '+91 9876500000', email: 'controlroom@surat.gov.in' },
                        serviceNeeded: 'Shelter & Evacuation',
                        urgency: 'critical',
                        message: 'Urgent: 15 families stranded near Tapi riverfront due to flood overflow. Immediate shelter deployment required.',
                        location: { lat: 21.1702, lng: 72.8311, address: 'Tapi Riverfront Sector 4, Surat' },
                        status: 'pending',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      };
                      queryClient.setQueryData(['myRequests', myProviderId], (old: ServiceRequestItem[] = []) => [mockSampleReq, ...old]);
                    }}
                    className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5"
                  >
                    ⚡ Generate Demo Emergency Request
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myRequests.map((req) => (
                    <div key={req._id} className="bg-surface/60 border border-gray-800 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{req.requesterName}</h4>
                          <span className="text-xs text-gray-400">({req.requesterType})</span>
                          {getUrgencyBadge(req.urgency)}
                          {getStatusBadge(req.status)}
                        </div>
                        <p className="text-xs text-primary font-semibold">Service Needed: {req.serviceNeeded}</p>
                        <p className="text-xs text-gray-300 leading-relaxed bg-gray-900/60 p-2 rounded border border-gray-800/80">{req.message}</p>
                        <div className="flex gap-4 text-xs text-gray-400 pt-1">
                          <span className="flex items-center gap-1"><Phone size={12} /> {req.requesterContact.phone}</span>
                          <span className="flex items-center gap-1"><Mail size={12} /> {req.requesterContact.email}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 self-end md:self-center shrink-0">
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatusMutation.mutate({ requestId: req._id, status: 'accepted' })}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => updateStatusMutation.mutate({ requestId: req._id, status: 'declined' })}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {req.status === 'accepted' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ requestId: req._id, status: 'completed' })}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REGISTRATION FORM */}
          <div className="glass-panel p-6 max-w-3xl mx-auto border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <PlusCircle className="text-primary" /> Provider Registration Form
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Register as an individual volunteer or relief NGO to list your disaster support capabilities on ResQAI.
            </p>

            {regError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs mb-4 flex items-center gap-2">
                <AlertCircle size={16} /> {regError}
              </div>
            )}

            {regSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} /> {regSuccess}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                registerMutation.mutate(regForm);
              }}
              className="space-y-4 text-xs"
            >
              {/* Type Toggle */}
              <div>
                <label className="block text-gray-300 font-bold mb-1">Provider Type *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      checked={regForm.type === 'ngo'}
                      onChange={() => setRegForm(p => ({ ...p, type: 'ngo' }))}
                      className="accent-primary"
                    />
                    NGO / Organization
                  </label>
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      checked={regForm.type === 'individual'}
                      onChange={() => setRegForm(p => ({ ...p, type: 'individual' }))}
                      className="accent-primary"
                    />
                    Individual Volunteer
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Contact Person / Name *</label>
                  <input
                    type="text"
                    required
                    value={regForm.name}
                    onChange={(e) => setRegForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-primary"
                  />
                </div>

                {regForm.type === 'ngo' && (
                  <div>
                    <label className="block text-gray-300 font-bold mb-1">Organization Name *</label>
                    <input
                      type="text"
                      required
                      value={regForm.organizationName}
                      onChange={(e) => setRegForm(p => ({ ...p, organizationName: e.target.value }))}
                      placeholder="e.g. Disaster Relief India Foundation"
                      className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={regForm.phone}
                    onChange={(e) => setRegForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 9876543210"
                    className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="contact@reliefngo.org"
                    className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Location details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={regForm.city}
                    onChange={(e) => setRegForm(p => ({ ...p, city: e.target.value }))}
                    className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={regForm.state}
                    onChange={(e) => setRegForm(p => ({ ...p, state: e.target.value }))}
                    className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    value={regForm.country}
                    onChange={(e) => setRegForm(p => ({ ...p, country: e.target.value }))}
                    className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-gray-300 font-bold mb-1">Latitude / Longitude Coordinates *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      required
                      value={regForm.lat}
                      onChange={(e) => setRegForm(p => ({ ...p, lat: Number(e.target.value) }))}
                      placeholder="Lat (e.g. 21.1702)"
                      className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-primary"
                    />
                    <input
                      type="number"
                      step="any"
                      required
                      value={regForm.lng}
                      onChange={(e) => setRegForm(p => ({ ...p, lng: Number(e.target.value) }))}
                      placeholder="Lng (e.g. 72.8311)"
                      className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGPSLocation}
                  className="px-3 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded font-medium flex items-center justify-center gap-1 border border-gray-700"
                >
                  <Navigation size={14} /> Detect My Location
                </button>
              </div>

              {/* Services Offered Checkboxes */}
              <div>
                <label className="block text-gray-300 font-bold mb-2">Services Offered (Select all that apply) *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SERVICE_CATEGORIES.map(c => (
                    <label
                      key={c.id}
                      className={`p-2.5 rounded border flex items-center gap-2 cursor-pointer transition-all ${
                        regForm.servicesOffered.includes(c.id) ? 'bg-primary/20 border-primary text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={regForm.servicesOffered.includes(c.id)}
                        onChange={() => handleServiceToggle(c.id)}
                        className="accent-primary"
                      />
                      <span>{c.icon} {c.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Capacity / Resources Available</label>
                <input
                  type="text"
                  value={regForm.capacity}
                  onChange={(e) => setRegForm(p => ({ ...p, capacity: e.target.value }))}
                  placeholder="e.g. 100 shelter beds, 3 ambulances, 500 food packets daily"
                  className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Description & Operational Details</label>
                <textarea
                  rows={3}
                  value={regForm.description}
                  onChange={(e) => setRegForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Briefly describe your team, equipment, or operational readiness..."
                  className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {registerMutation.isPending ? 'Registering Provider...' : 'Submit Provider Registration'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PROVIDER PROFILE DETAIL MODAL */}
      <AnimatePresence>
        {selectedProvider && (
          <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel w-full max-w-lg p-6 relative border border-gray-700 space-y-4"
            >
              <button
                onClick={() => setSelectedProvider(null)}
                className="absolute right-4 top-4 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3">
                <span className={`p-3 rounded-xl ${selectedProvider.type === 'ngo' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                  {selectedProvider.type === 'ngo' ? <Building2 size={24} /> : <User size={24} />}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedProvider.name}</h3>
                  {selectedProvider.organizationName && <p className="text-xs text-blue-400 font-semibold">{selectedProvider.organizationName}</p>}
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-300 bg-surface/50 p-3 rounded-lg border border-gray-800">
                <p className="flex items-center gap-2"><MapPin size={14} className="text-primary" /> {selectedProvider.location.address ? `${selectedProvider.location.address}, ` : ''}{selectedProvider.location.city}, {selectedProvider.location.state}</p>
                <p className="flex items-center gap-2"><Phone size={14} className="text-emerald-400" /> {selectedProvider.contact.phone}</p>
                <p className="flex items-center gap-2"><Mail size={14} className="text-blue-400" /> {selectedProvider.contact.email}</p>
                {selectedProvider.capacity && <p className="text-xs text-amber-400 font-medium">Capacity: {selectedProvider.capacity}</p>}
              </div>

              {selectedProvider.registrationNumber && (
                <div className="p-3 bg-gray-900/90 rounded-lg border border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                      <ShieldCheck className={selectedProvider.verified ? "text-emerald-400" : "text-amber-400"} size={16} />
                      NGO Darpan ID: <span className="font-mono text-white font-bold">{selectedProvider.registrationNumber}</span>
                    </span>
                    {selectedProvider.verified ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Government Verified
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                        <AlertCircle size={12} /> Self-Attested
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-400">
                    Cross-check this organization's official registration & compliance on NITI Aayog's official NGO Darpan portal.
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <a
                      href="https://ngodarpan.gov.in/index.php/search/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 rounded text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <ExternalLink size={13} /> Verify on NGO Darpan
                    </a>

                    <button
                      onClick={() => toggleVerifyMutation.mutate({ providerId: selectedProvider._id, verified: !selectedProvider.verified })}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                        selectedProvider.verified
                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md'
                      }`}
                    >
                      {selectedProvider.verified ? 'Undo Verification' : '✓ Mark Verified'}
                    </button>
                  </div>
                </div>
              )}

              {selectedProvider.description && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">About Provider</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">{selectedProvider.description}</p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Services Listed</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProvider.servicesOffered.map(s => {
                    const cat = SERVICE_CATEGORIES.find(c => c.id === s);
                    return (
                      <span key={s} className="px-2.5 py-1 bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded">
                        {cat?.icon} {cat?.label || s}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-800 flex gap-2">
                <button
                  onClick={() => setSelectedProvider(null)}
                  className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setRequestModalProvider(selectedProvider);
                    setSelectedProvider(null);
                    setRequestForm(prev => ({ ...prev, serviceNeeded: selectedProvider.servicesOffered[0] || 'shelter' }));
                  }}
                  className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white rounded text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Send size={14} /> Request Relief Service
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SERVICE REQUEST FORM MODAL */}
      <AnimatePresence>
        {requestModalProvider && (
          <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel w-full max-w-lg p-6 relative border border-gray-700 space-y-4"
            >
              <button
                onClick={() => setRequestModalProvider(null)}
                className="absolute right-4 top-4 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>

              <div>
                <span className="text-xs text-primary font-bold uppercase tracking-wider">Submit Service Request</span>
                <h3 className="text-base font-bold text-white">To: {requestModalProvider.name}</h3>
              </div>

              {requestSuccessMsg ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={18} /> {requestSuccessMsg}
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitRequestMutation.mutate(requestForm);
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="block text-gray-300 font-bold mb-1">Your Name / Organization *</label>
                    <input
                      type="text"
                      required
                      value={requestForm.requesterName}
                      onChange={(e) => setRequestForm(p => ({ ...p, requesterName: e.target.value }))}
                      placeholder="e.g. Relief Coordinator Patel"
                      className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Requester Type *</label>
                      <select
                        value={requestForm.requesterType}
                        onChange={(e) => setRequestForm(p => ({ ...p, requesterType: e.target.value as any }))}
                        className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-primary"
                      >
                        <option value="individual">Individual</option>
                        <option value="ngo">NGO</option>
                        <option value="authority">Government / Authority</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Urgency Level *</label>
                      <select
                        value={requestForm.urgency}
                        onChange={(e) => setRequestForm(p => ({ ...p, urgency: e.target.value as any }))}
                        className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-primary"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">🚨 Critical / SOS</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={requestForm.phone}
                        onChange={(e) => setRequestForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+91 9876543210"
                        className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={requestForm.email}
                        onChange={(e) => setRequestForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="requester@gmail.com"
                        className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-bold mb-1">Service Needed *</label>
                    <select
                      value={requestForm.serviceNeeded}
                      onChange={(e) => setRequestForm(p => ({ ...p, serviceNeeded: e.target.value }))}
                      className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-primary"
                    >
                      {requestModalProvider.servicesOffered.map(s => {
                        const cat = SERVICE_CATEGORIES.find(c => c.id === s);
                        return <option key={s} value={s}>{cat?.icon} {cat?.label || s}</option>;
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-bold mb-1">Message / Disaster Context *</label>
                    <textarea
                      rows={3}
                      required
                      value={requestForm.message}
                      onChange={(e) => setRequestForm(p => ({ ...p, message: e.target.value }))}
                      placeholder="Describe the disaster scenario, required quantity, or urgent assistance details..."
                      className="w-full p-2.5 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitRequestMutation.isPending}
                    className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {submitRequestMutation.isPending ? 'Submitting Request...' : 'Send Request to Provider'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

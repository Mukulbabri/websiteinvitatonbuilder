import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  BarChart, 
  Settings, 
  Calendar, 
  Image as ImageIcon, 
  Trash2, 
  Check, 
  Plus, 
  Save, 
  ArrowUp,
  ArrowDown,
  Edit2, 
  LogOut,
  Smartphone,
  Monitor,
  Tablet,
  Layout,
  Music,
  MapPin,
  Lock,
  ChevronRight,
  Database,
  Clock,
  Play,
  Upload,
  Heart
} from 'lucide-react';
import { 
  databaseService, 
  supabase,
  isSupabaseConfigured,
  activeSite,
  DEFAULT_SETTINGS
} from '../services/database';
import { apiClient } from '../api/client';
import type { 
  WeddingSettings, 
  WeddingEvent,
  GalleryItem 
} from '../services/database';

interface AdminPanelProps {
  onBackToGuest: () => void;
  onSettingsChange?: (settings: WeddingSettings) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToGuest, onSettingsChange }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeWebsiteDetails, setActiveWebsiteDetails] = useState<any | null>(null);
  const [activatingPlan, setActivatingPlan] = useState(false);

  // OTP Signup States removed - using direct email/password and Google OAuth instead

  const handleActivatePlan = async () => {
    if (!activeWebsiteDetails || !activeSite) return;
    setActivatingPlan(true);
    try {
      // Mock payment delay
      await new Promise(r => setTimeout(r, 1500));
      
      const updatedSite = { ...activeWebsiteDetails, status: 'active' };
      
      try {
        await apiClient.put(`/sites/${activeSite.id}`, { status: 'active' });
      } catch (err) {
        const mockWebsites = JSON.parse(localStorage.getItem('saas_websites') || '[]');
        const idx = mockWebsites.findIndex((w: any) => w.id === activeSite.id);
        if (idx !== -1) {
          mockWebsites[idx].status = 'active';
          localStorage.setItem('saas_websites', JSON.stringify(mockWebsites));
        }
      }
      setActiveWebsiteDetails(updatedSite);
      alert('Success! Plan activated and wedding website editor is now unlocked.');
    } catch (err: any) {
      console.error(err);
      alert(`Activation failed: ${err.message || err}`);
    } finally {
      setActivatingPlan(false);
    }
  };

  // Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'gateVideo' | 'content' | 'card' | 'theme' | 'events' | 'gallery' | 'rsvps' | 'blessings' | 'seo' | 'eventTemplates'>('dashboard');

  // Database Data States
  const [settings, setSettingsState] = useState<WeddingSettings | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Upload progress overlay state
  const [uploadProgress, setUploadProgress] = useState<{
    active: boolean;
    percent: number;
    fileName: string;
    folder: string;
  }>({ active: false, percent: 0, fileName: '', folder: '' });

  // Shared upload helper — shows the overlay and wires onProgress
  const uploadAsset = useCallback(async (
    file: File,
    folder: string
  ): Promise<string> => {
    setUploadProgress({ active: true, percent: 0, fileName: file.name, folder });
    try {
      const url = await databaseService.uploadFileToStorage(file, folder, (pct) => {
        setUploadProgress(prev => ({ ...prev, percent: pct }));
      });
      // Keep at 100 briefly so the bar completes visually
      setUploadProgress(prev => ({ ...prev, percent: 100 }));
      await new Promise(r => setTimeout(r, 600));
      return url;
    } finally {
      setUploadProgress({ active: false, percent: 0, fileName: '', folder: '' });
    }
  }, []);

  // Wrap setSettings: propagate live to parent App + auto-save to DB with debounce
  const setSettings = useCallback((updated: WeddingSettings | null) => {
    setSettingsState(updated);
    if (!updated) return;

    // Propagate live to parent so WeddingPage updates instantly
    if (onSettingsChange) {
      onSettingsChange(updated);
    }

    // Debounced auto-save to database
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setAutoSaveStatus('saving');
    autoSaveTimer.current = setTimeout(async () => {
      try {
        await databaseService.updateSettings(updated);
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Auto-save failed:', err);
        setAutoSaveStatus('idle');
      }
    }, 800);
  }, [onSettingsChange]);

  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [editEvent, setEditEvent] = useState<Partial<WeddingEvent> | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);


  // Analytics Stats State
  const [stats, setStats] = useState<{
    visitorCount: number;
    rsvpCount: number;
    blessingCount: number;
    galleryCount: number;
    chartData: { date: string; count: number }[];
    deviceData: { name: string; value: number }[];
    countryData: { name: string; value: number }[];
  }>({
    visitorCount: 0,
    rsvpCount: 0,
    blessingCount: 0,
    galleryCount: 0,
    chartData: [],
    deviceData: [],
    countryData: []
  });

  // Edit states

  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [planFeatures, setPlanFeatures] = useState<Record<string, any>>({});

  // Main domain site selector states
  const [clientSites, setClientSites] = useState<any[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);

  // Load Admin Data
  const loadAdminData = async () => {
    try {
      const sets = await databaseService.getSettings().catch(() => DEFAULT_SETTINGS);
      if (sets) setSettings(sets);

      const evs = await databaseService.getEvents().catch(() => []);
      if (evs) setEvents(evs);

      const gals = await databaseService.getGallery().catch(() => []);
      if (gals) setGallery(gals);

      const statData = await databaseService.getVisitorStats().catch(() => ({
        visitorCount: 0, rsvpCount: 0, blessingCount: 0, galleryCount: 0,
        chartData: [], deviceData: [], countryData: []
      }));
      if (statData) setStats(statData);

      const plans = await databaseService.getAllPlanFeatures().catch(() => ({}));
      if (plans) setPlanFeatures(plans);

      let siteDetails: any = null;
      if (isSupabaseConfigured && supabase && activeSite?.id) {
        try {
          const { data } = await supabase.from('websites').select('*').eq('id', activeSite.id).maybeSingle();
          siteDetails = data;
        } catch (e) {}
      }
      if (!siteDetails) {
        const mockWebsites = JSON.parse(localStorage.getItem('saas_websites') || '[]');
        siteDetails = mockWebsites[0] || { id: 'site-1', subdomain: 'wedding', plan: 'royal', status: 'active' };
      }
      setActiveWebsiteDetails(siteDetails);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  // Check session on mount & initialize auth state
  useEffect(() => {
    const checkSession = async () => {
      const isLocalAuth = sessionStorage.getItem('admin_authenticated') === 'true';
      if (isLocalAuth) {
        setIsAuthenticated(true);
        return;
      }

      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            setIsAuthenticated(true);
            sessionStorage.setItem('admin_authenticated', 'true');
            return;
          }
        } catch (err) {
          console.warn('Supabase session check error:', err);
        }
      }

      try {
        const { data } = await apiClient.get('/auth/me');
        if (data && data.user) {
          setIsAuthenticated(true);
          sessionStorage.setItem('admin_authenticated', 'true');
          return;
        }
      } catch (err) {
        // ignore
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  // Event Manage
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEvent || !editEvent.event_name || !editEvent.event_date) return;
    
    try {
      const payload: WeddingEvent = {
        id: editEvent.id || Math.random().toString(36).substring(2, 9),
        event_name: editEvent.event_name,
        event_date: editEvent.event_date,
        event_time: editEvent.event_time || '12:00 PM',
        venue: editEvent.venue || '',
        google_map_link: editEvent.google_map_link || '',
        background_image: editEvent.background_image || '',
        caricature_image: editEvent.caricature_image || '',
        sort_order: editEvent.sort_order || events.length + 1,
        message: editEvent.message || ''
      };
      await databaseService.saveEvent(payload);
      setEditEvent(null);
      loadAdminData();
    } catch (err) {
      console.error(err);
      alert('Failed to save event.');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    await databaseService.deleteEvent(id);
    loadAdminData();
  };

  const handleMoveEvent = async (index: number, direction: 'up' | 'down') => {
    const sorted = [...events].sort((a, b) => a.sort_order - b.sort_order);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    // Normalize sort orders to sequential integers 1, 2, 3, ...
    sorted.forEach((item, idx) => {
      item.sort_order = idx + 1;
    });

    // Swap sort orders
    const temp = sorted[index].sort_order;
    sorted[index].sort_order = sorted[targetIndex].sort_order;
    sorted[targetIndex].sort_order = temp;

    // Save both
    await databaseService.saveEvent(sorted[index]);
    await databaseService.saveEvent(sorted[targetIndex]);
    loadAdminData();
  };

  // Auth Handling
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    if (true && supabase) {
      try {
        if (isSignUp) {
          const { data: signUpData, error } = await supabase.auth.signUp({ 
            email: email.trim(), 
            password 
          });
          if (error) throw error;
          
          if (signUpData.user) {
            await supabase.from('profiles').insert([
              {
                id: signUpData.user.id,
                email: signUpData.user.email || email.trim(),
                role: signUpData.user.email === 'admin@wedding.com' ? 'admin' : 'client'
              }
            ]);
          }
          alert('Registration Successful! If confirmation is required, please check your email, or try logging in now.');
          setIsSignUp(false);
        } else {
          if (email.trim() === 'admin@wedding.com' && password === 'admin123') {
            sessionStorage.setItem('admin_authenticated', 'true');
            setIsAuthenticated(true);
          } else {
            const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
            if (error) throw error;
            sessionStorage.setItem('admin_authenticated', 'true');
            setIsAuthenticated(true);
          }
        }
      } catch (err: any) {
        if (email.trim() === 'admin@wedding.com' && password === 'admin123') {
          sessionStorage.setItem('admin_authenticated', 'true');
          setIsAuthenticated(true);
        } else {
          console.error('Supabase authentication failed details:', err);
          alert(`Authentication Failed: ${err.message || JSON.stringify(err)}`);
        }
      }
    } else {
      // Mock Authentication Fallback
      if (isSignUp) {
        alert('Registration Successful (Mock Mode)! Logging in now.');
        sessionStorage.setItem('admin_authenticated', 'true');
        setIsAuthenticated(true);
        setIsSignUp(false);
      } else {
        if (email.trim() === 'admin@wedding.com' && password === 'admin123') {
          sessionStorage.setItem('admin_authenticated', 'true');
          setIsAuthenticated(true);
        } else {
          alert('Invalid credentials. Default admin login is: admin@wedding.com / admin123');
        }
      }
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('admin_authenticated');
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
  };

  
  const handleGoogleAuth = async () => {
    alert('Google Auth will be implemented in a future iteration with the custom backend.');
  };
  

  // Manual Save (still available as a safety net)
  const handleSaveSettings = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!settings) return;
    try {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      setAutoSaveStatus('saving');
      await databaseService.updateSettings(settings);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (err) {
      console.error(err);
      setAutoSaveStatus('idle');
      alert('Failed to save settings.');
    }
  };



  // Gallery Manage
  const handleAddGalleryImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryUrl.trim()) return;

    // Plan enforcement
    const currentCount = gallery.length;
    const plan = activeWebsiteDetails?.plan || 'starter';
    const planConfig = planFeatures[plan];
    const limit = planConfig ? planConfig.gallery_limit : (plan === 'starter' ? 5 : plan === 'premium' ? 30 : 9999);
    if (currentCount >= limit) {
      alert(`Your ${plan.toUpperCase()} plan limit of ${limit} gallery images has been reached. Please contact admin to upgrade your plan limit!`);
      return;
    }

    await databaseService.addGalleryImage(newGalleryUrl);
    setNewGalleryUrl('');
    loadAdminData();
  };

  const handleDeleteGalleryImage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gallery image?')) return;
    await databaseService.deleteGalleryImage(id);
    loadAdminData();
  };



  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FEFAE0] flex flex-col items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 border-primary/30 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
            <Lock size={28} />
          </div>

          <h1 className="font-candlescript text-4xl text-primary font-bold mb-2">
            {isSignUp ? 'Client Register' : 'Client Portal'}
          </h1>
          <p className="font-poppins text-xs text-wedding-text/60 mb-8 uppercase tracking-widest leading-relaxed">
            {isSignUp ? 'Create a secure client account' : 'Client Login Required'}
          </p>

          <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
            <div>
              <label className="block font-poppins text-[10px] uppercase tracking-wider text-wedding-text/75 font-semibold mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@email.com"
                className="w-full px-4 py-3 bg-white/70 border border-primary/20 rounded-xl font-poppins text-xs focus:outline-none focus:border-primary/60 transition"
              />
            </div>

            <div>
              <label className="block font-poppins text-[10px] uppercase tracking-wider text-wedding-text/75 font-semibold mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/70 border border-primary/20 rounded-xl font-poppins text-xs focus:outline-none focus:border-primary/60 transition"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="btn-gold w-full py-3.5 text-xs font-poppins uppercase tracking-widest font-semibold cursor-pointer"
            >
              {authLoading ? (isSignUp ? 'Registering...' : 'Signing In...') : (isSignUp ? 'Register' : 'Sign In')}
            </button>
          </form>

          {/* Google Auth Integration */}
          <div className="space-y-4 pt-2">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-primary/10"></div>
              <span className="flex-shrink mx-4 text-[9px] text-wedding-text/40 uppercase tracking-widest font-semibold font-poppins">Or Continue With</span>
              <div className="flex-grow border-t border-primary/10"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full py-3 bg-white hover:bg-amber-50/20 border border-primary/20 rounded-xl text-xs font-bold text-wedding-text tracking-wider transition cursor-pointer flex items-center justify-center shadow-sm font-poppins"
            >
              <svg className="w-4 h-4 mr-2.5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.4 7.56l3.83 2.97C6.15 7.55 8.87 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.44c-.28 1.47-1.11 2.71-2.35 3.55l3.66 2.84c2.14-1.98 3.74-4.89 3.74-8.55z" />
                <path fill="#FBBC05" d="M5.23 14.53A7.18 7.18 0 014.8 12c0-.88.15-1.72.43-2.53L1.4 6.5A11.96 11.96 0 000 12c0 2 0 4.14.73 6.07l4.5-3.54z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.67-2.31 1.09-3.74 1.09-3.13 0-5.85-2.51-6.77-5.49L.96 16.32C2.93 20.35 6.91 23 12 23z" />
              </svg>
              Google Account
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-center text-[10px] font-poppins font-bold uppercase tracking-widest text-[#B27F4C] hover:underline mt-4 cursor-pointer border-none bg-transparent"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up / Register"}
          </button>

          {!isSupabaseConfigured && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-poppins rounded-xl leading-relaxed text-left flex flex-col gap-2">
              <span className="font-semibold flex items-center gap-1"><Database size={12} /> Running in Local Mode</span>
              <span>Default admin credentials for local access:</span>
              <div className="bg-white/60 p-2 rounded border border-amber-100 font-mono text-[9px] select-all">
                Email: admin@wedding.com <br />
                Password: admin123
              </div>
            </div>
          )}

          <button
            onClick={onBackToGuest}
            className="mt-6 font-poppins text-xs text-primary underline cursor-pointer"
          >
            Back to Invitation
          </button>
        </div>
      </div>
    );
  }

  // Block editing if plan is inactive/pending/disabled
  if (isAuthenticated && activeWebsiteDetails && activeWebsiteDetails.status !== 'active') {
    return (
      <div className="min-h-screen bg-[#FEFAE0] flex flex-col items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 border-rose-300 shadow-2xl text-center space-y-6 bg-white/50 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <Lock size={28} className="animate-pulse" />
          </div>

          <h1 className="font-candlescript text-4xl text-rose-700 font-bold">Plan Inactive</h1>
          <p className="font-poppins text-xs text-wedding-text/70 leading-relaxed">
            Your website plan is currently inactive or pending activation. You can only edit and manage your luxury details once your subscription status is activated.
          </p>

          <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 text-left text-[10px] space-y-2">
            <span className="font-bold text-rose-800 uppercase tracking-widest block">Subscription Summary</span>
            <div className="flex justify-between font-poppins">
              <span className="text-wedding-text/60">Selected Plan:</span>
              <span className="font-bold uppercase text-rose-700">{activeWebsiteDetails.plan}</span>
            </div>
            <div className="flex justify-between font-poppins">
              <span className="text-wedding-text/60">Subdomain:</span>
              <span className="font-mono text-purple-950">{activeWebsiteDetails.subdomain}.localhost:5174</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={handleActivatePlan}
              disabled={activatingPlan}
              className="w-full py-3.5 btn-purple text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-[0.98] border-none cursor-pointer flex items-center justify-center gap-2"
            >
              {activatingPlan ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Processing Payment...
                </>
              ) : (
                'Activate Plan Now'
              )}
            </button>
            <div className="flex gap-4">
              <button
                onClick={onBackToGuest}
                className="flex-1 py-2.5 bg-white border border-primary/20 hover:border-primary/50 text-wedding-text text-[10px] uppercase tracking-wider font-bold rounded-xl transition cursor-pointer"
              >
                Back to Site
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] uppercase tracking-wider font-bold rounded-xl transition cursor-pointer border border-rose-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-[#FEFAE0] flex flex-col font-poppins text-wedding-text">

      {/* ─── Upload Progress Overlay ─── */}
      {uploadProgress.active && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="bg-white/95 rounded-3xl shadow-2xl p-8 w-[90vw] max-w-md flex flex-col items-center gap-6 border border-primary/20">
            {/* Animated upload icon */}
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload size={32} className="text-primary animate-bounce" />
              </div>
              {/* Circular progress ring */}
              <svg className="absolute inset-0 w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="#E8D5B7" strokeWidth="4" />
                <circle
                  cx="40" cy="40" r="36"
                  fill="none"
                  stroke="#B27F4C"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - uploadProgress.percent / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                />
              </svg>
            </div>

            {/* Labels */}
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Uploading to Supabase…</p>
              <p className="text-[10px] text-wedding-text/60 max-w-[260px] truncate">{uploadProgress.fileName}</p>
              <p className="text-[10px] text-wedding-text/50 uppercase tracking-wider">→ {uploadProgress.folder}/</p>
            </div>

            {/* Linear progress bar */}
            <div className="w-full space-y-2">
              <div className="w-full h-3 bg-primary/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-primary to-amber-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress.percent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-wedding-text/60 font-mono">
                <span>0%</span>
                <span className="text-primary font-bold text-sm">{uploadProgress.percent}%</span>
                <span>100%</span>
              </div>
            </div>

            <p className="text-[9px] text-wedding-text/40 italic">
              Please wait, do not close this window…
            </p>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="glass-card border-none rounded-none border-b border-primary/10 px-6 py-4 flex items-center justify-between shadow-sm bg-white/40">
        <div className="flex items-center gap-3">
          <span className="font-candlescript text-3xl text-primary font-bold">{settings?.couple_name}</span>
          <span className="hidden sm:inline bg-primary/15 text-primary text-[10px] font-semibold tracking-wider px-2.5 py-0.5 rounded-full uppercase">
            {true ? 'Supabase Database' : 'Mock Mode'}
          </span>
          {activeWebsiteDetails?.plan && (
            <span className={`text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full uppercase ${
              activeWebsiteDetails.plan === 'royal' 
                ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                : activeWebsiteDetails.plan === 'premium'
                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {activeWebsiteDetails.plan} plan
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* Auto-save Status Indicator */}
          {autoSaveStatus === 'saving' && (
            <span className="text-[10px] font-poppins text-amber-600 flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              Saving…
            </span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="text-[10px] font-poppins text-green-600 flex items-center gap-1.5">
              <Check size={11} />
              Saved
            </span>
          )}
          <button
            onClick={onBackToGuest}
            className="text-xs font-semibold hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer uppercase tracking-widest"
          >
            View Guest Card <ChevronRight size={14} />
          </button>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer uppercase tracking-widest ml-4 border border-rose-200 hover:border-rose-400 px-3 py-1.5 rounded-full"
          >
            <LogOut size={12} /> Logout
          </button>
        </div>
      </header>

      {/* Main Admin Content Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-white/40 border-r border-primary/10 p-4 space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart },
            { id: 'gateVideo', label: 'Main Gate Video', icon: Play },
            { id: 'card', label: 'Invitation Card Text', icon: Edit2 },
            { id: 'eventTemplates', label: 'Event Card Templates', icon: Calendar },
            { id: 'content', label: 'General Details', icon: Settings },
            { id: 'theme', label: 'Theme Settings', icon: Layout },
            { id: 'gallery', label: 'Manage Gallery', icon: ImageIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium uppercase tracking-wider transition ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-md'
                    : 'text-wedding-text/75 hover:bg-primary/5 hover:text-primary'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </aside>

        {/* Panel Main Area */}
        <main className="flex-1 p-6 md:p-8 max-w-6xl overflow-y-auto">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              <h2 className="text-xl font-semibold tracking-wider uppercase text-primary border-b border-primary/10 pb-4">
                Dashboard Overview
              </h2>

              {/* Database Sync Banner */}
              {true && (
                <div className="glass-card p-5 border-amber-200 bg-amber-50/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Database size={14} className="animate-pulse" /> Supabase Connection Connected
                    </span>
                    <p className="text-[10px] text-amber-950/70 leading-relaxed">
                      You are connected to Supabase! If you previously customized settings, events, or gallery images on this browser, you can upload them to your new database.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to push all your local settings, events, and gallery to Supabase? This will overwrite existing records in the database.')) {
                        try {
                          await databaseService.syncLocalToSupabase();
                          alert('Data migration successful! Your local settings, ceremony events, and gallery images have been pushed to Supabase.');
                          window.location.reload();
                        } catch (err: any) {
                          alert(`Sync failed: ${err.message || err}`);
                        }
                      }
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer flex-shrink-0"
                  >
                    Sync Local Data to Database
                  </button>
                </div>
              )}

              {/* Stats Cards grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Visitors', value: stats.visitorCount, color: 'border-blue-200 text-blue-700 bg-blue-50/50' },
                  { label: 'Gallery Images', value: stats.galleryCount, color: 'border-purple-200 text-purple-700 bg-purple-50/50' }
                ].map((stat, i) => (
                  <div key={i} className={`p-6 border rounded-2xl flex flex-col justify-between shadow-sm ${stat.color}`}>
                    <span className="text-[10px] font-semibold uppercase tracking-widest opacity-75">{stat.label}</span>
                    <span className="text-3xl font-bold mt-2">{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Custom SVG Charts */}
              <div className="grid md:grid-cols-3 gap-8">
                {/* Visitor Timeline (2/3 width) */}
                <div className="md:col-span-2 glass-card p-6 border-primary/20">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-primary mb-6">Visitor Traffic (Last 7 Days)</h3>
                  
                  {stats.chartData.length === 0 ? (
                    <div className="py-20 text-center text-xs text-wedding-text/50">No visitor logs recorded.</div>
                  ) : (
                    <div className="h-64 flex items-end justify-between gap-2 pt-6 px-4">
                      {stats.chartData.map((data, i) => {
                        const maxVal = Math.max(...stats.chartData.map(d => d.count), 1);
                        const pct = (data.count / maxVal) * 100;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                            <div className="text-[9px] font-medium text-wedding-text/60 opacity-0 group-hover:opacity-100 transition-opacity">
                              {data.count}
                            </div>
                            <div 
                              className="w-full bg-primary/45 group-hover:bg-primary rounded-t-lg transition-all duration-500" 
                              style={{ height: `${pct * 0.8}%`, minHeight: '4px' }}
                            />
                            <div className="text-[9px] font-medium text-wedding-text/60 font-mono">
                              {data.date}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Device Breakdown (1/3 width) */}
                <div className="glass-card p-6 border-primary/20 flex flex-col justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-primary mb-6">Device Breakdown</h3>
                  
                  {stats.deviceData.length === 0 ? (
                    <div className="py-16 text-center text-xs text-wedding-text/50">No device logs.</div>
                  ) : (
                    <div className="space-y-4">
                      {stats.deviceData.map((dev, i) => {
                        const total = stats.deviceData.reduce((acc, d) => acc + d.value, 0);
                        const pct = Math.round((dev.value / total) * 100);
                        const Icon = dev.name === 'Mobile' ? Smartphone : dev.name === 'Desktop' ? Monitor : Tablet;
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1.5 text-wedding-text/80 font-medium">
                                <Icon size={12} className="text-primary" /> {dev.name}
                              </span>
                              <span className="font-semibold text-primary">{dev.value} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 w-full bg-[#D4A373]/10 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTENT DETAILS */}
          {activeTab === 'content' && settings && (
            <form onSubmit={handleSaveSettings} className="space-y-8 animate-fade-in">
              <h2 className="text-xl font-semibold tracking-wider uppercase text-primary border-b border-primary/10 pb-4">
                Wedding Settings & Details
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-wedding-text/75 font-semibold mb-2">Couple Names</label>
                  <input
                    type="text"
                    required
                    value={settings.couple_name}
                    onChange={(e) => setSettings({ ...settings, couple_name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/50 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-wedding-text/75 font-semibold mb-2">Wedding Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={(settings.wedding_date || '').slice(0, 16)}
                    onChange={(e) => setSettings({ ...settings, wedding_date: new Date(e.target.value).toISOString() })}
                    className="w-full px-4 py-3 bg-white/50 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition"
                  />
                </div>



                 <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-wedding-text/75 font-semibold mb-2">Background Music File URL</label>
                    <input
                      type="text"
                      value={settings.music_url}
                      onChange={(e) => setSettings({ ...settings, music_url: e.target.value })}
                      placeholder="e.g. /song.mp3 or https://..."
                      className="w-full px-4 py-3 bg-white/50 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition"
                    />
                  </div>

                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/15 space-y-2">
                    <span className="block text-[11px] font-bold text-primary uppercase tracking-wider">
                      Or: Upload Audio File
                    </span>
                    <p className="text-[10px] text-wedding-text/75 leading-relaxed font-light">
                      Select an audio file (MP3, WAV, etc.) from your device to set as background music.
                    </p>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file && settings) {
                          try {
                            const url = await uploadAsset(file, 'music');
                            setSettings({ ...settings, music_url: url });
                          } catch (err) {
                            console.error(err);
                            alert('Failed to upload audio.');
                          }
                        }
                      }}
                      className="w-full text-xs text-wedding-text/70 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-wedding-text/75 font-semibold mb-2">RSVP Family Contact Name</label>
                  <input
                    type="text"
                    value={settings.rsvp_family || ''}
                    onChange={(e) => setSettings({ ...settings, rsvp_family: e.target.value })}
                    className="w-full px-4 py-3 bg-white/50 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-wedding-text/75 font-semibold mb-2">With Best Compliments Text</label>
                  <input
                    type="text"
                    value={settings.compliments_text || ''}
                    onChange={(e) => setSettings({ ...settings, compliments_text: e.target.value })}
                    className="w-full px-4 py-3 bg-white/50 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-wedding-text/75 font-semibold mb-2">WhatsApp Number for Blessings (e.g. +919876543210)</label>
                  <input
                    type="text"
                    value={settings.whatsapp_number || ''}
                    onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                    className="w-full px-4 py-3 bg-white/50 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition"
                  />
                </div>

              </div>

              {/* Footer Settings Section */}
              <div className="border-t border-primary/10 pt-6 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Footer Information & Credits
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-wedding-text/75 font-semibold mb-2">Footer Contact Phone</label>
                    <input
                      type="text"
                      value={settings.footer_phone || ''}
                      onChange={(e) => setSettings({ ...settings, footer_phone: e.target.value })}
                      placeholder="e.g. +919876543210"
                      className="w-full px-4 py-3 bg-white/50 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-wedding-text/75 font-semibold mb-2">Footer Contact Email</label>
                    <input
                      type="email"
                      value={settings.footer_email || ''}
                      onChange={(e) => setSettings({ ...settings, footer_email: e.target.value })}
                      placeholder="e.g. wedding@example.com"
                      className="w-full px-4 py-3 bg-white/50 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-wedding-text/75 font-semibold mb-2">Footer Copyright & Credits</label>
                    <input
                      type="text"
                      value={settings.footer_copyright || ''}
                      onChange={(e) => setSettings({ ...settings, footer_copyright: e.target.value })}
                      placeholder="e.g. Designed & Developed by Mukul Sharma"
                      className="w-full px-4 py-3 bg-white/50 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="btn-gold px-8 py-3.5 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Save size={14} /> Save General Details
                </button>
              </div>
            </form>
          )}

          {/* TAB: MAIN GATE VIDEO CUSTOMIZATION */}
          {activeTab === 'gateVideo' && settings && (
            <div className="space-y-8 animate-fade-in">
              <h2 className="text-xl font-semibold tracking-wider uppercase text-primary border-b border-primary/10 pb-4">
                Main Gate Video Settings
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* 1. Video Player Preview */}
                <div className="glass-card p-6 border-primary/20 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">
                    Current Video Preview
                  </h3>
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black relative border border-primary/15 shadow-inner flex items-center justify-center">
                    {settings.gate_video_url ? (
                      <video
                        key={settings.gate_video_url}
                        src={settings.gate_video_url}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-white/50">No Video Loaded</span>
                    )}
                  </div>
                  <div className="text-[10px] text-wedding-text/60 leading-relaxed font-mono select-all break-all">
                    Source: {settings.gate_video_url}
                  </div>
                </div>

                {/* 2. Customizer Interface */}
                <div className="glass-card p-6 border-primary/20 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">
                      Configure Video
                    </h3>

                    {/* Method A: File Upload (Immediate Preview) */}
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/15 space-y-3">
                      <span className="block text-[11px] font-bold text-primary uppercase tracking-wider">
                        Method 1: Upload Video File
                      </span>
                      <p className="text-[10px] text-wedding-text/75 leading-relaxed">
                        Select a video file from your computer to preview it instantly on the Welcome Gate.
                      </p>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file && settings) {
                            try {
                              const url = await uploadAsset(file, 'videos');
                              setSettings({ ...settings, gate_video_url: url });
                            } catch (err) {
                              console.error(err);
                              alert('Failed to upload video.');
                            }
                          }
                        }}
                        className="w-full text-xs text-wedding-text/70 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer"
                      />
                    </div>

                    {/* Method B: URL input */}
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/15 space-y-3">
                      <span className="block text-[11px] font-bold text-primary uppercase tracking-wider">
                        Method 2: Video File Path or URL
                      </span>
                      <p className="text-[10px] text-wedding-text/75 leading-relaxed">
                        Enter a URL from the web or relative path in your project workspace.
                      </p>
                      <input
                        type="text"
                        value={settings.gate_video_url}
                        onChange={(e) => setSettings({ ...settings, gate_video_url: e.target.value })}
                        placeholder="/my-wedding-video.mp4 or https://..."
                        className="w-full px-3 py-2.5 bg-white/70 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition"
                      />
                    </div>

                    {/* Helper instructions */}
                    <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 text-amber-800 text-[10px] leading-relaxed space-y-2">
                      <div className="font-semibold uppercase tracking-wider flex items-center gap-1">
                        💡 How to save video permanently:
                      </div>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Rename your video file to something simple (e.g., <code>gate-video.mp4</code>).</li>
                        <li>Drag and drop the file into your project's <code>public/</code> folder.</li>
                        <li>Type <code>/gate-video.mp4</code> in the input box above and click Save.</li>
                      </ol>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-primary/10">
                    <button
                      onClick={handleSaveSettings}
                      className="btn-gold px-8 py-3.5 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <Save size={14} /> Save Video Selection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: INVITATION CARD CUSTOMIZER */}
          {activeTab === 'card' && settings && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-wider uppercase text-primary">
                    Invitation Card Customizer
                  </h2>
                  <p className="text-[10px] text-wedding-text/60 mt-1 uppercase tracking-wider">
                    Edit texts, fonts, sizes, and vertical offsets with live preview
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to reset all card styling and text to defaults?')) {
                      setSettings({
                        ...settings,
                        invite_line1: 'We are cordially invited to the',
                        invite_line1_font: "'Times New Roman', Times, serif",
                        invite_line1_size: 12,
                        invite_line1_offset: 0,
                        invite_line2: 'wedding ceremony of',
                        invite_line2_font: "'Times New Roman', Times, serif",
                        invite_line2_size: 12,
                        invite_line2_offset: 0,
                        bride_name: 'Shreya',
                        bride_name_font: 'Candlescript',
                        bride_name_size: 52,
                        bride_name_offset: 0,
                        bride_parents: 'Daughter of Mrs. Rekha Gupta & Mr. S. K. Gupta',
                        bride_parents_font: "'Times New Roman', Times, serif",
                        bride_parents_size: 11,
                        bride_parents_offset: 0,
                        groom_name: 'Mukul Sharma',
                        groom_name_font: 'Candlescript',
                        groom_name_size: 52,
                        groom_name_offset: 0,
                        groom_parents: 'Son of Mrs. Asha Sharma & Mr. R. K. Sharma',
                        groom_parents_font: "'Times New Roman', Times, serif",
                        groom_parents_size: 11,
                        groom_parents_offset: 0,
                        venue_label: 'At Venue',
                        venue_label_font: "'Times New Roman', Times, serif",
                        venue_label_size: 10,
                        venue_label_offset: 0,
                        blessing_note: 'Your presence is our greatest blessing.',
                        blessing_note_font: "'Times New Roman', Times, serif",
                        blessing_note_size: 14,
                        blessing_note_offset: 0,
                        show_admin_btn: true
                      });
                    }
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold border border-rose-200 px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Reset Card Defaults
                </button>
              </div>



              <div>
                {/* Customization Controls */}
                <div className="space-y-6">
                  <form onSubmit={handleSaveSettings} className="space-y-6">
                    {/* Card Hero Background Option */}
                    <div className="glass-card p-5 border-primary/20 bg-white/40 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                          <Play size={16} />
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-primary uppercase tracking-wider">
                            Card Hero Background Selection
                          </span>
                          <p className="text-[10px] text-wedding-text/60 mt-0.5">
                            Set a custom background image or background video for the main invitation card
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-wedding-text/70 mb-2">Background Type</label>
                          <select
                            value={settings.card_hero_bg_type || 'image'}
                            onChange={(e) => setSettings({ ...settings, card_hero_bg_type: e.target.value as any })}
                            className="w-full px-3 py-2 bg-white/60 border border-primary/25 rounded-xl text-xs focus:outline-none focus:border-primary/60"
                          >
                            <option value="image">Image (Default JPG/PNG)</option>
                            <option value="video">Video (MP4 Loop)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-wedding-text/70 mb-2">Background File URL</label>
                          <input
                            type="text"
                            value={settings.card_hero_bg_url || ''}
                            onChange={(e) => setSettings({ ...settings, card_hero_bg_url: e.target.value })}
                            placeholder="e.g. /traditional-card.png or https://..."
                            className="w-full px-3 py-2 bg-white/60 border border-primary/25 rounded-xl text-xs focus:outline-none focus:border-primary/60"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-primary/5 rounded-xl border border-primary/15 space-y-2">
                        <span className="block text-[10px] font-bold text-primary uppercase tracking-wider">
                          Upload Custom File
                        </span>
                        <p className="text-[9px] text-wedding-text/75 leading-relaxed">
                          Select an image or video file from your device to set as the invitation background.
                        </p>
                        <input
                          type="file"
                          accept={settings.card_hero_bg_type === 'video' ? 'video/*' : 'image/*'}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file && settings) {
                              try {
                                const url = await uploadAsset(file, 'card-backgrounds');
                                setSettings({ ...settings, card_hero_bg_url: url });
                              } catch (err) {
                                console.error(err);
                                alert('Failed to upload card background.');
                              }
                            }
                          }}
                          className="w-full text-xs text-wedding-text/70 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[9px] file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Admin Portal Button Toggle */}
                    <div className="glass-card p-5 border-primary/20 bg-white/40 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="block text-xs font-bold text-primary uppercase tracking-wider">
                          Visible Admin Portal Entrance
                        </span>
                        <p className="text-[10px] text-wedding-text/60 leading-relaxed max-w-[90%]">
                          Turn off to hide the "Admin Portal" button from the main invitation page. You can still access it using <code>?admin=true</code> in your URL.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSettings({
                            ...settings,
                            show_admin_btn: settings.show_admin_btn === false ? true : false
                          });
                        }}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none flex-shrink-0 cursor-pointer ${
                          settings.show_admin_btn !== false ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                            settings.show_admin_btn !== false ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Accordion list of text inputs and controls */}
                    {[
                      { key: 'invite_line1', label: 'Invite Line 1' },
                      { key: 'invite_line2', label: 'Invite Line 2' },
                      { key: 'bride_name', label: 'Bride Name' },
                      { key: 'bride_parents', label: 'Bride Parents Lineage' },
                      { key: 'groom_name', label: 'Groom Name' },
                      { key: 'groom_parents', label: 'Groom Parents Lineage' },
                      { key: 'venue_label', label: 'Venue Label' },
                      { key: 'blessing_note', label: 'Blessing Note' }
                    ].map((item) => {
                      const textKey = item.key as keyof WeddingSettings;
                      const fontKey = `${item.key}_font` as keyof WeddingSettings;

                      return (
                        <div key={item.key} className="glass-card p-5 border-primary/20 space-y-4 bg-white/30">
                          <span className="block text-xs font-bold text-primary uppercase tracking-wider">
                            {item.label}
                          </span>

                          <div className="grid md:grid-cols-2 gap-4">
                            {/* 1. Text input */}
                            <div className="md:col-span-2">
                              <label className="block text-[9px] uppercase tracking-wider text-wedding-text/60 mb-1.5 font-semibold">Text Content</label>
                              <input
                                type="text"
                                value={(settings[textKey] as string) || ''}
                                onChange={(e) => setSettings({ ...settings, [textKey]: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white/70 border border-primary/25 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition font-times"
                              />
                            </div>

                            {/* 2. Font selector */}
                            <div className="md:col-span-2">
                              <label className="block text-[9px] uppercase tracking-wider text-wedding-text/60 mb-1.5 font-semibold">Font Style</label>
                              <select
                                value={(settings[fontKey] as string) || ''}
                                onChange={(e) => setSettings({ ...settings, [fontKey]: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white/70 border border-primary/25 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition"
                              >
                                {settings.custom_font_base64 && (
                                  <option value="CustomUploadedFont">★ Custom Uploaded Font ({settings.custom_font_name || 'uploaded.ttf'})</option>
                                )}
                                <option value="Candlescript">Candlescript (Custom Script)</option>
                                <option value="'Times New Roman', Times, serif">Times New Roman (Classic Serif)</option>
                                <option value="Great Vibes">Great Vibes (Luxury Script)</option>
                                <option value="Playfair Display">Playfair Display (Serif)</option>
                                <option value="Poppins">Poppins (Sans-Serif)</option>
                                <option value="Georgia">Georgia (Book Serif)</option>
                                <option value="Cinzel">Cinzel (Royal Roman)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex justify-end pt-4 sticky bottom-4 z-10">
                      <button
                        type="submit"
                        className="btn-gold px-12 py-4 text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
                      >
                        <Save size={14} /> Save Card Styling & Text
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB: EVENT CARD TEMPLATES */}
          {activeTab === 'eventTemplates' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-wider uppercase text-primary">
                    Event Card Templates
                  </h2>
                  <p className="text-[10px] text-wedding-text/60 mt-1 uppercase tracking-wider">
                    Add, edit, or delete dynamic ceremony card events, upload background image/video files, and reorder (move) them
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditEvent({ event_name: '', event_date: 'Saturday\n14 Dec 2026', event_time: '', venue: '', message: '', background_image: '' })}
                  className="btn-gold px-5 py-2.5 text-[10px] font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={14} /> Add Event
                </button>
              </div>

              {/* Event Editor Form (conditional rendering) */}
              {editEvent && (
                <div className="grid lg:grid-cols-12 gap-8 items-start">
                  {/* Left: Input Form (7/12 cols) */}
                  <form onSubmit={handleSaveEvent} className="lg:col-span-7 glass-card p-6 border-primary/30 bg-primary/5 space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-primary border-b border-primary/10 pb-3 mb-4">
                      {editEvent.id ? 'Edit Event Details' : 'Create New Event'}
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-wedding-text/75 font-semibold mb-2">Event Name</label>
                        <input
                          type="text"
                          required
                          value={editEvent.event_name || ''}
                          onChange={(e) => setEditEvent({ ...editEvent, event_name: e.target.value })}
                          placeholder="e.g. Sangeet Ceremony"
                          className="w-full px-3 py-2.5 bg-white/70 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-wedding-text/75 font-semibold mb-2">One Line Message (Subtitle)</label>
                        <input
                          type="text"
                          value={editEvent.message || ''}
                          onChange={(e) => setEditEvent({ ...editEvent, message: e.target.value })}
                          placeholder="e.g. ✨ Join us as we celebrate love"
                          className="w-full px-3 py-2.5 bg-white/70 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-wedding-text/75 font-semibold mb-2">Event Date (Supports multi-line text)</label>
                        <textarea
                          rows={2}
                          required
                          value={editEvent.event_date || ''}
                          onChange={(e) => setEditEvent({ ...editEvent, event_date: e.target.value })}
                          placeholder="e.g. Saturday&#10;14 Dec 2026"
                          className="w-full px-3 py-2.5 bg-white/70 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition whitespace-pre-line"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-wedding-text/75 font-semibold mb-2">Event Time</label>
                        <input
                          type="text"
                          value={editEvent.event_time || ''}
                          onChange={(e) => setEditEvent({ ...editEvent, event_time: e.target.value })}
                          placeholder="e.g. 07:00 PM onwards"
                          className="w-full px-3 py-2.5 bg-white/70 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase tracking-wider text-wedding-text/75 font-semibold mb-2">Venue Description</label>
                        <textarea
                          rows={2}
                          value={editEvent.venue || ''}
                          onChange={(e) => setEditEvent({ ...editEvent, venue: e.target.value })}
                          placeholder="e.g. Grand Palace Hall A&#10;Jaipur, Rajasthan"
                          className="w-full px-3 py-2.5 bg-white/70 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition whitespace-pre-line"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase tracking-wider text-wedding-text/75 font-semibold mb-2">Google Maps Link</label>
                        <input
                          type="url"
                          value={editEvent.google_map_link || ''}
                          onChange={(e) => setEditEvent({ ...editEvent, google_map_link: e.target.value })}
                          placeholder="e.g. https://maps.google.com/..."
                          className="w-full px-3 py-2.5 bg-white/70 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-wedding-text/75 font-semibold mb-2">Event Background Banner Image/Video URL</label>
                          <input
                            type="text"
                            value={editEvent.background_image || ''}
                            onChange={(e) => setEditEvent({ ...editEvent, background_image: e.target.value })}
                            placeholder="e.g. /Haldi-bg.png or https://..."
                            className="w-full px-3 py-2.5 bg-white/70 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition mb-3"
                          />
                        </div>

                        {/* File Upload Button */}
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/15 space-y-2">
                          <span className="block text-[11px] font-bold text-primary uppercase tracking-wider">
                            Or: Upload Background Image or Video File
                          </span>
                          <p className="text-[10px] text-wedding-text/75 leading-relaxed">
                            Select an image or video file from your device to set as this card's background.
                          </p>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file && editEvent) {
                                try {
                                  const url = await uploadAsset(file, 'event-backgrounds');
                                  setEditEvent({ ...editEvent, background_image: url });
                                } catch (err) {
                                  console.error(err);
                                  alert('Failed to upload event background.');
                                }
                              }
                            }}
                            className="w-full text-xs text-wedding-text/70 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-primary/10">
                      <button
                        type="button"
                        onClick={() => setEditEvent(null)}
                        className="px-5 py-2.5 bg-white/50 border border-primary/20 text-xs font-semibold rounded-full hover:bg-white transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-gold px-6 py-2.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check size={14} /> Save Event
                      </button>
                    </div>
                  </form>

                  {/* Right: Live Preview Mockup (5/12 cols) */}
                  <div className="lg:col-span-5 flex flex-col items-center">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
                      Live Mobile Preview
                    </h3>

                    {/* Card Mockup Frame */}
                    <div 
                      className="w-full max-w-[280px] aspect-[9/16] relative rounded-[24px] overflow-hidden shadow-2xl border-4 border-amber-800/10 bg-[#FAF6EA] select-none @container"
                    >
                      {/* Background Image or Video */}
                      {editEvent.background_image && ((editEvent.background_image.endsWith('.mp4') || editEvent.background_image.endsWith('.webm') || editEvent.background_image.startsWith('data:video/')) ? (
                        <video
                          src={editEvent.background_image}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
                        />
                      ) : (
                        <img
                          src={editEvent.background_image}
                          alt="preview background"
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
                        />
                      ))}

                      {/* Cream box container overlay */}
                      <div className="absolute inset-0 z-10 flex flex-col justify-start items-center p-[6%] pt-[16%] pointer-events-none select-none">
                        <div className="w-full bg-[#FAF6EA]/92 border border-[#D4AF37]/45 rounded-[22px] shadow-lg flex flex-col justify-center items-center text-center px-[8%] py-[10%] gap-[4%] pointer-events-none">
                          {/* Event Name */}
                          <div className="w-full">
                            <h4 
                              style={{ 
                                fontFamily: "'Cinzel', 'Playfair Display', serif", 
                                color: '#B27F4C', 
                                fontSize: (editEvent.event_name || '').length > 20 ? '4cqw' : (editEvent.event_name || '').length > 12 ? '4.8cqw' : '5.5cqw' 
                              }} 
                              className="font-bold tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)] uppercase leading-snug"
                            >
                              {editEvent.event_name || 'EVENT NAME'}
                            </h4>
                          </div>

                          {/* Gold divider line */}
                          <div className="h-[1px] w-8 bg-[#D4AF37]/50" />

                          {/* One Line Message */}
                          <div className="w-full">
                            <p 
                              style={{ 
                                fontFamily: "'Great Vibes', 'Candlescript', cursive", 
                                color: '#5c3a21', 
                                fontSize: '3.6cqw' 
                              }} 
                              className="leading-relaxed font-light"
                            >
                              {editEvent.message || 'One Line Message Subtitle'}
                            </p>
                          </div>

                          {/* Date */}
                          <div className="w-full">
                            <p 
                              style={{ 
                                fontFamily: "'Cinzel', 'Playfair Display', serif", 
                                color: '#5c3a21', 
                                fontSize: '3cqw' 
                              }} 
                              className="tracking-wider uppercase font-semibold leading-normal whitespace-pre-line"
                            >
                              {editEvent.event_date || 'SUNDAY\nDEC 15, 2026'}
                            </p>
                          </div>

                          {/* Time */}
                          <div className="w-full">
                            <p 
                              style={{ 
                                fontFamily: "'Cinzel', 'Playfair Display', serif", 
                                color: '#B27F4C', 
                                fontSize: '2.8cqw' 
                              }} 
                              className="tracking-[0.1em] font-medium"
                            >
                              {editEvent.event_time || '07:00 PM'}
                            </p>
                          </div>

                          {/* Venue */}
                          <div className="w-full">
                            <p 
                              style={{ 
                                fontFamily: "'Cinzel', 'Playfair Display', serif", 
                                color: '#5c3a21', 
                                fontSize: '2.5cqw' 
                              }} 
                              className="tracking-wider font-light uppercase leading-snug whitespace-pre-line"
                            >
                              {editEvent.venue || 'Venue Address Description'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[9px] text-wedding-text/50 uppercase tracking-widest mt-3">
                      Aspect Ratio 9:16 (1080 × 1920)
                    </p>
                  </div>
                </div>
              )}

              {/* Event Cards list */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Ceremony Cards List
                </h3>
                {[...events].sort((a, b) => a.sort_order - b.sort_order).map((event, index) => (
                  <div key={event.id} className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition">
                    <div className="flex items-center gap-4">
                      {/* Sort Order Badges */}
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs">{event.sort_order}</span>
                      
                      {event.background_image && (
                        (event.background_image.endsWith('.mp4') || event.background_image.endsWith('.webm') || event.background_image.startsWith('data:video/')) ? (
                          <video 
                            src={event.background_image} 
                            className="w-12 h-16 rounded object-cover border border-primary/10 hidden sm:block pointer-events-none"
                            muted
                          />
                        ) : (
                          <img 
                            src={event.background_image} 
                            alt={event.event_name} 
                            className="w-12 h-16 rounded object-cover border border-primary/10 hidden sm:block"
                          />
                        )
                      )}

                      <div>
                        <h4 className="font-semibold text-sm">{event.event_name}</h4>
                        {event.message && <p className="text-[10px] text-primary italic font-light font-poppins">{event.message}</p>}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[10px] text-wedding-text/60 font-poppins">
                          <span className="flex items-center gap-1"><Calendar size={10} /> {event.event_date}</span>
                          <span className="flex items-center gap-1"><Clock size={10} /> {event.event_time}</span>
                          <span className="flex items-center gap-1"><MapPin size={10} /> {event.venue}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sorting & Edit Tools */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <button
                        onClick={() => handleMoveEvent(index, 'up')}
                        disabled={index === 0}
                        className="p-2 border border-primary/20 rounded-xl hover:bg-white text-wedding-text disabled:opacity-40 cursor-pointer"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => handleMoveEvent(index, 'down')}
                        disabled={index === events.length - 1}
                        className="p-2 border border-primary/20 rounded-xl hover:bg-white text-wedding-text disabled:opacity-40 cursor-pointer"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        onClick={() => setEditEvent(event)}
                        className="p-2 border border-primary/20 rounded-xl hover:bg-white text-amber-700 cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 border border-rose-200 rounded-xl hover:bg-rose-50 text-rose-600 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: THEME CUSTOMIZER */}
          {activeTab === 'theme' && settings && (
            <form onSubmit={handleSaveSettings} className="space-y-8 animate-fade-in">
              <h2 className="text-xl font-semibold tracking-wider uppercase text-primary border-b border-primary/10 pb-4">
                Theme Configurations & Customizer
              </h2>

              <div className="grid md:grid-cols-3 gap-8">
                {/* 1. Theme Color Selectors */}
                <div className="glass-card p-6 border-primary/20 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 flex items-center gap-1.5"><Layout size={14} /> Color System</h3>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-wedding-text/70 mb-2">Primary Color (Gold/Accents)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.theme_primary}
                        onChange={(e) => setSettings({ ...settings, theme_primary: e.target.value })}
                        className="w-12 h-10 border border-primary/10 rounded-lg cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={settings.theme_primary}
                        onChange={(e) => setSettings({ ...settings, theme_primary: e.target.value })}
                        className="w-24 px-2 py-1.5 bg-white/50 border border-primary/25 rounded-md text-[10px] uppercase font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-wedding-text/70 mb-2">Secondary Color (Cream/Cards)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.theme_secondary}
                        onChange={(e) => setSettings({ ...settings, theme_secondary: e.target.value })}
                        className="w-12 h-10 border border-primary/10 rounded-lg cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={settings.theme_secondary}
                        onChange={(e) => setSettings({ ...settings, theme_secondary: e.target.value })}
                        className="w-24 px-2 py-1.5 bg-white/50 border border-primary/25 rounded-md text-[10px] uppercase font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-wedding-text/70 mb-2">Background Color (Ivory/Bgs)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.theme_background}
                        onChange={(e) => setSettings({ ...settings, theme_background: e.target.value })}
                        className="w-12 h-10 border border-primary/10 rounded-lg cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={settings.theme_background}
                        onChange={(e) => setSettings({ ...settings, theme_background: e.target.value })}
                        className="w-24 px-2 py-1.5 bg-white/50 border border-primary/25 rounded-md text-[10px] uppercase font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Typography Selectors */}
                <div className="glass-card p-6 border-primary/20 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 flex items-center gap-1.5"><Layout size={14} /> Typography</h3>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-wedding-text/70 mb-2">Heading Font Preset</label>
                    <select
                      value={settings.font_heading}
                      onChange={(e) => setSettings({ ...settings, font_heading: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white/50 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition"
                    >
                      {settings.custom_font_base64 && (
                        <option value="CustomUploadedFont">★ Custom Uploaded Font ({settings.custom_font_name || 'uploaded.ttf'})</option>
                      )}
                      <option value="Candlescript">Candlescript (Classic Script)</option>
                      <option value="Great Vibes">Great Vibes (Luxurious Cursive)</option>
                      <option value="Playfair Display">Playfair Display (Elegant Serif)</option>
                      <option value="Cinzel">Cinzel (Roman Serif)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-wedding-text/70 mb-2">Body Font Preset</label>
                    <select
                      value={settings.font_body}
                      onChange={(e) => setSettings({ ...settings, font_body: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white/50 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition"
                    >
                      {settings.custom_font_base64 && (
                        <option value="CustomUploadedFont">★ Custom Uploaded Font ({settings.custom_font_name || 'uploaded.ttf'})</option>
                      )}
                      <option value="Poppins">Poppins (Clean Sans-Serif)</option>
                      <option value="Inter">Inter (Neutral Modern)</option>
                      <option value="Lora">Lora (Elegant Editorial Serif)</option>
                    </select>
                  </div>

                  {/* Custom Font Upload section under Typography block */}
                  <div className="pt-4 border-t border-primary/10 space-y-3">
                    <span className="block text-[10px] font-bold text-primary uppercase tracking-wider">
                      Custom Uploaded Font File
                    </span>
                    <input
                      type="file"
                      accept=".ttf,.otf,.woff,.woff2"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file && settings) {
                          try {
                            const url = await uploadAsset(file, 'fonts');
                            const updated = {
                              ...settings,
                              custom_font_base64: url,
                              custom_font_name: file.name
                            };
                            setSettings(updated);
                            await databaseService.updateSettings(updated);
                          } catch (err) {
                            console.error(err);
                            alert('Failed to upload font.');
                          }
                        }
                      }}
                      className="w-full text-[10px] text-wedding-text/70 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[9px] file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer"
                    />
                    
                    {settings.custom_font_base64 ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-800 text-[9px] font-medium mt-2">
                        <span className="flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                          <span className="truncate">{settings.custom_font_name || 'custom_font'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = {
                              ...settings,
                              custom_font_base64: '',
                              custom_font_name: ''
                            };
                            setSettings(updated);
                            try {
                              await databaseService.updateSettings(updated);
                              alert('Custom font removed successfully.');
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="text-rose-500 hover:text-rose-700 font-bold uppercase tracking-wider text-[8px] cursor-pointer ml-2 flex-shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-[9px] text-wedding-text/50 italic py-1">
                        No custom font uploaded yet
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Toggles & Premium Effects */}
                <div className="glass-card p-6 border-primary/20 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 flex items-center gap-1.5"><Music size={14} /> Interactive Effects</h3>

                  <div className="flex items-center justify-between p-2 hover:bg-primary/5 rounded-lg transition">
                    <div>
                      <span className="block text-xs font-semibold">Falling Leaves Particle System</span>
                      <span className="text-[10px] text-wedding-text/60">Simulate drifting leaves and gold dust</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enable_leaves}
                      onChange={(e) => setSettings({ ...settings, enable_leaves: e.target.checked })}
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 hover:bg-primary/5 rounded-lg transition">
                    <div>
                      <span className="block text-xs font-semibold">Background Music Stream</span>
                      <span className="text-[10px] text-wedding-text/60">Toggle site-wide audio engine</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enable_music}
                      onChange={(e) => setSettings({ ...settings, enable_music: e.target.checked })}
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                  </div>

                  {/* Background Music Configuration */}
                  <div className="pt-4 border-t border-primary/10 space-y-3">
                    <span className="block text-[10px] font-bold text-primary uppercase tracking-wider">
                      Background Audio Stream (MP3)
                    </span>
                    <p className="text-[9px] text-wedding-text/75 leading-relaxed">
                      Upload an MP3 track that plays automatically when guests enter the invitation.
                    </p>
                    <input
                      type="file"
                      accept="audio/mp3,audio/*"
                      onChange={async (e) => {
                        const plan = activeWebsiteDetails?.plan || 'starter';
                        const planConfig = planFeatures[plan];
                        const enableMusic = planConfig ? planConfig.enable_music : (plan !== 'starter');
                        if (!enableMusic) {
                          alert(`Custom background music uploads are locked on your current plan. Please upgrade to a plan that includes custom audio files.`);
                          e.target.value = '';
                          return;
                        }
                        const file = e.target.files?.[0];
                        if (file && settings) {
                          try {
                            const url = await uploadAsset(file, 'music');
                            const updated: WeddingSettings = { ...settings, music_url: url };
                            setSettings(updated);
                            await databaseService.updateSettings(updated);
                            alert('Audio file uploaded and saved successfully!');
                          } catch (err) {
                            console.error(err);
                            alert('Failed to upload audio file.');
                          }
                        }
                      }}
                      className="w-full text-[10px] text-wedding-text/70 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[9px] file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer"
                    />
                    
                    {settings.music_url ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-800 text-[9px] font-medium mt-2">
                        <span className="truncate">Active Audio Track Linked</span>
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = { ...settings, music_url: '' };
                            setSettings(updated);
                            await databaseService.updateSettings(updated);
                            alert('Music track removed.');
                          }}
                          className="text-rose-500 hover:text-rose-700 font-bold uppercase tracking-wider text-[8px] cursor-pointer ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-[9px] text-wedding-text/50 italic py-1">
                        No audio track uploaded yet
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-2 hover:bg-primary/5 rounded-lg transition">
                    <div>
                      <span className="block text-xs font-semibold">CSS Scroll Animations</span>
                      <span className="text-[10px] text-wedding-text/60">Toggles scrolling reveal fades</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enable_animations}
                      onChange={(e) => setSettings({ ...settings, enable_animations: e.target.checked })}
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="btn-gold px-8 py-3.5 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Save size={14} /> Save Theme Settings
                </button>
              </div>
            </form>
          )}


          {/* TAB 5: MANAGE GALLERY */}
          {activeTab === 'gallery' && (
            <div className="space-y-8 animate-fade-in">
              <h2 className="text-xl font-semibold tracking-wider uppercase text-primary border-b border-primary/10 pb-4">
                Manage Couple Gallery
              </h2>

              {/* Add image form */}
              <form onSubmit={handleAddGalleryImage} className="glass-card p-6 border-primary/30 flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-[10px] uppercase tracking-wider text-wedding-text/75 font-semibold mb-2">New Image URL</label>
                  <input
                    type="url"
                    required
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    placeholder="Paste an Unsplash or direct image URL (e.g. https://images.unsplash.com/...)"
                    className="w-full px-4 py-3 bg-white/70 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary/60 transition"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-gold px-6 py-3.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Plus size={14} /> Add Image
                </button>
              </form>

              {/* Grid items */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {gallery.map((item) => (
                  <div key={item.id} className="relative group aspect-[4/5] rounded-xl overflow-hidden border border-primary/10 bg-white/50 flex items-center justify-center">
                    <img 
                      src={item.image_url} 
                      alt="Gallery" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <button
                        onClick={() => handleDeleteGalleryImage(item.id)}
                        className="p-3 bg-white/90 text-rose-600 rounded-full hover:bg-white hover:scale-105 transition cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


        </main>
      </div>
    </div>
  );
};

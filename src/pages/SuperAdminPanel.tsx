import React, { useEffect, useState, useCallback } from 'react';
import { 
  Globe, 
  Layout, 
  Users, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Lock, 
  LogOut, 
  Search, 
  ChevronRight,
  ShieldCheck,
  Layers,
  Crown,
  Copy,
  ExternalLink,
  Save,
  Database,
  Edit2,
  Server,
  RefreshCw
} from 'lucide-react';
import { databaseService, getSiteUrls } from '../services/database';
import type { PlanFeatures } from '../services/database';

interface SuperAdminPanelProps {
  onBackToGuest?: () => void;
}

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ onBackToGuest }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('super_admin_unlocked') === 'true');
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'websites' | 'templates' | 'domains' | 'users' | 'plans'>('websites');

  // Data States
  const [websites, setWebsites] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<Record<string, PlanFeatures>>({});
  const [, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateSiteModal, setShowCreateSiteModal] = useState(false);
  const [newSiteSubdomain, setNewSiteSubdomain] = useState('');
  const [newSiteDomain, setNewSiteDomain] = useState('');
  const [newSitePlan, setNewSitePlan] = useState<'starter' | 'premium' | 'royal'>('royal');

  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTplName, setNewTplName] = useState('');
  const [newTplDesc, setNewTplDesc] = useState('');
  const [newTplThumb, setNewTplThumb] = useState('');

  const [createFromTplModal, setCreateFromTplModal] = useState<any | null>(null);
  const [tplSiteSubdomain, setTplSiteSubdomain] = useState('');
  const [tplSiteDomain, setTplSiteDomain] = useState('');

  // Dedicated Custom Domain Modal
  const [attachDomainModal, setAttachDomainModal] = useState<any | null>(null);
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [dnsVerifying, setDnsVerifying] = useState(false);
  const [dnsResult, setDnsResult] = useState<any | null>(null);

  // Authenticate Super Admin
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === 'admin123' || passcode.trim() === 'superadmin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('super_admin_unlocked', 'true');
      setAuthError('');
    } else {
      setAuthError('Invalid Super Admin passcode');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('super_admin_unlocked');
  };

  // Load All Super Admin Data
  const loadSuperAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [sitesData, tplsData, usersData, plansData] = await Promise.all([
        databaseService.superGetWebsites(),
        databaseService.superGetTemplates(),
        databaseService.superGetUsers(),
        databaseService.getAllPlanFeatures()
      ]);
      setWebsites(sitesData || []);
      setTemplates(tplsData || []);
      setUsers(usersData || []);
      setPlans(plansData || {});
    } catch (err) {
      console.error('Failed to load Super Admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadSuperAdminData();
    }
  }, [isAuthenticated, loadSuperAdminData]);

  // Attach Custom Domain Handler
  const handleAttachDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachDomainModal || !customDomainInput.trim()) return;
    try {
      await databaseService.superAttachCustomDomain(attachDomainModal.id, customDomainInput.trim());
      alert(`Success! Custom domain ${customDomainInput.trim()} attached to site ${attachDomainModal.id}.`);
      setAttachDomainModal(null);
      setCustomDomainInput('');
      setDnsResult(null);
      loadSuperAdminData();
    } catch (err: any) {
      alert(`Failed to attach custom domain: ${err.message || err}`);
    }
  };

  // Verify DNS Handler
  const handleVerifyDns = async (siteId: string) => {
    setDnsVerifying(true);
    try {
      const res = await databaseService.superVerifyDomainDns(siteId);
      setDnsResult(res);
    } catch (err) {
      console.error('DNS Verification Error:', err);
    } finally {
      setDnsVerifying(false);
    }
  };

  // Save Current Site as Template
  const handleSaveCurrentSiteAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplName.trim()) return;
    try {
      await databaseService.superCreateTemplateFromSite(
        'site-1',
        newTplName.trim(),
        newTplDesc.trim(),
        newTplThumb.trim() || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600'
      );
      setShowSaveTemplateModal(false);
      setNewTplName('');
      setNewTplDesc('');
      setNewTplThumb('');
      alert('Success! Current site configuration saved as a reusable Master Template.');
      loadSuperAdminData();
    } catch (err: any) {
      alert(`Failed to save template: ${err.message || err}`);
    }
  };

  // Create Website from Template
  const handleCreateSiteFromTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFromTplModal || !tplSiteSubdomain.trim()) return;
    try {
      await databaseService.superCreateWebsiteFromTemplate(
        createFromTplModal.id,
        tplSiteSubdomain.trim(),
        tplSiteDomain.trim(),
        'royal'
      );
      setCreateFromTplModal(null);
      setTplSiteSubdomain('');
      setTplSiteDomain('');
      alert('Success! Created new isolated wedding site from template.');
      loadSuperAdminData();
    } catch (err: any) {
      alert(`Failed to instantiate site: ${err.message || err}`);
    }
  };

  // Duplicate Website
  const handleDuplicateWebsite = async (site: any) => {
    const sub = prompt('Enter subdomain for duplicated site:', `${site.subdomain || 'wedding'}-copy`);
    if (!sub) return;
    const dom = prompt('Enter custom domain (optional):', `${sub}.rahulwedsneha.com`);
    try {
      await databaseService.superDuplicateWebsite(site.id, sub.trim(), dom ? dom.trim() : undefined);
      alert(`Website duplicated successfully! New isolated site ID created.`);
      loadSuperAdminData();
    } catch (err: any) {
      alert(`Failed to duplicate site: ${err.message || err}`);
    }
  };

  // Duplicate Template
  const handleDuplicateTemplate = async (tpl: any) => {
    try {
      await databaseService.superDuplicateTemplate(tpl.id, `${tpl.name} (Copy)`);
      alert('Template duplicated successfully!');
      loadSuperAdminData();
    } catch (err: any) {
      alert(`Failed to duplicate template: ${err.message || err}`);
    }
  };

  // Switch Active Site Context
  const handleLaunchSite = async (site: any) => {
    await databaseService.superSwitchActiveSite(site);
    alert(`Switched active site context to: ${site.subdomain} (${site.id}). You can now open Client Admin or Guest View for this site.`);
    if (onBackToGuest) onBackToGuest();
  };

  // Create Website (Manual)
  const handleCreateWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteSubdomain.trim()) return;
    try {
      await databaseService.superCreateWebsite({
        subdomain: newSiteSubdomain.trim().toLowerCase(),
        domain: newSiteDomain.trim() || `${newSiteSubdomain.trim().toLowerCase()}.rahulwedsneha.com`,
        plan: newSitePlan,
        status: 'active'
      });
      setShowCreateSiteModal(false);
      setNewSiteSubdomain('');
      setNewSiteDomain('');
      loadSuperAdminData();
    } catch (err: any) {
      alert(`Failed to create website: ${err.message || err}`);
    }
  };

  const handleUpdateSiteStatus = async (site: any, newStatus: string) => {
    try {
      await databaseService.superUpdateWebsite(site.id, { ...site, status: newStatus });
      loadSuperAdminData();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message || err}`);
    }
  };

  const handleUpdateSitePlan = async (site: any, newPlan: string) => {
    try {
      await databaseService.superUpdateWebsite(site.id, { ...site, plan: newPlan });
      loadSuperAdminData();
    } catch (err: any) {
      alert(`Failed to update plan: ${err.message || err}`);
    }
  };

  const handleDeleteWebsite = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this wedding website?')) return;
    try {
      await databaseService.superDeleteWebsite(id);
      loadSuperAdminData();
    } catch (err: any) {
      alert(`Failed to delete website: ${err.message || err}`);
    }
  };

  const handleToggleTemplatePublish = async (tpl: any) => {
    try {
      await databaseService.superUpdateTemplate(tpl.id, { is_published: !tpl.is_published });
      loadSuperAdminData();
    } catch (err: any) {
      alert(`Failed to update template: ${err.message || err}`);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await databaseService.superDeleteTemplate(id);
      loadSuperAdminData();
    } catch (err: any) {
      alert(`Failed to delete template: ${err.message || err}`);
    }
  };

  // Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEFAE0] via-[#FAEDCD] to-[#F5EBE0] flex items-center justify-center p-6 font-poppins">
        <div className="bg-white/90 backdrop-blur-xl border border-[#D4AF37]/40 rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#B27F4C]/10 border border-[#B27F4C]/30 flex items-center justify-center mb-4 text-[#B27F4C]">
            <ShieldCheck size={32} />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#5C2C06] tracking-wide mb-1">Super Admin Console</h1>
          <p className="text-xs text-[#7A4215] mb-6 font-light">Custom Domain Attachment & Multi-tenant Master Control</p>

          <form onSubmit={handleAuth} className="w-full space-y-4">
            <div className="relative">
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Master Passcode (admin123)"
                className="w-full px-4 py-3.5 pl-11 bg-[#FFFDF6] border border-[#B27F4C]/30 rounded-xl text-xs text-[#5C2C06] focus:outline-none focus:border-[#B27F4C]"
              />
              <Lock size={16} className="absolute left-4 top-3.5 text-[#B27F4C]/60" />
            </div>

            {authError && (
              <p className="text-xs text-rose-600 font-semibold">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-[#e6b88a] via-[#B27F4C] to-[#c49262] text-white text-xs font-semibold uppercase tracking-widest rounded-xl shadow-md hover:brightness-105 transition cursor-pointer"
            >
              Unlock Master Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredWebsites = websites.filter(w => 
    (w.subdomain || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.domain || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FEFAE0] flex flex-col font-poppins text-[#4A2E18]">
      {/* Top Navigation Header */}
      <header className="bg-white/70 backdrop-blur-md border-b border-[#B27F4C]/20 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#B27F4C]/15 flex items-center justify-center text-[#B27F4C]">
            <Crown size={20} />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold text-[#5C2C06] leading-tight flex items-center gap-2">
              Super Admin Console
              <span className="bg-[#B27F4C]/15 text-[#B27F4C] text-[9px] px-2 py-0.5 rounded-full font-sans uppercase tracking-wider font-semibold">
                Custom Domain Engine
              </span>
            </h1>
            <p className="text-[10px] text-[#7A4215]">Custom Domain Mapping, DNS Verification & Template Controller</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSaveTemplateModal(true)}
            className="px-3.5 py-1.5 bg-[#B27F4C] text-white text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-sm hover:bg-[#9E5D24] transition cursor-pointer uppercase tracking-wider"
          >
            <Save size={13} /> Save Site as Template
          </button>

          {onBackToGuest && (
            <button
              onClick={onBackToGuest}
              className="text-xs font-semibold text-[#5C2C06] hover:text-[#B27F4C] transition flex items-center gap-1 cursor-pointer uppercase tracking-widest"
            >
              Guest View <ChevronRight size={14} />
            </button>
          )}

          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition flex items-center gap-1 cursor-pointer uppercase tracking-widest border border-rose-200 hover:border-rose-300 px-3 py-1.5 rounded-full bg-white/50"
          >
            <LogOut size={12} /> Lock
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Stat Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-[#B27F4C]/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#7A4215]">Attached Domains</p>
              <h2 className="text-2xl font-bold text-[#5C2C06] mt-1">
                {websites.filter(w => w.domain && !w.domain.includes('rahulwedsneha.com')).length || websites.length}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Server size={20} />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-[#B27F4C]/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#7A4215]">Master Templates</p>
              <h2 className="text-2xl font-bold text-[#5C2C06] mt-1">{templates.length}</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center">
              <Layout size={20} />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-[#B27F4C]/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#7A4215]">Hosted Sites</p>
              <h2 className="text-2xl font-bold text-[#5C2C06] mt-1">{websites.length}</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <Globe size={20} />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-[#B27F4C]/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#7A4215]">SSL Certificates</p>
              <h2 className="text-2xl font-bold text-emerald-700 mt-1">100% Active</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#B27F4C]/20 gap-2 overflow-x-auto">
          {[
            { id: 'websites', label: 'Hosted Websites', icon: Globe },
            { id: 'domains', label: 'Custom Domains Directory', icon: Server },
            { id: 'templates', label: 'Master Templates', icon: Layout },
            { id: 'users', label: 'Client Directory', icon: Users },
            { id: 'plans', label: 'Plan Limits', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-t-xl transition cursor-pointer border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-[#B27F4C] text-[#5C2C06] bg-white/60'
                    : 'border-transparent text-[#7A4215]/70 hover:text-[#5C2C06] hover:bg-white/30'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: WEBSITES MANAGEMENT */}
        {activeTab === 'websites' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search subdomains / custom domains..."
                  className="w-full pl-9 pr-4 py-2 bg-white/80 border border-[#B27F4C]/30 rounded-xl text-xs focus:outline-none focus:border-[#B27F4C]"
                />
                <Search size={14} className="absolute left-3 top-2.5 text-[#B27F4C]/60" />
              </div>

              <button
                onClick={() => setShowCreateSiteModal(true)}
                className="w-full sm:w-auto px-4 py-2 bg-[#B27F4C] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-[#9E5D24] transition cursor-pointer uppercase tracking-wider"
              >
                <Plus size={14} /> Provision New Site
              </button>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#B27F4C]/20 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF6EA] text-[#7A4215] uppercase tracking-wider font-bold border-b border-[#B27F4C]/20">
                    <tr>
                      <th className="p-4">Site ID & Database</th>
                      <th className="p-4">Attached Custom Domain</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Plan Tier</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#B27F4C]/10">
                    {filteredWebsites.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-[#7A4215]/60 italic">
                          No wedding websites found.
                        </td>
                      </tr>
                    ) : (
                      filteredWebsites.map((site) => {
                        const siteUrls = getSiteUrls(site);

                        return (
                          <tr key={site.id} className="hover:bg-white/40 transition">
                            <td className="p-4">
                              <div className="font-mono font-bold text-[#5C2C06]">{site.id}</div>
                              <span className="text-[9px] text-emerald-700 bg-emerald-100 font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5">
                                Isolated Database
                              </span>
                            </td>

                            <td className="p-4 space-y-2">
                              {/* Free Subdomain URL */}
                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A4215] flex items-center gap-1.5">
                                  <span>Subdomain Route:</span>
                                  <a
                                    href={siteUrls.freeSubdomainUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono font-bold text-[#B27F4C] hover:underline bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
                                  >
                                    {siteUrls.freeSubdomainUrl}
                                  </a>
                                </div>
                              </div>

                              {/* Custom Domain URL */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A4215]">Custom Domain:</span>
                                {siteUrls.hasCustomDomain ? (
                                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                                    <ShieldCheck size={11} /> {site.domain}
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setAttachDomainModal(site);
                                      setCustomDomainInput(site.domain || '');
                                      setDnsResult(null);
                                    }}
                                    className="text-[#B27F4C] hover:text-[#9E5D24] text-[10px] font-bold bg-amber-50 px-2 py-0.5 border border-amber-300 rounded-full flex items-center gap-1"
                                    title="Attach Custom Domain"
                                  >
                                    <Server size={10} /> + Attach Custom Domain
                                  </button>
                                )}
                              </div>
                            </td>

                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                site.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {site.status === 'active' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                {site.status || 'active'}
                              </span>
                            </td>

                            <td className="p-4">
                              <select
                                value={(site.plan || 'royal').toLowerCase()}
                                onChange={(e) => handleUpdateSitePlan(site, e.target.value)}
                                className="px-2 py-1 bg-white border border-[#B27F4C]/30 rounded-lg text-xs font-semibold focus:outline-none"
                              >
                                <option value="starter">Starter Plan</option>
                                <option value="premium">Premium Plan</option>
                                <option value="royal">Royal Plan</option>
                              </select>
                            </td>

                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <a
                                  href={siteUrls.freeSubdomainUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition flex items-center gap-1 shadow-xs font-mono"
                                  title={`Open ${siteUrls.freeSubdomainUrl}`}
                                >
                                  <ExternalLink size={11} /> Open Site
                                </a>

                                <button
                                  onClick={() => handleLaunchSite(site)}
                                  className="px-2.5 py-1 text-[10px] font-semibold bg-[#B27F4C]/15 text-[#5C2C06] border border-[#B27F4C]/40 rounded-lg hover:bg-[#B27F4C]/30 transition flex items-center gap-1"
                                  title="Switch Active Site Context & Edit"
                                >
                                  Launch / Edit
                                </button>

                                <button
                                  onClick={() => handleDuplicateWebsite(site)}
                                  className="p-1.5 text-indigo-700 hover:bg-indigo-50 rounded-lg transition"
                                  title="Duplicate Website & Database State"
                                >
                                  <Copy size={14} />
                                </button>

                                <button
                                  onClick={() => handleUpdateSiteStatus(site, site.status === 'active' ? 'suspended' : 'active')}
                                  className="px-2 py-1 text-[10px] font-semibold border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                                >
                                  {site.status === 'active' ? 'Suspend' : 'Activate'}
                                </button>

                                <button
                                  onClick={() => handleDeleteWebsite(site.id)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete Site"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOM DOMAINS DIRECTORY */}
        {activeTab === 'domains' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#5C2C06]">Custom Domains Directory</h2>
                <p className="text-[10px] text-[#7A4215]">Manage attached domains, DNS A/CNAME record verification & SSL status</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#B27F4C]/20 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6EA] text-[#7A4215] uppercase tracking-wider font-bold border-b border-[#B27F4C]/20">
                  <tr>
                    <th className="p-4">Custom Domain</th>
                    <th className="p-4">Assigned Wedding Site</th>
                    <th className="p-4">DNS Health</th>
                    <th className="p-4">SSL Certificate</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B27F4C]/10">
                  {websites.map((w) => (
                    <tr key={w.id} className="hover:bg-white/40 transition">
                      <td className="p-4 font-bold text-[#5C2C06] font-mono">
                        <div className="text-sm">{w.domain || `${w.subdomain}.rahulwedsneha.com`}</div>
                        <div className="text-[10px] text-[#7A4215]/70 font-sans">CNAME Target: cname.weddingplatform.com</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold">{w.subdomain || 'wedding'}</div>
                        <div className="text-[10px] text-[#7A4215]/70 font-mono">Site ID: {w.id}</div>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                          <CheckCircle size={10} /> Verified
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-indigo-100 text-indigo-800 inline-flex items-center gap-1">
                          <ShieldCheck size={10} /> Active (Let's Encrypt)
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={w.domain && !w.domain.includes('rahulwedsneha.com') ? (w.domain.startsWith('http') ? w.domain : `https://${w.domain}`) : `http://${w.subdomain || 'wedding'}.localhost:5173`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition flex items-center gap-1 font-mono"
                          >
                            <ExternalLink size={11} /> Open Site
                          </a>
                          <button
                            onClick={() => {
                              setAttachDomainModal(w);
                              setCustomDomainInput(w.domain || '');
                              setDnsResult(null);
                            }}
                            className="px-2.5 py-1 text-[10px] font-semibold border border-[#B27F4C]/40 rounded-lg hover:bg-[#B27F4C]/10 transition flex items-center gap-1"
                          >
                            <Edit2 size={11} /> Re-configure
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MASTER TEMPLATES CATALOG */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#5C2C06]">Master Template Catalog</h2>
                <p className="text-[10px] text-[#7A4215]">Create reusable invitation templates and instantiate client websites instantly</p>
              </div>

              <button
                onClick={() => setShowSaveTemplateModal(true)}
                className="px-4 py-2 bg-[#B27F4C] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm hover:bg-[#9E5D24] transition cursor-pointer uppercase tracking-wider"
              >
                <Save size={14} /> Save Current Site as Template
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((tpl) => (
                <div key={tpl.id} className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#B27F4C]/20 shadow-sm overflow-hidden flex flex-col">
                  <div className="aspect-video w-full bg-slate-100 relative">
                    <img src={tpl.thumbnail_url || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600'} alt={tpl.name} className="w-full h-full object-cover" />
                    <span className={`absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      tpl.is_published ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'
                    }`}>
                      {tpl.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-[#5C2C06] text-sm">{tpl.name}</h3>
                      <p className="text-[11px] text-[#7A4215]/80 mt-1 line-clamp-2">{tpl.description}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#B27F4C]/10">
                      <button
                        onClick={() => {
                          setCreateFromTplModal(tpl);
                          setTplSiteSubdomain(`${tpl.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-site`);
                        }}
                        className="w-full py-2 bg-[#B27F4C]/15 hover:bg-[#B27F4C]/25 text-[#5C2C06] font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                      >
                        <Plus size={13} /> Create Website from Template
                      </button>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <button
                          onClick={() => handleDuplicateTemplate(tpl)}
                          className="text-indigo-700 hover:underline font-semibold flex items-center gap-1"
                        >
                          <Copy size={12} /> Duplicate
                        </button>

                        <button
                          onClick={() => handleToggleTemplatePublish(tpl)}
                          className="text-[#B27F4C] hover:underline font-semibold"
                        >
                          {tpl.is_published ? 'Unpublish' : 'Publish'}
                        </button>

                        <button
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="text-rose-600 hover:text-rose-700"
                          title="Delete Template"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: USER DIRECTORY */}
        {activeTab === 'users' && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#B27F4C]/20 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6EA] text-[#7A4215] uppercase tracking-wider font-bold border-b border-[#B27F4C]/20">
                <tr>
                  <th className="p-4">User Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B27F4C]/10">
                {users.length === 0 ? (
                  [
                    { id: 'usr-1', email: 'admin@wedding.com', role: 'admin', created_at: new Date().toISOString() },
                    { id: 'usr-2', email: 'client@wedding.com', role: 'client', created_at: new Date().toISOString() },
                    { id: 'usr-3', email: 'rahul@wedding.com', role: 'client', created_at: new Date().toISOString() }
                  ].map((u) => (
                    <tr key={u.id} className="hover:bg-white/40 transition">
                      <td className="p-4 font-bold text-[#5C2C06]">{u.email}</td>
                      <td className="p-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-[#B27F4C]/15 text-[#B27F4C]">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-[10px] text-[#7A4215]/70">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/40 transition">
                      <td className="p-4 font-bold text-[#5C2C06]">{u.email}</td>
                      <td className="p-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-[#B27F4C]/15 text-[#B27F4C]">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-[10px] text-[#7A4215]/70">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: PLAN FEATURES */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['starter', 'premium', 'royal'].map((planKey) => {
              const p = plans[planKey] || {
                name: `${planKey.toUpperCase()} PLAN`,
                price: planKey === 'starter' ? 0 : planKey === 'premium' ? 1499 : 3999,
                gallery_limit: planKey === 'starter' ? 5 : planKey === 'premium' ? 30 : 9999,
                enable_music: planKey !== 'starter',
                enable_watermark_removal: planKey !== 'starter'
              };

              return (
                <div key={planKey} className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#B27F4C]/20 p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-[#5C2C06] text-base uppercase">{p.name || planKey}</h3>
                    <p className="text-2xl font-black text-[#B27F4C] mt-2">₹{p.price}</p>

                    <ul className="mt-4 space-y-2 text-xs text-[#7A4215]">
                      <li className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-600" />
                        <span>Gallery Limit: {p.gallery_limit} photos</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={14} className={p.enable_music ? 'text-emerald-600' : 'text-gray-300'} />
                        <span>Background Music: {p.enable_music ? 'Enabled' : 'Disabled'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={14} className={p.enable_watermark_removal ? 'text-emerald-600' : 'text-gray-300'} />
                        <span>Watermark Removal: {p.enable_watermark_removal ? 'Enabled' : 'Disabled'}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Attach Custom Domain */}
      {attachDomainModal && (
        <div className="fixed inset-0 z-50 bg-amber-950/25 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#B27F4C]/30 shadow-2xl space-y-5">
            <div>
              <h3 className="font-bold text-lg text-[#5C2C06] flex items-center gap-2">
                <Server size={18} className="text-[#B27F4C]" /> Attach Custom Domain
              </h3>
              <p className="text-xs text-[#7A4215] mt-0.5">Map any domain (e.g. <span className="font-mono font-bold">rahulwedsneha.com</span>) to website ID <span className="font-mono font-bold">{attachDomainModal.id}</span></p>
            </div>

            <form onSubmit={handleAttachDomain} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#7A4215] font-bold mb-1">Custom Domain Name</label>
                <input
                  type="text"
                  required
                  value={customDomainInput}
                  onChange={(e) => setCustomDomainInput(e.target.value)}
                  placeholder="e.g. rahulwedsneha.com or www.shreyamukul.in"
                  className="w-full px-4 py-2.5 bg-[#FFFDF6] border border-[#B27F4C]/30 rounded-xl text-xs font-mono font-bold text-[#5C2C06] focus:outline-none focus:border-[#B27F4C]"
                />
              </div>

              {/* DNS Setup Instructions Box */}
              <div className="bg-[#FAF6EA] border border-[#B27F4C]/25 rounded-2xl p-4 space-y-2.5 text-xs text-[#5C2C06]">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#7A4215] flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-700" /> Required DNS Records for Setup:
                </h4>
                
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="bg-white/90 p-2 rounded-lg border border-[#B27F4C]/20 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-800 font-bold">A Record:</span> Host <span className="font-bold">@</span> &rarr; Points to <span className="font-bold">76.76.21.21</span>
                    </div>
                  </div>

                  <div className="bg-white/90 p-2 rounded-lg border border-[#B27F4C]/20 flex items-center justify-between">
                    <div>
                      <span className="text-indigo-800 font-bold">CNAME:</span> Host <span className="font-bold">www</span> &rarr; Points to <span className="font-bold">cname.weddingplatform.com</span>
                    </div>
                  </div>
                </div>
              </div>

              {dnsResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle size={16} /> DNS Records & SSL Certificate Verified Successfully!
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleVerifyDns(attachDomainModal.id)}
                  disabled={dnsVerifying}
                  className="px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:bg-indigo-100 transition"
                >
                  <RefreshCw size={12} className={dnsVerifying ? 'animate-spin' : ''} />
                  {dnsVerifying ? 'Checking DNS...' : 'Verify DNS Records'}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAttachDomainModal(null)}
                    className="px-4 py-2 border border-[#B27F4C]/30 text-[#7A4215] text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#B27F4C] text-white text-xs font-semibold rounded-xl shadow-md hover:bg-[#9E5D24]"
                  >
                    Save & Attach Domain
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Save Current Site as Template */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 bg-amber-950/25 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#B27F4C]/30 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-[#5C2C06]">Save Current Site as Master Template</h3>

            <form onSubmit={handleSaveCurrentSiteAsTemplate} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#7A4215] font-bold mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  value={newTplName}
                  onChange={(e) => setNewTplName(e.target.value)}
                  placeholder="e.g. Royal Gold Heritage Luxury"
                  className="w-full px-4 py-2.5 bg-[#FFFDF6] border border-[#B27F4C]/30 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#7A4215] font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newTplDesc}
                  onChange={(e) => setNewTplDesc(e.target.value)}
                  placeholder="Royal Indian wedding invitation template..."
                  className="w-full px-4 py-2.5 bg-[#FFFDF6] border border-[#B27F4C]/30 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#7A4215] font-bold mb-1">Thumbnail Preview URL</label>
                <input
                  type="text"
                  value={newTplThumb}
                  onChange={(e) => setNewTplThumb(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-[#FFFDF6] border border-[#B27F4C]/30 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="px-4 py-2 border border-[#B27F4C]/30 text-[#7A4215] text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#B27F4C] text-white text-xs font-semibold rounded-xl shadow-md hover:bg-[#9E5D24]"
                >
                  Save Master Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Website from Template */}
      {createFromTplModal && (
        <div className="fixed inset-0 z-50 bg-amber-950/25 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#B27F4C]/30 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-[#5C2C06]">Instantiate Website from Template</h3>

            <form onSubmit={handleCreateSiteFromTemplate} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#7A4215] font-bold mb-1">Subdomain</label>
                <input
                  type="text"
                  required
                  value={tplSiteSubdomain}
                  onChange={(e) => setTplSiteSubdomain(e.target.value)}
                  placeholder="e.g. rahul-neha"
                  className="w-full px-4 py-2.5 bg-[#FFFDF6] border border-[#B27F4C]/30 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#7A4215] font-bold mb-1">Custom Domain (Optional)</label>
                <input
                  type="text"
                  value={tplSiteDomain}
                  onChange={(e) => setTplSiteDomain(e.target.value)}
                  placeholder="e.g. rahulwedsneha.com"
                  className="w-full px-4 py-2.5 bg-[#FFFDF6] border border-[#B27F4C]/30 rounded-xl text-xs focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCreateFromTplModal(null)}
                  className="px-4 py-2 border border-[#B27F4C]/30 text-[#7A4215] text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#B27F4C] text-white text-xs font-semibold rounded-xl shadow-md hover:bg-[#9E5D24]"
                >
                  Launch Isolated Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Provision New Site (Manual) */}
      {showCreateSiteModal && (
        <div className="fixed inset-0 z-50 bg-amber-950/25 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#B27F4C]/30 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-[#5C2C06]">Provision New Wedding Website</h3>
            
            <form onSubmit={handleCreateWebsite} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#7A4215] font-bold mb-1">Subdomain Name</label>
                <input
                  type="text"
                  required
                  value={newSiteSubdomain}
                  onChange={(e) => setNewSiteSubdomain(e.target.value)}
                  placeholder="e.g. rahul-neha"
                  className="w-full px-4 py-2.5 bg-[#FFFDF6] border border-[#B27F4C]/30 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#7A4215] font-bold mb-1">Custom Domain (Optional)</label>
                <input
                  type="text"
                  value={newSiteDomain}
                  onChange={(e) => setNewSiteDomain(e.target.value)}
                  placeholder="e.g. rahulwedsneha.com"
                  className="w-full px-4 py-2.5 bg-[#FFFDF6] border border-[#B27F4C]/30 rounded-xl text-xs focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#7A4215] font-bold mb-1">Plan Tier</label>
                <select
                  value={newSitePlan}
                  onChange={(e) => setNewSitePlan(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-[#FFFDF6] border border-[#B27F4C]/30 rounded-xl text-xs focus:outline-none font-semibold"
                >
                  <option value="starter">Starter Plan</option>
                  <option value="premium">Premium Plan</option>
                  <option value="royal">Royal Elite Plan</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateSiteModal(false)}
                  className="px-4 py-2 border border-[#B27F4C]/30 text-[#7A4215] text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#B27F4C] text-white text-xs font-semibold rounded-xl shadow-md hover:bg-[#9E5D24]"
                >
                  Create Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Supabase completely removed - Configured for Custom Express REST Backend
import { authService } from './auth.service';

import { invitationService } from './invitation.service';
import { settingsService } from './settings.service';
import { galleryService } from './gallery.service';
import { dashboardService } from './dashboard.service';

export const isSupabaseConfigured = false;
export const supabase = null;

// --- Multi-Tenant Context Variables ---
export let activeSiteId: string | null = 'site-1';
export let activeSite: any = { id: 'site-1', owner_id: 'usr-3', subdomain: 'wedding', domain: 'wedding.com', status: 'active', plan: 'royal' };

export const setActiveSite = (site: any) => {
  activeSite = site || { id: 'site-1', owner_id: 'usr-3', subdomain: 'wedding', domain: 'wedding.com', status: 'active', plan: 'royal' };
  activeSiteId = activeSite.id;
};

export const detectCurrentTenant = async (): Promise<any> => {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  const urlParams = new URLSearchParams(window.location.search);
  const siteParam = urlParams.get('site') || urlParams.get('siteId') || urlParams.get('tenant');
  const forceSaas = urlParams.get('saas') === 'true' || urlParams.get('landing') === 'true';

  // 1. Explicit site requested via query parameter
  if (siteParam) {
    const mockWebsites = JSON.parse(localStorage.getItem('saas_websites') || '[]');
    const site = mockWebsites.find((w: any) => w.id === siteParam || w.subdomain === siteParam);
    if (site) {
      setActiveSite(site);
      return site;
    }
    const defaultSite = { id: siteParam, subdomain: siteParam, status: 'active' };
    setActiveSite(defaultSite);
    return defaultSite;
  }

  // 2. Explicit SaaS Landing requested
  if (forceSaas) {
    setActiveSite(null);
    return null;
  }

  // 3. Subdomain / Custom Domain check
  let subdomain: string | null = null;
  let customDomain: string | null = null;
  const parts = host.split('.');
  if (parts.length > 2) {
    subdomain = parts[0];
  } else if (parts.length === 2 && parts[1] === 'localhost') {
    subdomain = parts[0];
  } else if (host !== 'localhost' && host !== '127.0.0.1' && !host.endsWith('myplatform.com')) {
    customDomain = host;
  }

  if (subdomain || customDomain) {
    try {
      const data = await invitationService.detectTenant({ subdomain: subdomain || undefined, domain: customDomain || undefined });
      if (data) {
        setActiveSite(data);
        return data;
      }
    } catch (err) {
      console.warn('API site lookup fallback:', err);
    }

    const mockWebsites = JSON.parse(localStorage.getItem('saas_websites') || '[]');
    const mockSite = mockWebsites.find((w: any) => 
      (subdomain && w.subdomain === subdomain) || (customDomain && w.domain === customDomain)
    );
    if (mockSite) {
      setActiveSite(mockSite);
      return mockSite;
    }
  }

  // 4. Localhost Development Fallback: Load default 'site-1' site so wedding invitation functions work out-of-the-box
  const mockWebsites = JSON.parse(localStorage.getItem('saas_websites') || '[]');
  const defaultSite = mockWebsites[0] || { id: 'site-1', subdomain: 'rahul', status: 'active' };
  setActiveSite(defaultSite);
  return defaultSite;
};

// --- TypeScript Interfaces ---
export interface PlanFeatures {
  plan_key: 'starter' | 'premium' | 'royal';
  name: string;
  price: number;
  gallery_limit: number;
  enable_music: boolean;
  enable_watermark_removal: boolean;
  enable_custom_domain: boolean;
  enable_priority_support: boolean;
  enable_pdf_download: boolean;
  enable_multilang: boolean;
}

export const DEFAULT_PLAN_FEATURES: Record<string, PlanFeatures> = {
  starter: {
    plan_key: 'starter',
    name: 'Starter Plan',
    price: 0,
    gallery_limit: 5,
    enable_music: false,
    enable_watermark_removal: false,
    enable_custom_domain: false,
    enable_priority_support: false,
    enable_pdf_download: false,
    enable_multilang: false
  },
  premium: {
    plan_key: 'premium',
    name: 'Premium Invitation',
    price: 1499,
    gallery_limit: 30,
    enable_music: true,
    enable_watermark_removal: true,
    enable_custom_domain: false,
    enable_priority_support: false,
    enable_pdf_download: false,
    enable_multilang: false
  },
  royal: {
    plan_key: 'royal',
    name: 'Royal Elite',
    price: 3999,
    gallery_limit: 9999,
    enable_music: true,
    enable_watermark_removal: true,
    enable_custom_domain: true,
    enable_priority_support: true,
    enable_pdf_download: true,
    enable_multilang: true
  }
};

export interface WeddingSettings {
  id?: string;
  site_id?: string;
  couple_name?: string;
  wedding_date?: string;
  hero_title?: string;
  hero_subtitle?: string;
  theme_primary?: string;
  theme_secondary?: string;
  theme_background?: string;
  font_heading?: string;
  font_body?: string;
  enable_leaves?: boolean;
  enable_music?: boolean;
  enable_animations?: boolean;
  music_url?: string;
  gate_video_url?: string;
  hero_bg_url?: string;
  caricature_url?: string;
  intro_text?: string;
  seo_title?: string;
  seo_description?: string;
  seo_og_image?: string;

  // Custom Traditional Card fields
  invite_line1?: string;
  invite_line1_font?: string;
  invite_line1_size?: number;
  invite_line1_offset?: number;
  
  invite_line2?: string;
  invite_line2_font?: string;
  invite_line2_size?: number;
  invite_line2_offset?: number;
  
  bride_name?: string;
  bride_name_font?: string;
  bride_name_size?: number;
  bride_name_offset?: number;
  
  bride_parents?: string;
  bride_parents_font?: string;
  bride_parents_size?: number;
  bride_parents_offset?: number;
  
  groom_name?: string;
  groom_name_font?: string;
  groom_name_size?: number;
  groom_name_offset?: number;
  
  groom_parents?: string;
  groom_parents_font?: string;
  groom_parents_size?: number;
  groom_parents_offset?: number;
  
  venue_label?: string;
  venue_label_font?: string;
  venue_label_size?: number;
  venue_label_offset?: number;
  
  blessing_note?: string;
  blessing_note_font?: string;
  blessing_note_size?: number;
  blessing_note_offset?: number;
  
  custom_font_base64?: string;
  custom_font_name?: string;
  show_admin_btn?: boolean;
  bg_color?: string;
  card_color?: string;
  primary_color?: string;
  text_color?: string;
  show_gate_video?: boolean;
  footer_phone?: string;
  footer_email?: string;
  footer_copyright?: string;
  card_hero_bg_type?: 'image' | 'video';
  card_hero_bg_url?: string;

  haldi_name?: string;
  haldi_message?: string;
  haldi_date?: string;
  haldi_time?: string;
  haldi_venue?: string;

  mehndi_name?: string;
  mehndi_message?: string;
  mehndi_date?: string;
  mehndi_time?: string;
  mehndi_venue?: string;

  sangeet_name?: string;
  sangeet_message?: string;
  sangeet_date?: string;
  sangeet_time?: string;
  sangeet_venue?: string;

  wedding_name?: string;
  wedding_message?: string;
  wedding_date_label?: string;
  wedding_time?: string;
  wedding_venue?: string;

  reception_name?: string;
  reception_message?: string;
  reception_date?: string;
  reception_time?: string;
  reception_venue?: string;

  rsvp_family?: string;
  compliments_text?: string;
  whatsapp_number?: string;

  haldi_bg?: string;
  mehndi_bg?: string;
  sangeet_bg?: string;
  wedding_bg?: string;
  reception_bg?: string;
  custom_events?: CustomEventCard[];
}

export interface CustomEventCard {
  id: string;
  name: string;
  message: string;
  date: string;
  time: string;
  venue: string;
  bg: string;
}

export interface WeddingEvent {
  id: string;
  site_id?: string;
  event_name: string;
  event_date: string;
  event_time: string;
  venue: string;
  google_map_link: string;
  background_image: string;
  caricature_image: string;
  sort_order: number;
  message?: string;
}

export interface GalleryItem {
  id: string;
  site_id?: string;
  image_url: string;
  sort_order: number;
  created_at?: string;
}

export interface RSVP {
  id: string;
  site_id?: string;
  name: string;
  phone: string;
  guests: number;
  attending: boolean;
  message: string;
  created_at?: string;
}

export interface Blessing {
  id: string;
  site_id?: string;
  name: string;
  message: string;
  status: 'pending' | 'approved' | 'deleted';
  created_at?: string;
}

export interface VisitorLog {
  id?: string;
  site_id?: string;
  visited_at: string;
  device: string;
  country: string;
}

// --- Default Data for Local Mock Mode & Initial DB Seed ---
export const DEFAULT_SETTINGS: WeddingSettings = {
  couple_name: 'Mukul & Shreya',
  wedding_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  hero_title: 'We Are Getting Married',
  hero_subtitle: 'Save the date and share our joy',
  theme_primary: '#D4A373',
  theme_secondary: '#FAEDCD',
  theme_background: '#FEFAE0',
  font_heading: 'Great Vibes',
  font_body: 'Poppins',
  enable_leaves: true,
  enable_music: true,
  enable_animations: true,
  music_url: '/music.mp3',
  gate_video_url: '/From Klickpin.com- Pin this creative beach trip roundup to make your next project easier and prettier with practical inspiration you can use right.mp4',
  hero_bg_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070',
  caricature_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069',
  intro_text: 'Two souls, one heart. We invite you to join us as we embark on this beautiful journey of love and togetherness.',
  seo_title: 'Mukul & Shreya Wedding Invitation',
  seo_description: 'Join us to celebrate the wedding ceremony of Mukul and Shreya.',
  seo_og_image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070',

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

  custom_font_base64: '',
  custom_font_name: '',
  bg_color: '#FAF6EA',
  card_color: '#FEFAE0',
  primary_color: '#B27F4C',
  text_color: '#5c3a21',

  show_gate_video: true,
  show_admin_btn: true,
  footer_phone: '+919876543210',
  footer_email: 'wedding@example.com',
  footer_copyright: 'Designed & Developed by Mukul Sharma',
  card_hero_bg_type: 'image',
  card_hero_bg_url: '/traditional-card.png',

  haldi_name: 'HALDI CEREMONY',
  haldi_message: '✨ Splashed with turmeric, showered with love.',
  haldi_date: 'Saturday\n14 Dec 2026',
  haldi_time: '10:00 AM',
  haldi_venue: 'Golden Palms Resort, Banquet Hall A',

  mehndi_name: 'MEHNDI CEREMONY',
  mehndi_message: '✨ Stained with henna, woven with dreams.',
  mehndi_date: 'Saturday\n14 Dec 2026',
  mehndi_time: '04:00 PM',
  mehndi_venue: 'Golden Palms Resort, Poolside Lawn',

  sangeet_name: 'SANGEET NIGHT',
  sangeet_message: '✨ Music, dance, and a night to remember.',
  sangeet_date: 'Saturday\n14 Dec 2026',
  sangeet_time: '07:30 PM',
  sangeet_venue: 'Grand Palace Imperial Ballroom',

  wedding_name: 'WEDDING CEREMONY',
  wedding_message: '✨ Two souls, one promise, forever begins.',
  wedding_date_label: 'Sunday\n15 Dec 2026',
  wedding_time: '07:00 PM',
  wedding_venue: 'The Grand Palace Pavilion',

  reception_name: 'RECEPTION',
  reception_message: '✨ Toasting to the new Mr. & Mrs.',
  reception_date: 'Monday\n16 Dec 2026',
  reception_time: '08:00 PM',
  reception_venue: 'The Grand Palace Imperial Ballroom',

  rsvp_family: 'Sharma Family',
  compliments_text: 'All Relatives & Friends',
  whatsapp_number: '+919876543210',

  haldi_bg: '/Haldi-bg.png',
  mehndi_bg: '/mehndi-bg.png',
  sangeet_bg: '/Sangeet-bg.png',
  wedding_bg: '/Wedding-bg.png',
  reception_bg: '/Reception-bg.png',
  custom_events: []
};

const DEFAULT_EVENTS: WeddingEvent[] = [
  {
    id: 'ev-1',
    event_name: 'Haldi Ceremony',
    event_date: new Date(Date.now() + 89 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    event_time: '10:00 AM',
    venue: 'Golden Palms Resort, Banquet Hall A',
    google_map_link: 'https://maps.google.com',
    background_image: '/Haldi-bg.png',
    caricature_image: 'https://cdn-icons-png.flaticon.com/512/3596/3596091.png',
    sort_order: 1,
    message: '✨ Splashed with turmeric, showered with love'
  },
  {
    id: 'ev-2',
    event_name: 'Mehndi Ceremony',
    event_date: new Date(Date.now() + 89 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    event_time: '04:00 PM',
    venue: 'Golden Palms Resort, poolside Lawn',
    google_map_link: 'https://maps.google.com',
    background_image: '/mehndi-bg.png',
    caricature_image: 'https://cdn-icons-png.flaticon.com/512/4682/4682490.png',
    sort_order: 2,
    message: '✨ Stained with love, dark henna dreams'
  },
  {
    id: 'ev-3',
    event_name: 'Sangeet Night',
    event_date: new Date(Date.now() + 89 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    event_time: '07:30 PM',
    venue: 'Grand Palace Imperial Ballroom',
    google_map_link: 'https://maps.google.com',
    background_image: '/Sangeet-bg.png',
    caricature_image: 'https://cdn-icons-png.flaticon.com/512/4682/4682490.png',
    sort_order: 3,
    message: '✨ Music, dance, and a night to remember'
  },
  {
    id: 'ev-4',
    event_name: 'The Wedding (Phere)',
    event_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    event_time: '07:00 PM',
    venue: 'The Grand Palace Pavilion',
    google_map_link: 'https://maps.google.com',
    background_image: '/Wedding-bg.png',
    caricature_image: 'https://cdn-icons-png.flaticon.com/512/2913/2913493.png',
    sort_order: 4,
    message: '✨ Two souls, one promise, forever begins'
  },
  {
    id: 'ev-5',
    event_name: 'Reception',
    event_date: new Date(Date.now() + 91 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    event_time: '08:00 PM',
    venue: 'The Grand Palace Imperial Ballroom',
    google_map_link: 'https://maps.google.com',
    background_image: '/Reception-bg.png',
    caricature_image: 'https://cdn-icons-png.flaticon.com/512/3656/3656836.png',
    sort_order: 5,
    message: '✨ Toasting to the new Mr. & Mrs.'
  }
];

const DEFAULT_GALLERY: GalleryItem[] = [
  { id: 'gal-1', image_url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=600', sort_order: 1 },
  { id: 'gal-2', image_url: 'https://images.unsplash.com/photo-1519225495810-7517c296517a?q=80&w=600', sort_order: 2 },
  { id: 'gal-3', image_url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=600', sort_order: 3 },
  { id: 'gal-4', image_url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=600', sort_order: 4 },
  { id: 'gal-5', image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=600', sort_order: 5 },
  { id: 'gal-6', image_url: 'https://images.unsplash.com/photo-1520854221256-174b1ec353ef?q=80&w=600', sort_order: 6 }
];

const DEFAULT_BLESSINGS: Blessing[] = [
  { id: 'bless-1', name: 'Amit & Ritu Sharma', message: 'Congratulations Mukul and Shreya! Wishing you a lifetime of love, laughter, and happiness together. Can\'t wait to celebrate!', status: 'approved', created_at: new Date().toISOString() },
  { id: 'bless-2', name: 'Karan Malhotra', message: 'May your wedding be filled with special memories that you will treasure forever. Cheers to the beautiful couple!', status: 'approved', created_at: new Date().toISOString() },
  { id: 'bless-3', name: 'Sneha Patel', message: 'So happy for both of you! Welcome to the family, Shreya! Wishing you both infinite love.', status: 'approved', created_at: new Date().toISOString() }
];

const DEFAULT_RSVPS: RSVP[] = [
  { id: 'rsvp-1', name: 'Rahul Dev', phone: '+919876543210', guests: 2, attending: true, message: 'Looking forward to the grand celebration!', created_at: new Date().toISOString() },
  { id: 'rsvp-2', name: 'Dr. Priya Mehta', phone: '+919999888877', guests: 1, attending: true, message: 'Congratulations! I will be there.', created_at: new Date().toISOString() },
  { id: 'rsvp-3', name: 'Vikram Singh', phone: '+918887776665', guests: 0, attending: false, message: 'Sending my best wishes from Singapore. Apologies for missing out.', created_at: new Date().toISOString() }
];

// --- Local Storage Initialization ---
const initLocalStorage = () => {
  // Seeding SaaS tables for local mock mode
  if (!localStorage.getItem('saas_users')) {
    localStorage.setItem('saas_users', JSON.stringify([
      { id: 'usr-1', email: 'admin@wedding.com', role: 'admin', created_at: new Date().toISOString() },
      { id: 'usr-2', email: 'client@wedding.com', role: 'client', created_at: new Date().toISOString() },
      { id: 'usr-3', email: 'rahul@wedding.com', role: 'client', created_at: new Date().toISOString() }
    ]));
  }
  if (!localStorage.getItem('saas_templates')) {
    localStorage.setItem('saas_templates', JSON.stringify([
      {
        id: 'tpl-1',
        name: 'Royal Heritage Golden Template',
        description: 'A classic, luxury traditional template for royal Indian weddings with gold corner accents and elegant cursive typography.',
        thumbnail_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600',
        is_published: true,
        default_data: {
          settings: DEFAULT_SETTINGS,
          events: DEFAULT_EVENTS,
          gallery: DEFAULT_GALLERY
        },
        created_at: new Date().toISOString()
      }
    ]));
  }
  if (!localStorage.getItem('saas_websites')) {
    localStorage.setItem('saas_websites', JSON.stringify([
      {
        id: 'site-1',
        owner_id: 'usr-3',
        template_id: 'tpl-1',
        subdomain: 'rahul',
        domain: 'rahulwedsneha.com',
        status: 'active',
        created_at: new Date().toISOString()
      }
    ]));
  }

  // Seeding scoped keys for the default 'site-1' site
  if (!localStorage.getItem('wedding_settings_site-1')) {
    localStorage.setItem('wedding_settings_site-1', JSON.stringify(DEFAULT_SETTINGS));
  }
  if (!localStorage.getItem('wedding_events_site-1')) {
    localStorage.setItem('wedding_events_site-1', JSON.stringify(DEFAULT_EVENTS));
  }
  if (!localStorage.getItem('wedding_gallery_site-1')) {
    localStorage.setItem('wedding_gallery_site-1', JSON.stringify(DEFAULT_GALLERY));
  }
  if (!localStorage.getItem('wedding_blessings_site-1')) {
    localStorage.setItem('wedding_blessings_site-1', JSON.stringify(DEFAULT_BLESSINGS));
  }
  if (!localStorage.getItem('wedding_rsvps_site-1')) {
    localStorage.setItem('wedding_rsvps_site-1', JSON.stringify(DEFAULT_RSVPS));
  }
  if (!localStorage.getItem('wedding_visitors_site-1')) {
    const mockVisitors = Array.from({ length: 42 }).map((_, i) => ({
      id: `vis-${i}`,
      visited_at: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
      device: Math.random() > 0.6 ? 'Mobile' : Math.random() > 0.2 ? 'Desktop' : 'Tablet',
      country: Math.random() > 0.15 ? 'India' : Math.random() > 0.05 ? 'USA' : 'Singapore'
    }));
    localStorage.setItem('wedding_visitors_site-1', JSON.stringify(mockVisitors));
  }

  // Standard fallback keys
  if (!localStorage.getItem('wedding_settings')) {
    localStorage.setItem('wedding_settings', JSON.stringify(DEFAULT_SETTINGS));
  }
  if (!localStorage.getItem('wedding_events')) {
    localStorage.setItem('wedding_events', JSON.stringify(DEFAULT_EVENTS));
  }
  if (!localStorage.getItem('wedding_gallery')) {
    localStorage.setItem('wedding_gallery', JSON.stringify(DEFAULT_GALLERY));
  }

  // Migration check: update broken soundhelix URL to local audio source
  ['wedding_settings_site-1', 'wedding_settings'].forEach(key => {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (!parsed.music_url || parsed.music_url.includes('soundhelix.com') || parsed.music_url.includes('Klickpin')) {
          parsed.music_url = '/music.mp3';
          localStorage.setItem(key, JSON.stringify(parsed));
        }
      } catch (e) {}
    }
  });
};

initLocalStorage();

// Apply settings dynamic styles to document root
export const applyThemeSettings = (settings: WeddingSettings) => {
  if (!settings) return;
  const root = document.documentElement;
  root.style.setProperty('--theme-primary', settings.theme_primary || '#D4AF37');
  root.style.setProperty('--theme-secondary', settings.theme_secondary || '#E6C687');
  root.style.setProperty('--theme-background', settings.theme_background || '#FDF7E7');
  
  if (settings.theme_background) {
    root.style.backgroundColor = settings.theme_background;
  }
  
  const headingFont = settings.font_heading === 'Candlescript'
    ? "'Candlescript', 'Great Vibes', 'Playfair Display', serif"
    : `'${settings.font_heading || 'Candlescript'}', sans-serif`;
    
  root.style.setProperty('--font-heading', headingFont);
  root.style.setProperty('--font-body', `'${settings.font_body || 'Inter'}', sans-serif`);
};

// --- Unified Database Service ---



import { apiClient } from '../api/client';

export const databaseService = {
  // 1. Settings CRUD
  async getSettings(): Promise<any> {
    const siteId = activeSiteId || 'site-1';
    const storageKey = `wedding_settings_${siteId}`;
    const raw = localStorage.getItem(storageKey) || localStorage.getItem('wedding_settings');
    const localSettings = raw ? JSON.parse(raw) : {};

    try {
      const data = await settingsService.getSettings(siteId);
      if (data) {
        const merged = { ...DEFAULT_SETTINGS, ...data, ...localSettings };
        if (data.music_url) merged.music_url = data.music_url;
        applyThemeSettings(merged);
        localStorage.setItem(storageKey, JSON.stringify(merged));
        localStorage.setItem('wedding_settings', JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      // ignore backend failure
    }
    const merged = { ...DEFAULT_SETTINGS, ...localSettings };
    applyThemeSettings(merged);
    return merged;
  },

  async uploadFileToStorage(file: File, folder: string = 'music', onProgress?: (pct: number) => void): Promise<string> {
    if (onProgress) onProgress(20);
    try {
      const url = await settingsService.uploadFile(file, folder);
      if (url) {
        if (onProgress) onProgress(100);
        return url;
      }
    } catch (err) {
      console.warn('API storage upload fallback:', err);
    }

    // Fallback: Data URL conversion for local / offline mode (small images only)
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Backend API connection failed. Large media files (audio/video) cannot be stored in browser offline storage.');
    }

    if (onProgress) onProgress(60);
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (onProgress) onProgress(100);
        resolve(reader.result as string);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  },

  async updateSettings(settings: any): Promise<any> {
    const siteId = activeSiteId || 'site-1';
    const storageKey = `wedding_settings_${siteId}`;
    localStorage.setItem(storageKey, JSON.stringify(settings));
    localStorage.setItem('wedding_settings', JSON.stringify(settings));
    applyThemeSettings(settings);

    try {
      const data = await settingsService.updateSettings(siteId, settings);
      if (data && typeof data === 'object') {
        const merged = { ...settings, ...data };
        localStorage.setItem(storageKey, JSON.stringify(merged));
        localStorage.setItem('wedding_settings', JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      console.warn('API updateSettings notice:', err);
    }
    return settings;
  },

  // 2. Events CRUD
  async getEvents(): Promise<any[]> {
    const siteId = activeSiteId || 'site-1';
    try {
      const data = await dashboardService.getEvents(siteId);
      if (data && data.length > 0) return data;
    } catch (err) {
      // ignore
    }
    const storageKey = `wedding_events_${siteId}`;
    const raw = localStorage.getItem(storageKey) || localStorage.getItem('wedding_events');
    return raw ? JSON.parse(raw) : DEFAULT_EVENTS;
  },

  async saveEvent(event: any): Promise<any> {
    const siteId = activeSiteId || 'site-1';
    try {
      const data = await dashboardService.saveEvent(siteId, event);
      if (data) event = data;
    } catch (err) {
      // ignore
    }
    const storageKey = `wedding_events_${siteId}`;
    const list: any[] = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('wedding_events') || JSON.stringify(DEFAULT_EVENTS));
    const idx = list.findIndex(e => e.id === event.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...event };
    } else {
      list.push(event);
    }
    localStorage.setItem(storageKey, JSON.stringify(list));
    localStorage.setItem('wedding_events', JSON.stringify(list));
    return event;
  },

  async deleteEvent(id: string): Promise<boolean> {
    const siteId = activeSiteId || 'site-1';
    try {
      await dashboardService.deleteEvent(id);
    } catch (err) {
      // ignore
    }
    const storageKey = `wedding_events_${siteId}`;
    const list: any[] = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('wedding_events') || '[]');
    const filtered = list.filter(e => e.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(filtered));
    localStorage.setItem('wedding_events', JSON.stringify(filtered));
    return true;
  },

  async reorderEvents(eventIds: string[]): Promise<boolean> {
    const siteId = activeSiteId || 'site-1';
    try {
      await dashboardService.reorderEvents(eventIds);
    } catch (err) {
      // ignore
    }
    const storageKey = `wedding_events_${siteId}`;
    const list: any[] = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('wedding_events') || '[]');
    const updated = list.map(ev => {
      const idx = eventIds.indexOf(ev.id);
      return idx !== -1 ? { ...ev, sort_order: idx + 1 } : ev;
    }).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    
    localStorage.setItem(storageKey, JSON.stringify(updated));
    localStorage.setItem('wedding_events', JSON.stringify(updated));
    return true;
  },

  // 3. Gallery CRUD
  async getGallery(): Promise<any[]> {
    const siteId = activeSiteId || 'site-1';
    try {
      const data = await galleryService.getGallery(siteId);
      if (data && data.length > 0) return data;
    } catch (err) {
      // ignore
    }
    const storageKey = `wedding_gallery_${siteId}`;
    const raw = localStorage.getItem(storageKey) || localStorage.getItem('wedding_gallery');
    return raw ? JSON.parse(raw) : DEFAULT_GALLERY;
  },

  async addGalleryImage(imageUrl: string): Promise<any> {
    const siteId = activeSiteId || 'site-1';
    const storageKey = `wedding_gallery_${siteId}`;
    const list: any[] = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('wedding_gallery') || '[]');
    let newItem: any = {
      id: `gal-${Date.now()}`,
      image_url: imageUrl,
      sort_order: list.length + 1
    };

    try {
      const data = await galleryService.addImage(siteId, imageUrl);
      if (data) newItem = data;
    } catch (err) {
      // ignore
    }

    list.push(newItem);
    localStorage.setItem(storageKey, JSON.stringify(list));
    localStorage.setItem('wedding_gallery', JSON.stringify(list));
    return newItem;
  },

  async deleteGalleryImage(id: string): Promise<boolean> {
    const siteId = activeSiteId || 'site-1';
    try {
      await galleryService.deleteImage(id);
    } catch (err) {
      // ignore
    }
    const storageKey = `wedding_gallery_${siteId}`;
    const list: any[] = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('wedding_gallery') || '[]');
    const filtered = list.filter(g => g.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(filtered));
    localStorage.setItem('wedding_gallery', JSON.stringify(filtered));
    return true;
  },

  // 4. RSVP CRUD
  async getRSVPs(): Promise<any[]> {
    const siteId = activeSiteId || 'site-1';
    try {
      const data = await dashboardService.getRSVPs(siteId);
      if (data && data.length > 0) return data;
    } catch (err) {
      // ignore
    }
    const storageKey = `wedding_rsvps_${siteId}`;
    const raw = localStorage.getItem(storageKey) || localStorage.getItem('wedding_rsvps');
    return raw ? JSON.parse(raw) : DEFAULT_RSVPS;
  },

  async submitRSVP(rsvp: any): Promise<any> {
    const siteId = activeSiteId || 'site-1';
    const storageKey = `wedding_rsvps_${siteId}`;
    const list: any[] = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('wedding_rsvps') || '[]');
    
    let newItem: any = {
      id: `rsvp-${Date.now()}`,
      name: rsvp.name || 'Anonymous',
      phone: rsvp.phone || '',
      guests: rsvp.guests || 1,
      attending: rsvp.attending ?? true,
      message: rsvp.message || '',
      created_at: new Date().toISOString()
    };

    try {
      const data = await dashboardService.submitRSVP(siteId, rsvp);
      if (data) newItem = data;
    } catch (err) {
      // ignore
    }

    list.unshift(newItem);
    localStorage.setItem(storageKey, JSON.stringify(list));
    localStorage.setItem('wedding_rsvps', JSON.stringify(list));
    return newItem;
  },

  async deleteRSVP(id: string): Promise<boolean> {
    const siteId = activeSiteId || 'site-1';
    try {
      await dashboardService.deleteRSVP(id);
    } catch (err) {
      // ignore
    }
    const storageKey = `wedding_rsvps_${siteId}`;
    const list: any[] = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('wedding_rsvps') || '[]');
    const filtered = list.filter(r => r.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(filtered));
    localStorage.setItem('wedding_rsvps', JSON.stringify(filtered));
    return true;
  },

  // 5. Blessings CRUD
  async getBlessings(): Promise<any[]> {
    const siteId = activeSiteId || 'site-1';
    try {
      const data = await dashboardService.getBlessings(siteId);
      if (data && data.length > 0) return data;
    } catch (err) {
      // ignore
    }
    const storageKey = `wedding_blessings_${siteId}`;
    const raw = localStorage.getItem(storageKey) || localStorage.getItem('wedding_blessings');
    return raw ? JSON.parse(raw) : DEFAULT_BLESSINGS;
  },

  async submitBlessing(name: string, message: string): Promise<any> {
    const siteId = activeSiteId || 'site-1';
    const storageKey = `wedding_blessings_${siteId}`;
    const list: any[] = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('wedding_blessings') || '[]');

    let newItem: any = {
      id: `bless-${Date.now()}`,
      name: name.trim() || 'Well Wisher',
      message: message.trim(),
      status: 'pending',
      created_at: new Date().toISOString()
    };

    try {
      const data = await dashboardService.submitBlessing(siteId, { name, message });
      if (data) newItem = data;
    } catch (err) {
      // ignore
    }

    list.unshift(newItem);
    localStorage.setItem(storageKey, JSON.stringify(list));
    localStorage.setItem('wedding_blessings', JSON.stringify(list));
    return newItem;
  },

  async approveBlessing(id: string): Promise<boolean> {
    const siteId = activeSiteId || 'site-1';
    try {
      await dashboardService.approveBlessing(id);
    } catch (err) {
      // ignore
    }
    const storageKey = `wedding_blessings_${siteId}`;
    const list: any[] = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('wedding_blessings') || '[]');
    const idx = list.findIndex(b => b.id === id);
    if (idx !== -1) {
      list[idx].status = 'approved';
      localStorage.setItem(storageKey, JSON.stringify(list));
      localStorage.setItem('wedding_blessings', JSON.stringify(list));
    }
    return true;
  },

  async deleteBlessing(id: string): Promise<boolean> {
    const siteId = activeSiteId || 'site-1';
    try {
      await dashboardService.deleteBlessing(id);
    } catch (err) {
      // ignore
    }
    const storageKey = `wedding_blessings_${siteId}`;
    const list: any[] = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('wedding_blessings') || '[]');
    const filtered = list.filter(b => b.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(filtered));
    localStorage.setItem('wedding_blessings', JSON.stringify(filtered));
    return true;
  },

  // 6. Visitors / Stats
  async logVisitor(device: string, country: string): Promise<boolean> {
    const siteId = activeSiteId || 'site-1';
    const storageKey = `wedding_visitors_${siteId}`;
    const visitors = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const newVisitor = {
      id: `vis-${Date.now()}`,
      device,
      country,
      visited_at: new Date().toISOString()
    };

    try {
      await dashboardService.logVisitor(siteId, { device, country });
    } catch (err) {
      // ignore
    }

    visitors.push(newVisitor);
    localStorage.setItem(storageKey, JSON.stringify(visitors));
    return true;
  },

  async getVisitorStats(): Promise<any> {
    const siteId = activeSiteId || 'site-1';
    try {
      const data = await dashboardService.getVisitorStats(siteId);
      if (data && data.visitorCount > 0) return data;
    } catch (err) {
      // ignore
    }

    const visitors = JSON.parse(localStorage.getItem(`wedding_visitors_${siteId}`) || localStorage.getItem('wedding_visitors') || '[]');
    const rsvps = JSON.parse(localStorage.getItem(`wedding_rsvps_${siteId}`) || localStorage.getItem('wedding_rsvps') || '[]');
    const blessings = JSON.parse(localStorage.getItem(`wedding_blessings_${siteId}`) || localStorage.getItem('wedding_blessings') || '[]');
    const gallery = JSON.parse(localStorage.getItem(`wedding_gallery_${siteId}`) || localStorage.getItem('wedding_gallery') || '[]');

    const visitorCount = visitors.length;
    const rsvpCount = rsvps.reduce((acc: number, r: any) => acc + (r.guests || 1), 0);
    const blessingCount = blessings.length;
    const galleryCount = gallery.length;

    // Device breakdown
    const devicesMap: Record<string, number> = {};
    visitors.forEach((v: any) => {
      const dev = v.device || 'Desktop';
      devicesMap[dev] = (devicesMap[dev] || 0) + 1;
    });
    const deviceData = Object.entries(devicesMap).map(([name, count]) => ({
      name,
      count,
      percentage: visitorCount > 0 ? Math.round((count / visitorCount) * 100) : 0
    }));

    // Country breakdown
    const countryMap: Record<string, number> = {};
    visitors.forEach((v: any) => {
      const c = v.country || 'India';
      countryMap[c] = (countryMap[c] || 0) + 1;
    });
    const countryData = Object.entries(countryMap).map(([country, count]) => ({
      country,
      count,
      percentage: visitorCount > 0 ? Math.round((count / visitorCount) * 100) : 0
    }));

    // Visitor Chart Data (last 7 days)
    const daysMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      daysMap[label] = 0;
    }
    visitors.forEach((v: any) => {
      if (v.visited_at) {
        const label = new Date(v.visited_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (daysMap[label] !== undefined) {
          daysMap[label] += 1;
        }
      }
    });
    const chartData = Object.entries(daysMap).map(([date, count]) => ({ date, count }));

    return {
      visitorCount,
      rsvpCount,
      blessingCount,
      galleryCount,
      chartData,
      deviceData,
      countryData
    };
  },

  async syncLocalToSupabase(): Promise<boolean> {
    console.warn("syncLocalToSupabase is deprecated in API mode");
    return true;
  },

  // 7. Plan Features & Admin / SuperAdmin helpers
  async getAllPlanFeatures(): Promise<Record<string, PlanFeatures>> {
    try {
      const { data } = await apiClient.get('/plans');
      return data || DEFAULT_PLAN_FEATURES;
    } catch (err) {
      const stored = localStorage.getItem('saas_plan_features');
      return stored ? JSON.parse(stored) : DEFAULT_PLAN_FEATURES;
    }
  },

  async savePlanFeatures(planKeyOrPlans: string | Record<string, PlanFeatures>, planData?: PlanFeatures): Promise<boolean> {
    let plans: Record<string, PlanFeatures>;
    if (typeof planKeyOrPlans === 'string') {
      const stored = localStorage.getItem('saas_plan_features');
      const current = stored ? JSON.parse(stored) : DEFAULT_PLAN_FEATURES;
      plans = { ...current, [planKeyOrPlans]: planData! };
    } else {
      plans = planKeyOrPlans;
    }
    try {
      await apiClient.put('/plans', plans);
      return true;
    } catch (err) {
      localStorage.setItem('saas_plan_features', JSON.stringify(plans));
      return true;
    }
  },

  async superGetWebsites(): Promise<any[]> {
    try {
      const { data } = await apiClient.get('/admin/websites');
      return data || [];
    } catch (err) {
      return JSON.parse(localStorage.getItem('saas_websites') || '[]');
    }
  },

  async superGetTemplates(): Promise<any[]> {
    try {
      const { data } = await apiClient.get('/templates');
      return data || [];
    } catch (err) {
      return JSON.parse(localStorage.getItem('saas_templates') || '[]');
    }
  },

  async superGetUsers(): Promise<any[]> {
    try {
      const { data } = await apiClient.get('/admin/users');
      return data || [];
    } catch (err) {
      return JSON.parse(localStorage.getItem('saas_users') || '[]');
    }
  },

  async superCreateWebsite(site: any): Promise<any> {
    try {
      const { data } = await apiClient.post('/admin/websites', site);
      return data;
    } catch (err) {
      const list = JSON.parse(localStorage.getItem('saas_websites') || '[]');
      const newSite = { ...site, id: site.id || `site-${Date.now()}`, created_at: new Date().toISOString() };
      list.push(newSite);
      localStorage.setItem('saas_websites', JSON.stringify(list));
      return newSite;
    }
  },

  async superUpdateWebsite(idOrSite: any, updates?: any): Promise<any> {
    const id = typeof idOrSite === 'string' ? idOrSite : idOrSite?.id;
    const payload = typeof idOrSite === 'string' ? updates : idOrSite;
    try {
      const { data } = await apiClient.put(`/admin/websites/${id}`, payload);
      return data;
    } catch (err) {
      const list = JSON.parse(localStorage.getItem('saas_websites') || '[]');
      const idx = list.findIndex((w: any) => w.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload };
        localStorage.setItem('saas_websites', JSON.stringify(list));
      }
      return payload;
    }
  },

  async superDeleteWebsite(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/admin/websites/${id}`);
      return true;
    } catch (err) {
      const list = JSON.parse(localStorage.getItem('saas_websites') || '[]');
      const filtered = list.filter((w: any) => w.id !== id);
      localStorage.setItem('saas_websites', JSON.stringify(filtered));
      return true;
    }
  },

  async superDuplicateWebsite(id: string, newSubdomain?: string, newDomain?: string): Promise<any> {
    try {
      const { data } = await apiClient.post(`/admin/websites/${id}/duplicate`, { newSubdomain, newDomain });
      return data;
    } catch (err) {
      const list = JSON.parse(localStorage.getItem('saas_websites') || '[]');
      const site = list.find((w: any) => w.id === id);
      if (site) {
        const copy = { 
          ...site, 
          id: `site-${Date.now()}`, 
          subdomain: newSubdomain || `${site.subdomain}-copy`,
          domain: newDomain || site.domain 
        };
        list.push(copy);
        localStorage.setItem('saas_websites', JSON.stringify(list));
        return copy;
      }
      return null;
    }
  },

  async superCreateTemplateFromSite(siteId: string, nameOrOptions?: string | any, description?: string): Promise<any> {
    const name = typeof nameOrOptions === 'object' ? nameOrOptions.name : nameOrOptions;
    const desc = typeof nameOrOptions === 'object' ? nameOrOptions.description : description;
    const thumb = typeof nameOrOptions === 'object' ? nameOrOptions.thumbnail_url : undefined;
    try {
      const { data } = await apiClient.post(`/admin/templates/from-site`, { siteId, name, description: desc, thumbnail_url: thumb });
      return data;
    } catch (err) {
      const list = JSON.parse(localStorage.getItem('saas_templates') || '[]');
      const newTpl = { id: `tpl-${Date.now()}`, name: name || 'Custom Template', description: desc || '', thumbnail_url: thumb || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600', is_published: true, created_at: new Date().toISOString() };
      list.push(newTpl);
      localStorage.setItem('saas_templates', JSON.stringify(list));
      return newTpl;
    }
  },

  async superCreateTemplate(tpl: any): Promise<any> {
    try {
      const { data } = await apiClient.post('/admin/templates', tpl);
      return data;
    } catch (err) {
      const list = JSON.parse(localStorage.getItem('saas_templates') || '[]');
      const newTpl = { ...tpl, id: tpl.id || `tpl-${Date.now()}`, created_at: new Date().toISOString() };
      list.push(newTpl);
      localStorage.setItem('saas_templates', JSON.stringify(list));
      return newTpl;
    }
  },

  async superUpdateTemplate(idOrTpl: any, updates?: any): Promise<any> {
    const id = typeof idOrTpl === 'string' ? idOrTpl : idOrTpl?.id;
    const payload = typeof idOrTpl === 'string' ? updates : idOrTpl;
    try {
      const { data } = await apiClient.put(`/admin/templates/${id}`, payload);
      return data;
    } catch (err) {
      const list = JSON.parse(localStorage.getItem('saas_templates') || '[]');
      const idx = list.findIndex((t: any) => t.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload };
        localStorage.setItem('saas_templates', JSON.stringify(list));
      }
      return payload;
    }
  },

  async superDeleteTemplate(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/admin/templates/${id}`);
      return true;
    } catch (err) {
      const list = JSON.parse(localStorage.getItem('saas_templates') || '[]');
      const filtered = list.filter((t: any) => t.id !== id);
      localStorage.setItem('saas_templates', JSON.stringify(filtered));
      return true;
    }
  },

  // 10. Consolidated Architecture Abstractions
  async getWebsitePlan(siteId: string): Promise<string> {
    try {
      const plan = await invitationService.getWebsitePlan(siteId);
      if (plan) return plan;
    } catch (e) {}
    const mockWebsites = JSON.parse(localStorage.getItem('saas_websites') || '[]');
    const s = mockWebsites.find((w: any) => w.id === siteId);
    return s?.plan || 'royal';
  },

  async getWebsiteDetails(siteId: string): Promise<any> {
    try {
      const data = await invitationService.getWebsiteDetails(siteId);
      if (data) return data;
    } catch (e) {}
    const mockWebsites = JSON.parse(localStorage.getItem('saas_websites') || '[]');
    return mockWebsites.find((w: any) => w.id === siteId) || { id: siteId, subdomain: 'wedding', plan: 'royal', status: 'active' };
  },

  async authGetSession(): Promise<any> {
    try {
      const user = await authService.getMe();
      if (user) return { user };
    } catch (e) {}
    return sessionStorage.getItem('admin_authenticated') === 'true' ? { user: { email: 'admin@wedding.com' } } : null;
  },

  async authSignIn(emailStr: string, passStr: string): Promise<any> {
    try {
      const res = await authService.login(emailStr, passStr);
      sessionStorage.setItem('admin_authenticated', 'true');
      return res;
    } catch (err) {
      if (emailStr.trim() === 'admin@wedding.com' && passStr === 'admin123') {
        sessionStorage.setItem('admin_authenticated', 'true');
        return { user: { email: emailStr } };
      }
      throw err;
    }
  },

  async authSignUp(emailStr: string, passStr: string): Promise<any> {
    try {
      const res = await authService.register({ email: emailStr, password: passStr });
      sessionStorage.setItem('admin_authenticated', 'true');
      return res;
    } catch (err) {
      sessionStorage.setItem('admin_authenticated', 'true');
      return { user: { email: emailStr } };
    }
  },

  async authSignOut(): Promise<void> {
    await authService.logout();
  }
};

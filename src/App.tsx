import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import { databaseService, DEFAULT_SETTINGS } from './services/database';
import type { WeddingSettings } from './services/database';
import { WelcomeGate } from './components/WelcomeGate';
import { FloatingPetals } from './components/FloatingPetals';
import { CustomCursor } from './components/CustomCursor';
import { MusicPlayer } from './components/MusicPlayer';
import { WeddingPage } from './pages/WeddingPage';
import { AdminPanel } from './pages/AdminPanel';
import { SuperAdminPanel } from './pages/SuperAdminPanel';

const getInitialSettings = (): WeddingSettings => {
  try {
    const raw = localStorage.getItem('wedding_settings_site-1') || localStorage.getItem('wedding_settings');
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {}
  return DEFAULT_SETTINGS;
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [settings, setSettings] = useState<WeddingSettings>(getInitialSettings);
  const [isGateOpened, setIsGateOpened] = useState<boolean>(() => !getInitialSettings().show_gate_video);
  const [startMusic, setStartMusic] = useState(false);

  const isAdminPath = location.pathname === '/admin';
  const isSuperAdminPath = location.pathname === '/super-admin' || location.pathname === '/superadmin';

  const handleSettingsChange = useCallback((updated: WeddingSettings) => {
    setSettings(updated);
  }, []);

  const handleBackToGuest = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleOpenGate = useCallback((playMusic: boolean) => {
    setIsGateOpened(true);
    setStartMusic(playMusic);
  }, []);

  const handleStartPlayGate = useCallback(() => {
    setStartMusic(true);
  }, []);

  const handleNavigateToAdmin = useCallback(() => {
    navigate('/admin');
  }, [navigate]);

  // Dynamically load custom uploaded font if present in settings
  useEffect(() => {
    if (settings?.custom_font_base64) {
      let styleEl = document.getElementById('custom-uploaded-font-style') as HTMLStyleElement;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'custom-uploaded-font-style';
        document.head.appendChild(styleEl);
      }

      styleEl.innerHTML = `
        @font-face {
          font-family: 'CustomUploadedFont';
          src: url('${settings.custom_font_base64}');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;

      try {
        const fontFace = new FontFace('CustomUploadedFont', `url(${settings.custom_font_base64})`);
        fontFace.load().then((loadedFace) => {
          (document.fonts as any).add(loadedFace);
        }).catch(() => {});
      } catch (err) {}
    } else {
      const styleEl = document.getElementById('custom-uploaded-font-style');
      if (styleEl) styleEl.remove();
    }
  }, [settings]);

  // Load Settings and log visitor analytics immediately in background
  useEffect(() => {
    databaseService.getSettings()
      .then(sets => {
        if (sets) {
          setSettings(sets);
          if (sets.show_gate_video === false) {
            setIsGateOpened(true);
          }
        }
      })
      .catch(err => console.error('Error fetching settings:', err));

    let device = 'Desktop';
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) device = 'Tablet';
    else if (/mobile|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) device = 'Mobile';

    let country = 'India';
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes('Kolkata') || tz.includes('Asia/Kolkata')) country = 'India';
    else if (tz.includes('America') || tz.includes('US/')) country = 'USA';
    else if (tz.includes('Singapore')) country = 'Singapore';
    else if (tz.includes('Europe') || tz.includes('London') || tz.includes('Paris')) country = 'UK/Europe';

    databaseService.logVisitor(device, country).catch(() => {});
  }, []);

  // Lenis smooth scroll (only on guest page after gate opens)
  useEffect(() => {
    if (!isGateOpened || isAdminPath || isSuperAdminPath) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, [isGateOpened, isAdminPath, isSuperAdminPath]);

  if (isSuperAdminPath) {
    return <SuperAdminPanel onBackToGuest={handleBackToGuest} />;
  }

  return (
    <>
      {/* Background Music - Continuous Audio & Floating Bottom-Right Controls */}
      <MusicPlayer
        musicUrl={settings.music_url || ''}
        autoPlay={startMusic}
        enabled={!isAdminPath && !isSuperAdminPath && settings.enable_music !== false}
        showUI={!isAdminPath && !isSuperAdminPath}
      />

      {/* Floating Petals & Animated Butterflies */}
      {settings.enable_leaves && isGateOpened && !isAdminPath && !isSuperAdminPath && (
        <FloatingPetals count={20} />
      )}

      {/* Custom Cursor */}
      <CustomCursor />

      {/* Client Site Admin Panel */}
      {isAdminPath && (
        <AdminPanel
          onBackToGuest={handleBackToGuest}
          onSettingsChange={handleSettingsChange}
        />
      )}

      {/* Guest Invitation Site - Mounted so it is ready underneath */}
      {!isAdminPath && !isSuperAdminPath && (
        <WeddingPage
          settings={settings}
          onNavigateToAdmin={handleNavigateToAdmin}
          isGateOpened={isGateOpened}
        />
      )}

      {/* Welcome Gate Overlay - Fades out smoothly revealing WeddingPage underneath */}
      <AnimatePresence>
        {!isGateOpened && !isAdminPath && !isSuperAdminPath && (
          <WelcomeGate
            gateVideoUrl={settings.gate_video_url ?? ''}
            settings={settings}
            onOpen={handleOpenGate}
            onStartPlay={() => setStartMusic(true)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

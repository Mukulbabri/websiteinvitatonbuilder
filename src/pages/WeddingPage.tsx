import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Send, 
  Heart, 
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Shield
} from 'lucide-react';
import { 
  databaseService,
  activeSite
} from '../services/database';
import type { 
  WeddingSettings, 
  WeddingEvent, 
  GalleryItem
} from '../services/database';
import { ScratchCardInvitation } from '../components/ScratchCardInvitation';

interface WeddingPageProps {
  settings: WeddingSettings;
  onNavigateToAdmin: () => void;
  previewEvents?: WeddingEvent[];
  previewGallery?: GalleryItem[];
  isPreviewMode?: boolean;
  isGateOpened?: boolean;
}

export const WeddingPage = ({ 
  settings, 
  onNavigateToAdmin,
  previewEvents,
  previewGallery,
  isPreviewMode = false,
  isGateOpened = true,
}: WeddingPageProps) => {
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  
  // Blessing Form state
  const [blessingName, setBlessingName] = useState('');
  const [blessingMessage, setBlessingMessage] = useState('');
  const [blessingSubmitted, setBlessingSubmitted] = useState(false);
  const [blessingLoading, setBlessingLoading] = useState(false);

  // Lightbox state
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  // Active website plan state
  const [sitePlan, setSitePlan] = useState<'starter' | 'premium' | 'royal'>('starter');
  const [planFeatures, setPlanFeatures] = useState<Record<string, any>>({});

  useEffect(() => {
    if (isPreviewMode) return;
    const fetchPlan = async () => {
      try {
        if (!activeSite) return;
        const planValue = await databaseService.getWebsitePlan(activeSite.id);
        setSitePlan(planValue as any);
        
        // Load plan features configuration
        const plans = await databaseService.getAllPlanFeatures();
        setPlanFeatures(plans);
      } catch (err) {
        console.error('Failed to load site plan:', err);
      }
    };
    fetchPlan();
  }, [isPreviewMode]);


  // Load section data
  useEffect(() => {
    if (isPreviewMode) {
      setEvents(previewEvents || []);
      setGallery(previewGallery || []);
      return;
    }
    const loadData = async () => {
      try {
        const [evs, gal] = await Promise.all([
          databaseService.getEvents(),
          databaseService.getGallery()
        ]);
        setEvents(evs);
        setGallery(gal);
      } catch (err) {
        console.error('Failed to load page data:', err);
      }
    };
    loadData();
  }, [isPreviewMode, previewEvents, previewGallery]);

  const handleBlessingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blessingName.trim() || !blessingMessage.trim()) return;
    setBlessingLoading(true);
    try {
      await databaseService.submitBlessing(blessingName, blessingMessage);
      
      // WhatsApp redirect logic
      const waNumber = settings.whatsapp_number || '+919876543210';
      const cleanNumber = waNumber.replace(/[^\d+]/g, '');
      const messageText = `*Wedding Blessings & Wishes*\n\n*Name:* ${blessingName.trim()}\n*Message:* ${blessingMessage.trim()}`;
      const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageText)}`;
      window.open(waUrl, '_blank');
      
      setBlessingLoading(false);
      setBlessingSubmitted(true);
      setBlessingName('');
      setBlessingMessage('');
      setTimeout(() => {
        setBlessingSubmitted(false);
      }, 5000);
    } catch (err) {
      setBlessingLoading(false);
      console.error(err);
      alert('Failed to submit blessing. Please try again.');
    }
  };



  const formattedDate = new Date(settings.wedding_date || Date.now()).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const resolveFontFamily = (fontSetting?: string) => {
    if (fontSetting === 'CustomUploadedFont' && settings.custom_font_base64) {
      return "'CustomUploadedFont', 'Candlescript', 'Great Vibes', cursive";
    }
    if (settings.custom_font_base64 && (!fontSetting || fontSetting === 'Candlescript')) {
      return "'CustomUploadedFont', 'Candlescript', 'Great Vibes', cursive";
    }
    if (fontSetting === 'Candlescript') {
      return "'Candlescript', 'Great Vibes', cursive";
    }
    return fontSetting || "'Times New Roman', Times, serif";
  };

  return (
    <div className="flex-1 bg-[#FEFAE0] text-wedding-text selection:bg-primary/20 selection:text-primary">

      {/* 1. TRADITIONAL HERO SECTION */}
      <section 
        id="hero" 
        style={{ '--font-scale': '1' } as React.CSSProperties}
        className="wedding-card-container relative min-h-[100dvh] h-[100dvh] w-full flex items-center justify-center overflow-hidden bg-[#FEFAE0]"
      >
        {/* Full-viewport card background - image or video */}
        {(settings.card_hero_bg_type === 'video' || (settings.card_hero_bg_url && (
          settings.card_hero_bg_url.endsWith('.mp4') ||
          settings.card_hero_bg_url.endsWith('.webm') ||
          settings.card_hero_bg_url.endsWith('.mov') ||
          settings.card_hero_bg_url.startsWith('data:video/')
        ))) ? (
          <video
            ref={(el) => {
              if (el) {
                el.muted = true;
                el.play().catch(() => {});
              }
            }}
            src={settings.card_hero_bg_url || ''}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover object-bottom pointer-events-none z-0"
          />
        ) : (
          <img 
            src={settings.card_hero_bg_url || '/traditional-card.png'} 
            alt="Traditional Wedding Frame" 
            className="absolute inset-0 w-full h-full object-cover object-bottom pointer-events-none z-0" 
          />
        )}

        {/* Text Details absolute overlay - ONLY mounts and triggers animation when gate opens */}
        <AnimatePresence>
          {isGateOpened && (
            <motion.div
              key="hero-text-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center px-[8%] pt-0 pb-0 select-none"
            >
              <motion.span
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{
                  fontFamily: resolveFontFamily(settings.invite_line1_font),
                  fontSize: 'calc(10px * var(--font-scale))'
                }}
                className="tracking-[0.2em] font-light text-[11px] uppercase text-amber-950/65"
              >
                {settings.invite_line1 || 'We are cordially invited to the'}
              </motion.span>
              
              <motion.span
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                style={{
                  fontFamily: resolveFontFamily(settings.invite_line2_font),
                  fontSize: 'calc(10px * var(--font-scale))'
                }}
                className="tracking-[0.2em] font-light text-[11px] uppercase text-amber-950/65 mb-5"
              >
                {settings.invite_line2 || 'wedding ceremony of'}
              </motion.span>

              {/* Bride */}
              <motion.h3
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.6 }}
                style={{
                  fontFamily: resolveFontFamily(settings.bride_name_font),
                  fontSize: 'calc(52px * var(--font-scale))'
                }}
                className="text-amber-800 font-normal leading-[1.1] mb-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                {settings.bride_name || 'Shreya'}
              </motion.h3>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                style={{
                  fontFamily: resolveFontFamily(settings.bride_parents_font),
                  fontSize: 'calc(11px * var(--font-scale))'
                }}
                className="font-light italic text-amber-950/60 tracking-wider text-[11px] mb-4"
              >
                {settings.bride_parents || 'Daughter of Mrs. Rekha Gupta & Mr. S. K. Gupta'}
              </motion.p>

              {/* with connector */}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="font-candlescript text-lg text-amber-700/80 italic mb-4"
              >
                with
              </motion.span>

              {/* Groom */}
              <motion.h3
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 1.2 }}
                style={{
                  fontFamily: resolveFontFamily(settings.groom_name_font),
                  fontSize: 'calc(52px * var(--font-scale))'
                }}
                className="text-amber-800 font-normal leading-[1.1] mb-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                {settings.groom_name || 'Mukul'}
              </motion.h3>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.4 }}
                style={{
                  fontFamily: resolveFontFamily(settings.groom_parents_font),
                  fontSize: 'calc(11px * var(--font-scale))'
                }}
                className="font-light italic text-amber-950/60 tracking-wider text-[11px] mb-5"
              >
                {settings.groom_parents || 'Son of Mrs. Asha Sharma & Mr. R. K. Sharma'}
              </motion.p>

              {/* Tiny Divider */}
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.8, delay: 1.6 }}
                className="w-16 h-[1px] bg-amber-700/20 mb-4"
              />

              {/* Date */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.8 }}
                className="text-[11px] font-semibold text-amber-950 tracking-[0.25em] uppercase mb-1.5 font-times"
              >
                {formattedDate}
              </motion.p>

              {/* Venue */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 2.0 }}
                style={{
                  fontFamily: resolveFontFamily(settings.venue_label_font),
                  fontSize: 'calc(10px * var(--font-scale))'
                }}
                className="tracking-[0.2em] font-light text-[10px] uppercase text-amber-950/50"
              >
                {settings.venue_label || 'At Venue'}
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 2.2 }}
                className="text-[11px] font-semibold text-amber-950 tracking-[0.15em] uppercase max-w-[80%] leading-relaxed mt-1 mb-8"
              >
                {events.length > 0 ? events[events.length - 2]?.venue || events[0]?.venue : 'Grand Palace Resort'}
              </motion.p>

              {/* Footer Blessing */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, delay: 2.5 }}
                style={{
                  fontFamily: resolveFontFamily(settings.blessing_note_font),
                  fontSize: 'calc(14px * var(--font-scale))'
                }}
                className="text-amber-800/85 font-light italic  max-w-[90%] text-center text-xs tracking-wider leading-relaxed"
              >
                {settings.blessing_note || 'Your presence is our greatest blessing.'}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* NEW Scratch Card block with Confetti and Fade-up Countdown */}
      <ScratchCardInvitation settings={settings} />

      {/* 2. PREMIUM EVENT INVITATIONS SECTION */}
      <section id="event-cards" className="py-20 bg-gradient-to-b from-[#FAF6EA] via-[#FFFDF6] to-[#FAF6EA] px-4 md:px-6 relative overflow-hidden w-full border-t border-primary/10">
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-[url('/traditional-card-corner.png')] bg-no-repeat bg-contain opacity-5 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-[url('/traditional-card-corner.png')] bg-no-repeat bg-contain rotate-180 opacity-5 pointer-events-none" />

        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="font-poppins text-2xl md:text-3xl font-semibold tracking-widest text-wedding-text uppercase">Event Details</h2>
            <div className="w-16 h-[1px] bg-primary/40 mx-auto mt-4" />
          </div>

          {/* Strict responsive CSS Grid layout for 3 columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16 w-full max-w-6xl mx-auto px-4 justify-items-center">
            {events.length === 0 ? (
              <div className="col-span-3 text-center text-wedding-text/50 py-12 italic text-xs uppercase tracking-widest font-semibold font-poppins">
                No ceremony event cards added yet.
              </div>
            ) : (
              events.map((card) => {
                const nameLength = card.event_name.length;
                const nameFontSize = nameLength > 20 ? '4cqw' : nameLength > 12 ? '4.8cqw' : '5.5cqw';
                
                return (
                  <motion.div 
                    key={card.id} 
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full max-w-[360px] flex flex-col items-center"
                  >
                    {/* Card container */}
                    <div className="w-full aspect-[9/16] relative rounded-[28px] overflow-hidden shadow-2xl border border-primary/20 bg-white/40 @container transition-transform duration-500 hover:scale-[1.01]">
                      {/* Background Image or Video */}
                      {card.background_image && (card.background_image.endsWith('.mp4') || card.background_image.endsWith('.webm') || card.background_image.startsWith('data:video/')) ? (
                        <video
                          src={card.background_image}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
                        />
                      ) : (
                        <img 
                          src={card.background_image} 
                          alt={card.event_name} 
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0" 
                        />
                      )}

                      {/* Cream box container overlay */}
                      <div className="absolute inset-0 z-10 flex flex-col justify-start items-center p-[6%] pt-[16%] pointer-events-none select-none">
                        <motion.div 
                          initial="hidden"
                          whileInView="visible"
                          viewport={{ once: true, margin: "-100px" }}
                          variants={{
                            hidden: { opacity: 0, scale: 0.95 },
                            visible: {
                              opacity: 1,
                              scale: 1,
                              transition: {
                                staggerChildren: 0.1,
                                delayChildren: 0.1,
                                duration: 0.5
                              }
                            }
                          }}
                          className="w-full bg-[#FFFDF6]/95 border-2 border-[#D4AF37]/60 rounded-[22px] shadow-2xl flex flex-col justify-center items-center text-center px-[8%] py-[10%] gap-[4%] pointer-events-none"
                        >
                          {/* Event Title */}
                          <motion.div 
                            variants={{
                              hidden: { opacity: 0, y: 15 },
                              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                            }}
                            className="w-full"
                          >
                            <h3 
                              style={{ 
                                fontFamily: "'Cinzel', 'Playfair Display', serif", 
                                color: '#5C2C06', 
                                fontSize: nameFontSize
                              }} 
                              className="font-black tracking-widest drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] uppercase leading-snug"
                            >
                              {card.event_name}
                            </h3>
                          </motion.div>

                          {/* Gold divider line */}
                          <motion.div 
                            variants={{
                              hidden: { opacity: 0, scaleX: 0 },
                              visible: { opacity: 1, scaleX: 1, transition: { duration: 0.4 } }
                            }}
                            className="h-[2px] w-12 bg-[#B8860B]" 
                          />

                          {/* One Line Message */}
                          {card.message && (
                            <motion.div 
                              variants={{
                                hidden: { opacity: 0, y: 15 },
                                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                              }}
                              className="w-full"
                            >
                              <p 
                                style={{ 
                                  fontFamily: "'Great Vibes', 'Candlescript', cursive", 
                                  color: '#3B1E08', 
                                  fontSize: '4.2cqw' 
                                }} 
                                className="leading-relaxed font-bold"
                              >
                                {card.message}
                              </p>
                            </motion.div>
                          )}

                          {/* Date */}
                          <motion.div 
                            variants={{
                              hidden: { opacity: 0, y: 15 },
                              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                            }}
                            className="w-full"
                          >
                            <p 
                              style={{ 
                                fontFamily: "'Cinzel', 'Playfair Display', serif", 
                                color: '#1F0C02', 
                                fontSize: '3.4cqw' 
                              }} 
                              className="tracking-widest uppercase font-black leading-normal whitespace-pre-line drop-shadow-[0_0.5px_0.5px_rgba(255,255,255,0.5)]"
                            >
                              {card.event_date}
                            </p>
                          </motion.div>

                          {/* Time */}
                          <motion.div 
                            variants={{
                              hidden: { opacity: 0, y: 15 },
                              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                            }}
                            className="w-full"
                          >
                            <p 
                              style={{ 
                                fontFamily: "'Cinzel', 'Playfair Display', serif", 
                                color: '#7A4215', 
                                fontSize: '3.1cqw' 
                              }} 
                              className="tracking-[0.12em] font-bold"
                            >
                              {card.event_time}
                            </p>
                          </motion.div>

                          {/* Venue */}
                          <motion.div 
                            variants={{
                              hidden: { opacity: 0, y: 15 },
                              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                            }}
                            className="w-full"
                          >
                            <p 
                              style={{ 
                                fontFamily: "'Cinzel', 'Playfair Display', serif", 
                                color: '#1F0C02', 
                                fontSize: '3.0cqw' 
                              }} 
                              className="tracking-wider font-bold uppercase leading-snug whitespace-pre-line"
                            >
                              {card.venue}
                            </p>
                          </motion.div>
                        </motion.div>
                      </div>


                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* 6.5 TRADITIONAL RSVP, COMPLIMENTS & VENUE MAP */}
      <section id="venue-map" className="py-12 md:py-20 bg-[#FFFDF6] px-4 sm:px-6 border-t border-primary/15 w-full overflow-hidden">
        <div className="max-w-5xl mx-auto w-full flex flex-col items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-stretch w-full max-w-lg md:max-w-none mx-auto justify-center">
            {/* Left Column: RSVP & Compliments card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="glass-card bg-[#FAF6EA]/90 border border-[#D4AF37]/40 rounded-[24px] md:rounded-[28px] p-6 sm:p-8 md:p-12 flex flex-col justify-center text-center shadow-xl relative overflow-hidden w-full mx-auto"
            >
              {/* Decorative corner decorations */}
              <div className="absolute -top-10 -left-10 w-24 h-24 bg-[url('/traditional-card-corner.png')] bg-no-repeat bg-contain opacity-5 pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-[url('/traditional-card-corner.png')] bg-no-repeat bg-contain rotate-180 opacity-5 pointer-events-none" />

              {/* RSVP Block */}
              <div className="mb-8 md:mb-10 w-full text-center">
                <span className="font-poppins text-[10px] sm:text-xs uppercase tracking-[0.2em] text-primary/70 font-bold block mb-1">R S V P</span>
                <h3 
                  style={{ fontFamily: resolveFontFamily(settings.rsvp_font) }}
                  className="text-xl sm:text-2xl md:text-3xl font-bold text-[#9E5D24] tracking-wide mb-3"
                >
                  {settings.rsvp_family || 'Sharma Family'}
                </h3>
                <div className="w-8 h-[1px] bg-primary/30 mx-auto" />
              </div>

              {/* Compliments Block */}
              <div className="w-full text-center">
                <span 
                  style={{ fontFamily: resolveFontFamily(settings.compliments_font) }}
                  className="text-2xl sm:text-3xl text-[#9E5D24] font-bold block mb-2"
                >
                  With Best Compliments
                </span>
                <p 
                  style={{ fontFamily: resolveFontFamily(settings.compliments_font) }}
                  className="text-sm sm:text-base md:text-lg font-semibold text-[#7A4B1A] tracking-wide leading-relaxed"
                >
                  {settings.compliments_text || 'All Relatives & Friends'}
                </p>
              </div>
            </motion.div>

            {/* Right Column: Google Map and navigation button */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex flex-col gap-5 sm:gap-6 w-full mx-auto items-center justify-center"
            >
              {/* Google Map Iframe Container */}
              <div className="w-full aspect-[4/3] sm:aspect-square md:aspect-auto md:h-full min-h-[250px] sm:min-h-[300px] rounded-[20px] md:rounded-[24px] overflow-hidden shadow-xl border border-primary/20 relative">
                <iframe
                  title="Venue Map Location"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(events.length > 0 ? events[events.length - 2]?.venue || events[0]?.venue : 'Grand Palace Resort')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                />
              </div>

              {/* Navigate Link Button */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(events.length > 0 ? events[events.length - 2]?.venue || events[0]?.venue : 'Grand Palace Resort')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold w-full py-3.5 sm:py-4 px-4 text-[11px] sm:text-xs font-poppins uppercase tracking-widest font-semibold flex items-center justify-center gap-2 shadow-lg text-center"
              >
                <MapPin size={15} className="text-white shrink-0" />
                <span>Navigate to Venue (Google Maps)</span>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6.6 WHATSAPP BLESSINGS SECTION */}
      <section id="whatsapp-blessings" className="py-20 bg-[#FAF6EA] px-6 border-t border-b border-primary/15">
        <div className="max-w-xl mx-auto text-center">
          <span 
            style={{ fontFamily: "'Great Vibes', 'Candlescript', cursive" }}
            className="text-primary text-3xl font-bold block mb-2"
          >
            Send Love
          </span>
          <h2 
            style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
            className="text-xl md:text-2xl font-bold text-[#B27F4C] uppercase tracking-wider mb-4"
          >
            Bless the Couple
          </h2>
          <div className="w-12 h-[1px] bg-primary/40 mx-auto mb-6" />
          <p className="font-poppins text-xs text-wedding-text/75 leading-relaxed font-light mb-8">
            Write your name and message to send your loving blessings directly to the couple on WhatsApp!
          </p>

          <form onSubmit={handleBlessingSubmit} className="space-y-4 max-w-md mx-auto text-left">
            <div>
              <input
                type="text"
                required
                value={blessingName}
                onChange={(e) => setBlessingName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-4 py-3 bg-white/70 border border-primary/20 rounded-xl font-poppins text-xs focus:outline-none focus:border-primary/60 transition"
              />
            </div>
            <div>
              <textarea
                required
                rows={4}
                value={blessingMessage}
                onChange={(e) => setBlessingMessage(e.target.value)}
                placeholder="Your Blessing / Message"
                className="w-full px-4 py-3 bg-white/70 border border-primary/20 rounded-xl font-poppins text-xs focus:outline-none focus:border-primary/60 transition"
              />
            </div>
            <button
              type="submit"
              disabled={blessingLoading}
              className="btn-gold px-6 py-4 text-[10px] font-poppins uppercase tracking-widest font-semibold flex items-center gap-2 cursor-pointer w-full justify-center shadow-md"
            >
              <Send size={12} />
              {blessingLoading ? 'Redirecting...' : 'Send via WhatsApp'}
            </button>

            {blessingSubmitted && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-poppins rounded-lg text-center mt-4"
              >
                Thank you for your blessings! WhatsApp opened.
              </motion.div>
            )}
          </form>
        </div>
      </section>



      {/* 5. COUPLE GALLERY SECTION */}
      <section id="gallery" className="py-20 bg-[#FFFDF6] border-b border-primary/15">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-primary text-2xl font-candlescript font-bold block mb-2">Memories</span>
            <h2 className="font-poppins text-2xl md:text-3xl font-semibold tracking-widest text-wedding-text uppercase">Our Moments</h2>
            <div className="w-16 h-[1px] bg-primary/40 mx-auto mt-4" />
          </div>
        </div>

        {gallery.length === 0 ? (
          <div className="text-center font-poppins text-sm text-wedding-text/60 py-8">
            Gallery is currently empty.
          </div>
        ) : (
          <div className="w-full overflow-hidden space-y-6">
            {/* Row 1: Forward Marquee */}
            <div className="w-full overflow-hidden relative flex mask-image-horizontal">
              <div className="animate-marquee flex gap-6 py-2">
                {[...gallery, ...gallery].map((item, index) => {
                  const globalIndex = gallery.findIndex(g => g.id === item.id);
                  return (
                    <div 
                      key={`row1-${item.id}-${index}`} 
                      onClick={() => setActiveImageIndex(globalIndex)}
                      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-primary/10 shadow-md w-60 md:w-80 aspect-[4/3] bg-[#FEFAE0] flex-shrink-0 flex items-center justify-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                    >
                      <img 
                        src={item.image_url} 
                        alt="Gallery item"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-primary transform translate-y-4 group-hover:translate-y-0 transition duration-300">
                          <Heart size={16} fill="currentColor" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Reverse Marquee */}
            <div className="w-full overflow-hidden relative flex mask-image-horizontal">
              <div className="animate-marquee-reverse flex gap-6 py-2">
                {[...gallery, ...gallery].reverse().map((item, index) => {
                  const globalIndex = gallery.findIndex(g => g.id === item.id);
                  return (
                    <div 
                      key={`row2-${item.id}-${index}`} 
                      onClick={() => setActiveImageIndex(globalIndex)}
                      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-primary/10 shadow-md w-60 md:w-80 aspect-[4/3] bg-[#FEFAE0] flex-shrink-0 flex items-center justify-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                    >
                      <img 
                        src={item.image_url} 
                        alt="Gallery item"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-primary transform translate-y-4 group-hover:translate-y-0 transition duration-300">
                          <Heart size={16} fill="currentColor" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Fullscreen Lightbox Overlay */}
      <AnimatePresence>
        {activeImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          >
            {/* Close Button */}
            <button 
              onClick={() => setActiveImageIndex(null)}
              className="absolute top-6 right-6 text-white/80 hover:text-white cursor-pointer z-55 w-10 h-10 flex items-center justify-center bg-white/10 rounded-full transition"
            >
              <X size={20} />
            </button>

            {/* Left Button */}
            <button 
              onClick={() => setActiveImageIndex((prev) => (prev! === 0 ? gallery.length - 1 : prev! - 1))}
              className="absolute left-6 text-white/80 hover:text-white cursor-pointer z-55 w-12 h-12 flex items-center justify-center bg-white/10 rounded-full transition"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Active Image container */}
            <motion.div 
              key={activeImageIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="max-w-4xl max-h-[85vh] flex items-center justify-center relative"
            >
              <img 
                src={gallery[activeImageIndex].image_url} 
                alt="Active gallery preview" 
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-white/10"
              />
            </motion.div>

            {/* Right Button */}
            <button 
              onClick={() => setActiveImageIndex((prev) => (prev! === gallery.length - 1 ? 0 : prev! + 1))}
              className="absolute right-6 text-white/80 hover:text-white cursor-pointer z-55 w-12 h-12 flex items-center justify-center bg-white/10 rounded-full transition"
            >
              <ChevronRight size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. AWAITING YOUR PRESENCE SECTION */}
      <section className="py-20 md:py-28 px-6 text-center max-w-4xl mx-auto bg-[#FEFAE0] rounded-3xl my-8 border border-primary/15 shadow-sm">
        <span 
          style={{ fontFamily: "'Candlescript Demo Version', 'Candlescript', 'Great Vibes', cursive" }}
          className="text-[#9E5D24] text-4xl sm:text-5xl md:text-6xl font-bold block mb-5"
        >
          Awaiting Your Presence
        </span>
        <p 
          style={{ fontFamily: "'Playfair Display', 'Cinzel', serif" }}
          className="text-base sm:text-lg md:text-xl italic font-medium text-[#7A4B1A] leading-relaxed max-w-2xl mx-auto"
        >
          "True love is a journey of two hearts starting a new adventure together. We look forward to celebrating the beginning of our forever with you."
        </p>
        <div className="flex justify-center gap-2 mt-8 text-[#B27F4C]">
          <Heart size={16} fill="currentColor" />
          <Heart size={16} fill="currentColor" className="scale-125 text-[#9E5D24]" />
          <Heart size={16} fill="currentColor" />
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-[#FAF6EA] py-16 px-6 text-center border-t border-primary/20">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-5">
          <h2 
            style={{ fontFamily: "'Candlescript Demo Version', 'Candlescript', 'Great Vibes', cursive" }}
            className="text-4xl sm:text-5xl text-[#9E5D24] font-bold"
          >
            {settings.couple_name || 'Mukul & Shreya'}
          </h2>
          <p 
            style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
            className="text-xs sm:text-sm uppercase tracking-[0.25em] font-semibold text-[#B27F4C]"
          >
            {formattedDate}
          </p>

          <div className="w-20 h-[1px] bg-[#B8860B]/40" />

          {/* Social icons / contact info */}
          {(settings.footer_phone || settings.footer_email) && (
            <div className="flex items-center gap-4 text-[#9E5D24]">
              {settings.footer_phone && (
                <a href={`tel:${settings.footer_phone}`} className="hover:scale-115 transition w-9 h-9 rounded-full border border-[#D4AF37]/40 flex items-center justify-center bg-white/70 shadow-sm" title="Call Contact">
                  <Phone size={15} />
                </a>
              )}
              {settings.footer_email && (
                <a href={`mailto:${settings.footer_email}`} className="hover:scale-115 transition w-9 h-9 rounded-full border border-[#D4AF37]/40 flex items-center justify-center bg-white/70 shadow-sm" title="Email Contact">
                  <Heart size={15} fill="currentColor" />
                </a>
              )}
            </div>
          )}

          <p className="font-poppins text-[10px] text-wedding-text/60 mt-3 leading-relaxed">
            &copy; {new Date().getFullYear()} {settings.couple_name || 'Mukul & Shreya'}. All Rights Reserved.
            {settings.footer_copyright && (
              <span className="block mt-1 opacity-75">{settings.footer_copyright}</span>
            )}
          </p>
        </div>
      </footer>

    </div>
  );
};
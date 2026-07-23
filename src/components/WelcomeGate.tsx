import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WeddingSettings } from '../services/database';

interface WelcomeGateProps {
  gateVideoUrl: string;
  settings?: WeddingSettings;
  onOpen: (startMusic: boolean) => void;
  onStartPlay?: () => void;
}

export const WelcomeGate: React.FC<WelcomeGateProps> = ({
  gateVideoUrl,
  settings,
  onOpen,
  onStartPlay,
}) => {
  const [isOpening, setIsOpening] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const btnText = settings?.gate_btn_text || 'Tap to Open';
  const btnSubtitle = settings?.gate_btn_subtitle !== undefined ? settings.gate_btn_subtitle : '✦ Celebrate ✦';
  const btnShape = settings?.gate_btn_shape || 'circle';
  const btnOpacity = settings?.gate_btn_bg_opacity !== undefined ? settings.gate_btn_bg_opacity : 0.5;
  const btnBorderColor = settings?.gate_btn_border_color || '#D4AF37';
  const btnAnimStyle = settings?.gate_btn_anim_style || 'pulse';

  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    class GoldParticle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      alpha: number;
      alphaSpeed: number;
      glow: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.8; // 0.8px to 2.8px
        this.speedY = -(Math.random() * 0.4 + 0.15); // slow upward drift
        this.speedX = Math.random() * 0.2 - 0.1; // gentle sway
        this.alpha = Math.random() * 0.5 + 0.15;
        this.alphaSpeed = Math.random() * 0.008 + 0.002;
        this.glow = Math.random() > 0.4 ? 4 : 0; // soft gold glow
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        
        // Twinkle
        this.alpha += this.alphaSpeed;
        if (this.alpha > 0.8 || this.alpha < 0.1) {
          this.alphaSpeed = -this.alphaSpeed;
        }

        // Reset if offscreen
        if (this.y < -10) {
          this.y = height + 10;
          this.x = Math.random() * width;
        }
        if (this.x < -10 || this.x > width + 10) {
          this.x = Math.random() * width;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.save();
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        if (this.glow > 0) {
          c.shadowBlur = this.glow;
          c.shadowColor = '#D4A373';
        }
        
        c.fillStyle = `rgba(212, 163, 115, ${this.alpha})`;
        c.fill();
        c.restore();
      }
    }

    const count = Math.min(80, Math.floor(width / 18));
    const particles = Array.from({ length: count }).map(() => new GoldParticle());

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.update();
        p.draw(ctx);
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const triggerMusicPlayback = () => {
    if (typeof (window as any).startGlobalWeddingMusic === 'function') {
      (window as any).startGlobalWeddingMusic();
    }
    window.dispatchEvent(new Event('play_wedding_music'));
    if (onStartPlay) onStartPlay();
  };

  const handlePlayVideo = () => {
    triggerMusicPlayback();
    if (!videoRef.current) {
      handleOpen();
      return;
    }
    
    if (hasStarted) {
      handleOpen();
      return;
    }

    videoRef.current.muted = true;
    videoRef.current.play()
      .then(() => {
        setHasStarted(true);
      })
      .catch((err) => {
        console.error('Failed to play video:', err);
        handleOpen();
      });
  };

  const handleVideoEnded = () => {
    handleOpen();
  };

  const handleOpen = () => {
    triggerMusicPlayback();
    onOpen(true);
  };

  const videoSrc = gateVideoUrl || '/From Klickpin.com- Pin this creative beach trip roundup to make your next project easier and prettier with practical inspiration you can use right.mp4';

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#FEFAE0] via-[#FAEDCD] to-[#F5EBE0] pointer-events-auto"
    >
      {/* Royal Backdrop Image & Ambient Overlay (Visible instantly while video buffers) */}
      <img
        src="/traditional-card.png"
        alt="Wedding Gate Poster"
        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-multiply filter brightness-105 scale-105 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#FEFAE0]/80 via-[#FEFAE0]/30 to-[#FAEDCD]/60 pointer-events-none" />

      {/* Full Screen Video - Fades in smoothly once loaded */}
      <video
        ref={videoRef}
        src={videoSrc}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          isVideoLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        playsInline
        muted={true}
        preload="auto"
        onCanPlay={() => setIsVideoLoaded(true)}
        onLoadedData={() => setIsVideoLoaded(true)}
        onEnded={handleVideoEnded}
        onClick={handlePlayVideo}
      />

      {/* Golden Sparkles Canvas Overlay */}
      <canvas
        ref={particleCanvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full z-10 opacity-80"
      />

      {/* Circular "Tap to Open" Button on Gate */}
      <AnimatePresence>
        {!hasStarted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.15, rotate: -30, filter: 'blur(8px)' }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            onClick={handlePlayVideo}
            className="absolute z-30 cursor-pointer flex items-center justify-center select-none"
          >
            {/* Outer Expanding Pulse Waves - Slow & Graceful */}
            <motion.div
              animate={{
                scale: [1, 1.4, 1.75],
                opacity: [0.65, 0.2, 0],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="absolute w-36 h-36 md:w-44 md:h-44 rounded-full border-2 border-amber-600/50 pointer-events-none"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1.55],
                opacity: [0.45, 0.15, 0],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                delay: 1.2,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="absolute w-36 h-36 md:w-44 md:h-44 rounded-full border border-amber-800/40 pointer-events-none"
            />

            {/* Rotating Dashed Accent Ring - Slow & Royal */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 24,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute w-36 h-36 md:w-44 md:h-44 rounded-full border-2 border-dashed border-amber-600/50 pointer-events-none"
            />

            {/* Main Configurable Gate Button */}
            <motion.div
              animate={btnAnimStyle === 'none' ? {} : {
                scale: [1, 1.07, 0.98, 1.05, 1],
                boxShadow: [
                  `0 0 25px ${btnBorderColor}55, 0 10px 30px rgba(178, 127, 76, 0.25)`,
                  `0 0 50px ${btnBorderColor}AA, 0 0 55px ${btnBorderColor}55`,
                  '0 0 20px rgba(178, 127, 76, 0.2), 0 10px 30px rgba(178, 127, 76, 0.3)',
                  `0 0 45px ${btnBorderColor}99, 0 0 50px ${btnBorderColor}44`,
                  `0 0 25px ${btnBorderColor}55, 0 10px 30px rgba(178, 127, 76, 0.25)`,
                ],
              }}
              transition={{
                duration: 4.2,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{
                backgroundColor: `rgba(255, 253, 246, ${btnOpacity})`,
                borderColor: btnBorderColor,
              }}
              className={`${
                btnShape === 'pill'
                  ? 'px-8 py-5 rounded-full min-w-[200px]'
                  : btnShape === 'square'
                  ? 'w-32 h-32 md:w-40 md:h-40 rounded-3xl'
                  : 'w-32 h-32 md:w-40 md:h-40 rounded-full'
              } border-2 backdrop-blur-md flex flex-col items-center justify-center p-4 transition-colors duration-500 hover:bg-white/95 active:scale-95 group relative overflow-hidden`}
            >
              {/* Inner Radial Shimmer Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-200/40 via-transparent to-transparent opacity-50 group-hover:opacity-90 transition-opacity duration-500" />

              {/* Dynamic Text with Smooth Zoom Pulse */}
              <motion.span
                animate={btnAnimStyle === 'none' ? {} : { scale: [1, 1.05, 1] }}
                transition={{
                  duration: 4.2,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="relative z-10 text-[#5C2C06] font-serif font-bold text-xs md:text-sm tracking-[0.2em] uppercase text-center w-full block group-hover:text-amber-900 transition-colors drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]"
              >
                {btnText}
              </motion.span>
              {btnSubtitle && (
                <span className="relative z-10 text-[9px] md:text-[10px] text-[#7A4215] tracking-widest uppercase mt-1 font-semibold text-center w-full block group-hover:scale-105 transition-transform duration-300">
                  {btnSubtitle}
                </span>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeGateProps {
  gateVideoUrl: string;
  onOpen: (startMusic: boolean) => void;
  onStartPlay?: () => void;
}

export const WelcomeGate: React.FC<WelcomeGateProps> = ({
  gateVideoUrl,
  onOpen,
  onStartPlay,
}) => {
  const [isOpening, setIsOpening] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  const handlePlayVideo = () => {
    if (typeof (window as any).startGlobalWeddingMusic === 'function') {
      (window as any).startGlobalWeddingMusic();
    }
    window.dispatchEvent(new Event('play_wedding_music'));
    if (onStartPlay) onStartPlay();
    if (!videoRef.current) return;
    
    if (hasStarted) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(e => console.error(e));
      } else {
        videoRef.current.pause();
      }
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
    if (typeof (window as any).startGlobalWeddingMusic === 'function') {
      (window as any).startGlobalWeddingMusic();
    }
    window.dispatchEvent(new Event('play_wedding_music'));
    if (onStartPlay) onStartPlay();
    onOpen(true);
  };

  const videoSrc = gateVideoUrl || '/From Klickpin.com- Pin this creative beach trip roundup to make your next project easier and prettier with practical inspiration you can use right.mp4';

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black pointer-events-auto"
    >
      {/* Full Screen Video */}
      <video
        ref={videoRef}
        src={videoSrc}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted={true}
        preload="auto"
        onEnded={handleVideoEnded}
        onClick={handlePlayVideo}
      />

      {/* Golden Sparkles Canvas Overlay */}
      <canvas
        ref={particleCanvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full z-10 opacity-80"
      />

      {/* Invisible Full-Screen Tap Capture */}
      {!hasStarted && (
        <div 
          onClick={handlePlayVideo}
          className="absolute inset-0 bg-transparent cursor-pointer z-20"
        />
      )}
    </motion.div>
  );
};

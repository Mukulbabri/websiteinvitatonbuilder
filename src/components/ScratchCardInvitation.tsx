import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Countdown } from './Countdown';
import type { WeddingSettings } from '../services/database';

interface ScratchCardInvitationProps {
  settings: WeddingSettings;
}

export const ScratchCardInvitation: React.FC<ScratchCardInvitationProps> = ({ settings }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const [, setScratchProgress] = useState(0);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Hashtags generator
  const hashtags = [
    `#${(settings.couple_name || 'Mukul & Shreya').replace(/\s*&\s*/, 'Ki').replace(/\s+/g, '')}`
  ];

  // Draw the scratch card coating
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions matching its display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 320;
    canvas.height = rect.height || 220;

    const w = canvas.width;
    const h = canvas.height;

    // Create a beautiful premium gold/rose-gold gradient for the scratch coating
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#d4af37'); // Gold
    grad.addColorStop(0.2, '#f3e5ab'); // Silk gold
    grad.addColorStop(0.4, '#aa7c11'); // Dark gold
    grad.addColorStop(0.6, '#f3e5ab'); // Light gold
    grad.addColorStop(0.8, '#d4af37'); // Gold
    grad.addColorStop(1, '#8a6605'); // Bronze-gold

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw some subtle romantic pattern/overlay on the coating
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    for (let i = -w; i < w; i += 25) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.stroke();
    }

    // Draw instructions & border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    ctx.fillStyle = '#5c3a21'; // Dark brown ink
    ctx.font = 'bold 16px "Poppins", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCRATCH TO REVEAL', w / 2, h / 2 - 12);
    ctx.fillText('OUR SPECIAL DAY', w / 2, h / 2 + 12);
  };

  useEffect(() => {
    // Small delay to make sure bounding rect is correct
    const timer = setTimeout(() => {
      initCanvas();
    }, 100);

    // Re-initialize on window resize
    window.addEventListener('resize', initCanvas);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', initCanvas);
    };
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 44; // Diameter of scratch brush
    ctx.strokeStyle = '#000'; // Force solid stroke so destination-out fully erases pixels to 0 alpha

    ctx.beginPath();
    if (lastPosRef.current) {
      // Connect coordinates with a thick line
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      // Starting point fallback
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    lastPosRef.current = { x, y };
    checkProgress();
  };

  const checkProgress = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sample pixels to compute scratched percentage
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;
    let transparent = 0;

    // Check every 16th pixel for performance
    for (let i = 3; i < pixels.length; i += 16 * 4) {
      if (pixels[i] === 0) {
        transparent++;
      }
    }

    const totalSampled = pixels.length / (16 * 4);
    const progress = transparent / totalSampled;
    setScratchProgress(progress);

    if (progress > 0.45) {
      // Auto-reveal the rest
      setIsRevealed(true);
      
      // Confetti splash!
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ['#D4A373', '#FAEDCD', '#ccd5ae', '#b27f4c']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#D4A373', '#FAEDCD', '#ccd5ae', '#b27f4c']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsScratching(true);
    const { x, y } = getCoordinates(e);
    lastPosRef.current = { x, y };
    scratch(x, y);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isScratching) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    scratch(x, y);
  };

  const handleEnd = () => {
    setIsScratching(false);
    lastPosRef.current = null;
  };

  return (
    <section className="py-12 bg-gradient-to-b from-[#FEFAE0] to-[#FAF6EA] px-6 relative overflow-hidden flex flex-col items-center w-full">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-[url('/traditional-card-corner.png')] bg-no-repeat bg-contain opacity-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-[url('/traditional-card-corner.png')] bg-no-repeat bg-contain rotate-180 opacity-10 pointer-events-none" />

      {/* Scratch Card Container */}
      <div 
        ref={containerRef}
        className="w-full max-w-md aspect-[2.1/1] relative rounded-3xl overflow-hidden shadow-2xl border border-primary/20 bg-white/70 backdrop-blur-sm p-6 flex flex-col justify-center items-center text-center select-none"
      >
        {/* Underlay (Revealed Content) */}
        <div className="space-y-3">
          <h3 className="font-candlescript text-4xl text-primary font-bold tracking-wide">
            Save The Date
          </h3>

          {/* Hashtags */}
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {hashtags.map((tag, idx) => (
              <span 
                key={idx} 
                className="text-[9px] font-mono font-semibold bg-[#D4A373]/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Scratch Coating Canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className={`absolute inset-0 w-full h-full cursor-pointer z-10 touch-none transition-opacity duration-700 ${
            isRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        />
      </div>

      {/* Countdown Card (Fades Up after scratching) */}
      <AnimatePresence>
        {isRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="w-full max-w-lg mt-8 flex flex-col items-center px-4"
          >
            <div className="glass-card px-8 py-3.5 w-full shadow-lg border border-primary/10 bg-white/40 rounded-2xl flex items-center justify-center">
              <Countdown targetDate={settings.wedding_date || ''} variant="line" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

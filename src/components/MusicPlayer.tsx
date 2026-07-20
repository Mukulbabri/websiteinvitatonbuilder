import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';

interface MusicPlayerProps {
  musicUrl: string;
  autoPlay: boolean;
  enabled: boolean;
  showUI: boolean;
}

const DEFAULT_MUSIC_FALLBACK = '/From Klickpin.com- Pin this creative beach trip roundup to make your next project easier and prettier with practical inspiration you can use right.mp4';

const getAbsoluteUrl = (url: string) => {
  if (!url) return '';
  try {
    return new URL(url, window.location.href).href;
  } catch (e) {
    return url;
  }
};

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  musicUrl,
  autoPlay,
  enabled,
  showUI,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [showVolume, setShowVolume] = useState(false);

  const effectiveUrl = (musicUrl && !musicUrl.includes('soundhelix.com')) ? musicUrl : DEFAULT_MUSIC_FALLBACK;
  const targetSrc = getAbsoluteUrl(effectiveUrl);

  useEffect(() => {
    const playAudio = () => {
      if (audioRef.current && enabled) {
        if (targetSrc && audioRef.current.src !== targetSrc) {
          audioRef.current.src = targetSrc;
        }
        audioRef.current.muted = false;
        audioRef.current.volume = volume;
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.log('Audio play error:', err));
      }
    };

    (window as any).startGlobalWeddingMusic = playAudio;

    const handleUserPlay = () => {
      playAudio();
    };

    window.addEventListener('play_wedding_music', handleUserPlay);
    return () => {
      delete (window as any).startGlobalWeddingMusic;
      window.removeEventListener('play_wedding_music', handleUserPlay);
    };
  }, [targetSrc, enabled, volume]);

  useEffect(() => {
    if (!enabled) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (audioRef.current) {
      if (targetSrc && audioRef.current.src !== targetSrc) {
        const wasPlaying = isPlaying;
        audioRef.current.src = targetSrc;
        audioRef.current.load();
        if (wasPlaying || autoPlay) {
          audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      } else if (autoPlay && !isPlaying && audioRef.current.paused) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.log('Autoplay blocked:', err);
            setIsPlaying(false);
          });
      }
    }
  }, [targetSrc, autoPlay, enabled]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Error playing audio:', err));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioRef.current.muted = nextMute;
    if (nextMute) {
      audioRef.current.volume = 0;
    } else {
      audioRef.current.volume = volume;
    }
  };

  if (!enabled) return null;

  return (
    <>
      {/* Offscreen media element (active rendering tree for guaranteed browser audio decoding) */}
      <video
        ref={audioRef as any}
        src={targetSrc}
        loop
        playsInline
        style={{ position: 'fixed', top: -9999, left: -9999, width: 1, height: 1, opacity: 0.01, pointerEvents: 'none' }}
      />

      {/* Pure Circular Music Control Icon in Bottom Right Corner */}
      {showUI && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center">
          <button
            onClick={togglePlay}
            className={`w-14 h-14 rounded-full border-2 border-amber-300/70 shadow-[0_4px_30px_rgba(212,175,55,0.45)] select-none bg-black/85 backdrop-blur-md text-amber-200 flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer relative overflow-hidden ${
              isPlaying ? 'ring-2 ring-amber-400/60 shadow-[0_0_25px_rgba(251,191,36,0.6)]' : ''
            }`}
            title={isPlaying ? "Mute Music" : "Play Music"}
          >
            {/* Classic Musical Note Icon */}
            {isPlaying ? (
              <Music
                size={22}
                className="text-amber-300 animate-[bounce_1.5s_infinite] drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] mt-0.5"
              />
            ) : (
              <VolumeX
                size={20}
                className="text-amber-200/50 mt-0.5"
              />
            )}

            {/* Equalizer bars inside bottom of circle */}
            <div className="flex items-end gap-[2px] h-2.5 mt-0.5">
              {[1, 2, 3].map((bar) => (
                <div
                  key={bar}
                  className={`w-[2px] bg-amber-300 rounded-full origin-bottom transition-all duration-300 ${
                    isPlaying ? 'animate-[bounce_0.6s_infinite]' : 'h-1 opacity-30'
                  }`}
                  style={{
                    animationDelay: `${bar * 0.18}s`,
                    height: isPlaying ? '100%' : '25%',
                  }}
                />
              ))}
            </div>
          </button>
        </div>
      )}
    </>
  );
};

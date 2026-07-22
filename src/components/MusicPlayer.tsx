import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';

interface MusicPlayerProps {
  musicUrl: string;
  autoPlay: boolean;
  enabled: boolean;
  showUI: boolean;
}

const DEFAULT_MUSIC_FALLBACK = '/music.mp3';

const getAbsoluteUrl = (url: string) => {
  if (!url) return new URL(DEFAULT_MUSIC_FALLBACK, window.location.href).href;
  try {
    const cleanUrl = url.trim();
    if (!cleanUrl) return new URL(DEFAULT_MUSIC_FALLBACK, window.location.href).href;
    return new URL(cleanUrl, window.location.href).href;
  } catch (e) {
    return new URL(DEFAULT_MUSIC_FALLBACK, window.location.href).href;
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
  const [volume, setVolume] = useState(0.8);

  const fallbackSrc = getAbsoluteUrl(DEFAULT_MUSIC_FALLBACK);
  const effectiveUrl = musicUrl && !musicUrl.includes('soundhelix.com') ? musicUrl : DEFAULT_MUSIC_FALLBACK;
  const targetSrc = getAbsoluteUrl(effectiveUrl);

  const forceFallbackPlay = () => {
    if (audioRef.current) {
      if (decodeURIComponent(audioRef.current.src) !== decodeURIComponent(fallbackSrc)) {
        audioRef.current.src = fallbackSrc;
        audioRef.current.load();
      }
      audioRef.current.volume = volume;
      audioRef.current.muted = false;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn('Fallback play error:', e));
    }
  };

  const handleAudioError = () => {
    console.warn(`Audio source "${audioRef.current?.src}" failed to load. Switching to fallback "${fallbackSrc}"`);
    forceFallbackPlay();
  };

  const attemptPlay = () => {
    if (!audioRef.current || !enabled) return;
    audioRef.current.volume = volume;
    audioRef.current.muted = isMuted;

    if (audioRef.current.error) {
      forceFallbackPlay();
      return;
    }

    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        if (err.name === 'NotSupportedError') {
          forceFallbackPlay();
        } else {
          console.log('Autoplay blocked by browser policy, waiting for user interaction:', err);
          setIsPlaying(false);
        }
      });
  };

  // 1. Instantly update audio src & load when targetSrc, enabled, or autoPlay changes
  useEffect(() => {
    if (!enabled || !targetSrc) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (audioRef.current) {
      const currentSrc = audioRef.current.src;
      if (!currentSrc || decodeURIComponent(currentSrc) !== decodeURIComponent(targetSrc)) {
        audioRef.current.src = targetSrc;
        audioRef.current.load();
      }
      if (autoPlay) {
        attemptPlay();
      }
    }
  }, [targetSrc, enabled, autoPlay]);

  // 2. Gate tap / Explicit user interaction listener
  useEffect(() => {
    if (!enabled) return;

    const handleUserInteraction = (e?: Event) => {
      if (e && e.target && (e.target as HTMLElement).closest('.music-player-btn')) {
        return;
      }
      if (audioRef.current) {
        audioRef.current.volume = volume;
        audioRef.current.muted = false;
        if (audioRef.current.error) {
          forceFallbackPlay();
          return;
        }
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            if (err.name === 'NotSupportedError') {
              forceFallbackPlay();
            } else {
              console.log('Playback attempt on interaction:', err);
            }
          });
      }
    };

    window.addEventListener('play_wedding_music', handleUserInteraction);
    (window as any).startGlobalWeddingMusic = handleUserInteraction;

    return () => {
      window.removeEventListener('play_wedding_music', handleUserInteraction);
      delete (window as any).startGlobalWeddingMusic;
    };
  }, [enabled, targetSrc, volume]);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!audioRef.current) return;

    if (!audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.muted = false;
      audioRef.current.volume = volume;
      if (audioRef.current.error) {
        forceFallbackPlay();
        return;
      }
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          if (err.name === 'NotSupportedError') {
            forceFallbackPlay();
          } else {
            console.error('Error playing audio:', err);
          }
        });
    }
  };

  if (!enabled) return null;

  return (
    <>
      {/* HTML5 Standard Audio Element */}
      <audio
        ref={audioRef}
        src={targetSrc}
        loop
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={handleAudioError}
      />

      {/* Floating Bottom-Right Music Button */}
      {showUI && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center">
          <button
            onClick={togglePlay}
            className={`music-player-btn w-14 h-14 rounded-full border-2 border-amber-300/70 shadow-[0_4px_30px_rgba(212,175,55,0.45)] select-none bg-black/85 backdrop-blur-md text-amber-200 flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer relative overflow-hidden ${
              isPlaying ? 'ring-2 ring-amber-400/60 shadow-[0_0_25px_rgba(251,191,36,0.6)]' : ''
            }`}
            title={isPlaying ? 'Pause Music' : 'Play Music'}
          >
            {isPlaying ? (
              <Music
                size={22}
                className="text-amber-300 animate-[bounce_1.5s_infinite] drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] mt-0.5"
              />
            ) : (
              <VolumeX size={20} className="text-amber-200/50 mt-0.5" />
            )}

            {/* Equalizer Bars */}
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
